import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './components/dashboard.css';
import { T, TREE_LABELS } from './components/theme';
import { useGameClock } from './hooks/useGameClock';
import { buildDashboardProps } from './selectors/buildDashboardProps';
import { TopBar } from './components/TopBar';
import { VitalsBar } from './components/VitalsBar';
import { ActionHub } from './components/ActionHub';
import { SkyZone } from './components/SkyZone';
import { GameOverScreen } from './components/GameOverScreen';
import { RecruitModal } from './components/RecruitModal';
import { BuildModal } from './components/BuildModal';
import { PoliciesModal } from './components/PoliciesModal';
import { ResearchModal } from './components/ResearchModal';
import { CompletionModal } from './components/CompletionModal';
import { InfoPopup } from './components/devtools/InfoPopup';
import { DevToolsPanel } from './components/devtools/DevToolsPanel';
import { LlamaPoolEditor } from './components/devtools/LlamaPoolEditor';
import { BuildingsEditor } from './components/devtools/BuildingsEditor';
import FortLlamaLanding from './components/FortLlamaLanding';

const API_BASE = '';

// Responsive width hook — returns current window width, updates on resize
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

function App({ mode = 'player' }) {
  const winWidth = useWindowWidth();
  const layout = winWidth >= 850 ? 'wide' : winWidth >= 600 ? 'medium' : 'narrow';
  const [screen, setScreen] = useState(mode === 'player' ? 'landing' : 'game');
  const [view, setView] = useState('dashboard');
  // narrowTab removed — vitals + actions always visible at all breakpoints
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [buildComplete, setBuildComplete] = useState(null);
  const [policyComplete, setPolicyComplete] = useState(null);
  const [techComplete, setTechComplete] = useState(null);
  const [showLlamaPoolEditor, setShowLlamaPoolEditor] = useState(false);
  const [showBuildingsEditor, setShowBuildingsEditor] = useState(false);
  const [editableLlamas, setEditableLlamas] = useState([]);
  const [editableBuildings, setEditableBuildings] = useState([]);
  const [recruitCandidates, setRecruitCandidates] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rentInput, setRentInput] = useState('');
  const [infoPopup, setInfoPopup] = useState(null);
  const [budgetInputs, setBudgetInputs] = useState({
    nutrition: 0, cleanliness: 0, maintenance: 0,
    fatigue: 0, fun: 0, drive: 0
  });
  const budgetSyncedWeek = useRef(null);
  
  const [expandedPrimitives, setExpandedPrimitives] = useState({});
  const [activeModal, setActiveModal] = useState(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      const data = await res.json();
      setGameState(data);
      setConfig(data.config);
      if (!editConfig) {
        setEditConfig({
          ...data.config,
          health: data.healthConfig,
          primitives: data.primitiveConfig,
          vibes: data.vibesConfig,
          scoreConfig: data.scoreConfig,
          tierConfig: data.tierConfig
        });
      }
      if (rentInput === '' || rentInput === String(data.currentRent)) {
        setRentInput(String(data.currentRent));
      }
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  }, [editConfig, rentInput]);

  const fetchBuildings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/buildings`);
      const data = await res.json();
      setBuildings(data);
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  };

  useEffect(() => {
    fetchState();
    fetchBuildings();
    const interval = setInterval(fetchState, 500);
    return () => clearInterval(interval);
  }, [fetchState]);

  const prevResearchCompleted = useRef(null);
  useEffect(() => {
    if (gameState?.researchCompletedThisWeek && gameState.researchCompletedThisWeek !== prevResearchCompleted.current) {
      prevResearchCompleted.current = gameState.researchCompletedThisWeek;
      const tech = (gameState.techTree || []).find(t => t.id === gameState.researchCompletedThisWeek);
      if (tech) {
        setTechComplete(tech);
      }
    } else if (!gameState?.researchCompletedThisWeek) {
      prevResearchCompleted.current = null;
    }
  }, [gameState?.researchCompletedThisWeek]);

  const isPaused = gameState?.isPausedForWeeklyDecision && !gameState?.isGameOver;

  const { displayTime, resetClock } = useGameClock(gameState, config);


  useEffect(() => {
    if (gameState?.budgets && gameState?.week !== undefined) {
      const syncKey = `${gameState.week}-${gameState.day}`;
      if (budgetSyncedWeek.current !== syncKey && isPaused) {
        budgetSyncedWeek.current = syncKey;
        setBudgetInputs({ ...gameState.budgets });
      }
      if (budgetSyncedWeek.current === null) {
        budgetSyncedWeek.current = syncKey;
        setBudgetInputs({ ...gameState.budgets });
      }
    }
  }, [gameState?.week, gameState?.day, isPaused]);

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    resetClock();
    fetchState();
  };

  const handleDismissWeekly = async () => {
    await fetch(`${API_BASE}/api/dismiss-weekly`, { method: 'POST' });
    fetchState();
  };

  const handleSetRent = async (rent) => {
    const rentNum = parseInt(rent);
    if (isNaN(rentNum) || rentNum < config.rentMin || rentNum > config.rentMax) {
      return false;
    }
    await fetch(`${API_BASE}/api/action/set-rent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rent: rentNum })
    });
    setRentInput(String(rentNum));
    fetchState();
    return true;
  };

  const commitBudgets = async (overrideBudgets) => {
    const toSend = overrideBudgets || budgetInputs;
    await fetch(`${API_BASE}/api/action/set-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgets: toSend })
    });
  };

  const handleBudgetStep = (key, delta) => {
    const current = budgetInputs[key] || 0;
    const newVal = Math.min(500, Math.max(0, current + delta));
    const newBudgets = { ...budgetInputs, [key]: newVal };
    setBudgetInputs(newBudgets);
    commitBudgets(newBudgets);
  };

  const handleInvite = async (llamaId) => {
    try {
      const res = await fetch(`${API_BASE}/api/action/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llamaId })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error('Failed to invite:', err);
    }
  };

  const handleOpenLlamaPoolEditor = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/llama-pool`);
      const data = await res.json();
      setEditableLlamas(data.llamas || []);
      setShowLlamaPoolEditor(true);
    } catch (err) {
      console.error('Failed to fetch llama pool:', err);
    }
  };

  const updateLlamaField = (llamaId, field, value) => {
    setEditableLlamas(prev => prev.map(llama => {
      if (llama.id !== llamaId) return llama;
      if (field === 'stats') {
        return { ...llama, stats: value };
      }
      if (field === 'age') {
        return { ...llama, [field]: parseInt(value) || 0 };
      }
      return { ...llama, [field]: value };
    }));
  };

  const handleSaveLlamaPool = async () => {
    try {
      await fetch(`${API_BASE}/api/llama-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llamas: editableLlamas })
      });
      setShowLlamaPoolEditor(false);
      fetchState();
    } catch (err) {
      console.error('Failed to save llama pool:', err);
    }
  };

  const handleOpenBuildingsEditor = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/buildings`);
      const data = await res.json();
      setEditableBuildings(data || []);
      setShowBuildingsEditor(true);
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  };

  const updatePrimitiveConfig = (primitive, field, value) => {
    if (!Number.isFinite(value)) return;
    setEditConfig(prev => {
      if (primitive === 'global') {
        return { ...prev, primitives: { ...prev.primitives, [field]: value } };
      }
      return {
        ...prev,
        primitives: {
          ...prev.primitives,
          [primitive]: { ...prev.primitives?.[primitive], [field]: value }
        }
      };
    });
  };

  const updateTechConfig = (techId, field, value) => {
    setEditConfig(prev => ({
      ...prev,
      techConfig: {
        ...prev.techConfig,
        [techId]: { ...(prev.techConfig?.[techId] || {}), [field]: value }
      }
    }));
  };

  const togglePrimitiveExpanded = (name) => {
    setExpandedPrimitives(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const updateBuildingField = (buildingId, field, value) => {
    setEditableBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      if (field === 'capacity' || field === 'atStart' || field === 'cost' || field === 'quality') {
        const parsed = value === '' ? null : parseInt(value);
        return { ...b, [field]: parsed };
      }
      if (field === 'utilitiesMultiplier' || field === 'groundRentMultiplier' || 
          field === 'recoveryMult' || field === 'foodMult' || field === 'messMult' ||
          field === 'cleanMult' || field === 'funMult' || field === 'noiseMult' || field === 'repairMult' ||
          field === 'funOutput') {
        const parsed = value === '' ? null : parseFloat(value);
        return { ...b, [field]: parsed };
      }
      if (field === 'buildable') {
        return { ...b, [field]: value };
      }
      return { ...b, [field]: value };
    }));
  };

  const handleSaveBuildings = async () => {
    try {
      await fetch(`${API_BASE}/api/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildings: editableBuildings })
      });
      setShowBuildingsEditor(false);
      fetchState();
      fetchBuildings();
    } catch (err) {
      console.error('Failed to save buildings:', err);
    }
  };

  const handleBuild = async (buildingId) => {
    const res = await fetch(`${API_BASE}/api/action/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId })
    });
    const data = await res.json();
    if (data.success) {
      const building = gameState.buildings?.find(b => b.id === buildingId);
      setBuildComplete({
        name: building?.name || data.building,
        count: data.count,
        cost: building?.cost,
        capacity: data.capacity
      });
    }
    fetchState();
    fetchBuildings();
  };

  const handleTogglePolicy = async (policyId) => {
    const res = await fetch(`${API_BASE}/api/action/toggle-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      const policy = (gameState.policyDefinitions || []).find(p => p.id === policyId);
      setPolicyComplete({
        name: policy?.name || policyId,
        action: data.action,
        primitive: policy?.primitive
      });
    }
    fetchState();
  };

  const handleResearch = async (techId) => {
    const res = await fetch(`${API_BASE}/api/action/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    }
    fetchState();
  };

  const handleCancelResearch = async () => {
    await fetch(`${API_BASE}/api/action/cancel-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    fetchState();
  };

  // New dashboard: open modal handler (fetches candidates for recruit)
  const handleOpenModal = async (modal) => {
    if (modal === 'recruit' && !gameState.hasRecruitedThisWeek) {
      try {
        const res = await fetch(`${API_BASE}/api/recruitment-candidates`);
        const data = await res.json();
        setRecruitCandidates(data.candidates || []);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
      }
    }
    setActiveModal(modal);
  };

  // New dashboard: prepare all props from gameState
  const dashboardProps = useMemo(
    () => buildDashboardProps({ gameState, config, budgetInputs, rentInput, isPaused, buildings, recruitCandidates, displayTime }),
    [gameState, config, budgetInputs, rentInput, isPaused, buildings, recruitCandidates, displayTime]
  );

  const pushAllDevToolConfigs = async () => {
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editConfig)
    });
    if (editConfig.budgetConfig) {
      await fetch(`${API_BASE}/api/budget-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.budgetConfig)
      });
    }
    if (editConfig.policyConfig) {
      await fetch(`${API_BASE}/api/policy-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.policyConfig)
      });
    }
    if (editConfig.techConfig) {
      await fetch(`${API_BASE}/api/tech-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.techConfig)
      });
    }
    if (editConfig.scoreConfig) {
      await fetch(`${API_BASE}/api/score-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.scoreConfig)
      });
    }
    if (editConfig.vibes) {
      await fetch(`${API_BASE}/api/vibes-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.vibes)
      });
    }
    if (editConfig.tierConfig) {
      await fetch(`${API_BASE}/api/tier-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.tierConfig)
      });
    }
    if (editableBuildings.length > 0) {
      await fetch(`${API_BASE}/api/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildings: editableBuildings })
      });
    }
  };

  const handleApplyConfig = async () => {
    await pushAllDevToolConfigs();
    budgetSyncedWeek.current = null;
    fetchState();
    setView('dashboard');
  };

  const handleSaveDefaults = async () => {
    await pushAllDevToolConfigs();
    await fetch(`${API_BASE}/api/save-balance-config`, { method: 'POST' });
    await fetch(`${API_BASE}/api/save-defaults`, { method: 'POST' });
    budgetSyncedWeek.current = null;
    fetchState();
    alert('Current settings saved as defaults!');
  };

  const updateEditConfig = (key, value) => {
    setEditConfig(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  if (!gameState || !config) {
    return <div className="app">Loading...</div>;
  }

  if (screen === 'landing') {
    return <FortLlamaLanding onStartGame={() => setScreen('game')} />;
  }

  return (
    <div className="app" style={{ background: T.pageBg, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <TopBar
        vibes={dashboardProps?.vibes}
        reputation={dashboardProps?.reputation}
        level={dashboardProps?.level}
        score={dashboardProps?.score}
        layout={layout}
        mode={mode}
        view={view}
        onViewChange={setView}
      />

      {gameState.isGameOver && view === 'dashboard' && (
        <GameOverScreen onRestart={handleReset} />
      )}

      {view === 'dashboard' && dashboardProps && (<>
        <VitalsBar layout={layout}
          treasury={dashboardProps.treasury} income={dashboardProps.income} expenses={dashboardProps.expenses} net={dashboardProps.net}
          incomeBreakdown={dashboardProps.incomeBreakdown} expenseBreakdown={dashboardProps.expenseBreakdown}
          healthMetrics={dashboardProps.healthMetrics} metricHistory={dashboardProps.metricHistory} researchedCulture={dashboardProps.researchedCulture}
          buildings={dashboardProps.buildings} residents={dashboardProps.residents} population={dashboardProps.population} capacity={dashboardProps.capacity}
          aggregateStats={dashboardProps.aggregateStats} policies={dashboardProps.policies} primitives={dashboardProps.primitives} events={dashboardProps.events}
        />
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
          <SkyZone />
        </div>
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '0 16px 12px', position: 'relative', zIndex: 4 }}>
          <ActionHub layout={layout}
            week={dashboardProps.week} day={dashboardProps.day} time={dashboardProps.time}
            hasRecruitedThisWeek={dashboardProps.hasRecruitedThisWeek} buildsThisWeek={dashboardProps.buildsThisWeek} buildsPerWeek={dashboardProps.buildsPerWeek}
            policyChangesLeft={dashboardProps.policyChangesLeft} researchingTech={dashboardProps.researchingTech}
            rent={dashboardProps.rent} rentTier={dashboardProps.rentTier} rentMin={dashboardProps.rentMin} rentMax={dashboardProps.rentMax} rentStep={dashboardProps.rentStep}
            budgets={dashboardProps.budgets} primitives={dashboardProps.primitives} isPaused={dashboardProps.isPaused}
            onOpenModal={handleOpenModal} onRentChange={(val) => setRentInput(String(val))} onRentRelease={() => handleSetRent(rentInput)}
            onBudgetStep={handleBudgetStep} onStartWeek={handleDismissWeekly}
            onRestart={() => { if (window.confirm('Are you sure you want to restart the game?')) handleReset(); }}
          />
        </div>
      </>)}

      {/* New dashboard modals */}
      {activeModal === 'recruit' && dashboardProps && (
        <RecruitModal
          candidates={dashboardProps.candidates}
          population={dashboardProps.population}
          capacity={dashboardProps.capacity}
          hasRecruitedThisWeek={dashboardProps.hasRecruitedThisWeek}
          onInvite={(id) => { handleInvite(id); setActiveModal(null); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'build' && dashboardProps && (
        <BuildModal
          buildableBuildings={dashboardProps.buildableBuildings}
          buildsThisWeek={dashboardProps.buildsThisWeek}
          buildsPerWeek={dashboardProps.buildsPerWeek}
          treasury={dashboardProps.treasury}
          debtLimit={dashboardProps.debtLimit}
          onBuild={(id) => { handleBuild(id); setActiveModal(null); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'policies' && dashboardProps && (
        <PoliciesModal
          allPolicies={dashboardProps.allPolicies}
          policySlots={dashboardProps.policySlots}
          policyChangesLeft={dashboardProps.policyChangesLeft}
          onApplyChanges={async (ids) => { for (const id of ids) await handleTogglePolicy(id); setActiveModal(null); }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'research' && dashboardProps && (
        <ResearchModal
          techTree={dashboardProps.techTree}
          researchingTech={dashboardProps.researchingTech}
          treasury={dashboardProps.treasury}
          debtLimit={dashboardProps.debtLimit}
          onResearch={(id) => { handleResearch(id); setActiveModal(null); }}
          onCancelResearch={() => { handleCancelResearch(); setActiveModal(null); }}
          onClose={() => setActiveModal(null)}
        />
      )}


      {mode === 'dev' && view === 'devtools' && editConfig && (
        <DevToolsPanel
          gameState={gameState}
          editConfig={editConfig}
          setEditConfig={setEditConfig}
          updateEditConfig={updateEditConfig}
          updatePrimitiveConfig={updatePrimitiveConfig}
          updateTechConfig={updateTechConfig}
          expandedPrimitives={expandedPrimitives}
          togglePrimitiveExpanded={togglePrimitiveExpanded}
          setInfoPopup={setInfoPopup}
          onOpenLlamaPool={handleOpenLlamaPoolEditor}
          onOpenBuildings={handleOpenBuildingsEditor}
          onSaveDefaults={handleSaveDefaults}
          onApply={handleApplyConfig}
        />
      )}

      {infoPopup && <InfoPopup popup={infoPopup} onClose={() => setInfoPopup(null)} />}

      {buildComplete && (
        <CompletionModal
          icon={'\u{1F3D7}'}
          title="Building Complete"
          titleColor={T.positive}
          message={<>New <span style={{fontWeight: 600}}>{buildComplete.name}</span> built successfully.</>}
          rows={[
            { label: `Total ${buildComplete.name}`, value: buildComplete.count },
            { label: 'Cost', value: `-£${buildComplete.cost?.toLocaleString()}`, color: T.negative },
            { label: 'Total Capacity', value: buildComplete.capacity, color: T.positive },
          ]}
          onClose={() => setBuildComplete(null)}
        />
      )}

      {policyComplete && (
        <CompletionModal
          icon={policyComplete.action === 'activated' ? '\u2705' : '\u274C'}
          title={`Policy ${policyComplete.action === 'activated' ? 'Activated' : 'Deactivated'}`}
          titleColor={policyComplete.action === 'activated' ? T.positive : T.negative}
          message={<><span style={{fontWeight: 600}}>{policyComplete.name}</span> has been {policyComplete.action}.</>}
          rows={[
            { label: 'Affects', value: policyComplete.primitive, style: { textTransform: 'capitalize' } },
          ]}
          onClose={() => setPolicyComplete(null)}
        />
      )}

      {techComplete && (
        <CompletionModal
          icon={'\u{1F52C}'}
          title="Research Complete"
          titleColor={T.positive}
          maxWidth="380px"
          message={<><span style={{fontWeight: 600}}>{techComplete.name}</span> has been researched.</>}
          rows={[
            { label: 'Type', value: techComplete.type?.replace('_', ' '), style: { textTransform: 'capitalize' } },
            { label: 'Tree', value: TREE_LABELS[techComplete.tree] || techComplete.tree },
          ]}
          onClose={() => setTechComplete(null)}
        />
      )}

      {showLlamaPoolEditor && (
        <LlamaPoolEditor
          llamas={editableLlamas}
          communeResidents={gameState.communeResidents}
          onUpdateField={updateLlamaField}
          onSave={handleSaveLlamaPool}
          onClose={() => setShowLlamaPoolEditor(false)}
        />
      )}

      {showBuildingsEditor && (
        <BuildingsEditor
          buildings={editableBuildings}
          techTree={gameState?.techTree}
          onUpdateField={updateBuildingField}
          onSave={handleSaveBuildings}
          onClose={() => setShowBuildingsEditor(false)}
        />
      )}
    </div>
  );
}

export default App;
