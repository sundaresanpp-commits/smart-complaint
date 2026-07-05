import React from 'react';

export function StatusPill({ status }) {
  const key = status.replace(/\s/g, '');
  return <span className={`pill pill-${key}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`priority-badge ${priority}`}>{priority}</span>;
}

export function Stamp({ type }) {
  const map = {
    resolved: { cls: 'stamp-resolved', label: 'Resolved' },
    escalated: { cls: 'stamp-escalated', label: 'Escalated' },
    duplicate: { cls: 'stamp-duplicate', label: 'Duplicate' },
  };
  const item = map[type];
  if (!item) return null;
  return <span className={`stamp ${item.cls}`}>{item.label}</span>;
}
