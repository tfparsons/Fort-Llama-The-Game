import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './components/dashboard.css';
import { T, STAT_DISPLAY, BUDGET_DISPLAY, TREE_COLORS, TREE_LABELS } from './components/theme';
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
  
  const [displayTime, setDisplayTime] = useState({ hour: 9, minute: 0, dayIndex: 0 });
  const clockAnimationRef = useRef(null);
  const clockStartRef = useRef({ hour: 9, day: 1, realStartTime: Date.now(), synced: false });
  const wasPausedRef = useRef(true);
  
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
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

  // Store current pause state in ref so animation can read fresh value
  const isPausedRef = useRef(true);
  const configRef = useRef({ tickSpeed: 333, hoursPerTick: 4 });
  const gameStateRef = useRef(null);
  
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

  // Keep refs in sync with state
  useEffect(() => {
    if (gameState) {
      isPausedRef.current = gameState.isPausedForWeeklyDecision || gameState.isGameOver;
      gameStateRef.current = gameState;
    }
  }, [gameState]);
  
  useEffect(() => {
    if (config) {
      configRef.current = { 
        tickSpeed: config.tickSpeed || 333, 
        hoursPerTick: config.hoursPerTick || 4 
      };
    }
  }, [config]);

  // Handle pause/unpause transitions
  useEffect(() => {
    if (!gameState) return;
    
    const isPaused = gameState.isPausedForWeeklyDecision || gameState.isGameOver;
    
    // Detect pause/unpause transitions
    if (isPaused && !wasPausedRef.current) {
      // Just paused - sync display to server time
      wasPausedRef.current = true;
      clockStartRef.current.synced = false;
    } else if (!isPaused && wasPausedRef.current) {
      // Just unpaused - capture starting point for animation
      wasPausedRef.current = false;
      clockStartRef.current = {
        hour: gameState.hour,
        day: gameState.day,
        realStartTime: Date.now(),
        synced: true
      };
    }
    
    // Initial sync if not yet synced
    if (!clockStartRef.current.synced && gameState.hour !== undefined) {
      clockStartRef.current = {
        hour: gameState.hour,
        day: gameState.day,
        realStartTime: Date.now(),
        synced: true
      };
    }
  }, [gameState]);

  // Continuous clock animation - runs purely client-side
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const { tickSpeed, hoursPerTick } = configRef.current;
      const gameMinutesPerMs = (hoursPerTick * 60) / tickSpeed;
      
      if (isPausedRef.current) {
        // When paused, show server time exactly
        const gs = gameStateRef.current;
        const serverHour = gs?.hour ?? 9;
        const serverDay = gs?.day ?? 1;
        setDisplayTime({ hour: serverHour, minute: 0, dayIndex: serverDay - 1 });
      } else {
        // Calculate time based purely on elapsed real time since unpause
        const elapsedMs = now - clockStartRef.current.realStartTime;
        const elapsedGameMinutes = elapsedMs * gameMinutesPerMs;
        const startMinutes = clockStartRef.current.hour * 60;
        const totalMinutes = startMinutes + elapsedGameMinutes;
        
        // Calculate hours and days crossed
        const totalHours = totalMinutes / 60;
        const daysCrossed = Math.floor(totalHours / 24);
        
        const hour = Math.floor(totalHours) % 24;
        const minute = Math.floor(totalMinutes % 60);
        const dayIndex = ((clockStartRef.current.day - 1) + daysCrossed) % 7;
        
        setDisplayTime({ hour, minute, dayIndex });
      }
      
      clockAnimationRef.current = requestAnimationFrame(animate);
    };
    
    clockAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (clockAnimationRef.current) {
        cancelAnimationFrame(clockAnimationRef.current);
      }
    };
  }, []);

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    clockStartRef.current = { hour: 9, day: 1, realStartTime: Date.now(), synced: false };
    wasPausedRef.current = true;
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
  const dashboardProps = useMemo(() => {
    if (!gameState || !config) return null;

    const communeResidents = (gameState.communeResidents || []).filter(r => !r.churned);
    const pop = communeResidents.length;

    // Aggregate stats: average stat → percentage modifier
    const aggregateStats = {};
    if (pop > 0) {
      for (const [key, label] of Object.entries(STAT_DISPLAY)) {
        const avg = communeResidents.reduce((sum, r) => sum + (r.stats?.[key] || 10), 0) / pop;
        aggregateStats[label] = Math.round((avg - 10) * 3);
      }
    }

    // Residents with display-name skills
    const residents = communeResidents.map(r => ({
      name: r.name,
      skills: r.stats ? Object.fromEntries(
        Object.entries(STAT_DISPLAY).map(([key, label]) => {
          const avg = communeResidents.reduce((sum, res) => sum + (res.stats?.[key] || 10), 0) / pop;
          return [label, Math.round((avg - 10) * 3)];
        })
      ) : {},
    }));

    // Health metrics scaled 0–1 → 0–100
    const healthMetrics = {
      livingStandards: Math.round((gameState.healthMetrics?.livingStandards || 0) * 100),
      productivity: Math.round((gameState.healthMetrics?.productivity || 0) * 100),
      partytime: Math.round((gameState.healthMetrics?.partytime || 0) * 100),
    };

    // Treasury
    const projIncome = gameState.projectedIncome ?? (gameState.residents * gameState.currentRent);
    const projGroundRent = gameState.projectedGroundRent ?? config.groundRentBase;
    const projUtilities = gameState.projectedUtilities ?? config.utilitiesBase;
    const projBudget = gameState.projectedBudget ?? Object.values(budgetInputs).reduce((s, v) => s + v, 0);
    const projFixedCosts = gameState.projectedFixedCosts ?? 0;
    const totalExpenses = projGroundRent + projUtilities + projBudget + projFixedCosts;
    const net = gameState.weeklyDelta ?? (projIncome - totalExpenses);

    const incomeBreakdown = [
      { label: 'Rent', amount: Math.round(projIncome) },
    ];
    const expenseBreakdown = [
      { label: 'Ground Rent', amount: Math.round(projGroundRent) },
      { label: 'Utilities', amount: Math.round(projUtilities) },
      { label: 'Budgets', amount: Math.round(projBudget) },
    ];
    if (projFixedCosts > 0) {
      expenseBreakdown.push({ label: 'Fixed Costs', amount: Math.round(projFixedCosts) });
    }

    // Primitives + tier labels from coverageData
    const primKeys = ['nutrition', 'fun', 'drive', 'crowding', 'noise', 'cleanliness', 'maintenance', 'fatigue'];
    const primitives = {};
    for (const key of primKeys) {
      primitives[key] = {
        value: Math.round(gameState.primitives?.[key] || 0),
        tier: gameState.coverageData?.[key]?.label || '',
        threshold: key === 'nutrition' ? 22 : key === 'fun' ? 18 : key === 'drive' ? 20 : undefined,
      };
    }

    // Buildings display
    const buildingDefs = gameState.buildings || buildings || [];
    const buildingsDisplay = buildingDefs
      .filter(b => (b.count > 0) || gameState.pendingBuildings?.includes(b.id))
      .map(b => ({
        name: b.name,
        count: b.count || 0,
        cap: (b.count || 0) * (b.capacity || 0),
        status: gameState.pendingBuildings?.includes(b.id) ? 'pending' : 'active',
      }));

    // Policies display
    const activePolicyIds = gameState.activePolicies || [];
    const policyDefs = gameState.policyDefinitions || [];
    const policiesDisplay = policyDefs
      .filter(p => activePolicyIds.includes(p.id) || (!p.techRequired || gameState.researchedTechs?.includes(p.techRequired)))
      .filter(p => activePolicyIds.includes(p.id))
      .map(p => ({
        name: p.name,
        effect: p.description || p.effect || '',
        active: true,
      }));

    // Policy changes logic
    const policyLimitActive = (gameState.policiesStableWeeks || 0) >= 1 && activePolicyIds.length >= 3;
    const policyChangesLeft = policyLimitActive
      ? Math.max(0, (config.policyChangesPerWeek ?? 1) - (gameState.policyChangesThisWeek || 0))
      : 999;

    // All policies for modal
    const allPolicies = policyDefs.map(p => ({
      id: p.id,
      name: p.name,
      effect: p.description || p.effect || '',
      primitive: p.primitive || '',
      active: activePolicyIds.includes(p.id),
      unlocked: !p.techRequired || gameState.researchedTechs?.includes(p.techRequired),
    }));

    // Buildable buildings for modal
    const buildableBuildings = buildingDefs
      .filter(b => b.buildable !== false && (!b.techRequired || gameState.researchedTechs?.includes(b.techRequired)))
      .map(b => ({
        id: b.id,
        name: b.name,
        desc: b.description || '',
        cost: b.cost || 0,
        capacity: b.capacity || 0,
        groundRent: b.groundRentMultiplier ? Math.round(b.groundRentMultiplier * (config.groundRentBase || 700)) : 0,
        utilities: b.utilitiesMultiplier ? Math.round(b.utilitiesMultiplier * (config.utilitiesBase || 250)) : 0,
      }));

    // Tech tree for modal
    const techTree = (gameState.techTree || []).map(t => ({
      id: t.id,
      name: t.name,
      desc: t.description || '',
      cost: t.cost || gameState.techConfig?.[t.id]?.cost || 0,
      type: t.type || 'upgrade',
      tree: t.tree || 'livingStandards',
      researched: gameState.researchedTechs?.includes(t.id) || false,
      available: t.available !== false,
      parent: t.parent || null,
    }));

    // Culture trophies
    const researchedCulture = techTree
      .filter(t => t.type === 'culture' && t.researched)
      .map(t => ({ id: t.id, badge: t.name, tree: t.tree }));

    // Recruit candidates for modal
    const candidates = (recruitCandidates || []).map(c => ({
      id: c.id,
      name: c.name,
      age: c.age,
      bio: c.bio || '',
      stats: c.stats ? {
        Sharing: c.stats.sharingTolerance,
        Cooking: c.stats.cookingSkill,
        Tidiness: c.stats.tidiness,
        Handiness: c.stats.handiness,
        'Consider.': c.stats.consideration,
        Sociable: c.stats.sociability,
        Party: c.stats.partyStamina,
        Work: c.stats.workEthic,
      } : {},
    }));

    // Metric history for sparklines (from existing state)
    const metricHistory = (gameState.metricHistory || []).map(d => ({
      ls: Math.round((d.livingStandards || 0) * 100),
      pr: Math.round((d.productivity || 0) * 100),
      pt: Math.round((d.partytime || 0) * 100),
    }));

    // Clock
    const dayName = DAY_NAMES[displayTime.dayIndex] || 'Monday';
    const timeStr = `${String(displayTime.hour).padStart(2, '0')}:${String(displayTime.minute).padStart(2, '0')}`;

    return {
      // TopBar
      vibes: gameState.vibes?.tierName || 'Decent',
      reputation: gameState.vibes?.branchLabel || gameState.vibes?.reputation || 'Obscure',
      level: (gameState.coverageData?.tier || 0) + 1,
      score: gameState.scoring?.totalScore || 0,
      // ActionHub
      week: gameState.week,
      day: dayName,
      time: timeStr,
      hasRecruitedThisWeek: !!gameState.hasRecruitedThisWeek,
      buildsThisWeek: gameState.buildsThisWeek || 0,
      buildsPerWeek: config.buildsPerWeek ?? 1,
      policyChangesLeft,
      researchingTech: gameState.researchingTech,
      rent: parseInt(rentInput) || gameState.currentRent || 150,
      rentTier: (() => {
        const r = parseInt(rentInput) || gameState.currentRent || 150;
        const ls = Math.max(0, Math.min(1, gameState.healthMetrics?.livingStandards || 0.5));
        const rMin = config.rentMin || 50;
        const rMax = config.rentMax || 500;
        const curvature = Math.max(0.1, gameState.healthConfig?.livingStandards?.rentTierCurvature ?? 2);
        const maxTolerant = rMin + (rMax - rMin) * Math.pow(ls, 1 / curvature);
        const ratio = r / maxTolerant;
        if (ratio <= 0.3) return 'Bargain';
        if (ratio <= 0.5) return 'Cheap';
        if (ratio <= 0.7) return 'Fair';
        if (ratio <= 0.9) return 'Pricey';
        return 'Extortionate';
      })(),
      rentMin: config.rentMin || 50,
      rentMax: config.rentMax || 500,
      rentStep: config.rentStep || 10,
      budgets: budgetInputs,
      isPaused,
      // VitalsBar
      treasury: Math.round(gameState.treasury || 0),
      income: Math.round(projIncome),
      expenses: Math.round(totalExpenses),
      net: Math.round(net),
      incomeBreakdown,
      expenseBreakdown,
      healthMetrics,
      metricHistory,
      researchedCulture,
      buildings: buildingsDisplay,
      residents,
      population: pop,
      capacity: gameState.capacity || 0,
      aggregateStats,
      policies: policiesDisplay,
      events: [...(gameState.events || [])].reverse(),
      primitives,
      // Modals
      candidates,
      buildableBuildings,
      allPolicies,
      policySlots: config.maxActivePolicies ?? 3,
      techTree,
      debtLimit: gameState.config?.gameOverLimit ?? -5000,
    };
  }, [gameState, config, budgetInputs, rentInput, isPaused, buildings, recruitCandidates, displayTime, DAY_NAMES]);

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
