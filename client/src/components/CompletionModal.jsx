import React from 'react';
import { T } from './theme';

// Centered "action complete" toast modal: icon, coloured title, message, detail rows.
// Used for build/policy/research completion confirmations.
export function CompletionModal({ icon, title, titleColor, message, rows, maxWidth = '360px', onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
        <h2 style={{ color: titleColor }}>{title}</h2>
        <p style={{ color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0' }}>
          {message}
        </p>
        <div style={{ background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'left' }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < rows.length - 1 ? '6px' : 0 }}>
              <span style={{ color: T.textSecondary }}>{row.label}</span>
              <span style={{ color: row.color || T.textPrimary, ...(row.style || {}) }}>{row.value}</span>
            </div>
          ))}
        </div>
        <button className="action-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
