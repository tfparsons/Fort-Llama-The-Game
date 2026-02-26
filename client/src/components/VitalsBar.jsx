import { useState } from 'react';
import { T, FONT, FONT_BODY, FS, evtStyle, tierColor } from './theme';
import { TreasuryRow } from './TreasuryRow';
import { Sparkline } from './Sparkline';
import { ResidentChip } from './ResidentChip';
import { PolicyChip } from './PolicyChip';
import { MiniGauge } from './MiniGauge';
import { PixelIcon } from './PixelIcon';

/**
 * VitalsBar — horizontal at-a-glance strip below TopBar.
 * Click any section to expand/collapse its detail dropdown.
 * Only one section open at a time. Noticeboard on far right.
 */
export function VitalsBar({
  layout = 'wide',
  treasury, income, expenses, net, incomeBreakdown, expenseBreakdown,
  healthMetrics, metricHistory, researchedCulture,
  buildings, residents, population, capacity, aggregateStats,
  policies, primitives, events,
}) {
  const [expanded, setExpanded] = useState('noticeboard'); // open by default
  const toggle = (key) => setExpanded(prev => prev === key ? null : key);
  const isNarrow = layout === 'narrow';

  const ls = healthMetrics?.livingStandards ?? 0;
  const pr = healthMetrics?.productivity ?? 0;
  const pt = healthMetrics?.partytime ?? 0;
  const isWide = layout === 'wide';

  // Responsive size tokens
  const sz = {
    sectionPad: isWide ? '10px 16px' : '6px 10px',
    sectionLabel: isWide ? '10px' : FS.micro,
    value: isWide ? '17px' : '14px',
    valueSm: isWide ? '15px' : '13px',
    valueXs: isWide ? '13px' : '11px',
    divider: isWide ? '32px' : '24px',
    dot: isWide ? '9px' : '7px',
    metricBadge: isWide ? '9px' : '7px',
    metricVal: isWide ? '15px' : '13px',
    gap: isWide ? '12px' : '8px',
    gapSm: isWide ? '12px' : '10px',
  };

  const sectionStyle = (key) => ({
    padding: sz.sectionPad,
    cursor: 'pointer',
    background: expanded === key ? 'rgba(212,160,53,0.08)' : 'transparent',
    borderBottom: expanded === key ? `2px solid ${T.accent}` : '2px solid transparent',
    transition: 'background 0.15s',
    position: 'relative',
    flexShrink: 0,
  });

  const dropdownStyle = (anchor) => ({
    position: 'absolute',
    top: '100%',
    ...(anchor === 'right' ? { right: 0 } : { left: 0 }),
    background: T.actionBg,
    border: `2px solid ${T.panelBorder}`,
    borderTop: `2px solid ${T.accent}`,
    padding: '10px 14px',
    zIndex: 20,
    boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
    overflow: 'visible',
    minWidth: '280px',
  });

  const dropdownScrollStyle = (anchor) => ({
    ...dropdownStyle(anchor),
    maxHeight: '420px',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '10px 14px',
  });

  return (
    <div style={{ flexShrink: 0, background: T.actionBg, borderBottom: `2px solid ${T.panelBorder}`, position: 'relative', zIndex: 4, overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: isNarrow ? 'auto' : 'visible' }} className="fl-scroll">

        {/* ── Treasury ── */}
        <div style={sectionStyle('treasury')} onClick={() => toggle('treasury')}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: sz.gap }}>
            <span style={{ fontFamily: FONT, fontSize: sz.sectionLabel, color: T.accent, letterSpacing: '1px' }}>{isNarrow ? '£' : 'TREASURY'}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: sz.value, color: (treasury || 0) >= 0 ? T.positive : T.negative }}>&pound;{(treasury || 0).toLocaleString()}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: sz.valueXs, color: (net || 0) >= 0 ? T.positive : T.negative }}>({(net || 0) >= 0 ? '+' : ''}{net}/wk)</span>
          </div>
          {expanded === 'treasury' && (
            <div style={dropdownStyle('left')}>
              <TreasuryRow label="Balance" val={`\u00A3${(treasury || 0).toLocaleString()}`} color={(treasury || 0) >= 0 ? T.positive : T.negative} />
              <TreasuryRow label="Income" val={`\u00A3${(income || 0).toLocaleString()}`} color={T.positive} breakdown={incomeBreakdown} />
              <TreasuryRow label="Expenses" val={`-\u00A3${(expenses || 0).toLocaleString()}`} color={T.negative} breakdown={expenseBreakdown} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0 0', marginTop: '2px', borderTop: `1px solid ${T.panelBorderLight}` }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textSecondary }}>Net</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: '15px', color: (net || 0) >= 0 ? T.positive : T.negative }}>&pound;{net || 0}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: sz.divider, background: T.panelBorder, flexShrink: 0 }} />

        {/* ── Culture / Health Metrics ── */}
        <div style={sectionStyle('culture')} onClick={() => toggle('culture')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sz.gapSm }}>
            {!isNarrow && <span style={{ fontFamily: FONT, fontSize: sz.sectionLabel, color: T.accent, letterSpacing: '1px' }}>CULTURE</span>}
            {[{ label: 'LS', val: ls, color: T.ls }, { label: 'PR', val: pr, color: T.pr }, { label: 'PT', val: pt, color: T.pt }].map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span style={{ fontFamily: FONT, fontSize: sz.metricBadge, color: m.color, padding: '1px 3px', background: `${m.color}22` }}>{m.label}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: sz.metricVal, color: m.color }}>{m.val}</span>
              </div>
            ))}
          </div>
          {expanded === 'culture' && (
            <div style={dropdownStyle('left')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Living Std', val: ls, color: T.ls, data: metricHistory?.map(d => d.ls) },
                  { label: 'Productivity', val: pr, color: T.pr, data: metricHistory?.map(d => d.pr) },
                  { label: 'Leisure', val: pt, color: T.pt, data: metricHistory?.map(d => d.pt) },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: FONT, fontSize: FS.micro, color: T.bg, background: m.color, padding: '2px 5px', whiteSpace: 'nowrap' }}>{m.label}</span>
                    <div style={{ flex: 1 }}><Sparkline data={m.data} color={m.color} width={120} height={20} /></div>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '16px', color: m.color, width: '28px', textAlign: 'right' }}>{m.val}</span>
                  </div>
                ))}
              </div>
              {researchedCulture && researchedCulture.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${T.panelBorder}`, whiteSpace: 'normal' }}>
                  {researchedCulture.map(c => {
                    const treeColor = c.tree === 'livingStandards' ? T.ls : c.tree === 'productivity' ? T.pr : T.pt;
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: `${treeColor}12`, border: `1px solid ${treeColor}33`, padding: '3px 7px 3px 5px' }}>
                        <PixelIcon type="trophy" size={10} color={treeColor} />
                        <span style={{ fontFamily: FONT, fontSize: FS.micro, color: treeColor }}>{c.badge}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: sz.divider, background: T.panelBorder, flexShrink: 0 }} />

        {/* ── Residents ── */}
        <div style={sectionStyle('residents')} onClick={() => toggle('residents')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap }}>
            <span style={{ fontFamily: FONT, fontSize: sz.sectionLabel, color: T.accent, letterSpacing: '1px' }}>{isNarrow ? 'RES' : 'RESIDENTS'}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: sz.valueSm, color: T.textPrimary }}>{population}/{capacity}</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[primitives?.crowding, primitives?.noise].map((prim, i) => {
                const v = prim?.value ?? 0;
                const health = 100 - v;
                const color = health >= 60 ? '#5ab87a' : health >= 35 ? '#e8b84a' : '#d45a5a';
                return <div key={i} style={{ width: sz.dot, height: sz.dot, background: color, opacity: 0.9 }} title={prim?.tier || ''} />;
              })}
            </div>
          </div>
          {expanded === 'residents' && (
            <div style={dropdownStyle('left')}>
              <div style={{ whiteSpace: 'normal' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                  {residents && residents.map(r => (<ResidentChip key={r.name} resident={r} />))}
                </div>
                {aggregateStats && Object.keys(aggregateStats).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', paddingTop: '6px', borderTop: `1px solid ${T.panelBorder}` }}>
                    {Object.entries(aggregateStats).map(([skill, val]) => (
                      <div key={skill} style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: '11px', color: T.textSecondary, textTransform: 'uppercase' }}>{skill}</span>
                        <span style={{ fontFamily: FONT_BODY, fontSize: '11px', color: val > 0 ? T.positive : val < 0 ? T.negative : T.textSecondary }}>{val > 0 ? `+${val}%` : `${val}%`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Crowding & Noise gauges */}
              <div style={{ paddingTop: '8px', marginTop: '8px', borderTop: `1px solid ${T.panelBorder}`, overflow: 'visible' }}>
                <div style={{ display: 'flex', gap: '10px', overflow: 'visible' }}>
                  <MiniGauge value={primitives?.crowding?.value ?? 0} label="CROWDING" tierLabel={primitives?.crowding?.tier} />
                  <MiniGauge value={primitives?.noise?.value ?? 0} label="NOISE" tierLabel={primitives?.noise?.tier} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: sz.divider, background: T.panelBorder, flexShrink: 0 }} />

        {/* ── Policies ── */}
        {(() => {
          const activeCount = policies ? policies.filter(p => p.active !== false).length : 0;
          const maxPolicies = 3;
          return (
            <div style={sectionStyle('policies')} onClick={() => toggle('policies')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap }}>
                <span style={{ fontFamily: FONT, fontSize: sz.sectionLabel, color: T.accent, letterSpacing: '1px' }}>{isNarrow ? 'POL' : 'POLICIES'}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: sz.valueSm, color: T.textPrimary }}>{activeCount}/{maxPolicies}</span>
              </div>
              {expanded === 'policies' && (
                <div style={dropdownStyle('left')}>
                  <div style={{ whiteSpace: 'normal' }}>
                    {(!policies || policies.length === 0) ? (
                      <span style={{ fontSize: '12px', color: T.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>None active</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {policies.map((p, i) => (<PolicyChip key={i} policy={p} />))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ width: '1px', height: sz.divider, background: T.panelBorder, flexShrink: 0 }} />

        {/* ── Buildings ── */}
        {(() => {
          const builtCount = buildings ? buildings.filter(b => b.status !== 'pending').length : 0;
          const pendingCount = buildings ? buildings.filter(b => b.status === 'pending').length : 0;
          const totalCount = builtCount + pendingCount;
          const overCap = buildings?.some(b => population > (b.count || 0) * (b.capacity || 1));
          return (
            <div style={sectionStyle('buildings')} onClick={() => toggle('buildings')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap }}>
                <span style={{ fontFamily: FONT, fontSize: sz.sectionLabel, color: T.accent, letterSpacing: '1px' }}>{isNarrow ? 'BLDG' : 'BUILDINGS'}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: sz.valueSm, color: T.textPrimary }}>{totalCount}</span>
                {pendingCount > 0 && (
                  <span style={{ fontFamily: FONT_BODY, fontSize: sz.valueXs, color: T.accentBright }}>{pendingCount} pending</span>
                )}
                {overCap && (
                  <span className="fl-notif-flash" style={{ fontSize: isWide ? '16px' : '13px', color: '#d45a5a', marginLeft: '2px' }} title="Population exceeds a building's service capacity">⚠</span>
                )}
              </div>
              {expanded === 'buildings' && (
                <div style={dropdownStyle('left')}>
                  {buildings && buildings.length > 0 ? buildings.map((b, i) => (
                    <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: i < buildings.length - 1 ? '1px solid rgba(70,70,70,0.4)' : 'none', gap: '20px' }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: b.status === 'pending' ? T.textMuted : T.textSecondary }}>{b.name}</span>
                      {b.status === 'pending' ? (
                        <span style={{ fontFamily: FONT, fontSize: FS.micro, color: T.bg, background: T.accentBright, padding: '1px 4px' }}>Pending</span>
                      ) : (
                        <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textPrimary }}>{b.count} ({b.cap})</span>
                      )}
                    </div>
                  )) : (
                    <span style={{ fontSize: '12px', color: T.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>No buildings yet.</span>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Spacer pushes noticeboard to far right */}
        <div style={{ flex: 1, minWidth: '8px' }} />

        <div style={{ width: '1px', height: sz.divider, background: T.panelBorder, flexShrink: 0 }} />

        {/* ── Noticeboard ── */}
        <div style={sectionStyle('noticeboard')} onClick={() => toggle('noticeboard')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
               className={events && events.length > 0 && expanded !== 'noticeboard' ? 'fl-notif-flash' : ''}>
            <PixelIcon type="mail" size={16} color={expanded === 'noticeboard' ? T.accent : events && events.length > 0 ? T.accentBright : T.textMuted} />
            {events && events.length > 0 && (
              <span style={{ fontFamily: FONT, fontSize: '7px', color: expanded === 'noticeboard' ? T.accent : T.accentBright }}>{Math.min(events.length, 99)}</span>
            )}
          </div>
          {expanded === 'noticeboard' && (
            <div style={dropdownScrollStyle('right')} className="fl-scroll">
              {events && events.length > 0 ? events.map((evt, i) => {
                const es = evtStyle(evt.type);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '4px 0', borderBottom: i < events.length - 1 ? '1px solid rgba(70,70,70,0.35)' : 'none' }}>
                    <span style={{ color: es.color, fontFamily: FONT, fontSize: FS.body, width: '12px', textAlign: 'center', flexShrink: 0 }}>{es.icon}</span>
                    <span style={{ fontSize: '13px', fontFamily: FONT_BODY, color: '#fff', lineHeight: '1.5', flex: 1, whiteSpace: 'normal', minWidth: '180px' }}>{evt.text}</span>
                    <span style={{ fontFamily: FONT, fontSize: FS.micro, color: T.textMuted, flexShrink: 0 }}>W{evt.week}</span>
                  </div>
                );
              }) : (
                <span style={{ fontSize: '12px', color: T.textMuted, fontStyle: 'italic', fontFamily: FONT_BODY }}>No notices yet.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
