const Location = require('../models/Location');
const { searchLocations } = require('../utils/locationResolver');
const { geocodeAddress } = require('../utils/geocoding');

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({}).sort({ name: 1 });
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch locations', error: err.message });
  }
};

exports.searchLocations = async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const locations = await searchLocations(q, Number(limit) || 10);
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to search locations', error: err.message });
  }
};

exports.geocodeLocation = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ message: 'Location query is required' });
    }

    const result = await geocodeAddress(q);
    if (!result) {
      return res.status(404).json({ message: 'Location could not be found within the campus area' });
    }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: 'Geocoding failed', error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name, lat, lng, category } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }

    const location = await Location.create({
      name,
      lat: Number(lat),
      lng: Number(lng),
      category: category || '',
    });

    res.status(201).json({ location });
  } catch (err) {
    const message = err.code === 11000 ? 'Location name already exists' : 'Failed to create location';
    res.status(500).json({ message, error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { name, lat, lng, category } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (lat !== undefined) update.lat = Number(lat);
    if (lng !== undefined) update.lng = Number(lng);
    if (category !== undefined) update.category = category;

    const location = await Location.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!location) return res.status(404).json({ message: 'Location not found' });

    res.json({ location });
  } catch (err) {
    const message = err.code === 11000 ? 'Location name already exists' : 'Failed to update location';
    res.status(500).json({ message, error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete location', error: err.message });
  }
};
