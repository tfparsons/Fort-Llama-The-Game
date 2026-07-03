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
import { TechTreeEditor } from './components/devtools/TechTreeEditor';
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

  const updateBudgetConfig = (itemKey, field, value) => {
    setEditConfig(prev => ({
      ...prev,
      budgetConfig: {
        ...prev.budgetConfig,
        [itemKey]: { ...prev.budgetConfig?.[itemKey], [field]: value }
      }
    }));
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
        <div className="dev-tools" style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <div className="dev-tools-header">
            <h2>Developer Tools</h2>
            <div className="dev-tools-buttons">
              <button className="manage-llamas-btn" onClick={handleOpenLlamaPoolEditor}>
                Manage Llamas
              </button>
              <button className="manage-llamas-btn" onClick={handleOpenBuildingsEditor}>
                Manage Buildings
              </button>
              <button className="save-defaults-button" onClick={handleSaveDefaults}>
                Save as Defaults
              </button>
              <button className="apply-button" onClick={handleApplyConfig}>
                Apply & Reset
              </button>
            </div>
          </div>

          <h3 className="section-divider">Basic Settings</h3>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Starting Values</h3>
              <div className="config-field">
                <label>Treasury (£)</label>
                <input type="number" value={editConfig.startingTreasury} onChange={(e) => updateEditConfig('startingTreasury', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Residents</label>
                <input type="number" value={editConfig.startingResidents} onChange={(e) => updateEditConfig('startingResidents', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Builds / Week</label>
                <input type="number" min="1" value={editConfig.buildsPerWeek ?? 1} onChange={(e) => updateEditConfig('buildsPerWeek', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Policy Changes / Week</label>
                <input type="number" min="1" value={editConfig.policyChangesPerWeek ?? 1} onChange={(e) => updateEditConfig('policyChangesPerWeek', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Research Actions / Week</label>
                <input type="number" min="1" value={editConfig.researchActionsPerWeek ?? 1} onChange={(e) => updateEditConfig('researchActionsPerWeek', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Ground Rent (£/wk)</label>
                <input type="number" value={editConfig.groundRentBase} onChange={(e) => updateEditConfig('groundRentBase', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Utilities (£/wk)</label>
                <input type="number" value={editConfig.utilitiesBase} onChange={(e) => updateEditConfig('utilitiesBase', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Game Over (£)</label>
                <input type="number" value={editConfig.gameOverLimit} onChange={(e) => updateEditConfig('gameOverLimit', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Rent & Churn</h3>
              <div className="config-field">
                <label>Min (£)</label>
                <input type="number" value={editConfig.rentMin} onChange={(e) => updateEditConfig('rentMin', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Max (£)</label>
                <input type="number" value={editConfig.rentMax} onChange={(e) => updateEditConfig('rentMax', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Default (£)</label>
                <input type="number" value={editConfig.defaultRent} onChange={(e) => updateEditConfig('defaultRent', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Base Churn</label>
                <input type="number" step="0.01" value={editConfig.baseChurnRate} onChange={(e) => updateEditConfig('baseChurnRate', e.target.value)} />
              </div>
              <div className="config-field">
                <label title="How much each £ of rent adds to churn rate. At 0.0003, charging £100 adds 3% to weekly churn.">Rent Impact</label>
                <input type="number" step="0.0001" value={editConfig.churnRentMultiplier} onChange={(e) => updateEditConfig('churnRentMultiplier', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Timing</h3>
              <div className="config-field">
                <label>Tick (ms)</label>
                <input type="number" value={editConfig.tickSpeed} onChange={(e) => updateEditConfig('tickSpeed', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Base Recruit Slots</label>
                <input type="number" value={editConfig?.health?.baseRecruitSlots ?? 1} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, baseRecruitSlots: parseInt(e.target.value)}})} />
              </div>
            </div>

          </div>


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

          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Scoring</h3>
              <p style={{color: T.textSecondary, fontSize: '0.7rem', marginBottom: '8px', lineHeight: '1.5'}}>
                Weekly points are calculated each week-end:
              </p>
              <div style={{background: 'rgba(212,160,53,0.10)', padding: '8px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#D4A035'}}>
                pts = floor(vibes × popScale × harmony × scale)
              </div>
              <div style={{fontSize: '0.7rem', color: T.textSecondary, lineHeight: '1.6', marginBottom: '10px'}}>
                <div><strong style={{color: '#e2ddd4'}}>vibes</strong> — overall vibes score (0–100)</div>
                <div><strong style={{color: '#e2ddd4'}}>popScale</strong> — multiplier from population bracket lookup</div>
                <div><strong style={{color: '#e2ddd4'}}>harmony</strong> = harmonyFloor + harmonyWeight × (min/max health metric)</div>
                <div style={{marginLeft: '12px', color: '#6a6866'}}>Rewards balanced LS/PR/PT; ranges {(editConfig?.scoreConfig?.weeklyFormula?.harmonyFloor ?? 0.7).toFixed(1)}–{((editConfig?.scoreConfig?.weeklyFormula?.harmonyFloor ?? 0.7) + (editConfig?.scoreConfig?.weeklyFormula?.harmonyWeight ?? 0.3)).toFixed(1)}</div>
                <div><strong style={{color: '#e2ddd4'}}>scale</strong> — global multiplier for point values</div>
              </div>
              <div style={{borderTop: `1px solid ${T.panelBorder}`, paddingTop: '8px'}}>
                <div style={{fontSize: '0.7rem', color: T.textSecondary, marginBottom: '6px'}}>Formula parameters</div>
                {[
                  { field: 'scale', label: 'Scale', step: 1, def: 10 },
                  { field: 'harmonyFloor', label: 'Harmony floor', step: 0.05, def: 0.7 },
                  { field: 'harmonyWeight', label: 'Harmony weight', step: 0.05, def: 0.3 }
                ].map(p => (
                  <div key={p.field} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <label style={{flex: 1}}>{p.label}</label>
                    <input type="number" step={p.step} style={{width: '70px'}} value={editConfig?.scoreConfig?.weeklyFormula?.[p.field] ?? p.def} onChange={(e) => {
                      setEditConfig(prev => ({
                        ...prev,
                        scoreConfig: {
                          ...prev.scoreConfig,
                          weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), [p.field]: parseFloat(e.target.value) }
                        }
                      }));
                    }} />
                  </div>
                ))}
                <div style={{fontSize: '0.7rem', color: T.textSecondary, marginTop: '8px', marginBottom: '4px'}}>Population scale brackets</div>
                {(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [
                  { maxN: 4, mult: 1.0 }, { maxN: 8, mult: 1.5 }, { maxN: 12, mult: 2.0 }, { maxN: Infinity, mult: 3.0 }
                ]).map((b, i) => (
                  <div key={i} className="config-field" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <label style={{flex: 1}}>≤ {b.maxN === Infinity || b.maxN === null ? '∞' : (
                      <input type="number" step="1" min="1" style={{width: '50px', display: 'inline'}} value={b.maxN} onChange={(e) => {
                        const brackets = [...(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [])];
                        brackets[i] = { ...brackets[i], maxN: parseInt(e.target.value) || 1 };
                        setEditConfig(prev => ({
                          ...prev,
                          scoreConfig: {
                            ...prev.scoreConfig,
                            weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), popScaleBrackets: brackets }
                          }
                        }));
                      }} />
                    )} residents</label>
                    <input type="number" step="0.1" min="0.1" style={{width: '70px'}} value={b.mult} onChange={(e) => {
                      const brackets = [...(editConfig?.scoreConfig?.weeklyFormula?.popScaleBrackets || [])];
                      brackets[i] = { ...brackets[i], mult: parseFloat(e.target.value) || 0.1 };
                      setEditConfig(prev => ({
                        ...prev,
                        scoreConfig: {
                          ...prev.scoreConfig,
                          weeklyFormula: { ...(prev.scoreConfig?.weeklyFormula || {}), popScaleBrackets: brackets }
                        }
                      }));
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="config-section" style={{gridColumn: 'span 2', display: 'flex', flexDirection: 'column', maxHeight: '520px'}}>
              <h3 style={{flexShrink: 0}}>Milestones</h3>
              <div style={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem'}}>
                <thead>
                  <tr style={{borderBottom: `1px solid ${T.panelBorder}`, fontSize: '0.7rem', color: T.textSecondary}}>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px 0', fontWeight: 400}}>Badge</th>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px', fontWeight: 400}}>Category</th>
                    <th style={{textAlign: 'left', padding: '2px 8px 4px', fontWeight: 400}}>Condition</th>
                    <th style={{textAlign: 'right', padding: '2px 8px 4px', fontWeight: 400}}>Points</th>
                    <th style={{textAlign: 'left', padding: '2px 0 4px 8px', fontWeight: 400}}>Flavour</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const earned = new Set((gameState.scoring?.earnedMilestones || []).map(m => m.id));
                    const allDefs = gameState.milestoneDefinitions || [];
                    return allDefs.filter(m => !earned.has(m.id)).map(m => {
                      const c = m.condition || {};
                      let condStr = c.type || '';
                      if (c.min !== undefined) condStr += ` ≥ ${c.min}`;
                      if (c.name) condStr += `: ${c.name}`;
                      if (c.label) condStr += `: ${c.label}`;
                      if (c.techId) condStr += `: ${c.techId}`;
                      if (c.any) condStr += ' (any)';
                      if (c.id) condStr += `: ${c.id}`;
                      return (
                        <tr key={m.id} style={{borderBottom: `1px solid ${T.panelBorder}`}}>
                          <td style={{padding: '4px 8px 4px 0', whiteSpace: 'nowrap'}}>{m.badgeName}</td>
                          <td style={{padding: '4px 8px', color: T.textSecondary, fontSize: '0.75rem'}}>{m.category}</td>
                          <td style={{padding: '4px 8px', color: T.textMuted, fontSize: '0.7rem', fontFamily: 'monospace'}}>{condStr}</td>
                          <td style={{padding: '4px 8px', textAlign: 'right', color: T.accentBright}}>{m.points}</td>
                          <td style={{padding: '4px 0 4px 8px', color: T.textMuted, fontSize: '0.75rem'}}>{m.flavour}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          <TechTreeEditor
            techTree={gameState.techTree}
            buildings={gameState.buildings}
            techConfig={editConfig?.techConfig}
            onUpdateTechConfig={updateTechConfig}
          />


        </div>
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
