import React from 'react';
import { Link } from 'react-router-dom';
import { StatusPill, PriorityBadge, Stamp } from './Badges';

export default function TicketCard({ complaint = {} }) {
  const id = complaint._id || '';
  const shortId = id ? id.slice(-6).toUpperCase() : 'NEW';
  const date = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'No date';
  const detailPath = id ? `/complaints/${id}` : '/dashboard';

  return (
    <Link to={detailPath} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`ticket priority-${complaint.priority || 'Low'}`}>
        <div className="flex justify-between items-center">
          <span className="ticket-id">TICKET #{shortId}</span>
          <span className="text-sm text-slate">{date}</span>
        </div>
        <div className="ticket-title">{complaint.title || 'Untitled complaint'}</div>
        <div className="ticket-meta">
          <StatusPill status={complaint.status || 'Submitted'} />
          <PriorityBadge priority={complaint.priority || 'Low'} />
          <span
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 100,
              padding: '3px 10px',
              color: 'var(--ink-soft)',
              fontSize: 12,
            }}
          >
            {complaint.category || 'General'}
          </span>
          {(complaint.location?.name || complaint.locationName) && (
            <span
              style={{
                background: 'var(--teal-soft)',
                border: '1px solid var(--line)',
                borderRadius: 100,
                padding: '3px 10px',
                color: 'var(--teal)',
                fontSize: 12,
              }}
            >
              {complaint.location?.name || complaint.locationName}
            </span>
          )}
          {complaint.isEscalated && <Stamp type="escalated" />}
          {complaint.isDuplicate && <Stamp type="duplicate" />}
          {['Resolved', 'Closed'].includes(complaint.status) && <Stamp type="resolved" />}
        </div>
      </div>
    </Link>
  );
}
