const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    category: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);


