/**
 * Seeds the database with demo users and complaints so you have
 * something to show immediately, without waiting on real submissions.
 * Run with: npm run seed  (from the backend folder)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Location = require('../models/Location');

const demoLocations = [
  { name: 'A Block', category: 'Academic', lat: 9.8812, lng: 78.0814 },
  { name: 'B Block', category: 'Academic', lat: 9.8816, lng: 78.0818 },
  { name: 'C Block', category: 'Academic', lat: 9.882, lng: 78.0822 },
  { name: 'D Block', category: 'Academic', lat: 9.8824, lng: 78.0826 },
  { name: 'E Block', category: 'Academic', lat: 9.8828, lng: 78.083 },
  { name: 'Guest House', category: 'Residential', lat: 9.8832, lng: 78.0813 },
  { name: 'Main Canteen', category: 'Dining', lat: 9.8818, lng: 78.0835 },
  { name: 'Trotters Ground', category: 'Recreation', lat: 9.8845, lng: 78.0838 },
  { name: 'Library', category: 'Academic', lat: 9.8835, lng: 78.0828 },
  { name: 'KS Auditorium', category: 'Recreation', lat: 9.8829, lng: 78.0837 },
  { name: 'M Halls', category: 'Academic', lat: 9.8814, lng: 78.0829 },
  { name: 'Main Building', category: 'Administration', lat: 9.8821, lng: 78.0816 },
  { name: 'Department of Mechanical Engineering', category: 'Academic', lat: 9.8842, lng: 78.0831 },
  { name: 'Department of Civil Engineering', category: 'Academic', lat: 9.8819, lng: 78.0818 },
  { name: 'Department of Information Technology', category: 'Academic', lat: 9.8823, lng: 78.0825 },
  { name: 'B Halls', category: 'Academic', lat: 9.8817, lng: 78.0827 },
  { name: 'LR Halls', category: 'Academic', lat: 9.883, lng: 78.0821 },
];

const demoComplaints = [
  {
    title: 'WiFi down in Block C hostel',
    description: 'Internet has been completely unavailable in Block C for two days, affecting online classes.',
    category: 'Wi-Fi/IT',
    priority: 'High',
    sentiment: 'Urgent',
    locationName: 'C Block',
  },
  {
    title: 'Water leakage near main library',
    description: 'There is a continuous water leak from the pipe near the library entrance, creating a slip hazard.',
    category: 'Infrastructure',
    priority: 'Critical',
    sentiment: 'Distressed',
    locationName: 'Library',
  },
  {
    title: 'Canteen food quality declining',
    description: 'The food quality in the main canteen has gotten worse over the last week, several students got sick.',
    category: 'Canteen',
    priority: 'High',
    sentiment: 'Concerned',
    locationName: 'Main Canteen',
  },
  {
    title: 'Shuttle bus consistently late',
    description: 'The 8am shuttle from the gate to the academic block has been 20+ minutes late every day this week.',
    category: 'Transport',
    priority: 'Medium',
    sentiment: 'Concerned',
    locationName: 'Main Building',
  },
  {
    title: 'Garbage not collected in Block A',
    description: 'Garbage bins outside Block A have not been emptied in 4 days and are overflowing.',
    category: 'Sanitation',
    priority: 'Medium',
    sentiment: 'Concerned',
    locationName: 'A Block',
  },
  {
    title: 'Streetlights not working near parking lot',
    description: 'Several streetlights near the north parking lot are broken, making it unsafe to walk at night.',
    category: 'Ragging/Safety',
    priority: 'Critical',
    sentiment: 'Distressed',
    locationName: 'Trotters Ground',
  },
  {
    title: 'Projector not working in Room 204',
    description: 'The projector in Room 204 has not worked for the past three lectures, classes are being disrupted.',
    category: 'Academic',
    priority: 'Low',
    sentiment: 'Calm',
    locationName: 'LR Halls',
  },
];

async function seed() {
  await connectDB();

  await User.deleteMany({ email: { $in: ['admin@demo.com', 'staff@demo.com', 'student@demo.com'] } });
  await Complaint.deleteMany({});
  await Location.deleteMany({});
  await Location.insertMany(demoLocations);
  const locations = await Location.find({});
  const locationsByName = new Map(locations.map((location) => [location.name, location]));

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'password123',
    role: 'admin',
  });

  const staff = await User.create({
    name: 'Staff Member',
    email: 'staff@demo.com',
    password: 'password123',
    role: 'staff',
    department: 'Infrastructure',
  });

  const student = await User.create({
    name: 'Demo Student',
    email: 'student@demo.com',
    password: 'password123',
    role: 'user',
  });

  for (const { locationName, ...c } of demoComplaints) {
    const location = locationsByName.get(locationName);
    await Complaint.create({
      ...c,
      location: location._id,
      locationName: location.name,
      coordinates: { lat: location.lat, lng: location.lng },
      submittedBy: student._id,
      statusHistory: [{ status: 'Submitted', changedBy: student._id, note: 'Complaint submitted' }],
    });
  }

  console.log('Seed complete!');
  console.log('Login with:');
  console.log('  Admin:   admin@demo.com / password123');
  console.log('  Staff:   staff@demo.com / password123');
  console.log('  Student: student@demo.com / password123');
  mongoose.connection.close();
}

seed();
