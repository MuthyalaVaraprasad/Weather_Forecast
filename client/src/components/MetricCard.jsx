import React from 'react';

/**
 * Modular glassmorphic card to display secondary weather details.
 */
export default function MetricCard({ icon, title, value, subtitle, extra }) {
  return (
    <div className="glass-panel detail-card">
      <div className="card-header-metrics" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {icon}
        <span className="card-title" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px 0', fontFamily: 'var(--font-primary)' }}>{value}</div>
      {subtitle && <div className="metric-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
      {extra}
    </div>
  );
}
