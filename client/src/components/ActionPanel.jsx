import { useState, useRef } from 'react';
import { T, FONT, FONT_BODY, FS, BUDGET_DISPLAY } from './theme';
import { PixelIcon } from './PixelIcon';
import { ActionButton } from './ActionButton';

function RestartToggle({ onRestart }) {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef(null);

  const handleReveal = () => {
    setRevealed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setRevealed(false), 5000);
  };

  if (!revealed) {
    return (
      <div
        onClick={handleReveal}
        style={{
          marginTop: '4px', padding: '4px 6px', textAlign: 'center',
          cursor: 'pointer', opacity: 0.3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: '6px', color: T.textMuted, letterSpacing: '1px' }}>···</span>
      </div>
    );
  }

  return (
    <div onClick={onRestart} style={{
      background: 'rgba(160,70,70,0.35)', border: '2px solid rgba(196,126,126,0.5)',
      marginTop: '4px', padding: '7px 6px', textAlign: 'center', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: FONT, fontSize: FS.label, color: T.negative, letterSpacing: '1px' }}>Restart</span>
    </div>
  );
}

// Left sidebar: clock, action buttons, rent slider, budgets accordion, game controls
export function ActionPanel({
  week, day, time,
  hasRecruitedThisWeek, buildsThisWeek, buildsPerWeek,
  policyChangesLeft, researchingTech,
  rent, rentTier, rentMin, rentMax, rentStep,
  budgets,             // { [key]: currentValue }
  budgetConfig,        // { [key]: { floor, ceiling } } for stepper bounds
  isPaused,
  hideCollapse,        // hide collapse toggle (narrow mode)
  fullWidth,           // unused in final design — ActionPanel stays 240px
  onOpenModal,         // (modalName) => void
  onRentChange,        // (value) => void
  onRentRelease,       // () => void
  onBudgetStep,        // (key, delta) => void
  onStartWeek,         // () => void
  onRestart,           // () => void
}) {
  const [actionOpen, setActionOpen] = useState(true);
  const [budgetsOpen, setBudgetsOpen] = useState(true);

  const budgetEntries = Object.entries(budgets || {});
  const totalBudget = budgetEntries.reduce((s, [, v]) => s + v, 0);

  // Collapsed state — thin stripe with expand arrow + vertical label
  if (!hideCollapse && !actionOpen) {
    return (
      <div onClick={() => setActionOpen(true)} style={{
        width: '36px', flexShrink: 0, background: T.actionBg,
        borderRight: `2px solid ${T.panelBorder}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '12px', cursor: 'pointer', gap: '6px',
      }}>
        <span style={{ fontFamily: FONT, fontSize: FS.body, color: T.accent }}>{'\u25BA'}</span>
        <span style={{
          fontFamily: FONT, fontSize: FS.micro, color: T.accent,
          writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '2px',
        }}>Actions</span>
      </div>
    );
  }

  return (
    <div className="fl-scroll" style={{
      width: fullWidth ? '100%' : '240px', flexShrink: 0,
      borderRight: fullWidth ? 'none' : `2px solid ${T.panelBorder}`,
      background: T.actionBg, padding: '8px 8px 12px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* Collapse toggle */}
      {!hideCollapse && (
        <div onClick={() => setActionOpen(false)} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', padding: '2px 0 6px', borderBottom: `1px solid ${T.panelBorder}`,
        }}>
          <span style={{ fontFamily: FONT, fontSize: FS.heading, color: T.accent, letterSpacing: '1px' }}>Actions</span>
          <span style={{ fontFamily: FONT, fontSize: FS.label, color: T.accent, opacity: 0.7 }}>{'\u25C4'} Hide</span>
        </div>
      )}

      {/* Clock */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '6px 8px',
        background: T.panelBg, border: `2px solid ${T.panelBorder}`,
      }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textSecondary }}>Wk {week}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textPrimary }}>{day}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textPrimary, letterSpacing: '1px' }}>{time}</span>
      </div>

      {/* 2x2 Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
        <ActionButton label="Recruit" icon={<PixelIcon type="recruit" color={T.accentBright} />}
          spent={hasRecruitedThisWeek} onClick={() => onOpenModal('recruit')} />
        <ActionButton label="Build" icon={<PixelIcon type="build" color={T.accentBright} />}
          spent={buildsThisWeek >= buildsPerWeek} onClick={() => onOpenModal('build')} />
        <ActionButton label="Policies" icon={<PixelIcon type="policies" color={T.accentBright} />}
          spent={policyChangesLeft <= 0} onClick={() => onOpenModal('policies')} />
        <ActionButton label="Research" icon={<PixelIcon type="research" color={T.accentBright} />}
          spent={!!researchingTech} onClick={() => onOpenModal('research')} />
      </div>

      {/* Rent slider */}
      <div style={{ background: T.panelBg, border: `2px solid ${T.panelBorder}`, padding: '6px 8px' }}>
        <span style={{ fontFamily: FONT, fontSize: FS.body, color: '#fff' }}>Rent</span>
        <input className="fl-rent" type="range"
          min={rentMin || 50} max={rentMax || 500} step={rentStep || 10}
          value={rent}
          onChange={e => onRentChange(Number(e.target.value))}
          onMouseUp={onRentRelease}
          onTouchEnd={onRentRelease}
          style={{ margin: '6px 0 4px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.accent }}>{rentTier}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '14px', color: '#fff' }}>&pound;{rent}</span>
        </div>
      </div>

      {/* Budgets accordion */}
      <div>
        <div onClick={() => setBudgetsOpen(!budgetsOpen)} style={{
          background: T.buttonBg, border: `2px solid ${T.buttonBorder}`,
          padding: '5px 8px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: FONT, fontSize: FS.body, color: T.textPrimary }}>Budgets</span>
          <span style={{ fontFamily: FONT, fontSize: FS.body, color: T.textSecondary }}>{budgetsOpen ? '\u25BC' : '\u25BA'}</span>
        </div>
        {budgetsOpen && (
          <div style={{ background: T.panelBg, border: `2px solid ${T.panelBorder}`, borderTop: 'none', padding: '4px 6px' }}>
            {budgetEntries.map(([key, value], i) => {
              const display = BUDGET_DISPLAY[key] || { name: key, color: T.textSecondary };
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0',
                  borderBottom: i < budgetEntries.length - 1 ? '1px solid rgba(70,70,70,0.4)' : 'none',
                }}>
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: '13px', color: T.textSecondary,
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '6px',
                  }}>{display.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    {['--', '-'].map(btn => (
                      <div key={btn} onClick={() => onBudgetStep(key, btn === '--' ? -10 : -5)} style={{
                        width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: T.buttonBg, border: `1px solid ${T.buttonBorder}`, cursor: 'pointer',
                        fontFamily: FONT_BODY, fontSize: '12px', color: T.textSecondary,
                      }}>{btn}</div>
                    ))}
                    <div style={{
                      width: '38px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                    }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textPrimary }}>&pound;{value}</span>
                    </div>
                    {['+', '++'].map(btn => (
                      <div key={btn} onClick={() => onBudgetStep(key, btn === '++' ? 10 : 5)} style={{
                        width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: T.buttonBg, border: `1px solid ${T.buttonBorder}`, cursor: 'pointer',
                        fontFamily: FONT_BODY, fontSize: '12px', color: T.textSecondary,
                      }}>{btn}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Total — always visible */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '5px 8px',
          background: T.panelBg, border: `2px solid ${T.panelBorder}`, borderTop: 'none',
        }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.textSecondary }}>Total</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: '13px', color: T.negative }}>
            -&pound;{totalBudget}/wk
          </span>
        </div>
      </div>

      {/* Start Week + Restart */}
      <div style={{ paddingTop: '4px' }}>
        <div onClick={isPaused ? onStartWeek : undefined} style={{
          background: '#3a7a5a', padding: '10px 6px', textAlign: 'center',
          cursor: isPaused ? 'pointer' : 'default',
          border: '2px solid #5aaa7a',
          opacity: isPaused ? 1 : 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: FONT, fontSize: FS.heading, color: '#fff', letterSpacing: '1px' }}>Start Week</span>
        </div>
        <RestartToggle onRestart={onRestart} />
      </div>
    </div>
  );
}
