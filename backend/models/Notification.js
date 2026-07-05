const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['status_update', 'assignment', 'escalation', 'feedback_request', 'general'],
      default: 'general',
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
