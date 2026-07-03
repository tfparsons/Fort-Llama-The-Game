import React from 'react';

// Dev tools modal: edit the full llama pool (names, bios, stats).
// State lives in App (editableLlamas); this component is purely presentational.
export function LlamaPoolEditor({ llamas, communeResidents, onUpdateField, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal llama-pool-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Manage Llama Pool</h2>
        <div className="llama-pool-table-container">
          <table className="llama-pool-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Bio</th>
                <th>Share</th>
                <th>Cook</th>
                <th>Tidy</th>
                <th>Handy</th>
                <th>Consid</th>
                <th>Social</th>
                <th>Party</th>
                <th>Work</th>
              </tr>
            </thead>
            <tbody>
              {llamas.map(llama => (
                <tr key={llama.id} className={communeResidents?.some(r => r.id === llama.id) ? 'in-commune' : ''}>
                  <td>
                    <input
                      type="text"
                      value={llama.name}
                      onChange={(e) => onUpdateField(llama.id, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={llama.gender}
                      onChange={(e) => onUpdateField(llama.id, 'gender', e.target.value)}
                    >
                      <option value="F">F</option>
                      <option value="M">M</option>
                      <option value="NB">NB</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={llama.age}
                      onChange={(e) => onUpdateField(llama.id, 'age', e.target.value)}
                      min="18" max="80"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={llama.bio}
                      onChange={(e) => onUpdateField(llama.id, 'bio', e.target.value)}
                      className="bio-input"
                    />
                  </td>
                  {[
                    'sharingTolerance', 'cookingSkill', 'tidiness', 'handiness',
                    'consideration', 'sociability', 'partyStamina', 'workEthic',
                  ].map(stat => (
                    <td key={stat}>
                      <input
                        type="number"
                        value={llama.stats[stat]}
                        onChange={(e) => onUpdateField(llama.id, 'stats', { ...llama.stats, [stat]: parseInt(e.target.value) || 0 })}
                        min="1" max="20"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="llama-pool-actions">
          <button className="action-button" onClick={onSave}>Apply Changes</button>
          <button className="modal-close" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
