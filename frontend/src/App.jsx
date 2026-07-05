import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import AllComplaints from './pages/AllComplaints';
import Analytics from './pages/Analytics';
import CampusMap from './pages/CampusMap';
import StaffManagement from './pages/StaffManagement';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />
      <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />

      {/* User-only */}
      <Route
        path="/submit"
        element={
          <ProtectedRoute roles={['user']}>
            <SubmitComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute roles={['user']}>
            <MyComplaints />
          </ProtectedRoute>
        }
      />

      {/* Staff-only */}
      <Route
        path="/queue"
        element={
          <ProtectedRoute roles={['staff']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin-only */}
      <Route
        path="/complaints"
        element={
          <ProtectedRoute roles={['admin', 'staff']}>
            <AllComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute roles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute roles={['admin']}>
            <StaffManagement />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
