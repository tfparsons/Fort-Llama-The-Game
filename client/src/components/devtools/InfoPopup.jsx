import React from 'react';

// Formula-explanation popups for the health metrics, opened from the dev tools
// panel's info icons. Content is keyed by popup id; add new popups to the map.

const POPUP_CONTENT = {
  livingStandards: (
    <>
      <h2>Living Standards</h2>
      <div className="formula-section">
        <h4>Raw Formula</h4>
        <code>LS_raw = baseline(Nutrition) × damp(Cleanliness) × damp(Crowding) × damp(Maintenance)</code>
        <p>Nutrition provides the baseline. Cleanliness, Crowding and Maintenance are dampeners (higher debt = worse).</p>
      </div>
      <div className="formula-section">
        <h4>Scoring (0-100)</h4>
        <code>M_ref = ref0 × (pop/pop0)^alpha × levelMult[level]</code>
        <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
        <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
      </div>
      <div className="formula-section">
        <h4>Primitives Used</h4>
        <ul>
          <li><strong>Nutrition</strong> (baseline × nutritionWeight) - Food quality from Kitchen</li>
          <li><strong>Cleanliness</strong> (dampener × cleanlinessDampen) - Mess debt reduces LS</li>
          <li><strong>Crowding</strong> (dampener × crowdingDampen) - Worst ratio across all rooms</li>
          <li><strong>Maintenance</strong> (dampener × maintenanceDampen) - Wear debt reduces LS</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Buildings</h4>
        <ul>
          <li><strong>Kitchen</strong> - Quality &amp; foodMult affect Nutrition throughput</li>
          <li><strong>Bathroom</strong> - Count, quality &amp; cleanMult affect Cleanliness recovery</li>
          <li><strong>All rooms</strong> - Crowding = max ratio across Bedroom/Bathroom/Kitchen/Living Room</li>
          <li><strong>Utility Closet</strong> - Quality &amp; repairMult affect Maintenance recovery</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Resident Stats</h4>
        <ul>
          <li><strong>Cooking Skill</strong> - Boosts Nutrition output</li>
          <li><strong>Tidiness</strong> - Boosts Cleanliness recovery</li>
          <li><strong>Handiness</strong> - Boosts Maintenance recovery</li>
          <li><strong>Sharing Tolerance</strong> - Reduces effective resident count for crowding</li>
          <li><strong>Consideration</strong> - Helps Cleanliness recovery</li>
        </ul>
      </div>
      <div className="formula-section effect">
        <h4>Game Effect</h4>
        <p>Higher Living Standards = higher rent tolerance. At LS=35, £100 rent feels 'Fair'. At LS=100, residents tolerate up to £500.</p>
        <code>maxTolerantRent = rentMin + (rentMax - rentMin) × LS^(1/rentTierCurvature)</code>
        <p>Rent level (Bargain→Cheap→Fair→Pricey→Extortionate) depends on where current rent falls relative to maxTolerantRent.</p>
      </div>
    </>
  ),
  productivity: (
    <>
      <h2>Productivity</h2>
      <div className="formula-section">
        <h4>Raw Formula</h4>
        <code>PR_raw = baseline(Drive) × damp(Fatigue, w_PR) × damp(Noise) × damp(Crowding)</code>
        <p>Drive provides the baseline. Noise and Crowding are fixed dampeners. Fatigue weight is dynamic: communes leaning toward productivity get hit harder by fatigue.</p>
      </div>
      <div className="formula-section">
        <h4>Dynamic Fatigue Weight</h4>
        <code>prShare = PR_preFatigue / (PR_preFatigue + PT_preFatigue)</code>
        <code>w_PR = baseFatigueWeight + (prShare − 0.5) × fatigueWeightSwing</code>
        <p>When the commune is more productive than party-oriented, fatigue dampens PR more. Configured via Base fatigue wt and Fatigue swing.</p>
      </div>
      <div className="formula-section">
        <h4>Scoring (0-100)</h4>
        <code>M_ref = ref0 × (pop/pop0)^alpha × levelMult[level]</code>
        <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
        <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
      </div>
      <div className="formula-section">
        <h4>Primitives Used</h4>
        <ul>
          <li><strong>Drive</strong> (baseline × driveWeight) - Motivation from workspace</li>
          <li><strong>Fatigue</strong> (dampener, dynamic weight) - Tiredness reduces output; weight shifts with commune balance</li>
          <li><strong>Noise</strong> (dampener × noiseWeight) - Distractions reduce focus</li>
          <li><strong>Crowding</strong> (dampener × crowdingWeight) - Overcrowding hurts focus</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Buildings</h4>
        <ul>
          <li><strong>Living Room</strong> - Quality affects Drive; capacity affects distractions</li>
          <li><strong>Bedroom</strong> - Quality &amp; recoveryMult affect Fatigue recovery</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Resident Stats</h4>
        <ul>
          <li><strong>Work Ethic</strong> - Directly boosts Drive</li>
          <li><strong>Consideration</strong> - Reduces noise and distractions</li>
          <li><strong>Party Stamina</strong> - Improves Fatigue recovery</li>
          <li><strong>Sociability</strong> - Increases noise/distractions (negative here!)</li>
        </ul>
      </div>
      <div className="formula-section effect">
        <h4>Game Effect</h4>
        <p>At PR=35, churn is neutral. Above 35, churn decreases by 1% per point. Below 35, churn increases. Productive communes keep residents longer even at higher rents.</p>
      </div>
    </>
  ),
  partytime: (
    <>
      <h2>Leisure</h2>
      <div className="formula-section">
        <h4>Raw Formula</h4>
        <code>PT_raw = baseline(Fun) × damp(Fatigue, w_PT)</code>
        <p>Fun provides the baseline. Fatigue is the only dampener. Fatigue weight is dynamic: party-oriented communes get hit harder by fatigue.</p>
      </div>
      <div className="formula-section">
        <h4>Scoring (0-100)</h4>
        <code>M_ref = ref0 × (pop/pop0)^alpha × levelMult[level]</code>
        <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
        <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
      </div>
      <div className="formula-section">
        <h4>Primitives Used</h4>
        <ul>
          <li><strong>Fun</strong> (baseline × funWeight) - Party energy from social activity</li>
          <li><strong>Fatigue</strong> (dampener, dynamic weight) - Too tired to party; weight shifts with commune balance</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Buildings</h4>
        <ul>
          <li><strong>Living Room</strong> - Quality &amp; funMult directly affect Fun; capacity affects crowd factor</li>
          <li><strong>Bedroom</strong> - Quality &amp; recoveryMult affect Fatigue recovery</li>
        </ul>
      </div>
      <div className="formula-section">
        <h4>Resident Stats</h4>
        <ul>
          <li><strong>Sociability</strong> - Boosts Fun</li>
          <li><strong>Party Stamina</strong> - Boosts Fun and Fatigue recovery</li>
          <li><strong>Consideration</strong> - No impact on Leisure</li>
        </ul>
      </div>
      <div className="formula-section effect">
        <h4>Game Effect</h4>
        <p>At PT=35, you get base recruitment slots. Every +15 PT adds +1 extra slot. A fun commune attracts more potential residents.</p>
      </div>
    </>
  ),
};

export function InfoPopup({ popup, onClose }) {
  const content = POPUP_CONTENT[popup];
  if (!content) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="info-popup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        {content}
      </div>
    </div>
  );
}
