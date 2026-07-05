import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import api from '../services/api';

const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const CATEGORIES = [
  'Infrastructure',
  'Hostel',
  'Transport',
  'Wi-Fi/IT',
  'Sanitation',
  'Ragging/Safety',
  'Academic',
  'Canteen',
  'Other',
];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });

  const load = () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    api
      .get('/complaints', { params })
      .then((res) => setComplaints(res.data.complaints))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <Layout>
      <h1 style={{ marginBottom: 16 }}>All Complaints</h1>

      <form onSubmit={handleSearch} className="flex gap-8" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search title/description..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6, minWidth: 220 }}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6 }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6 }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6 }}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button className="btn btn-outline btn-sm" type="submit">Search</button>
      </form>

      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-slate">No complaints match these filters.</p>
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
