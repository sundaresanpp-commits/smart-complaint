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

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'user') {
      api.get('/complaints/mine').then((res) => setComplaints(res.data.complaints)).finally(() => setLoading(false));
    } else if (user.role === 'staff') {
      api
        .get('/complaints', { params: { assignedToMe: true, limit: 6 } })
        .then((res) => setComplaints(res.data.complaints))
        .finally(() => setLoading(false));
    } else {
      Promise.all([api.get('/admin/analytics'), api.get('/complaints', { params: { limit: 6 } })])
        .then(([a, c]) => {
          setAnalytics(a.data);
          setComplaints(c.data.complaints);
        })
        .finally(() => setLoading(false));
      api.get('/admin/summary').then((res) => setAiSummary(res.data.summary));
    }
  }, [user.role]);

  if (user.role === 'user') {
    const active = complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status));
    const resolved = complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status));
    return (
      <Layout>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div>
            <h1>Welcome back, {user.name.split(' ')[0]}</h1>
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
        {loading ? (
          <p className="text-slate">Loading...</p>
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-slate">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-16">
            {complaints.slice(0, 4).map((c) => (
              <TicketCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
      </Layout>
    );
  }

  if (user.role === 'staff') {
    return (
      <Layout>
        <h1 style={{ marginBottom: 4 }}>My Queue</h1>
        <p className="text-slate" style={{ marginBottom: 24 }}>Complaints assigned to you.</p>
        {loading ? (
          <p className="text-slate">Loading...</p>
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-slate">No complaints assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-16">
            {complaints.map((c) => (
              <TicketCard key={c._id} complaint={c} />
            ))}
          </div>
        )}
      </Layout>
    );
  }

  // Admin dashboard
  return (
    <Layout>
      <h1 style={{ marginBottom: 4 }}>Admin Overview</h1>
      <p className="text-slate" style={{ marginBottom: 24 }}>Campus-wide complaint activity at a glance.</p>

      {analytics && (
        <div className="grid grid-cols-4 gap-16" style={{ marginBottom: 24 }}>
          <StatCard label="Total Complaints" value={analytics.totals.total} />
          <StatCard label="In Progress" value={analytics.totals.inProgress} accent="var(--amber)" />
          <StatCard label="Resolved" value={analytics.totals.resolved} accent="var(--teal)" />
          <StatCard label="Avg Resolution" value={`${analytics.avgResolutionHours}h`} />
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
          View all →
        </Link>
      </div>
      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-16">
          {complaints.map((c) => (
            <TicketCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </Layout>
  );
}
