import { useState } from 'react';
import { T, FONT, FONT_BODY, FS, tierColor } from './theme';
import { PixelIcon } from './PixelIcon';
import { ActionButton } from './ActionButton';

/**
 * ActionHub — bottom floating bar with all player controls.
 * Layout: Clock ticker (top) → Start Week/Restart | 2×2 Actions | Rent | Budget toggle (bottom row)
 * Budget toggle opens an upward-expanding panel with steppers + primitive health bars.
 */
export function ActionHub({
  layout = 'wide',
  week, day, time,
  hasRecruitedThisWeek, buildsThisWeek, buildsPerWeek,
  policyChangesLeft, researchingTech, rent, rentTier, rentMin, rentMax, rentStep,
  budgets, primitives, isPaused,
  onOpenModal, onRentChange, onRentRelease, onBudgetStep, onStartWeek, onRestart,
}) {
  const isNarrow = layout === 'narrow';
  const isWide = layout === 'wide';

  // Responsive size tokens for wide screens
  const sz = {
    clockPad: isWide ? '6px 20px' : '5px 16px',
    clockWk: isWide ? '12px' : '10px',
    clockDay: isWide ? '18px' : '15px',
    clockTime: isWide ? '21px' : '17px',
    clockGap: isWide ? '16px' : '12px',
    hubPad: isWide ? '8px 14px' : '6px 10px',
    startPad: isWide ? '8px 22px' : '6px 16px',
    startFont: isWide ? '12px' : FS.body,
    restartFont: isWide ? '10px' : FS.label,
    rentPad: isWide ? '6px 16px' : '4px 12px',
    rentMin: isWide ? '220px' : '180px',
    rentLabel: isWide ? '10px' : FS.micro,
    rentTier: isWide ? '13px' : '11px',
    rentVal: isWide ? '15px' : '12px',
    budgetLabel: isWide ? '10px' : FS.micro,
    budgetVal: isWide ? '17px' : '14px',
    budgetDot: isWide ? '9px' : '7px',
    budgetPad: isWide ? '6px 16px' : '4px 12px',
    iconSize: isWide ? 20 : 16,
  };
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const budgetEntries = Object.entries(budgets || {});
  const totalBudget = budgetEntries.reduce((s, [, v]) => s + v, 0);

  // Budget→Primitive mapping for combined module
  const BUDGET_PRIM_MAP = [
    { section: 'coverage', label: 'Coverage', items: [
      { budgetKey: 'nutrition', budgetName: 'Ingredients', primKey: 'nutrition', icon: '\u{1F958}' },
      { budgetKey: 'fun',       budgetName: 'Party Supplies', primKey: 'fun',  icon: '\u{1F389}' },
      { budgetKey: 'drive',     budgetName: 'Internet',    primKey: 'drive',    icon: '\u{1F4BB}' },
    ]},
    { section: 'accumulators', label: 'Upkeep', items: [
      { budgetKey: 'cleanliness', budgetName: 'Cleaning',  primKey: 'cleanliness', icon: '\u{1F9F9}' },
      { budgetKey: 'maintenance', budgetName: 'Repairs',   primKey: 'maintenance', icon: '\u{1F527}' },
      { budgetKey: 'fatigue',     budgetName: 'Recovery',  primKey: 'fatigue',     icon: '\u{1F634}' },
    ]},
  ];

  const stepBtnStyle = {
    width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: T.buttonBg, border: `1px solid ${T.buttonBorder}`, cursor: 'pointer',
    fontFamily: FONT_BODY, fontSize: '11px', color: T.textSecondary, userSelect: 'none',
  };

  const segGrad = (i, tot) => {
    const t = i / (tot - 1); let r, g, b;
    if (t < 0.5) { const p = t / 0.5; r = 212+(232-212)*p; g = 90+(184-90)*p; b = 90+(74-90)*p; }
    else { const p = (t-0.5)/0.5; r = 232+(90-232)*p; g = 184; b = 74+(122-74)*p; }
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  };

  return (
    <div style={{ background: T.actionBg, border: `2px solid ${T.panelBorder}`, position: 'relative', zIndex: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'inline-flex', flexDirection: 'column', maxWidth: '100%' }}>

      {/* ── Expanded Budget + Systems panel (above hub) ── */}
      {budgetsOpen && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, background: T.actionBg, border: `2px solid ${T.panelBorder}`, borderBottom: 'none', padding: '10px 12px', boxShadow: '0 -6px 20px rgba(0,0,0,0.4)', zIndex: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', gap: '24px' }}>
            <span style={{ fontFamily: FONT, fontSize: FS.heading, color: T.accent, letterSpacing: '1px' }}>BUDGET</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: '15px', color: T.negative }}>-&pound;{totalBudget}/wk</span>
          </div>

          {BUDGET_PRIM_MAP.map((sec, si) => (
            <div key={sec.section}>
              <div style={{
                fontFamily: FONT, fontSize: FS.micro, color: T.textMuted,
                letterSpacing: '1px', padding: '6px 0 3px',
                borderTop: si > 0 ? `1px solid ${T.panelBorder}` : 'none',
                marginTop: si > 0 ? '6px' : 0,
              }}>
                {sec.label}
              </div>
              {sec.items.map(item => {
                const bv = (budgets || {})[item.budgetKey] || 0;
                const prim = (primitives || {})[item.primKey];
                const tc = tierColor(prim?.tier);
                const isAccum = sec.section === 'accumulators';
                const primVal = prim?.value ?? 0;

                return (
                  <div key={item.budgetKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                    <span style={{ fontSize: '13px', width: '18px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: '11px', color: T.textSecondary, width: '96px', flexShrink: 0 }}>{item.budgetName}</span>
                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                      <div style={stepBtnStyle} onClick={() => onBudgetStep(item.budgetKey, -10)}>{'\u2012\u2012'}</div>
                      <div style={stepBtnStyle} onClick={() => onBudgetStep(item.budgetKey, -5)}>{'\u2012'}</div>
                      <div style={{ width: '40px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.panelBorderLight}` }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: '12px', color: T.textPrimary }}>&pound;{bv}</span>
                      </div>
                      <div style={stepBtnStyle} onClick={() => onBudgetStep(item.budgetKey, 5)}>+</div>
                      <div style={stepBtnStyle} onClick={() => onBudgetStep(item.budgetKey, 10)}>++</div>
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: '8px', color: T.textMuted, flexShrink: 0 }}>&rarr;</span>
                    {/* Primitive bar */}
                    <div style={{ flex: 1, minWidth: '80px', height: '8px', position: 'relative' }}>
                      {isAccum ? (
                        <div style={{ height: '100%', background: 'rgba(154,150,144,0.08)', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(primVal, 100)}%`, background: primVal < 25 ? '#5ab87a' : primVal < 50 ? '#e8b84a' : primVal < 75 ? '#d4845a' : '#d45a5a', opacity: 0.75 }} />
                        </div>
                      ) : (() => {
                        const segs = 20, filled = Math.round((Math.min(primVal, 100) / 100) * segs);
                        const threshSeg = prim?.threshold ? Math.round((prim.threshold / 100) * segs) : null;
                        return (
                          <>
                            <div style={{ display: 'flex', gap: '1.5px', height: '100%' }}>
                              {Array.from({ length: segs }, (_, i) => (
                                <div key={i} style={{ flex: 1, height: '100%', background: i < filled ? segGrad(i, segs) : 'rgba(154,150,144,0.08)', opacity: i < filled ? 0.85 + (i/segs)*0.15 : 0.35 }} />
                              ))}
                            </div>
                            {threshSeg !== null && (
                              <div style={{ position: 'absolute', left: `${(threshSeg/segs)*100}%`, top: '-1px', bottom: '-1px', width: '2px', background: T.textPrimary, opacity: 0.6 }} />
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: FS.micro, color: tc, width: '64px', textAlign: 'right', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {prim?.tier || '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Clock ticker ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: sz.clockGap, padding: sz.clockPad, borderBottom: `1px solid ${T.panelBorder}`, background: 'rgba(0,0,0,0.15)' }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: isWide ? '15px' : '13px', color: T.accent }}>WK {week}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: isWide ? '15px' : '13px', color: T.textSecondary }}>{day}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: isWide ? '17px' : '15px', color: '#fff', letterSpacing: '1px' }}>{time}</span>
      </div>

      {/* ── Main hub row ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', padding: sz.hubPad, flexWrap: 'wrap' }}>
        {/* Start Week + Restart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, padding: '0 8px 0 0', borderRight: `1px solid ${T.panelBorder}` }}>
          <div onClick={isPaused ? onStartWeek : undefined} style={{
            background: '#3a7a5a', padding: sz.startPad, cursor: isPaused ? 'pointer' : 'default',
            border: '2px solid #5aaa7a', opacity: isPaused ? 1 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
          }}>
            <span style={{ fontFamily: FONT, fontSize: sz.startFont, color: '#fff', letterSpacing: '1px' }}>Start Week</span>
          </div>
          <div onClick={onRestart} style={{
            background: 'rgba(160,70,70,0.35)', border: '2px solid rgba(196,126,126,0.5)',
            padding: '6px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
          }}>
            <span style={{ fontFamily: FONT, fontSize: sz.restartFont, color: T.negative, letterSpacing: '1px' }}>Restart</span>
          </div>
        </div>

        {/* 4 Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 8px', borderRight: isNarrow ? 'none' : `1px solid ${T.panelBorder}`, flexShrink: 0 }}>
          {[
            { key: 'recruit', label: 'Recruit', spent: hasRecruitedThisWeek },
            { key: 'build', label: 'Build', spent: buildsThisWeek >= buildsPerWeek },
            { key: 'policies', label: 'Policies', spent: policyChangesLeft <= 0 },
            { key: 'research', label: 'Research', spent: !!researchingTech },
          ].map(a => (
            <ActionButton key={a.key} label={a.label} icon={<PixelIcon type={a.key} size={sz.iconSize} color={T.accentBright} />} spent={a.spent} onClick={() => onOpenModal(a.key)} />
          ))}
        </div>

        {/* Rent + Budget wrapper — side-by-side on narrow, inline on wide/medium */}
        {isNarrow && <div style={{ width: '100%', borderTop: `1px solid ${T.panelBorder}`, marginTop: '6px' }} />}

        {/* Rent */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: isNarrow ? '8px 10px' : sz.rentPad,
          borderRight: `1px solid ${T.panelBorder}`, flexShrink: isNarrow ? 1 : 0,
          ...(isNarrow ? { flex: 1, minWidth: 0 } : { minWidth: sz.rentMin }),
        }}>
          <span style={{ fontFamily: FONT, fontSize: sz.rentLabel, color: '#fff' }}>Rent</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <input className="fl-rent" type="range" min={rentMin || 50} max={rentMax || 500} step={rentStep || 10} value={rent}
              onChange={e => onRentChange(Number(e.target.value))} onMouseUp={onRentRelease} onTouchEnd={onRentRelease} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: sz.rentTier, color: T.accent }}>{rentTier}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: sz.rentVal, color: '#fff' }}>&pound;{rent}</span>
            </div>
          </div>
        </div>

        {/* Budget toggle with system health dots */}
        <div onClick={() => setBudgetsOpen(!budgetsOpen)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
          padding: isNarrow ? '8px 10px' : sz.budgetPad, cursor: 'pointer', flexShrink: 0,
          background: budgetsOpen ? 'rgba(212,160,53,0.08)' : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: FONT, fontSize: sz.budgetLabel, color: T.textPrimary }}>Budget</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: sz.budgetVal, color: T.negative }}>-&pound;{totalBudget}/wk</span>
            <span style={{ fontFamily: FONT, fontSize: sz.budgetLabel, color: T.textSecondary }}>{budgetsOpen ? '\u25BC' : '\u25B2'}</span>
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[
              { key: 'nutrition', accum: false }, { key: 'fun', accum: false }, { key: 'drive', accum: false },
              { key: 'cleanliness', accum: true }, { key: 'maintenance', accum: true }, { key: 'fatigue', accum: true },
            ].map(({ key, accum }) => {
              const prim = primitives?.[key];
              if (!prim) return <div key={key} style={{ width: sz.budgetDot, height: sz.budgetDot, background: T.textMuted, opacity: 0.3 }} />;
              const v = prim.value ?? 0;
              const health = accum ? 100 - v : v;
              const color = health >= 60 ? '#5ab87a' : health >= 35 ? '#e8b84a' : '#d45a5a';
              return <div key={key} style={{ width: sz.budgetDot, height: sz.budgetDot, background: color, opacity: 0.9 }} title={`${key}: ${prim.tier}`} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
