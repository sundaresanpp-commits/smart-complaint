const Location = require('../models/Location');
const { findCampusLocation } = require('./campusLocations');
const { geocodeAddress } = require('./geocoding');
const { isValidLatLng } = require('./coordinates');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findLocationById(locationId) {
  if (!locationId) return null;
  return Location.findById(locationId);
}

async function findLocationByName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  const exact = await Location.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
  });
  if (exact) return exact;

  const partial = await Location.find({
    name: { $regex: new RegExp(escapeRegex(trimmed), 'i') },
  }).sort({ name: 1 });
  if (partial.length === 1) return partial[0];

  const aliasMatch = findCampusLocation(trimmed);
  if (aliasMatch) {
    const aliasCandidates = [aliasMatch.name, ...(aliasMatch.aliases || [])];
    for (const candidate of aliasCandidates) {
      const byAlias = await Location.findOne({
        name: { $regex: new RegExp(escapeRegex(candidate), 'i') },
      });
      if (byAlias) return byAlias;
    }
  }

  return partial[0] || null;
}

async function findClosestLocation(lat, lng) {
  const locations = await Location.find({});
  if (!locations.length) return null;

  let closest = null;
  let bestDistance = Infinity;
  for (const location of locations) {
    const distance = haversineMeters(lat, lng, location.lat, location.lng);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = location;
    }
  }
  return closest;
}

/**
 * Resolve a campus location from an ID, name, or geocoded address.
 * Returns { location, coordinates, source } or null.
 */
async function resolveLocation({ locationId, locationName, allowGeocode = true }) {
  if (locationId) {
    const byId = await findLocationById(locationId);
    if (byId) {
      return {
        location: byId,
        coordinates: { lat: byId.lat, lng: byId.lng },
        source: 'id',
      };
    }
  }

  if (locationName) {
    const byName = await findLocationByName(locationName);
    if (byName) {
      return {
        location: byName,
        coordinates: { lat: byName.lat, lng: byName.lng },
        source: 'name',
      };
    }

    const aliasMatch = findCampusLocation(locationName);
    if (aliasMatch?.coordinates && isValidLatLng(aliasMatch.coordinates.lat, aliasMatch.coordinates.lng)) {
      const closest = await findClosestLocation(aliasMatch.coordinates.lat, aliasMatch.coordinates.lng);
      if (closest) {
        return {
          location: closest,
          coordinates: aliasMatch.coordinates,
          source: 'alias',
        };
      }
    }

    if (allowGeocode) {
      const geocoded = await geocodeAddress(locationName);
      if (geocoded) {
        const closest = await findClosestLocation(geocoded.lat, geocoded.lng);
        if (closest) {
          return {
            location: closest,
            coordinates: { lat: geocoded.lat, lng: geocoded.lng },
            source: 'geocode',
            geocodedName: geocoded.displayName,
          };
        }
      }
    }
  }

  return null;
}

async function searchLocations(query, limit = 10) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return Location.find({}).sort({ name: 1 }).limit(limit);
  }

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const dbMatches = await Location.find({ name: regex }).sort({ name: 1 }).limit(limit);
  const seen = new Set(dbMatches.map((loc) => loc._id.toString()));
  const results = [...dbMatches];

  const aliasMatch = findCampusLocation(trimmed);
  if (aliasMatch) {
    const aliasCandidates = [aliasMatch.name, ...(aliasMatch.aliases || [])];
    for (const candidate of aliasCandidates) {
      if (results.length >= limit) break;
      const aliasDb = await Location.findOne({
        name: { $regex: new RegExp(escapeRegex(candidate), 'i') },
      });
      if (aliasDb && !seen.has(aliasDb._id.toString())) {
        seen.add(aliasDb._id.toString());
        results.unshift(aliasDb);
      }
    }
  }

  return results.slice(0, limit);
}

module.exports = {
  findLocationById,
  findLocationByName,
  findClosestLocation,
  resolveLocation,
  searchLocations,
};
