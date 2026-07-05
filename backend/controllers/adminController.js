const Complaint = require('../models/Complaint');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { summarizeComplaints } = require('../utils/aiService');
const { createNotification } = require('../utils/notify');
const { PASSWORD_REQUIREMENTS, isStrongPassword, isValidEmail, normalizeEmail } = require('../utils/validation');

// @route GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [total, submitted, assigned, inProgress, resolved, closed] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Submitted' }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Closed' }),
    ]);

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Monthly trend for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Average resolution time (hours) for resolved complaints
    const resolvedComplaints = await Complaint.find({ status: 'Resolved', resolvedAt: { $ne: null } }).select(
      'createdAt resolvedAt'
    );
    let avgResolutionHours = 0;
    if (resolvedComplaints.length) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedComplaints.length) * 10) / 10;
    }

    // Department performance: resolved count + avg resolution time per department
    const deptPerformance = await Complaint.aggregate([
      { $match: { assignedDepartment: { $ne: null } } },
      {
        $group: {
          _id: '$assignedDepartment',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      totals: { total, submitted, assigned, inProgress, resolved, closed },
      categoryStats,
      priorityStats,
      monthlyTrend,
      avgResolutionHours,
      deptPerformance,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};

// @route GET /api/admin/summary  (AI-generated overview)
exports.getAISummary = async (req, res) => {
  try {
    const recent = await Complaint.find().sort({ createdAt: -1 }).limit(40);
    const summary = await summarizeComplaints(recent);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
};

// @route GET /api/admin/users  (list staff/users for management)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// @route POST /api/admin/users  (admin creates staff/admin accounts)
exports.createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_REQUIREMENTS });
    }
    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be staff or admin' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role, department: department || null });
    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

// @route PUT /api/admin/users/:id/deactivate
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

// @route POST /api/admin/escalate  (run manually or via cron - see utils/escalationJob.js)
exports.runEscalation = async (req, res) => {
  try {
    const thresholdHours = Number(process.env.ESCALATION_HOURS) || 48;
    const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    const staleComplaints = await Complaint.find({
      status: { $in: ['Submitted', 'Assigned', 'In Progress'] },
      isEscalated: false,
      createdAt: { $lte: cutoff },
    });

    for (const complaint of staleComplaints) {
      complaint.isEscalated = true;
      complaint.escalatedAt = new Date();
      complaint.statusHistory.push({
        status: complaint.status,
        note: `Auto-escalated after exceeding ${thresholdHours}h without resolution`,
      });
      await complaint.save();

      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          complaintId: complaint._id,
          message: `Escalation: "${complaint.title}" has been unresolved for over ${thresholdHours} hours.`,
          type: 'escalation',
        });
      }
    }

    res.json({ escalatedCount: staleComplaints.length });
  } catch (err) {
    res.status(500).json({ message: 'Escalation run failed', error: err.message });
  }
};

// @route GET /api/admin/export/pdf
exports.exportPDF = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('submittedBy', 'name').sort({ createdAt: -1 });
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Complaint Management Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    complaints.forEach((c, i) => {
      doc
        .fontSize(12)
        .text(`${i + 1}. ${c.title}`, { continued: false })
        .fontSize(9)
        .text(`Category: ${c.category}  |  Priority: ${c.priority}  |  Status: ${c.status}`)
        .text(`Submitted by: ${c.isAnonymous ? 'Anonymous' : c.submittedBy?.name || 'N/A'}`)
        .text(`Date: ${c.createdAt.toLocaleDateString()}`)
        .moveDown(0.8);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export PDF', error: err.message });
  }
};

// @route GET /api/admin/export/excel
exports.exportExcel = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('submittedBy', 'name').sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Complaints');
    sheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Submitted By', key: 'submittedBy', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Resolved At', key: 'resolvedAt', width: 20 },
    ];

    complaints.forEach((c) => {
      sheet.addRow({
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        submittedBy: c.isAnonymous ? 'Anonymous' : c.submittedBy?.name || 'N/A',
        location: c.location,
        createdAt: c.createdAt.toLocaleString(),
        resolvedAt: c.resolvedAt ? c.resolvedAt.toLocaleString() : '',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export Excel', error: err.message });
  }
};

