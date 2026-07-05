const CAMPUS_LOCATIONS = [
  {
    name: 'CSE Department',
    aliases: ['cse', 'cse department', 'computer science', 'computer science department'],
    coordinates: { lat: 9.8826, lng: 78.0822 },
  },
  {
    name: 'IT Department',
    aliases: ['it', 'it department', 'information technology'],
    coordinates: { lat: 9.8823, lng: 78.0825 },
  },
  {
    name: 'ECE Department',
    aliases: ['ece', 'ece department', 'electronics department'],
    coordinates: { lat: 9.8832, lng: 78.0828 },
  },
  {
    name: 'EEE Department',
    aliases: ['eee', 'eee department', 'electrical department'],
    coordinates: { lat: 9.8837, lng: 78.0826 },
  },
  {
    name: 'Mechanical Department',
    aliases: ['mechanical', 'mechanical department', 'mech'],
    coordinates: { lat: 9.8842, lng: 78.0831 },
  },
  {
    name: 'Civil Department',
    aliases: ['civil', 'civil department'],
    coordinates: { lat: 9.8819, lng: 78.0818 },
  },
  {
    name: 'Main Library',
    aliases: ['library', 'main library'],
    coordinates: { lat: 9.8835, lng: 78.0828 },
  },
  {
    name: 'Main Canteen',
    aliases: ['canteen', 'main canteen'],
    coordinates: { lat: 9.8818, lng: 78.0835 },
  },
  {
    name: 'Main Gate',
    aliases: ['gate', 'main gate', 'entrance'],
    coordinates: { lat: 9.8806, lng: 78.0811 },
  },
  {
    name: 'Hostel Block A',
    aliases: ['hostel a', 'hostel block a', 'block a hostel'],
    coordinates: { lat: 9.8842, lng: 78.0817 },
  },
  {
    name: 'Hostel Block C',
    aliases: ['hostel c', 'hostel block c', 'block c hostel'],
    coordinates: { lat: 9.8829, lng: 78.0822 },
  },
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function findCampusLocation(value) {
  const input = normalize(value);
  if (!input) return null;

  return (
    CAMPUS_LOCATIONS.find((place) => normalize(place.name) === input || place.aliases.includes(input)) ||
    CAMPUS_LOCATIONS.find((place) => normalize(place.name).includes(input) || place.aliases.some((alias) => alias.includes(input)))
  );
}

module.exports = { CAMPUS_LOCATIONS, findCampusLocation };
