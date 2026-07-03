import React from 'react';

export function HealthMetricsSection({ editConfig, setEditConfig, setInfoPopup }) {
  return (
    <>
          <h3 className="section-divider">Health Metric Settings</h3>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Living Standards <span className="info-icon" onClick={() => setInfoPopup('livingStandards')}>&#9432;</span></h3>
              <div className="config-field">
                <label>Nutrition wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.nutritionWeight ?? 0.5} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, nutritionWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Cleanliness damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.cleanlinessDampen ?? 0.35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, cleanlinessDampen: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Crowding damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.crowdingDampen ?? 0.35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, crowdingDampen: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Maintenance damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.maintenanceDampen ?? 0.35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, maintenanceDampen: parseFloat(e.target.value)}}})} />
              </div>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>LS Rent Curve</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.rentCurve ?? 0.7}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, rentCurve: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Rent Tier Curvature</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.rentTierCurvature ?? 2}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, rentTierCurvature: parseFloat(e.target.value)}}})} />
              </div>
              <p className="config-hint">Lower curve = steeper progression. At LS=35, £100 is 'Fair'. At LS=100, max tolerable rent ~£500.</p>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>ref0</label>
                <input type="number" step="0.05" value={editConfig?.health?.livingStandards?.ref0 ?? 0.5}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, ref0: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>alpha</label>
                <input type="number" step="0.05" value={editConfig?.health?.livingStandards?.alpha ?? 0.15}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, alpha: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>p (curve)</label>
                <input type="number" step="0.5" value={editConfig?.health?.livingStandards?.p ?? 2}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, p: parseFloat(e.target.value)}}})} />
              </div>
            </div>

            <div className="config-section">
              <h3>Productivity <span className="info-icon" onClick={() => setInfoPopup('productivity')}>&#9432;</span></h3>
              <div className="config-field">
                <label>Drive wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.productivity?.driveWeight ?? 1.0} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, driveWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Base fatigue wt</label>
                <input type="number" step="0.05" value={editConfig?.health?.baseFatigueWeight ?? 0.5}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, baseFatigueWeight: parseFloat(e.target.value)}})} />
              </div>
              <div className="config-field">
                <label>Fatigue swing</label>
                <input type="number" step="0.05" value={editConfig?.health?.fatigueWeightSwing ?? 0.5}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, fatigueWeightSwing: parseFloat(e.target.value)}})} />
              </div>
              <div className="config-field">
                <label>Noise damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.productivity?.noiseWeight ?? 0.35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, noiseWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Crowding damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.productivity?.crowdingWeight ?? 0.25} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, crowdingWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>Churn Baseline PR</label>
                <input type="number" value={editConfig?.health?.churnBaselinePR ?? 35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, churnBaselinePR: parseInt(e.target.value)}})} />
              </div>
              <div className="config-field">
                <label>Churn Scale Per Point</label>
                <input type="number" step="0.005" value={editConfig?.health?.churnScalePerPoint ?? 0.01} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, churnScalePerPoint: parseFloat(e.target.value)}})} />
              </div>
              <p className="config-hint">At PR={editConfig?.health?.churnBaselinePR ?? 35}, churn is neutral. Above reduces, below increases churn by {((editConfig?.health?.churnScalePerPoint ?? 0.01) * 100).toFixed(1)}% per point.</p>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>ref0</label>
                <input type="number" step="0.05" value={editConfig?.health?.productivity?.ref0 ?? 0.5}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, ref0: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>alpha</label>
                <input type="number" step="0.05" value={editConfig?.health?.productivity?.alpha ?? 0.15}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, alpha: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>p (curve)</label>
                <input type="number" step="0.5" value={editConfig?.health?.productivity?.p ?? 2}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, p: parseFloat(e.target.value)}}})} />
              </div>
            </div>

            <div className="config-section">
              <h3>Leisure <span className="info-icon" onClick={() => setInfoPopup('partytime')}>&#9432;</span></h3>
              <div className="config-field">
                <label>Fun wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.partytime?.funWeight ?? 1.0} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, funWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>Recruit Baseline PT</label>
                <input type="number" value={editConfig?.health?.recruitBaselinePT ?? 35} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, recruitBaselinePT: parseInt(e.target.value)}})} />
              </div>
              <div className="config-field">
                <label>Recruit Scale Per Slot</label>
                <input type="number" value={editConfig?.health?.recruitScalePerSlot ?? 15} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, recruitScalePerSlot: parseInt(e.target.value)}})} />
              </div>
              <p className="config-hint">At PT={editConfig?.health?.recruitBaselinePT ?? 35}, get base slots. Each +{editConfig?.health?.recruitScalePerSlot ?? 15} PT adds +1 slot.</p>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>ref0</label>
                <input type="number" step="0.05" value={editConfig?.health?.partytime?.ref0 ?? 0.5}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, ref0: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>alpha</label>
                <input type="number" step="0.05" value={editConfig?.health?.partytime?.alpha ?? 0.15}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, alpha: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>p (curve)</label>
                <input type="number" step="0.5" value={editConfig?.health?.partytime?.p ?? 2}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, p: parseFloat(e.target.value)}}})} />
              </div>
            </div>
          </div>
    </>
  );
}
