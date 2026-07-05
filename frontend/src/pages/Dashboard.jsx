import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div className="text-sm text-slate" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: accent || 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function DashboardError({ children }) {
  if (!children) return null;

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: 'var(--rust)' }}>
      <p className="field-error" style={{ margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role;
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    let isMounted = true;

    const setSafeComplaints = (items) => {
      if (isMounted) setComplaints(Array.isArray(items) ? items : []);
    };

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        if (role === 'user') {
          const res = await api.get('/complaints/mine');
          setSafeComplaints(res.data?.complaints);
          return;
        }

        if (role === 'staff') {
          const res = await api.get('/complaints', { params: { assignedToMe: true, limit: 6 } });
          setSafeComplaints(res.data?.complaints);
          return;
        }

        const [analyticsRes, complaintsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/complaints', { params: { limit: 6 } }),
        ]);

        if (isMounted) {
          setAnalytics(analyticsRes.data || null);
          setSafeComplaints(complaintsRes.data?.complaints);
        }

        api
          .get('/admin/summary')
          .then((res) => {
            if (isMounted) setAiSummary(res.data?.summary || '');
          })
          .catch(() => {
            if (isMounted) setAiSummary('');
          });
      } catch {
        if (isMounted) {
          setError('Unable to load dashboard data. Please make sure the backend is running and your login session is valid.');
          setSafeComplaints([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (role) loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (role === 'user') {
    const active = complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status));
    const resolved = complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status));

    return (
      <Layout>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div>
            <h1>Welcome back, {firstName}</h1>
            <p className="text-slate">Here's what's happening with your complaints.</p>
          </div>
          <Link to="/submit" className="btn btn-primary">
            + New Complaint
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-16" style={{ marginBottom: 28 }}>
          <StatCard label="Total Submitted" value={complaints.length} />
          <StatCard label="Active" value={active.length} accent="var(--amber)" />
          <StatCard label="Resolved" value={resolved.length} accent="var(--teal)" />
        </div>

        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Recent Complaints</h2>
        <DashboardError>{error}</DashboardError>
        {loading ? (
          <p className="text-slate">Loading...</p>
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-slate">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-16">
            {complaints.slice(0, 4).map((c, index) => (
              <TicketCard key={c._id || index} complaint={c} />
            ))}
          </div>
        )}
      </Layout>
    );
  }

  if (role === 'staff') {
    return (
      <Layout>
        <h1 style={{ marginBottom: 4 }}>My Queue</h1>
        <p className="text-slate" style={{ marginBottom: 24 }}>Complaints assigned to you.</p>
        <DashboardError>{error}</DashboardError>
        {loading ? (
          <p className="text-slate">Loading...</p>
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-slate">No complaints assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-16">
            {complaints.map((c, index) => (
              <TicketCard key={c._id || index} complaint={c} />
            ))}
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 style={{ marginBottom: 4 }}>Admin Overview</h1>
      <p className="text-slate" style={{ marginBottom: 24 }}>Campus-wide complaint activity at a glance.</p>

      {analytics && (
        <div className="grid grid-cols-4 gap-16" style={{ marginBottom: 24 }}>
          <StatCard label="Total Complaints" value={analytics.totals?.total || 0} />
          <StatCard label="In Progress" value={analytics.totals?.inProgress || 0} accent="var(--amber)" />
          <StatCard label="Resolved" value={analytics.totals?.resolved || 0} accent="var(--teal)" />
          <StatCard label="Avg Resolution" value={`${analytics.avgResolutionHours || 0}h`} />
        </div>
      )}

      {aiSummary && (
        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--amber-soft)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>AI-Generated Overview</h3>
          <p className="text-sm" style={{ lineHeight: 1.6, margin: 0 }}>
            {aiSummary}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 17 }}>Recent Complaints</h2>
        <Link to="/complaints" className="text-sm">
          View all -&gt;
        </Link>
      </div>
      <DashboardError>{error}</DashboardError>
      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-slate">No recent complaints found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-16">
          {complaints.map((c, index) => (
            <TicketCard key={c._id || index} complaint={c} />
          ))}
        </div>
      )}
    </Layout>
  );
}
