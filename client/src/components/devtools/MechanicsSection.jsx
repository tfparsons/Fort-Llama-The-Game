import React from 'react';
import { T } from '../theme';

export function MechanicsSection({ gameState, editConfig, setEditConfig }) {
  return (
    <>
          <h3 className="section-divider">Mechanics</h3>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Budgets</h3>
              <div style={{fontSize: '0.7rem', color: T.textSecondary, marginBottom: '6px'}}>Starting £/week per category (+ £/capita neutral point)</div>
              {[
                { key: 'nutrition', label: 'Ingredients', def: 50, bpc: 15 },
                { key: 'cleanliness', label: 'Cleaning supplies', def: 15, bpc: 5 },
                { key: 'maintenance', label: 'Repairs & tools', def: 25, bpc: 8 },
                { key: 'fatigue', label: 'Wellness', def: 15, bpc: 5 },
                { key: 'fun', label: 'Entertainment', def: 30, bpc: 10 },
                { key: 'drive', label: 'Internet & workspace', def: 15, bpc: 5 }
              ].map(item => (
                <div key={item.key} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px'}}>
                  <label style={{flex: 1, fontSize: '0.7rem'}}>{item.label}</label>
                  <input type="number" step="5" min="0" max="500" style={{width: '55px'}} value={editConfig.startingBudgets?.[item.key] ?? item.def} onChange={(e) => {
                    const val = Math.max(0, Math.min(500, parseInt(e.target.value) || 0));
                    setEditConfig(prev => ({
                      ...prev,
                      startingBudgets: { ...prev.startingBudgets, [item.key]: val }
                    }));
                  }} />
                  <input type="number" step="1" min="1" max="50" style={{width: '40px', fontSize: '0.65rem', opacity: 0.7}} title="basePerCapita" value={editConfig?.budgetConfig?.[item.key]?.basePerCapita ?? item.bpc} onChange={(e) => {
                    const val = Math.max(1, parseFloat(e.target.value) || 1);
                    setEditConfig(prev => ({
                      ...prev,
                      budgetConfig: {
                        ...prev.budgetConfig,
                        [item.key]: { ...prev.budgetConfig?.[item.key], basePerCapita: val }
                      }
                    }));
                  }} />
                </div>
              ))}
              <div style={{fontSize: '0.7rem', color: T.textSecondary, marginTop: '8px', marginBottom: '4px'}}>Budget curve</div>
              {[
                { field: 'scaleExp', label: 'Scale exp', step: 0.05, def: 0.7 },
                { field: 'floor', label: 'Floor (£0)', step: 0.05, def: 0.5 },
                { field: 'ceiling', label: 'Ceiling', step: 0.05, def: 1.5 }
              ].map(p => (
                <div key={p.field} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <label style={{flex: 1}}>{p.label}</label>
                  <input type="number" step={p.step} style={{width: '70px'}} value={editConfig?.budgetConfig?.curve?.[p.field] ?? p.def} onChange={(e) => {
                    setEditConfig(prev => ({
                      ...prev,
                      budgetConfig: {
                        ...prev.budgetConfig,
                        curve: { ...prev.budgetConfig?.curve, [p.field]: parseFloat(e.target.value) }
                      }
                    }));
                  }} />
                </div>
              ))}
            </div>

            <div className="config-section" style={{gridColumn: 'span 2'}}>
              <h3>Policies</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem'}}>
                <thead>
                  <tr style={{borderBottom: `1px solid ${T.panelBorder}`, fontSize: '0.7rem', color: T.textSecondary}}>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px 0', fontWeight: 400}}>Name</th>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px', fontWeight: 400}}>Effect</th>
                    <th style={{textAlign: 'right', padding: '2px 8px 4px', fontWeight: 400}}>Exclude %</th>
                    <th style={{textAlign: 'right', padding: '2px 0 4px 8px', fontWeight: 400}}>Unlock</th>
                  </tr>
                </thead>
                <tbody>
                  {(gameState.policyDefinitions || []).map(policy => {
                    const techUnlock = policy.techRequired ? (gameState.techTree || []).find(t => t.id === policy.techRequired) : null;
                    const ocadoPct = gameState.techConfig?.ocado?.effectPercent || 15;
                    const desc = policy.description.replace('{ocadoPct}', ocadoPct);
                    return (
                      <tr key={policy.id} style={{borderBottom: `1px solid ${T.panelBorder}`}}>
                        <td style={{padding: '4px 8px 4px 0', whiteSpace: 'nowrap'}}>{policy.name}</td>
                        <td style={{padding: '4px 8px', color: T.textSecondary, fontSize: '0.75rem'}}>{desc}</td>
                        <td style={{padding: '4px 8px', textAlign: 'right'}}>
                          {policy.type === 'exclude_worst' ? (
                            <input type="number" step="0.05" min="0" max="1" className="config-table-input"
                              value={editConfig?.policyConfig?.[policy.id]?.excludePercent ?? 0.25}
                              onChange={(e) => setEditConfig(prev => ({...prev, policyConfig: {...(prev.policyConfig || {}), [policy.id]: {...(prev.policyConfig?.[policy.id] || {}), excludePercent: parseFloat(e.target.value)}}}))}
                            />
                          ) : (
                            <span style={{color: T.textMuted, fontSize: '0.75rem'}}>—</span>
                          )}
                        </td>
                        <td style={{padding: '4px 0 4px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: techUnlock ? T.accentBright : T.positive, fontSize: '0.75rem'}}>
                          {techUnlock ? techUnlock.name : 'Default'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{borderTop: `1px solid ${T.panelBorder}`, marginTop: '8px', paddingTop: '8px'}}>
                <div style={{fontSize: '0.7rem', color: T.textSecondary, marginBottom: '8px'}}>Fun penalty (too many active policies)</div>
                <div className="config-field">
                  <label title="Number of active policies before Fun penalty applies">Threshold</label>
                  <input type="number" step="1" min="1"
                    value={editConfig?.policyConfig?.funPenalty?.threshold ?? 3}
                    onChange={(e) => setEditConfig(prev => ({...prev, policyConfig: {...(prev.policyConfig || {}), funPenalty: {...(prev.policyConfig?.funPenalty || {}), threshold: parseInt(e.target.value)}}}))}
                  />
                </div>
                <div className="config-field">
                  <label title="Penalty curve steepness">K</label>
                  <input type="number" step="0.05"
                    value={editConfig?.policyConfig?.funPenalty?.K ?? 0.15}
                    onChange={(e) => setEditConfig(prev => ({...prev, policyConfig: {...(prev.policyConfig || {}), funPenalty: {...(prev.policyConfig?.funPenalty || {}), K: parseFloat(e.target.value)}}}))}
                  />
                </div>
                <div className="config-field">
                  <label title="Penalty curve exponent">P</label>
                  <input type="number" step="0.1"
                    value={editConfig?.policyConfig?.funPenalty?.P ?? 1.5}
                    onChange={(e) => setEditConfig(prev => ({...prev, policyConfig: {...(prev.policyConfig || {}), funPenalty: {...(prev.policyConfig?.funPenalty || {}), P: parseFloat(e.target.value)}}}))}
                  />
                </div>
              </div>
            </div>
          </div>
    </>
  );
}
