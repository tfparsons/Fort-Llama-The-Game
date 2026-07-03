import React from 'react';
import { T } from '../theme';

// Dev tools modal: edit building definitions (capacity, quality, costs, multipliers).
// State lives in App (editableBuildings, also pushed by Save-as-Defaults);
// this component is purely presentational.
export function BuildingsEditor({ buildings, techTree, onUpdateField, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal buildings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage Buildings</h2>
        <div className="buildings-table-container">
          <table className="buildings-table">
            <thead>
              <tr>
                <th>Building</th>
                <th>Capacity</th>
                <th>At Start</th>
                <th>Quality</th>
                <th>Primitive Mult</th>
                <th>Cost</th>
                <th>Util Mult</th>
                <th>Rent Mult</th>
                <th>Dependency</th>
                <th>Buildable</th>
              </tr>
            </thead>
            <tbody>
              {buildings.filter(b => b.id !== 'great_hall').flatMap(b => {
                const greatHall = b.id === 'living_room' ? buildings.find(x => x.id === 'great_hall') : null;
                const rows = [b];
                if (greatHall) rows.push(greatHall);
                return rows;
              }).map(b => {
                const techName = b.techRequired
                  ? (techTree || []).find(t => t.id === b.techRequired)?.name || b.techRequired
                  : null;
                const isUpgradeRow = b.isUpgrade;
                return (
                <tr key={b.id} style={isUpgradeRow ? {background: T.panelBg + '22'} : undefined}>
                  <td style={isUpgradeRow ? {paddingLeft: '20px'} : undefined}>
                    {isUpgradeRow && <span style={{color: T.textMuted, fontSize: '0.7rem', marginRight: '4px'}}>↳</span>}
                    {b.name}
                    {isUpgradeRow && <span style={{color: T.accentBright, fontSize: '0.65rem', marginLeft: '6px'}}>upgrade</span>}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={b.capacity ?? ''}
                      onChange={(e) => onUpdateField(b.id, 'capacity', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={b.atStart ?? ''}
                      onChange={(e) => onUpdateField(b.id, 'atStart', e.target.value)}
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={b.quality ?? 1}
                      onChange={(e) => onUpdateField(b.id, 'quality', e.target.value)}
                      min="1"
                      max="3"
                    />
                  </td>
                  <td className="primitive-mult-cell">
                    {b.id === 'bedroom' && (
                      <div className="mult-row">
                        <label>Recovery:</label>
                        <input type="number" step="0.1" value={b.recoveryMult ?? 1.0}
                          onChange={(e) => onUpdateField(b.id, 'recoveryMult', e.target.value)} />
                      </div>
                    )}
                    {b.id === 'kitchen' && (
                      <>
                        <div className="mult-row">
                          <label>Food:</label>
                          <input type="number" step="0.1" value={b.foodMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'foodMult', e.target.value)} />
                        </div>
                        <div className="mult-row">
                          <label>Mess:</label>
                          <input type="number" step="0.1" value={b.messMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'messMult', e.target.value)} />
                        </div>
                      </>
                    )}
                    {b.id === 'bathroom' && (
                      <>
                        <div className="mult-row">
                          <label>Clean:</label>
                          <input type="number" step="0.1" value={b.cleanMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'cleanMult', e.target.value)} />
                        </div>
                        <div className="mult-row">
                          <label>Mess:</label>
                          <input type="number" step="0.1" value={b.messMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'messMult', e.target.value)} />
                        </div>
                      </>
                    )}
                    {b.id === 'living_room' && (
                      <>
                        <div className="mult-row">
                          <label>Fun:</label>
                          <input type="number" step="0.1" value={b.funMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'funMult', e.target.value)} />
                        </div>
                        <div className="mult-row">
                          <label>Noise:</label>
                          <input type="number" step="0.1" value={b.noiseMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'noiseMult', e.target.value)} />
                        </div>
                      </>
                    )}
                    {b.id === 'great_hall' && (
                      <>
                        <div className="mult-row">
                          <label>Fun:</label>
                          <input type="number" step="0.1" value={b.funMult ?? 1.3}
                            onChange={(e) => onUpdateField(b.id, 'funMult', e.target.value)} />
                        </div>
                        <div className="mult-row">
                          <label>Noise:</label>
                          <input type="number" step="0.1" value={b.noiseMult ?? 1.0}
                            onChange={(e) => onUpdateField(b.id, 'noiseMult', e.target.value)} />
                        </div>
                        <div className="mult-row">
                          <label>Drive:</label>
                          <input type="number" step="0.1" value={b.driveMult ?? 1.2}
                            onChange={(e) => onUpdateField(b.id, 'driveMult', e.target.value)} />
                        </div>
                      </>
                    )}
                    {b.id === 'utility_closet' && (
                      <div className="mult-row">
                        <label>Repair:</label>
                        <input type="number" step="0.1" value={b.repairMult ?? 1.0}
                          onChange={(e) => onUpdateField(b.id, 'repairMult', e.target.value)} />
                      </div>
                    )}
                    {(b.id === 'heaven' || b.id === 'hot_tub') && (
                      <div className="mult-row">
                        <label>Fun Out:</label>
                        <input type="number" step="0.5" value={b.funOutput ?? 0}
                          onChange={(e) => onUpdateField(b.id, 'funOutput', e.target.value)} />
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={b.cost ?? ''}
                      onChange={(e) => onUpdateField(b.id, 'cost', e.target.value)}
                      placeholder="n/a"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={b.utilitiesMultiplier ?? ''}
                      onChange={(e) => onUpdateField(b.id, 'utilitiesMultiplier', e.target.value)}
                      placeholder="n/a"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={b.groundRentMultiplier ?? ''}
                      onChange={(e) => onUpdateField(b.id, 'groundRentMultiplier', e.target.value)}
                      placeholder="n/a"
                    />
                  </td>
                  <td style={{fontSize: '0.75rem', color: techName ? T.textSecondary : T.panelBorder + '44'}}>
                    {techName || '—'}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={b.buildable}
                      onChange={(e) => onUpdateField(b.id, 'buildable', e.target.checked)}
                    />
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <div className="buildings-actions">
          <button className="action-button" onClick={onSave}>Apply Changes</button>
          <button className="modal-close" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
