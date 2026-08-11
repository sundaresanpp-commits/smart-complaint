const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Infrastructure',
        'Hostel',
        'Transport',
        'Wi-Fi/IT',
        'Sanitation',
        'Ragging/Safety',
        'Academic',
        'Canteen',
        'Other',
      ],
      default: 'Other',
    },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    locationName: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    imageUrl: { type: String, default: null },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    sentiment: {
      type: String,
      enum: ['Calm', 'Concerned', 'Urgent', 'Distressed'],
      default: 'Concerned',
    },
    aiSummary: { type: String, default: '' },

    status: {
      type: String,
      enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Submitted',
    },
    statusHistory: [statusHistorySchema],

    isAnonymous: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedDepartment: { type: String, default: null },

    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },

    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },

    resolvedAt: { type: Date, default: null },
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

complaintSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);

