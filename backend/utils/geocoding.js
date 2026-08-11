const { isInsideTce, parseCoordinate } = require('./coordinates');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TCE_VIEWBOX = '78.0775,9.887,78.088,9.8775'; // left,top,right,bottom

/**
 * Geocode a place name/address to lat/lng using OpenStreetMap Nominatim.
 * Restricted to the TCE campus area via viewbox + bounded search.
 * No API key required; please respect Nominatim usage policy (1 req/sec).
 */
async function geocodeAddress(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: `${trimmed}, Thiagarajar College of Engineering, Madurai, Tamil Nadu, India`,
    format: 'json',
    limit: '1',
    viewbox: TCE_VIEWBOX,
    bounded: '1',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      'User-Agent': 'CampusFix-ComplaintSystem/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding service returned ${response.status}`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const lat = parseCoordinate(results[0].lat);
  const lng = parseCoordinate(results[0].lon);
  if (lat === null || lng === null) return null;

  if (!isInsideTce(lat, lng)) {
    return null;
  }

  return {
    lat,
    lng,
    displayName: results[0].display_name || trimmed,
  };
}

module.exports = { geocodeAddress };
