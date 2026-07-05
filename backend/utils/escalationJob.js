const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { createNotification } = require('./notify');

/**
 * Checks for complaints unresolved past ESCALATION_HOURS and flags them.
 * Called on a timer from server.js (every hour) so escalation happens
 * automatically without needing to hit the manual /api/admin/escalate endpoint.
 */
async function runEscalationCheck() {
  try {
    const thresholdHours = Number(process.env.ESCALATION_HOURS) || 48;
    const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    const staleComplaints = await Complaint.find({
      status: { $in: ['Submitted', 'Assigned', 'In Progress'] },
      isEscalated: false,
      createdAt: { $lte: cutoff },
    });

    if (!staleComplaints.length) return;

    const admins = await User.find({ role: 'admin' });

    for (const complaint of staleComplaints) {
      complaint.isEscalated = true;
      complaint.escalatedAt = new Date();
      complaint.statusHistory.push({
        status: complaint.status,
        note: `Auto-escalated after exceeding ${thresholdHours}h without resolution`,
      });
      await complaint.save();

      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          complaintId: complaint._id,
          message: `Escalation: "${complaint.title}" has been unresolved for over ${thresholdHours} hours.`,
          type: 'escalation',
        });
      }
    }
    console.log(`Escalation job: flagged ${staleComplaints.length} complaint(s).`);
  } catch (err) {
    console.error('Escalation job error:', err.message);
  }
}

module.exports = runEscalationCheck;
