import React from 'react';
import { T, FONT, FS } from './theme';
import logoSvg from '../assets/fort-llama-icon.svg';

// Fixed top bar: brand + vibes/score status strip
// Layout-aware: renders differently for wide, medium, narrow breakpoints
export function TopBar({ vibes, reputation, level, score, layout, narrowTab, onNarrowTab, mode, view, onViewChange }) {
  const stats = [
    { k: 'VIBE', v: vibes },
    { k: 'REP', v: reputation },
    { k: 'LVL', v: level },
    { k: 'SCORE', v: (score || 0).toLocaleString() },
  ];

  const logoRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
      <img src={logoSvg} alt="Fort Llama" style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />
      <span style={{ fontSize: FS.brand, color: T.accentBright, letterSpacing: '2px', fontFamily: FONT }}>Fort Llama</span>
    </div>
  );

  /* Single-row stats bar (used in wide + medium) */
  const statsRow = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 12px',
      background: 'transparent', border: `1px solid ${T.accent}`,
      ...(layout === 'wide' ? { flexShrink: 1, minWidth: 0, overflow: 'hidden' } : {}),
    }}>
      {stats.map((item, i, arr) => (
        <React.Fragment key={item.k}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '4px',
            flexShrink: item.k === 'SCORE' ? 0 : 1, minWidth: 0,
          }}>
            <span style={{ fontFamily: FONT, fontSize: FS.micro, color: T.textMuted, letterSpacing: '1px' }}>{item.k}</span>
            <span style={{
              fontFamily: FONT, fontSize: FS.body, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              ...(item.k === 'SCORE' ? { minWidth: '52px', textAlign: 'right' } : {}),
            }}>{item.v}</span>
          </div>
          {i < arr.length - 1 && <div style={{ width: '1px', height: '14px', background: T.accent, flexShrink: 0 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  /* 2x2 grid stats (used in narrow) */
  const statsGrid = (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
      padding: '4px 12px', border: `1px solid ${T.accent}`, overflow: 'hidden',
    }}>
      {stats.map(item => (
        <div key={item.k} style={{
          display: 'flex', alignItems: 'baseline', gap: '4px', minWidth: 0, overflow: 'hidden',
        }}>
          <span style={{ fontFamily: FONT, fontSize: FS.micro, color: T.textMuted, letterSpacing: '1px' }}>{item.k}</span>
          <span style={{
            fontFamily: FONT, fontSize: FS.body, color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{item.v}</span>
        </div>
      ))}
    </div>
  );

  /* Dev mode pill tabs: inline next to logo */
  const devTabs = mode === 'dev' && (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[{ key: 'dashboard', label: 'Dashboard' }, { key: 'devtools', label: 'Dev Tools' }].map(t => (
        <span key={t.key} onClick={() => onViewChange(t.key)} style={{
          fontFamily: FONT, fontSize: FS.body, padding: '4px 10px',
          background: view === t.key ? T.accent : 'transparent',
          color: view === t.key ? '#fff' : T.textSecondary,
          border: `1px solid ${view === t.key ? T.accent : T.panelBorder}`, cursor: 'pointer',
        }}>{t.label}</span>
      ))}
    </div>
  );

  /* WIDE: single row — logo | tabs | spacer | stats */
  if (layout === 'wide') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
        padding: '6px 14px', height: '42px', flexShrink: 0,
        background: T.actionBg, borderBottom: `2px solid ${T.panelBorder}`,
        gap: '8px', position: 'relative', zIndex: 1,
      }}>
        {logoRow}
        {devTabs}
        <div style={{ flex: 1, minWidth: 0 }} />
        {statsRow}
      </div>
    );
  }

  /* MEDIUM: two rows — logo + tabs on top, stats below */
  if (layout === 'medium') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        background: T.actionBg, borderBottom: `2px solid ${T.panelBorder}`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', height: '42px', gap: '12px' }}>
          {logoRow}
          {devTabs}
        </div>
        <div style={{ padding: '0 14px 6px' }}>
          {statsRow}
        </div>
      </div>
    );
  }

  /* NARROW: logo row, 2x2 stats grid, then Actions/Vitals tabs */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      background: T.actionBg, borderBottom: `2px solid ${T.panelBorder}`,
      position: 'relative', zIndex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', height: '42px', gap: '12px' }}>
        {logoRow}
        {devTabs}
      </div>
      <div style={{ padding: '0 14px 6px' }}>
        {statsGrid}
      </div>
      <div style={{ display: 'flex', borderTop: `1px solid ${T.panelBorder}` }}>
        {[{ key: 'actions', label: 'Actions' }, { key: 'vitals', label: 'Vitals' }].map(t => (
          <div key={t.key} onClick={() => onNarrowTab(t.key)} style={{
            flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer',
            background: narrowTab === t.key ? T.panelBg : 'transparent',
            borderBottom: narrowTab === t.key ? `2px solid ${T.accent}` : '2px solid transparent',
          }}>
            <span style={{
              fontFamily: FONT, fontSize: FS.body,
              color: narrowTab === t.key ? T.accent : T.textSecondary, letterSpacing: '1px',
            }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
