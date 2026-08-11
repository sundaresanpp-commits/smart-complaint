export function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeLatLng(lat, lng) {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);
  if (parsedLat === null || parsedLng === null) return null;

  if (parsedLat > 20 && parsedLng < 20) {
    return { lat: parsedLng, lng: parsedLat, swapped: true };
  }

  return { lat: parsedLat, lng: parsedLng, swapped: false };
}

export function resolveComplaintCoordinates(complaint) {
  const stored = normalizeLatLng(complaint?.coordinates?.lat, complaint?.coordinates?.lng);
  if (stored) return { lat: stored.lat, lng: stored.lng };

  const fromLocation = normalizeLatLng(complaint?.location?.lat, complaint?.location?.lng);
  if (fromLocation) return { lat: fromLocation.lat, lng: fromLocation.lng };

  return null;
}

export const TCE_CENTER = [9.8819, 78.0827];
export const TCE_BOUNDS = [
  [9.8775, 78.0775],
  [9.887, 78.088],
];

export function isInsideTce(lat, lng) {
  const parsedLat = parseCoordinate(lat);
  const parsedLng = parseCoordinate(lng);
  if (parsedLat === null || parsedLng === null) return false;
  return (
    parsedLat >= TCE_BOUNDS[0][0] &&
    parsedLat <= TCE_BOUNDS[1][0] &&
    parsedLng >= TCE_BOUNDS[0][1] &&
    parsedLng <= TCE_BOUNDS[1][1]
  );
}
