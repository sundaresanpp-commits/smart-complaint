/**
 * Lightweight coordinate/location resolver checks (no DB required).
 * Run: node utils/testLocationFlow.js
 */
const { parseCoordinate, isValidLatLng, isInsideTce, resolveComplaintCoordinates, normalizeLatLng } = require('./coordinates');
const { findCampusLocation } = require('./campusLocations');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(parseCoordinate('9.8818') === 9.8818, 'parseCoordinate number string');
  assert(parseCoordinate('invalid') === null, 'parseCoordinate invalid');
  assert(isValidLatLng(9.8818, 78.0835), 'valid TCE coords');
  const swapped = normalizeLatLng(78.0835, 9.8818);
  assert(swapped.lat === 9.8818 && swapped.lng === 78.0835 && swapped.swapped, 'detect and fix swapped coords');
  assert(isInsideTce(9.8818, 78.0835), 'inside TCE bounds');
  assert(!isInsideTce(10.0, 78.0), 'outside TCE bounds');

  const complaintWithStored = {
    coordinates: { lat: 9.8818, lng: 78.0835 },
    location: { lat: 9.99, lng: 78.99 },
  };
  const stored = resolveComplaintCoordinates(complaintWithStored);
  assert(stored.lat === 9.8818 && stored.lng === 78.0835, 'prefer stored complaint coordinates');

  const legacyComplaint = {
    coordinates: { lat: null, lng: null },
    location: { lat: 9.882, lng: 78.0822 },
  };
  const legacy = resolveComplaintCoordinates(legacyComplaint);
  assert(legacy.lat === 9.882 && legacy.lng === 78.0822, 'fallback to populated location');

  const alias = findCampusLocation('canteen');
  assert(alias?.name === 'Main Canteen', 'alias lookup for canteen');

  console.log('All location flow checks passed.');
}

run();
