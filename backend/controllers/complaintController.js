const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { analyzeComplaint, findDuplicate } = require('../utils/aiService');
const { createNotification, sendEmail } = require('../utils/notify');
const { resolveComplaintCoordinates } = require('../utils/coordinates');
const { resolveLocation, findClosestLocation } = require('../utils/locationResolver');

// @route POST /api/complaints
// @desc  Submit a new complaint. Runs AI categorization/priority/sentiment/summary,
//        then checks for duplicates among recent open complaints in the same category.
exports.createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      locationId,
      location,
      locationName,
      isAnonymous,
      category: manualCategory,
      lat: suppliedLat,
      lng: suppliedLng,
    } = req.body;
    const selectedLocationId = locationId || location;
    const trimmedTitle = String(title || '').trim();
    const trimmedDescription = String(description || '').trim();
    const parsedLat = Number(suppliedLat);
    const parsedLng = Number(suppliedLng);
    const hasPinCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
    if (!trimmedTitle || !trimmedDescription) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const ai = await analyzeComplaint({ title: trimmedTitle, description: trimmedDescription });
    let resolved = null;

    if (hasPinCoordinates) {
      const fallbackLocation = await findClosestLocation(parsedLat, parsedLng);
      resolved = {
        location: fallbackLocation,
        coordinates: { lat: parsedLat, lng: parsedLng },
        source: 'pin',
      };
    } else {
      resolved = await resolveLocation({
        locationId: selectedLocationId,
        locationName:
          locationName ||
          (typeof location === 'string' && !mongoose.Types.ObjectId.isValid(location) ? location : ''),
        allowGeocode: true,
      });
    }
    if (!resolved) {
      return res.status(400).json({
        message:
          'The complaint location could not be resolved. Please place the pin on the campus map before submitting.',
      });
    }

    const { location: selectedLocation, coordinates } = resolved;

    const complaint = new Complaint({
      title: trimmedTitle,
      description: trimmedDescription,
      category: manualCategory || ai.category,
      location: selectedLocation?._id || null,
      locationName: locationName || selectedLocation?.name || 'Custom pinpoint',
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      priority: ai.priority,
      sentiment: ai.sentiment,
      aiSummary: ai.summary,
      isAnonymous: !!isAnonymous,
      submittedBy: req.user._id,
      statusHistory: [{ status: 'Submitted', changedBy: req.user._id, note: 'Complaint submitted' }],
    });

    // Duplicate check against recent (last 30 days) open complaints in same category
    const recentCandidates = await Complaint.find({
      category: complaint.category,
      status: { $nin: ['Resolved', 'Closed'] },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .limit(15)
      .select('title description');

    const dup = await findDuplicate({ title: trimmedTitle, description: trimmedDescription }, recentCandidates);
    if (dup) {
      complaint.isDuplicate = true;
      complaint.duplicateOf = dup.complaintId;
    }

    await complaint.save();

    if (dup) {
      await createNotification({
        userId: req.user._id,
        complaintId: complaint._id,
        message: `Your complaint appears similar to an existing report and has been linked to it for faster resolution.`,
        type: 'general',
      });
    }

    res.status(201).json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create complaint', error: err.message });
  }
};

// @route GET /api/complaints/mine
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ submittedBy: req.user._id })
      .populate('location', 'name category lat lng')
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaints', error: err.message });
  }
};

// @route GET /api/complaints/:id
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('location', 'name category lat lng')
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email department')
      .populate('statusHistory.changedBy', 'name role');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Users can only view their own complaints; staff/admin can view all
    if (
      req.user.role === 'user' &&
      complaint.submittedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaint', error: err.message });
  }
};

// @route GET /api/complaints  (staff/admin - with filters)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, search, assignedToMe, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedToMe === 'true') filter.assignedTo = req.user._id;
    if (search) filter.$text = { $search: search };

    // Staff only see complaints assigned to their department (or unassigned)
    if (req.user.role === 'staff') {
      filter.$or = [{ assignedDepartment: req.user.department }, { assignedTo: req.user._id }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('location', 'name category lat lng')
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(filter),
    ]);

    res.json({ complaints, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch complaints', error: err.message });
  }
};

// @route PUT /api/complaints/:id/assign  (admin)
exports.assignComplaint = async (req, res) => {
  try {
    const { staffId, department } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (staffId) {
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({ message: 'Please select a valid staff member' });
      }
      const staff = await User.findById(staffId);
      if (!staff || staff.role !== 'staff' || staff.isActive === false) {
        return res.status(400).json({ message: 'Invalid or inactive staff member' });
      }
      complaint.assignedTo = staff._id;
      complaint.assignedDepartment = staff.department;
    } else if (department) {
      complaint.assignedDepartment = department;
    }

    if (complaint.status === 'Submitted') complaint.status = 'Assigned';
    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      note: `Assigned to ${staffId ? 'staff member' : department}`,
    });
    await complaint.save();

    await createNotification({
      userId: complaint.submittedBy,
      complaintId: complaint._id,
      message: `Your complaint "${complaint.title}" has been assigned and is being reviewed.`,
      type: 'assignment',
    });
    if (staffId) {
      await createNotification({
        userId: staffId,
        complaintId: complaint._id,
        message: `You have been assigned a new complaint: "${complaint.title}"`,
        type: 'assignment',
      });
    }

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign complaint', error: err.message });
  }
};

// @route PUT /api/complaints/:id/status  (staff/admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id, note: note || '' });
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    await complaint.save();

    const user = await User.findById(complaint.submittedBy);
    await createNotification({
      userId: complaint.submittedBy,
      complaintId: complaint._id,
      message: `Your complaint "${complaint.title}" status changed to "${status}".`,
      type: 'status_update',
    });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Complaint Update: ${complaint.title}`,
        text: `Your complaint status is now "${status}". ${note ? `Note: ${note}` : ''}`,
      });
    }

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

// @route POST /api/complaints/:id/feedback  (user - after resolution)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['Resolved', 'Closed'].includes(complaint.status)) {
      return res.status(400).json({ message: 'Feedback can only be given after resolution' });
    }
    complaint.feedback = { rating, comment: comment || '' };
    await complaint.save();
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};

// @route GET /api/complaints/map/locations  (public within app - complaint pins)
exports.getMapData = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('location', 'name category lat lng')
      .select('title category priority status location locationName coordinates createdAt')
      .sort({ createdAt: -1 });

    const normalized = [];
    for (const complaint of complaints) {
      const coords = resolveComplaintCoordinates(complaint);
      if (!coords) continue;

      const hasStoredCoords =
        complaint.coordinates?.lat != null && complaint.coordinates?.lng != null;
      if (!hasStoredCoords) {
        Complaint.updateOne(
          { _id: complaint._id },
          { coordinates: { lat: coords.lat, lng: coords.lng } }
        ).catch(() => {});
      } else {
        const storedLat = complaint.coordinates?.lat;
        const storedLng = complaint.coordinates?.lng;
        if (storedLat !== coords.lat || storedLng !== coords.lng) {
          Complaint.updateOne(
            { _id: complaint._id },
            { coordinates: { lat: coords.lat, lng: coords.lng } }
          ).catch(() => {});
        }
      }

      normalized.push({
        _id: complaint._id,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        locationName: complaint.locationName || complaint.location?.name,
        coordinates: { lat: coords.lat, lng: coords.lng },
        createdAt: complaint.createdAt,
      });
    }

    res.json({ complaints: normalized });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch map data', error: err.message });
  }
};

