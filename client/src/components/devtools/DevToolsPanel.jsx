import React from 'react';
import { BasicSettingsSection } from './BasicSettingsSection';
import { ProgressionSection } from './ProgressionSection';
import { HealthMetricsSection } from './HealthMetricsSection';
import { PrimitivesSection } from './PrimitivesSection';
import { MechanicsSection } from './MechanicsSection';
import { ScoringSection } from './ScoringSection';
import { TechTreeEditor } from './TechTreeEditor';

// Dev tools root: header actions plus one component per config section.
// All editor state stays lifted in App (editConfig, expanded accordions,
// editable llamas/buildings) so edits survive switching back to the dashboard.
export function DevToolsPanel({
  gameState, editConfig, setEditConfig,
  updateEditConfig, updatePrimitiveConfig, updateTechConfig,
  expandedPrimitives, togglePrimitiveExpanded, setInfoPopup,
  onOpenLlamaPool, onOpenBuildings, onSaveDefaults, onApply,
}) {
  return (
    <div className="dev-tools" style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
      <div className="dev-tools-header">
        <h2>Developer Tools</h2>
        <div className="dev-tools-buttons">
          <button className="manage-llamas-btn" onClick={onOpenLlamaPool}>
            Manage Llamas
          </button>
          <button className="manage-llamas-btn" onClick={onOpenBuildings}>
            Manage Buildings
          </button>
          <button className="save-defaults-button" onClick={onSaveDefaults}>
            Save as Defaults
          </button>
          <button className="apply-button" onClick={onApply}>
            Apply & Reset
          </button>
        </div>
      </div>

      <BasicSettingsSection editConfig={editConfig} setEditConfig={setEditConfig} updateEditConfig={updateEditConfig} />
      <ProgressionSection editConfig={editConfig} setEditConfig={setEditConfig} />
      <HealthMetricsSection editConfig={editConfig} setEditConfig={setEditConfig} setInfoPopup={setInfoPopup} />
      <PrimitivesSection editConfig={editConfig} updatePrimitiveConfig={updatePrimitiveConfig} expandedPrimitives={expandedPrimitives} togglePrimitiveExpanded={togglePrimitiveExpanded} />
      <MechanicsSection gameState={gameState} editConfig={editConfig} setEditConfig={setEditConfig} />
      <ScoringSection gameState={gameState} editConfig={editConfig} setEditConfig={setEditConfig} />

      <TechTreeEditor
        techTree={gameState.techTree}
        buildings={gameState.buildings}
        techConfig={editConfig?.techConfig}
        onUpdateTechConfig={updateTechConfig}
      />
    </div>
  );
}
