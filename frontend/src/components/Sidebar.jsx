import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const iconStyle = { width: 18, height: 18, flexShrink: 0 };

function Icon({ path }) {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  dashboard: 'M4 4h7v9H4zM13 4h7v5h-7zM13 12h7v8h-7zM4 16h7v4H4z',
  submit: 'M12 5v14M5 12h14',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 3',
  map: 'M9 2 4 4v18l5-2 6 2 5-2V2l-5 2-6-2z M9 2v18 M15 4v18',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  analytics: 'M3 3v18h18 M7 15l4-6 4 3 5-8',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/submit', label: 'Submit Complaint', icon: 'submit' },
    { to: '/history', label: 'My Complaints', icon: 'history' },
    { to: '/map', label: 'Campus Map', icon: 'map' },
  ];
  const staffLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/queue', label: 'My Queue', icon: 'history' },
    { to: '/map', label: 'Campus Map', icon: 'map' },
  ];
  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/complaints', label: 'All Complaints', icon: 'history' },
    { to: '/analytics', label: 'Analytics', icon: 'analytics' },
    { to: '/map', label: 'Campus Map', icon: 'map' },
    { to: '/staff', label: 'Manage Staff', icon: 'users' },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'staff' ? staffLinks : userLinks;

  return (
    <aside
      style={{
        width: 232,
        background: 'var(--ink)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 14px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          C
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>CampusFix</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 6,
              color: isActive ? 'var(--ink)' : 'rgba(255,255,255,0.85)',
              background: isActive ? 'var(--amber)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: 14,
            })}
          >
            <Icon path={ICONS[link.icon]} />
            {link.label}
          </NavLink>
        ))}
        <NavLink
          to="/notifications"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 6,
            color: isActive ? 'var(--ink)' : 'rgba(255,255,255,0.85)',
            background: isActive ? 'var(--amber)' : 'transparent',
            fontWeight: isActive ? 600 : 500,
            fontSize: 14,
          })}
        >
          <Icon path={ICONS.bell} />
          Notifications
        </NavLink>
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, marginTop: 14 }}>
        <div style={{ padding: '0 12px 10px', fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-sm"
          style={{ width: '100%', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <Icon path={ICONS.logout} />
          Log out
        </button>
      </div>
    </aside>
  );
}
