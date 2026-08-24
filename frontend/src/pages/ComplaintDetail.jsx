import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { StatusPill, PriorityBadge, Stamp } from '../components/Badges';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_FLOW = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [message, setMessage] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');

  const load = () => {
    api.get(`/complaints/${id}`).then((res) => setComplaint(res.data.complaint));
  };

  useEffect(() => {
    load();
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/admin/users?role=staff').then((res) => {
        const staff = (res.data.users || [])
          .map((member) => ({ ...member, staffId: member._id || member.id }))
          .filter((member) => member.staffId);
        setStaffList(staff);
      });
    }
  }, [user.role]);

  const handleAssign = async () => {
    if (!selectedStaff) {
      setMessage('Please select a staff member');
      return;
    }
    try {
      await api.put(`/complaints/${id}/assign`, { staffId: selectedStaff });
      setMessage('Complaint assigned');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to assign');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status, note: statusNote });
      setStatusNote('');
      setMessage(`Status updated to ${status}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/complaints/${id}/feedback`, { rating, comment: feedbackComment });
      setMessage('Thanks for your feedback!');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading || !complaint) {
    return (
      <Layout>
        <p className="text-slate">Loading...</p>
      </Layout>
    );
  }

  const canManage = user.role === 'staff' || user.role === 'admin';
  const canGiveFeedback =
    user.role === 'user' &&
    complaint.submittedBy?._id === user.id &&
    ['Resolved', 'Closed'].includes(complaint.status) &&
    !complaint.feedback?.rating;

  const nextStatusOptions = STATUS_FLOW.filter((s) => s !== complaint.status);

  return (
    <Layout>
      <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
        <span className="ticket-id">TICKET #{complaint._id.slice(-6).toUpperCase()}</span>
        <div className="flex gap-8">
          {complaint.isEscalated && <Stamp type="escalated" />}
          {complaint.isDuplicate && <Stamp type="duplicate" />}
        </div>
      </div>
      <h1 style={{ marginBottom: 16 }}>{complaint.title}</h1>

      <div className="grid grid-cols-3 gap-16" style={{ alignItems: 'start' }}>
        {/* Left: details */}
        <div className="card" style={{ gridColumn: 'span 2', padding: 24 }}>
          <div className="flex gap-8" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            <StatusPill status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="pill" style={{ background: 'var(--paper)', color: 'var(--ink-soft)' }}>
              {complaint.category}
            </span>
            <span className="pill" style={{ background: 'var(--paper)', color: 'var(--ink-soft)' }}>
              Sentiment: {complaint.sentiment}
            </span>
          </div>

          <p style={{ marginBottom: 16, lineHeight: 1.6 }}>{complaint.description}</p>

          {complaint.aiSummary && (
            <div
              className="text-sm"
              style={{
                background: 'var(--amber-soft)',
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <strong>AI Summary:</strong> {complaint.aiSummary}
            </div>
          )}

          {complaint.imageUrl && (
            <img
              src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${
                complaint.imageUrl
              }`}
              alt="Complaint"
              style={{ maxWidth: '100%', borderRadius: 6, marginBottom: 16, border: '1px solid var(--line)' }}
            />
          )}

          <div className="text-sm text-slate">
            Location: {complaint.location?.name || complaint.locationName || 'Not specified'} <br />
            Submitted by: {complaint.isAnonymous ? 'Anonymous' : complaint.submittedBy?.name || 'N/A'} <br />
            {complaint.assignedTo && <>Assigned to: {complaint.assignedTo.name} <br /></>}
          </div>

          {complaint.duplicateCount > 0 && (
            <div style={{ marginTop: 20, padding: 12, background: 'var(--amber-soft)', borderRadius: 6 }}>
              <strong>Duplicate Count: {complaint.duplicateCount}</strong>
              <ul className="text-sm text-slate" style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {(complaint.duplicateHistory || []).map((duplicate, index) => (
                  <li key={`${duplicate.submittedAt}-${index}`}>{new Date(duplicate.submittedAt).toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Status timeline */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>Status Timeline</h3>
          <div className="flex-col gap-12">
            {complaint.statusHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--teal)',
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {h.status} {h.changedBy?.name && <span className="text-slate">— {h.changedBy.name}</span>}
                  </div>
                  {h.note && <div className="text-sm text-slate">{h.note}</div>}
                  <div className="text-sm text-slate mono">{new Date(h.changedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {complaint.feedback?.rating && (
            <div style={{ marginTop: 20, padding: 12, background: 'var(--teal-soft)', borderRadius: 6 }}>
              <strong>Feedback:</strong> {complaint.feedback.rating}/5 — {complaint.feedback.comment}
            </div>
          )}

          {canGiveFeedback && (
            <form onSubmit={handleFeedback} style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>Rate this resolution</h3>
              <div className="field">
                <label>Rating (1-5)</label>
                <input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div className="field">
                <label>Comment</label>
                <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} rows={3} />
              </div>
              <button className="btn btn-primary" type="submit">
                Submit Feedback
              </button>
            </form>
          )}
        </div>

        {/* Right: management panel */}
        {canManage && (
          <div className="card" style={{ padding: 20 }}>
            {user.role === 'admin' && (
              <>
                <h3 style={{ marginBottom: 12, fontSize: 15 }}>Assign Staff</h3>
                <div className="field">
                  <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                    <option value="">Select staff member</option>
                    {staffList.map((s) => (
                      <option key={s.staffId} value={s.staffId}>
                        {s.name} {s.department ? `(${s.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleAssign} style={{ marginBottom: 20 }}>
                  Assign
                </button>
              </>
            )}
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>Update Status</h3>
            <div className="field">
              <label>Note (optional)</label>
              <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} />
            </div>
            <div className="flex-col gap-8">
              {nextStatusOptions.map((s) => (
                <button key={s} className="btn btn-outline btn-sm" onClick={() => handleStatusChange(s)}>
                  Mark as {s}
                </button>
              ))}
            </div>
            {message && (
              <p className="text-sm" style={{ marginTop: 12, color: 'var(--teal)' }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

