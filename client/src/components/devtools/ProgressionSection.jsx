import React from 'react';
import { T } from '../theme';

export function ProgressionSection({ editConfig, setEditConfig }) {
  return (
    <>
          <h3 className="section-divider">Progression</h3>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Scaling (Global)</h3>
              <div className="config-field">
                <label>ref0</label>
                <input type="number" step="0.05" value={editConfig?.health?.globalScaling?.ref0 ?? 0.5} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, globalScaling: {...editConfig.health?.globalScaling, ref0: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>alpha</label>
                <input type="number" step="0.05" value={editConfig?.health?.globalScaling?.alpha ?? 0.15} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, globalScaling: {...editConfig.health?.globalScaling, alpha: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>p (curve)</label>
                <input type="number" step="0.5" value={editConfig?.health?.globalScaling?.p ?? 2} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, globalScaling: {...editConfig.health?.globalScaling, p: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>pop0 (baseline)</label>
                <input type="number" value={editConfig?.health?.pop0 ?? 2} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, pop0: parseInt(e.target.value)}})} />
              </div>
              <p className="config-hint">Per-metric ref0/alpha/p override these global defaults.</p>
            </div>

            <div className="config-section">
              <h3>Level Progression</h3>
              <p className="config-hint">Population tiers scale output and health expectations. Brackets are readonly; multipliers are tunable.</p>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                <thead>
                  <tr style={{borderBottom: `1px solid ${T.panelBorder}`, fontSize: '0.7rem', color: T.textSecondary}}>
                    <th style={{textAlign: 'left', padding: '2px 4px 4px 0', fontWeight: 400}}>Level</th>
                    <th style={{textAlign: 'left', padding: '2px 4px 4px', fontWeight: 400}}>Pop</th>
                    <th style={{textAlign: 'right', padding: '2px 4px 4px', fontWeight: 400}}>Output</th>
                    <th style={{textAlign: 'right', padding: '2px 4px 4px', fontWeight: 400}}>Health</th>
                    <th style={{textAlign: 'right', padding: '2px 0 4px 4px', fontWeight: 400}}>Q.Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map(i => {
                    const brackets = editConfig?.tierConfig?.brackets || [6, 12, 20, 50, 100];
                    const popRange = i === 0 ? `1-${brackets[0]}` : i === 5 ? `${brackets[4]+1}+` : `${brackets[i-1]+1}-${brackets[i]}`;
                    const updateTierArr = (field, idx, val) => {
                      const arr = [...(editConfig?.tierConfig?.[field] || [])];
                      arr[idx] = val;
                      setEditConfig(prev => ({...prev, tierConfig: {...(prev.tierConfig || {}), [field]: arr}}));
                    };
                    return (
                      <tr key={i} style={{borderBottom: `1px solid ${T.panelBg}`}}>
                        <td style={{padding: '3px 4px 3px 0', color: '#D4A035'}}>L{i + 1}</td>
                        <td style={{padding: '3px 4px', color: '#6a6866'}}>{popRange}</td>
                        <td style={{padding: '3px 4px', textAlign: 'right'}}>
                          <input type="number" step="0.05" min="0.1" className="config-table-input"
                            value={editConfig?.tierConfig?.outputMults?.[i] ?? [1, 1.15, 1.3, 1.5, 1.75, 2][i]}
                            onChange={(e) => updateTierArr('outputMults', i, parseFloat(e.target.value) || 1)} />
                        </td>
                        <td style={{padding: '3px 4px', textAlign: 'right'}}>
                          <input type="number" step="0.05" min="0.1" className="config-table-input"
                            value={editConfig?.tierConfig?.healthMults?.[i] ?? [1, 1.1, 1.2, 1.35, 1.5, 1.7][i]}
                            onChange={(e) => updateTierArr('healthMults', i, parseFloat(e.target.value) || 1)} />
                        </td>
                        <td style={{padding: '3px 0 3px 4px', textAlign: 'right'}}>
                          <input type="number" step="1" min="1" max="10" className="config-table-input" style={{width: '45px'}}
                            value={editConfig?.tierConfig?.qualityCaps?.[i] ?? [2, 3, 4, 5, 5, 5][i]}
                            onChange={(e) => updateTierArr('qualityCaps', i, parseInt(e.target.value) || 1)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="config-section" style={{gridColumn: '1 / -1'}}>
              <h3>Vibes & Reputation</h3>
              <div style={{display: 'flex', gap: '16px'}}>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '0.75rem', color: T.textSecondary, display: 'block', marginBottom: '4px'}}>Vibes Tier Ladder</label>
                  <div className="tier-ladder-list">
                    {(editConfig?.vibes?.tierThresholds || []).map((tier, idx) => (
                      <div key={idx} className="tier-ladder-item">
                        <span className="tier-rank">{idx + 1}.</span>
                        <input className="config-table-input" style={{width: '80px', textAlign: 'left'}}
                          value={tier.name}
                          onChange={(e) => {
                            const tiers = [...(editConfig.vibes.tierThresholds)];
                            tiers[idx] = { ...tiers[idx], name: e.target.value };
                            setEditConfig({...editConfig, vibes: {...editConfig.vibes, tierThresholds: tiers}});
                          }} />
                        <span className="tier-range">{Math.round(tier.min * 100)}-{Math.round(tier.max * 100)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '0.75rem', color: T.textSecondary, display: 'block', marginBottom: '4px'}}>Fame Levels (Vibes + pop level)</label>
                  <div className="tier-ladder-list">
                    {(editConfig?.vibes?.fameLevels || []).map((f, idx) => (
                      <div key={idx} className="tier-ladder-item">
                        <span className="tier-rank">{idx + 1}.</span>
                        <input className="config-table-input" style={{width: '90px', textAlign: 'left'}}
                          value={f.name}
                          onChange={(e) => {
                            const levels = [...(editConfig.vibes.fameLevels)];
                            levels[idx] = { ...levels[idx], name: e.target.value };
                            setEditConfig({...editConfig, vibes: {...editConfig.vibes, fameLevels: levels}});
                          }} />
                        <span className="tier-range" style={{minWidth: '36px'}}>{f.min}-{f.max}</span>
                        <span style={{fontSize: '0.65rem', color: '#6a6866', marginLeft: '4px'}}>{f.minTier === 0 ? 'Any' : `Level ${f.minTier + 1}+`}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <label style={{fontSize: '0.75rem', color: T.textSecondary, display: 'block', marginBottom: '4px'}}>Identity Labels (when imbalanced)</label>
                  <div style={{display: 'flex', gap: '8px', marginBottom: '6px'}}>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.6rem', color: '#6a6866', display: 'block', marginBottom: '2px'}}>Balanced Ratio</label>
                      <input className="config-table-input" type="number" step="0.05" style={{width: '100%'}}
                        value={editConfig?.vibes?.balancedRatio ?? 0.6}
                        onChange={(e) => setEditConfig({...editConfig, vibes: {...editConfig.vibes, balancedRatio: parseFloat(e.target.value)}})} />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '0.6rem', color: '#6a6866', display: 'block', marginBottom: '2px'}}>Strong Imbalance</label>
                      <input className="config-table-input" type="number" step="0.05" style={{width: '100%'}}
                        value={editConfig?.vibes?.strongImbalanceRatio ?? 0.4}
                        onChange={(e) => setEditConfig({...editConfig, vibes: {...editConfig.vibes, strongImbalanceRatio: parseFloat(e.target.value)}})} />
                    </div>
                  </div>
                  <div style={{fontSize: '0.6rem', color: '#6a6866', marginBottom: '6px'}}>
                    Min/Max &ge; {editConfig?.vibes?.balancedRatio || 0.6} = Balanced | {editConfig?.vibes?.strongImbalanceRatio || 0.4}–{editConfig?.vibes?.balancedRatio || 0.6} = Mild | &lt; {editConfig?.vibes?.strongImbalanceRatio || 0.4} = Strong
                  </div>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem'}}>
                    <thead>
                      <tr style={{borderBottom: `1px solid ${T.panelBorder}`}}>
                        <th style={{textAlign: 'left', padding: '4px 6px', color: '#6a6866', fontWeight: 500}}>Condition</th>
                        <th style={{textAlign: 'left', padding: '4px 6px', color: '#D4A035', fontWeight: 500}}>Mild</th>
                        <th style={{textAlign: 'left', padding: '4px 6px', color: '#c47e7e', fontWeight: 500}}>Strong</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const labels = editConfig?.vibes?.branchLabels || {};
                        const rows = [
                          { key: 'highLivingStandards', label: 'Overindex LS', color: '#8cc4a0' },
                          { key: 'lowLivingStandards', label: 'Underindex LS', color: '#8cc4a0' },
                          { key: 'highProductivity', label: 'Overindex PR', color: '#7eaac4' },
                          { key: 'lowProductivity', label: 'Underindex PR', color: '#7eaac4' },
                          { key: 'highPartytime', label: 'Overindex PT', color: '#D4A035' },
                          { key: 'lowPartytime', label: 'Underindex PT', color: '#D4A035' }
                        ];
                        const updateLabel = (key, severity, val) => {
                          const bl = {...(editConfig.vibes.branchLabels)};
                          bl[key] = { ...bl[key], [severity]: val };
                          setEditConfig({...editConfig, vibes: {...editConfig.vibes, branchLabels: bl}});
                        };
                        return rows.map(r => (
                          <tr key={r.key} style={{borderBottom: `1px solid ${T.panelBg}`}}>
                            <td style={{padding: '4px 6px', color: r.color}}>{r.label}</td>
                            <td style={{padding: '2px 4px'}}><input className="config-table-input" style={{width: '100%', textAlign: 'left', color: '#D4A035'}}
                              value={labels[r.key]?.mild || ''} onChange={(e) => updateLabel(r.key, 'mild', e.target.value)} /></td>
                            <td style={{padding: '2px 4px'}}><input className="config-table-input" style={{width: '100%', textAlign: 'left', color: '#c47e7e'}}
                              value={labels[r.key]?.strong || ''} onChange={(e) => updateLabel(r.key, 'strong', e.target.value)} /></td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
    </>
  );
}
