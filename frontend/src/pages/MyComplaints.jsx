import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import api from '../services/api';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api
      .get('/complaints/mine')
      .then((res) => setComplaints(res.data.complaints))
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const filtered = filter === 'All' ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <Layout>
      <h1 style={{ marginBottom: 16 }}>My Complaints</h1>

      <div className="flex gap-8" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-slate">No complaints in this status yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-16">
          {filtered.map((c) => (
            <TicketCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </Layout>
  );
}
