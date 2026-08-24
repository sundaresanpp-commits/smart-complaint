const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const retentionDays = () => {
  const configured = Number(process.env.RESOLVED_COMPLAINT_RETENTION_DAYS);
  return Number.isFinite(configured) && configured > 0 ? configured : 30;
};

/** Permanently removes complaints that have remained Resolved past the retention period. */
async function runResolvedComplaintCleanup() {
  try {
    const cutoff = new Date(Date.now() - retentionDays() * 24 * 60 * 60 * 1000);
    const expiredComplaints = await Complaint.find({
      status: 'Resolved',
      resolvedAt: { $lte: cutoff },
    }).select('_id');

    if (!expiredComplaints.length) return 0;

    const complaintIds = expiredComplaints.map((complaint) => complaint._id);
    await Notification.deleteMany({ complaint: { $in: complaintIds } });
    await Complaint.deleteMany({ _id: { $in: complaintIds } });
    console.log(`Resolved complaint cleanup: deleted ${complaintIds.length} complaint(s).`);
    return complaintIds.length;
  } catch (err) {
    console.error('Resolved complaint cleanup error:', err.message);
    return 0;
  }
}

module.exports = runResolvedComplaintCleanup;
