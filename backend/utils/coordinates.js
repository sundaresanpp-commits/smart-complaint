/** TCE campus bounding box (Madurai) — used to validate geocoded results. */
const TCE_BOUNDS = {
  minLat: 9.8775,
  maxLat: 9.887,
  minLng: 78.0775,
  maxLng: 78.088,
};

function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function isValidLatLng(lat, lng) {
  return (
    parseCoordinate(lat) !== null &&
    parseCoordinate(lng) !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  if (!isValidLatLng(lat1, lng1) || !isValidLatLng(lat2, lng2)) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function isInsideTce(lat, lng) {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);
  if (parsedLat === null || parsedLng === null) return false;
  return (
    parsedLat >= TCE_BOUNDS.minLat &&
    parsedLat <= TCE_BOUNDS.maxLat &&
    parsedLng >= TCE_BOUNDS.minLng &&
    parsedLng <= TCE_BOUNDS.maxLng
  );
}

function normalizeLatLng(lat, lng) {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);
  if (parsedLat === null || parsedLng === null) return null;

  // TCE campus coordinates are ~9.88 N, ~78.08 E. Values like lat=78 & lng=9 indicate a swap.
  if (parsedLat > 20 && parsedLng < 20) {
    return { lat: parsedLng, lng: parsedLat, swapped: true };
  }

  return { lat: parsedLat, lng: parsedLng, swapped: false };
}

/** Resolve lat/lng from a complaint document (denormalized coords or populated location). */
function resolveComplaintCoordinates(complaint) {
  const stored = normalizeLatLng(complaint?.coordinates?.lat, complaint?.coordinates?.lng);
  if (stored) return { lat: stored.lat, lng: stored.lng };

  const fromLocation = normalizeLatLng(complaint?.location?.lat, complaint?.location?.lng);
  if (fromLocation) return { lat: fromLocation.lat, lng: fromLocation.lng };

  return null;
}

module.exports = {
  TCE_BOUNDS,
  parseCoordinate,
  isValidLatLng,
  isInsideTce,
  haversineMeters,
  normalizeLatLng,
  resolveComplaintCoordinates,
};

