import React from 'react';
import { Link } from 'react-router-dom';
import { StatusPill, PriorityBadge, Stamp } from './Badges';

export default function TicketCard({ complaint }) {
  const shortId = complaint._id.slice(-6).toUpperCase();
  const date = new Date(complaint.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link to={`/complaints/${complaint._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`ticket priority-${complaint.priority}`}>
        <div className="flex justify-between items-center">
          <span className="ticket-id">TICKET #{shortId}</span>
          <span className="text-sm text-slate">{date}</span>
        </div>
        <div className="ticket-title">{complaint.title}</div>
        <div className="ticket-meta">
          <StatusPill status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
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
            {complaint.category}
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
