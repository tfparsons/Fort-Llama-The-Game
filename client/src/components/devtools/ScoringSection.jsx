import React from 'react';
import { T } from '../theme';

export function ScoringSection({ gameState, editConfig, setEditConfig }) {
  return (
    <>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Scoring</h3>
              <p style={{color: T.textSecondary, fontSize: '0.7rem', marginBottom: '8px', lineHeight: '1.5'}}>
                Weekly points are calculated each week-end:
              </p>
              <div style={{background: 'rgba(212,160,53,0.10)', padding: '8px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#D4A035'}}>
                pts = floor(vibes × popScale × harmony × scale)
              </div>
              <div style={{fontSize: '0.7rem', color: T.textSecondary, lineHeight: '1.6', marginBottom: '10px'}}>
                <div><strong style={{color: '#e2ddd4'}}>vibes</strong> — overall vibes score (0–100)</div>
                <div><strong style={{color: '#e2ddd4'}}>popScale</strong> — multiplier from population bracket lookup</div>
                <div><strong style={{color: '#e2ddd4'}}>harmony</strong> = harmonyFloor + harmonyWeight × (min/max health metric)</div>
                <div style={{marginLeft: '12px', color: '#6a6866'}}>Rewards balanced LS/PR/PT; ranges {(editConfig?.scoreConfig?.weeklyFormula?.harmonyFloor ?? 0.7).toFixed(1)}–{((editConfig?.scoreConfig?.weeklyFormula?.harmonyFloor ?? 0.7) + (editConfig?.scoreConfig?.weeklyFormula?.harmonyWeight ?? 0.3)).toFixed(1)}</div>
                <div><strong style={{color: '#e2ddd4'}}>scale</strong> — global multiplier for point values</div>
              </div>
              <div style={{borderTop: `1px solid ${T.panelBorder}`, paddingTop: '8px'}}>
                <div style={{fontSize: '0.7rem', color: T.textSecondary, marginBottom: '6px'}}>Formula parameters</div>
                {[
                  { field: 'scale', label: 'Scale', step: 1, def: 10 },
                  { field: 'harmonyFloor', label: 'Harmony floor', step: 0.05, def: 0.7 },
                  { field: 'harmonyWeight', label: 'Harmony weight', step: 0.05, def: 0.3 }
                ].map(p => (
                  <div key={p.field} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <label style={{flex: 1}}>{p.label}</label>
                    <input type="number" step={p.step} style={{width: '70px'}} value={editConfig?.scoreConfig?.weeklyFormula?.[p.field] ?? p.def} onChange={(e) => {
                      setEditConfig(prev => ({
                        ...prev,
                        scoreConfig: {
                          ...prev.scoreConfig,
                          weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), [p.field]: parseFloat(e.target.value) }
                        }
                      }));
                    }} />
                  </div>
                ))}
                <div style={{fontSize: '0.7rem', color: T.textSecondary, marginTop: '8px', marginBottom: '4px'}}>Population scale brackets</div>
                {(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [
                  { maxN: 4, mult: 1.0 }, { maxN: 8, mult: 1.5 }, { maxN: 12, mult: 2.0 }, { maxN: Infinity, mult: 3.0 }
                ]).map((b, i) => (
                  <div key={i} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <label style={{flex: 1}}>≤ {b.maxN === Infinity || b.maxN === null ? '∞' : (
                      <input type="number" step="1" min="1" style={{width: '50px', display: 'inline'}} value={b.maxN} onChange={(e) => {
                        const brackets = [...(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [])];
                        brackets[i] = { ...brackets[i], maxN: parseInt(e.target.value) || 1 };
                        setEditConfig(prev => ({
                          ...prev,
                          scoreConfig: {
                            ...prev.scoreConfig,
                            weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), popScaleBrackets: brackets }
                          }
                        }));
                      }} />
                    )} residents</label>
                    <input type="number" step="0.1" min="0.1" style={{width: '70px'}} value={b.mult} onChange={(e) => {
                      const brackets = [...(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [])];
                      brackets[i] = { ...brackets[i], mult: parseFloat(e.target.value) || 0.1 };
                      setEditConfig(prev => ({
                        ...prev,
                        scoreConfig: {
                          ...prev.scoreConfig,
                          weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), popScaleBrackets: brackets }
                        }
                      }));
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="config-section" style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', maxHeight: '520px'}}>
              <h3 style={{flexShrink: 0}}>Milestones</h3>
              <div style={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem'}}>
                <thead>
                  <tr style={{borderBottom: `1px solid ${T.panelBorder}`, fontSize: '0.7rem', color: T.textSecondary}}>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px 0', fontWeight: 400}}>Badge</th>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px', fontWeight: 400}}>Category</th>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px', fontWeight: 400}}>Condition</th>
                    <th style={{textAlign: 'right', padding: '2px 8px 4px', fontWeight: 400}}>Points</th>
                    <th style={{textAlign: 'left', padding: '2px 0 4px 8px', fontWeight: 400}}>Flavour</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const earned = new Set((gameState.scoring?.earnedMilestones || []).map(m => m.id));
                    const allDefs = gameState.milestoneDefinitions || [];
                    return allDefs.filter(m => !earned.has(m.id)).map(m => {
                      const c = m.condition || {};
                      let condStr = c.type || '';
                      if (c.min !== undefined) condStr += ` ≥ ${c.min}`;
                      if (c.name) condStr += `: ${c.name}`;
                      if (c.label) condStr += `: ${c.label}`;
                      if (c.techId) condStr += `: ${c.techId}`;
                      if (c.any) condStr += ' (any)';
                      if (c.id) condStr += `: ${c.id}`;
                      return (
                        <tr key={m.id} style={{borderBottom: `1px solid ${T.panelBorder}`}}>
                          <td style={{padding: '4px 8px 4px 0', whiteSpace: 'nowrap'}}>{m.badgeName}</td>
                          <td style={{padding: '4px 8px', color: T.textSecondary, fontSize: '0.75rem'}}>{m.category}</td>
                          <td style={{padding: '4px 8px', color: T.textMuted, fontSize: '0.7rem', fontFamily: 'monospace'}}>{condStr}</td>
                          <td style={{padding: '4px 8px', textAlign: 'right', color: T.accentBright}}>{m.points}</td>
                          <td style={{padding: '4px 0 4px 8px', color: T.textMuted, fontSize: '0.75rem'}}>{m.flavour}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              </div>
            </div>
          </div>
    </>
  );
}
