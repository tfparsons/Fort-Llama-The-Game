import React from 'react';

export function PrimitivesSection({ editConfig, updatePrimitiveConfig, expandedPrimitives, togglePrimitiveExpanded }) {
  return (
    <>
          <h3 className="section-divider">Primitive Settings</h3>
          <div className="primitives-accordion">
            
            <div className={`primitive-section ${expandedPrimitives.crowding ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('crowding')}>
                <span className="expand-icon">{expandedPrimitives.crowding ? '▼' : '▶'}</span>
                <span className="primitive-name">Crowding</span>
                <span className="primitive-type pressure">Pressure</span>
              </div>
              {expandedPrimitives.crowding && (
                <div className="primitive-body">
                  <div className="formula-display">maxRatio × baseMult × penalty(maxRatio)</div>
                  <div className="primitive-info">
                    <span className="info-label">Ratio:</span> max of (beds, bath, kitchen, living) capacity ratios
                  </div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>baseMult</label>
                      <input type="number" step="1" min="1" value={editConfig?.primitives?.crowding?.baseMult ?? 43}
                        onChange={(e) => updatePrimitiveConfig('crowding', 'baseMult', parseInt(e.target.value) || 43)} />
                    </div>
                    <div className="config-field">
                      <label>shareTolCoeff</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.crowding?.shareTolCoeff ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('crowding', 'shareTolCoeff', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyK</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.crowding?.penaltyK ?? 2}
                        onChange={(e) => updatePrimitiveConfig('crowding', 'penaltyK', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyP</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.crowding?.penaltyP ?? 2}
                        onChange={(e) => updatePrimitiveConfig('crowding', 'penaltyP', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.noise ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('noise')}>
                <span className="expand-icon">{expandedPrimitives.noise ? '▼' : '▶'}</span>
                <span className="primitive-name">Noise</span>
                <span className="primitive-type pressure">Pressure</span>
              </div>
              {expandedPrimitives.noise && (
                <div className="primitive-body">
                  <div className="formula-display">socialNoise + ambientNoise × (1/livingQuality)</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>baseSocial</label>
                      <input type="number" step="0.25" value={editConfig?.primitives?.noise?.baseSocial ?? 2.25}
                        onChange={(e) => updatePrimitiveConfig('noise', 'baseSocial', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>baseAmbient</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.noise?.baseAmbient ?? 10}
                        onChange={(e) => updatePrimitiveConfig('noise', 'baseAmbient', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>socioMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.noise?.socioMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('noise', 'socioMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>considMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.noise?.considMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('noise', 'considMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                    <div className="config-field">
                      <label>penaltyK</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.noise?.penaltyK ?? 2}
                        onChange={(e) => updatePrimitiveConfig('noise', 'penaltyK', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyP</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.noise?.penaltyP ?? 2}
                        onChange={(e) => updatePrimitiveConfig('noise', 'penaltyP', parseFloat(e.target.value))} />
                    </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.nutrition ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('nutrition')}>
                <span className="expand-icon">{expandedPrimitives.nutrition ? '▼' : '▶'}</span>
                <span className="primitive-name">Nutrition</span>
                <span className="primitive-type coverage">Coverage</span>
              </div>
              {expandedPrimitives.nutrition && (
                <div className="primitive-body">
                  <div className="formula-display">supply = min(N,cap) × outputRate × levelMult × quality × (1 + skillMult × cookSkill) × budgetMult</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.nutrition?.outputRate ?? 7.3}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>consumptionRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.nutrition?.consumptionRate ?? 13}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'consumptionRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.nutrition?.skillMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.fun ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('fun')}>
                <span className="expand-icon">{expandedPrimitives.fun ? '▼' : '▶'}</span>
                <span className="primitive-name">Fun</span>
                <span className="primitive-type coverage">Coverage</span>
              </div>
              {expandedPrimitives.fun && (
                <div className="primitive-body">
                  <div className="formula-display">supply = min(N,cap) × outputRate × levelMult × quality × (1 + skillMult × avgSocioStamina) × policyMult × budgetMult</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fun?.outputRate ?? 9.2}
                        onChange={(e) => updatePrimitiveConfig('fun', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>consumptionRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.fun?.consumptionRate ?? 16}
                        onChange={(e) => updatePrimitiveConfig('fun', 'consumptionRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.fun?.skillMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('fun', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.drive ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('drive')}>
                <span className="expand-icon">{expandedPrimitives.drive ? '▼' : '▶'}</span>
                <span className="primitive-name">Drive</span>
                <span className="primitive-type coverage">Coverage</span>
              </div>
              {expandedPrimitives.drive && (
                <div className="primitive-body">
                  <div className="formula-display">supply = min(N,cap) × outputRate × levelMult × quality × (1 + skillMult × workEthic) × budgetMult</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.drive?.outputRate ?? 6.3}
                        onChange={(e) => updatePrimitiveConfig('drive', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>slackRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.drive?.slackRate ?? 11}
                        onChange={(e) => updatePrimitiveConfig('drive', 'slackRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.drive?.skillMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('drive', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.cleanliness ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('cleanliness')}>
                <span className="expand-icon">{expandedPrimitives.cleanliness ? '▼' : '▶'}</span>
                <span className="primitive-name">Cleanliness</span>
                <span className="primitive-type stock">Stock (Debt)</span>
              </div>
              {expandedPrimitives.cleanliness && (
                <div className="primitive-body">
                  <div className="formula-display">messIn = messPerResident × N × overcrowdingPenalty</div>
                  <div className="formula-display">cleanOut = cleanBase × bathQ × cleanMult × (1 + skillMult × tidiness) × budgetMult × techBoosts</div>
                  <div className="formula-display">debt += (messIn - cleanOut) × 0.5</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>messPerResident</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.cleanliness?.messPerResident ?? 0.1}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'messPerResident', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>cleanBase</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.cleanliness?.cleanBase ?? 0.52}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'cleanBase', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.cleanliness?.skillMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyK</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.cleanliness?.penaltyK ?? 2}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'penaltyK', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyP</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.cleanliness?.penaltyP ?? 2}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'penaltyP', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.maintenance ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('maintenance')}>
                <span className="expand-icon">{expandedPrimitives.maintenance ? '▼' : '▶'}</span>
                <span className="primitive-name">Maintenance</span>
                <span className="primitive-type stock">Stock (Debt)</span>
              </div>
              {expandedPrimitives.maintenance && (
                <div className="primitive-body">
                  <div className="formula-display">accumulates: (wearIn × penalty - repairOut × budgetMult × techBoosts) × 0.5</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>wearPerResident</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.maintenance?.wearPerResident ?? 0.08}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'wearPerResident', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>repairBase</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.maintenance?.repairBase ?? 0.54}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'repairBase', parseFloat(e.target.value))} />
                    </div>
                  </div>
                    <div className="config-field">
                      <label>penaltyK</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.maintenance?.penaltyK ?? 4}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'penaltyK', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyP</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.maintenance?.penaltyP ?? 3}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'penaltyP', parseFloat(e.target.value))} />
                    </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.fatigue ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('fatigue')}>
                <span className="expand-icon">{expandedPrimitives.fatigue ? '▼' : '▶'}</span>
                <span className="primitive-name">Fatigue</span>
                <span className="primitive-type stock">Stock (Debt)</span>
              </div>
              {expandedPrimitives.fatigue && (
                <div className="primitive-body">
                  <div className="formula-display">exertion = exertBase × (1 + workMult × workEthic + socioMult × sociability) + funFatigueCoeff × funSupply/N + driveFatigueCoeff × driveSupply/N</div>
                  <div className="formula-display">recovery = recoverBase × bedroomQ × recoveryMult × (1 + partyCoeff × partyStamina) × budgetMult × wellnessBoost</div>
                  <div className="formula-display">accumulates: exertion - recovery</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>exertBase</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.fatigue?.exertBase ?? 0.59}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'exertBase', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>recoverBase</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.fatigue?.recoverBase ?? 0.51}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'recoverBase', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>workMult</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.fatigue?.workMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'workMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>socioMult</label>
                      <input type="number" step="0.01" value={editConfig?.primitives?.fatigue?.socioMult ?? 0.25}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'socioMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>funFatigueCoeff</label>
                      <input type="number" step="0.001" value={editConfig?.primitives?.fatigue?.funFatigueCoeff ?? 0.005}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'funFatigueCoeff', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>driveFatigueCoeff</label>
                      <input type="number" step="0.001" value={editConfig?.primitives?.fatigue?.driveFatigueCoeff ?? 0.005}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'driveFatigueCoeff', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyK</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fatigue?.penaltyK ?? 2}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'penaltyK', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>penaltyP</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fatigue?.penaltyP ?? 2}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'penaltyP', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
    </>
  );
}
