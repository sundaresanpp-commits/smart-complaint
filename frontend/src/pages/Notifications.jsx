import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const TYPE_LABEL = {
  status_update: 'Status Update',
  assignment: 'Assignment',
  escalation: 'Escalation',
  feedback_request: 'Feedback',
  general: 'General',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then((res) => setNotifications(res.data.notifications)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
        <h1>Notifications</h1>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>

      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-slate">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex-col gap-8">
          {notifications.map((n) => (
            <div
              key={n._id}
              className="card"
              style={{
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: n.isRead ? 'var(--paper-raised)' : 'var(--amber-soft)',
              }}
            >
              <div>
                <span className="text-sm text-slate mono" style={{ marginRight: 10 }}>
                  {TYPE_LABEL[n.type] || 'Update'}
                </span>
                <span>{n.message}</span>
                {n.complaint && (
                  <>
                    {' '}
                    <Link to={`/complaints/${n.complaint}`} className="text-sm">
                      View →
                    </Link>
                  </>
                )}
                <div className="text-sm text-slate" style={{ marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.isRead && (
                <button className="btn btn-outline btn-sm" onClick={() => markRead(n._id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
