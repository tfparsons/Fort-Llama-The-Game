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
  const [narrowTab, setNarrowTab] = useState('actions');
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildConfirm, setBuildConfirm] = useState(null);
  const [buildComplete, setBuildComplete] = useState(null);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyConfirm, setPolicyConfirm] = useState(null);
  const [policyComplete, setPolicyComplete] = useState(null);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showTechTreeModal, setShowTechTreeModal] = useState(false);
  const [techConfirm, setTechConfirm] = useState(null);
  const [techComplete, setTechComplete] = useState(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [showLlamaPoolEditor, setShowLlamaPoolEditor] = useState(false);
  const [showBuildingsEditor, setShowBuildingsEditor] = useState(false);
  const [editableLlamas, setEditableLlamas] = useState([]);
  const [editableBuildings, setEditableBuildings] = useState([]);
  const [recruitCandidates, setRecruitCandidates] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rentInput, setRentInput] = useState('');
  const [hoveredResident, setHoveredResident] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [infoPopup, setInfoPopup] = useState(null);
  const [budgetInputs, setBudgetInputs] = useState({
    nutrition: 0, cleanliness: 0, maintenance: 0,
    fatigue: 0, fun: 0, drive: 0
  });
  const budgetSyncedWeek = useRef(null);
  const [budgetViewedThisWeek, setBudgetViewedThisWeek] = useState(false);
  const budgetViewedWeekRef = useRef(null);
  
  const [displayTime, setDisplayTime] = useState({ hour: 9, minute: 0, dayIndex: 0 });
  const clockAnimationRef = useRef(null);
  const clockStartRef = useRef({ hour: 9, day: 1, realStartTime: Date.now(), synced: false });
  const wasPausedRef = useRef(true);
  
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [expandedPrimitives, setExpandedPrimitives] = useState({});
  const techTreeContainerRef = useRef(null);
  const [techConnectors, setTechConnectors] = useState({});
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
  const showWeeklyPanel = gameState != null && !gameState?.isGameOver;

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
      if (budgetViewedWeekRef.current !== gameState.week) {
        budgetViewedWeekRef.current = gameState.week;
        setBudgetViewedThisWeek(false);
        setRecruitedInfo(null);
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

  const measureTechTree = useCallback(() => {
    const container = techTreeContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const newConnectors = {};
      container.querySelectorAll('[data-tree-name]').forEach(treeEl => {
        const treeName = treeEl.dataset.treeName;
        const treeRect = treeEl.getBoundingClientRect();
        const cards = treeEl.querySelectorAll('[data-tech-id]');
        const rects = {};
        cards.forEach(card => {
          const r = card.getBoundingClientRect();
          rects[card.dataset.techId] = {
            left: r.left - treeRect.left,
            right: r.right - treeRect.left,
            midY: (r.top + r.bottom) / 2 - treeRect.top,
          };
        });
        const paths = [];
        const root = treeEl.querySelector('[data-tech-level="1"]');
        const l2s = treeEl.querySelectorAll('[data-tech-level="2"]');
        if (root) {
          const rootR = rects[root.dataset.techId];
          if (rootR) {
            l2s.forEach(l2El => {
              const l2R = rects[l2El.dataset.techId];
              if (l2R) {
                const midX = (rootR.right + l2R.left) / 2;
                paths.push(`M ${rootR.right} ${rootR.midY} L ${midX} ${rootR.midY} L ${midX} ${l2R.midY} L ${l2R.left} ${l2R.midY}`);
              }
            });
          }
        }
        l2s.forEach(l2El => {
          const l2Id = l2El.dataset.techId;
          const l2R = rects[l2Id];
          if (!l2R) return;
          const children = treeEl.querySelectorAll(`[data-tech-parent="${l2Id}"]`);
          children.forEach(l3El => {
            const l3R = rects[l3El.dataset.techId];
            if (l3R) {
              const midX = (l2R.right + l3R.left) / 2;
              paths.push(`M ${l2R.right} ${l2R.midY} L ${midX} ${l2R.midY} L ${midX} ${l3R.midY} L ${l3R.left} ${l3R.midY}`);
            }
          });
        });
        newConnectors[treeName] = { paths, width: treeRect.width, height: treeRect.height };
      });
      setTechConnectors(newConnectors);
    });
  }, []);

  useEffect(() => {
    if (view !== 'devtools' || !techTreeContainerRef.current) return;
    const timer = setTimeout(measureTechTree, 100);
    const container = techTreeContainerRef.current;
    const ro = new ResizeObserver(() => measureTechTree());
    if (container) ro.observe(container);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [view, editConfig, gameState, measureTechTree]);

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

  const handleRentSliderChange = (e) => {
    setRentInput(e.target.value);
  };

  const handleRentSliderRelease = () => {
    handleSetRent(rentInput);
  };

  const handleBudgetChange = (key, value) => {
    const numValue = Math.min(500, Math.max(0, Math.round(Number(value) / 10) * 10));
    setBudgetInputs(prev => ({ ...prev, [key]: numValue }));
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

  const handleBudgetInputBlur = (key, rawValue) => {
    const num = parseInt(rawValue, 10);
    const snapped = isNaN(num) ? 0 : Math.min(500, Math.max(0, Math.round(num / 10) * 10));
    const newBudgets = { ...budgetInputs, [key]: snapped };
    setBudgetInputs(newBudgets);
    commitBudgets(newBudgets);
  };

  const handleBudgetInputKey = (key, e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleOpenRecruitment = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recruitment-candidates`);
      const data = await res.json();
      setRecruitCandidates(data.candidates || []);
      setShowRecruitModal(true);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  const [recruitedInfo, setRecruitedInfo] = useState(null);

  const handleInvite = async (llamaId) => {
    try {
      const res = await fetch(`${API_BASE}/api/action/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llamaId })
      });
      const data = await res.json();
      if (data.success) {
        const llama = recruitCandidates.find(c => c.id === llamaId);
        const rejected = recruitCandidates.filter(c => c.id !== llamaId);
        setRecruitedInfo({
          name: data.invited,
          arrivalDayName: data.arrivalDayName,
          llama,
          rejected
        });
        fetchState();
      }
    } catch (err) {
      console.error('Failed to invite:', err);
    }
  };

  const handlePassRecruitment = () => {
    setShowRecruitModal(false);
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
    setBuildConfirm(null);
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

  const handleBuildBedroom = async () => {
    await handleBuild('bedroom');
    setShowBuildModal(false);
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
      setPolicyConfirm(null);
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
    } else {
      setTechConfirm(null);
      setShowTechModal(false);
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

  const handleToggleFixedCost = async (fixedCostId) => {
    const res = await fetch(`${API_BASE}/api/action/toggle-fixed-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixedCostId })
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
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
      // ActionPanel
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
      // DataPanel
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

  const formatCurrency = (val) => {
    const num = val ?? 0;
    const prefix = num < 0 ? '-£' : '£';
    return `${prefix}${Math.abs(Math.round(num)).toLocaleString()}`;
  };

  const projectedIncome = gameState.projectedIncome ?? (gameState.residents * gameState.currentRent);
  const projectedGroundRent = gameState.projectedGroundRent ?? config.groundRentBase;
  const projectedUtilities = gameState.projectedUtilities ?? config.utilitiesBase;
  const projectedBudget = gameState.projectedBudget ?? Object.values(budgetInputs).reduce((s, v) => s + v, 0);
  const weeklyDelta = gameState.weeklyDelta ?? (projectedIncome - projectedGroundRent - projectedUtilities - projectedBudget);

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
        narrowTab={narrowTab}
        onNarrowTab={setNarrowTab}
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

          <div className="dev-tools-grid">
            <div className="config-section" style={{gridColumn: '1 / -1'}}>
              <h3>Tech Tree Configuration</h3>
              <p style={{color: T.textSecondary, fontSize: '0.75rem', marginBottom: '8px'}}>Configure research costs and effects for each technology. Changes apply on Reset.</p>
              <div ref={techTreeContainerRef}>
              {['livingStandards', 'productivity', 'fun'].map(treeName => {
                const treeLabel = TREE_LABELS[treeName] || treeName;
                const treeColor = TREE_COLORS[treeName] || T.textMuted;
                const treeTechs = (gameState.techTree || []).filter(t => t.tree === treeName);
                return (
                  <div key={treeName} data-tree-name={treeName} style={{marginBottom: '16px', position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: `2px solid ${treeColor}33`, paddingBottom: '4px'}}>
                      <span style={{background: treeColor, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block'}}></span>
                      <span style={{color: treeColor, fontWeight: 600, fontSize: '0.85rem'}}>{treeLabel}</span>
                    </div>
                    {(() => {
                      const l1 = treeTechs.filter(t => t.level === 1);
                      const l2 = treeTechs.filter(t => t.level === 2);
                      const l3 = treeTechs.filter(t => t.level === 3);
                      const renderDevTechNode = (tech) => {
                        const cfg = editConfig?.techConfig?.[tech.id] || {};
                        const updateTechCfg = (field, value) => {
                          setEditConfig(prev => ({
                            ...prev,
                            techConfig: {
                              ...prev.techConfig,
                              [tech.id]: { ...(prev.techConfig?.[tech.id] || {}), [field]: value }
                            }
                          }));
                        };
                        const unlockedBuilding = (gameState.buildings || []).find(b => b.techRequired === tech.id);
                        return (
                          <div key={tech.id} data-tech-id={tech.id} data-tech-level={tech.level} data-tech-parent={tech.parent || ''} style={{background: T.panelBg, borderRadius: '6px', padding: '8px 10px', border: `1px solid ${tech.available ? treeColor + '44' : T.panelBorder + '33'}`}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                              <span style={{fontWeight: 600, fontSize: '0.8rem', color: tech.available ? T.textPrimary : T.textMuted}}>{tech.name}</span>
                              <span style={{fontSize: '0.6rem', background: treeColor + '22', color: treeColor, padding: '1px 6px', borderRadius: '4px', textTransform: 'capitalize'}}>{tech.type.replace('_', ' ')}</span>
                            </div>
                            {unlockedBuilding && <div style={{fontSize: '0.65rem', color: T.accentBright, marginBottom: '4px'}}>Unlocks: {unlockedBuilding.name}</div>}
                            {!unlockedBuilding && (tech.type === 'building' || tech.type === 'upgrade') && <div style={{fontSize: '0.65rem', color: T.textMuted, marginBottom: '4px'}}>Building: TBC</div>}
                            {!tech.available && <div style={{fontSize: '0.65rem', color: T.textMuted, marginBottom: '6px'}}>Coming Soon</div>}
                            <div className="config-field" style={{marginBottom: '4px'}}>
                              <label style={{fontSize: '0.7rem'}}>Cost</label>
                              <input type="number" step="100" min="0"
                                value={cfg.cost ?? 500}
                                onChange={(e) => updateTechCfg('cost', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            {tech.type === 'fixed_expense' && (
                              <>
                                <div className="config-field" style={{marginBottom: '4px'}}>
                                  <label style={{fontSize: '0.7rem'}}>Weekly Cost</label>
                                  <input type="number" step="10" min="0"
                                    value={cfg.weeklyCost ?? 0}
                                    onChange={(e) => updateTechCfg('weeklyCost', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="config-field" style={{marginBottom: '0'}}>
                                  <label style={{fontSize: '0.7rem'}}>Effect %</label>
                                  <input type="number" step="1" min="0"
                                    value={cfg.effectPercent ?? 0}
                                    onChange={(e) => updateTechCfg('effectPercent', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </>
                            )}
                            {tech.type === 'policy' && tech.id === 'ocado' && (
                              <div className="config-field" style={{marginBottom: '0'}}>
                                <label style={{fontSize: '0.7rem'}}>Effect %</label>
                                <input type="number" step="1" min="0"
                                  value={cfg.effectPercent ?? 15}
                                  onChange={(e) => updateTechCfg('effectPercent', parseInt(e.target.value) || 0)}
                                />
                              </div>
                            )}
                            {tech.type === 'upgrade' && tech.id === 'great_hall' && (
                              <div style={{fontSize: '0.65rem', color: T.textMuted, marginTop: '4px'}}>
                                Stats editable in Manage Buildings
                              </div>
                            )}
                          </div>
                        );
                      };
                      const root = l1[0];
                      const branches = l2.map(l2tech => ({
                        tech: l2tech,
                        children: l3.filter(l3tech => l3tech.parent === l2tech.id)
                      }));
                      return (
                        <div style={{display: 'flex', gap: '32px', alignItems: 'flex-start'}}>
                          <div style={{flex: 1}}>
                            {root && renderDevTechNode(root)}
                          </div>
                          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {branches.map(branch => (
                              <div key={branch.tech.id}>{renderDevTechNode(branch.tech)}</div>
                            ))}
                          </div>
                          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {branches.map(branch => (
                              <div key={branch.tech.id} style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                {branch.children.map(l3tech => renderDevTechNode(l3tech))}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {techConnectors[treeName] && (
                      <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible'}}
                        viewBox={`0 0 ${techConnectors[treeName].width} ${techConnectors[treeName].height}`}
                        preserveAspectRatio="none">
                        {techConnectors[treeName].paths.map((d, i) => (
                          <path key={i} d={d} fill="none" stroke={T.panelBorder} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        ))}
                      </svg>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>


        </div>
      )}

      {infoPopup && (
        <div className="modal-overlay" onClick={() => setInfoPopup(null)}>
          <div className="info-popup-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setInfoPopup(null)}>×</button>
            {infoPopup === 'livingStandards' && (
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
                    <li><strong>Kitchen</strong> - Quality & foodMult affect Nutrition throughput</li>
                    <li><strong>Bathroom</strong> - Count, quality & cleanMult affect Cleanliness recovery</li>
                    <li><strong>All rooms</strong> - Crowding = max ratio across Bedroom/Bathroom/Kitchen/Living Room</li>
                    <li><strong>Utility Closet</strong> - Quality & repairMult affect Maintenance recovery</li>
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
            )}
            {infoPopup === 'productivity' && (
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
                    <li><strong>Bedroom</strong> - Quality & recoveryMult affect Fatigue recovery</li>
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
            )}
            {infoPopup === 'partytime' && (
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
                    <li><strong>Living Room</strong> - Quality & funMult directly affect Fun; capacity affects crowd factor</li>
                    <li><strong>Bedroom</strong> - Quality & recoveryMult affect Fatigue recovery</li>
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
            )}
          </div>
        </div>
      )}

      {showBuildModal && (
        <div className="modal-overlay" onClick={() => setShowBuildModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Build</h2>
              <span style={{background: (gameState.buildsThisWeek || 0) >= (gameState.config?.buildsPerWeek ?? 1) ? T.negative : T.panelBorder, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600}}>
                {Math.max(0, (gameState.config?.buildsPerWeek ?? 1) - (gameState.buildsThisWeek || 0))} remaining
              </span>
            </div>
            {(gameState.buildsThisWeek || 0) >= (gameState.config?.buildsPerWeek ?? 1) && (
              <p style={{color: T.negative, fontSize: '0.85rem', marginBottom: '8px'}}>Build limit reached for this week.</p>
            )}
            {gameState.buildings?.filter(b => b.buildable && b.cost !== null && (!b.techRequired || gameState.researchedTechs?.includes(b.techRequired))).map(building => (
              <div key={building.id} className="building-card">
                <h3>{building.name.replace(/s$/, '')}</h3>
                <div className="building-stats">
                  <div>Cost: £{building.cost?.toLocaleString()}</div>
                  <div>Capacity: {building.capacity} residents</div>
                  {building.funOutput != null && (
                    <div>Fun Output: {building.funOutput}</div>
                  )}
                  {building.groundRentMultiplier !== null && (
                    <div>Ground Rent: +{(building.groundRentMultiplier * 100).toFixed(0)}%</div>
                  )}
                  {building.utilitiesMultiplier !== null && (
                    <div>Utilities: +{(building.utilitiesMultiplier * 100).toFixed(0)}%</div>
                  )}
                  <div>Current: {building.count}</div>
                  {building.id === 'living_room' && gameState.researchedTechs?.includes('great_hall') && (() => {
                    const gh = gameState.buildings?.find(b => b.id === 'great_hall');
                    if (!gh) return null;
                    return (
                      <div style={{marginTop: '4px', padding: '3px 6px', background: T.pr + '33', borderRadius: '4px', fontSize: '0.75rem', color: T.pr}}>
                        Great Hall: Cap {gh.capacity}, Fun x{gh.funMult ?? 1.3}, Drive x{gh.driveMult ?? 1.2}
                      </div>
                    );
                  })()}
                </div>
                <button 
                  className="action-button"
                  onClick={() => setBuildConfirm(building)}
                  disabled={gameState.treasury - building.cost < (gameState.config?.gameOverLimit ?? -5000) || (gameState.buildsThisWeek || 0) >= (gameState.config?.buildsPerWeek ?? 1)}
                >
                  {(gameState.buildsThisWeek || 0) >= (gameState.config?.buildsPerWeek ?? 1) ? 'Limit reached' : gameState.treasury - building.cost < (gameState.config?.gameOverLimit ?? -5000) ? 'Debt limit' : 'Build'}
                </button>
              </div>
            ))}
            <button className="modal-close" onClick={() => { setShowBuildModal(false); setBuildConfirm(null); }}>
              Close
            </button>
          </div>
        </div>
      )}

      {buildConfirm && (
        <div className="modal-overlay" onClick={() => setBuildConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '360px'}}>
            <h2>Confirm Build</h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              Build a new <span style={{color: T.positive, fontWeight: 600}}>{buildConfirm.name}</span>?
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Cost</span>
                <span style={{color: T.negative}}>-£{buildConfirm.cost?.toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Treasury after</span>
                <span style={{color: T.textPrimary}}>£{(gameState.treasury - (buildConfirm.cost || 0)).toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>New count</span>
                <span style={{color: T.textPrimary}}>{(buildConfirm.count || 0) + 1}</span>
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="action-button" style={{flex: 1}} onClick={() => handleBuild(buildConfirm.id)}>
                Confirm
              </button>
              <button className="modal-close" style={{flex: 1}} onClick={() => setBuildConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {buildComplete && (
        <div className="modal-overlay" onClick={() => setBuildComplete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '360px', textAlign: 'center'}}>
            <div style={{fontSize: '2rem', marginBottom: '8px'}}>&#127959;</div>
            <h2 style={{color: T.positive}}>Building Complete</h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              New <span style={{fontWeight: 600}}>{buildComplete.name}</span> built successfully.
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Total {buildComplete.name}</span>
                <span style={{color: T.textPrimary}}>{buildComplete.count}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Cost</span>
                <span style={{color: T.negative}}>-£{buildComplete.cost?.toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>Total Capacity</span>
                <span style={{color: T.positive}}>{buildComplete.capacity}</span>
              </div>
            </div>
            <button className="action-button" onClick={() => setBuildComplete(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {showPolicyModal && (() => {
        const policyLimitActive = (gameState.policiesStableWeeks || 0) >= 1 && (gameState.previousPolicies?.length || 0) >= 3;
        const maxChanges = gameState.config?.policyChangesPerWeek ?? 1;
        const changesUsed = gameState.policyChangesThisWeek || 0;
        const changesRemaining = Math.max(0, maxChanges - changesUsed);
        const changeLimitReached = policyLimitActive && changesUsed >= maxChanges;
        return (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Policies</h2>
              <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                {policyLimitActive && (
                  <span style={{background: changeLimitReached ? T.negative : T.panelBorder, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem'}}>
                    {changesRemaining} change{changesRemaining !== 1 ? 's' : ''} left
                  </span>
                )}
                <span style={{background: (gameState.activePolicies?.length || 0) > 3 ? T.negative : T.panelBorder, color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600}}>
                  {gameState.activePolicies?.length || 0} / 3
                </span>
              </div>
            </div>
            <p style={{color: T.textSecondary, fontSize: '0.85rem', marginBottom: '12px'}}>
              Toggle policies to improve your commune. More than 3 active policies will reduce Fun.
            </p>
            {changeLimitReached && (
              <p style={{color: T.negative, fontSize: '0.8rem', marginBottom: '8px'}}>Policy change limit reached for this week.</p>
            )}
            <div className="policy-list">
              {(gameState.policyDefinitions || []).filter(policy => !policy.techRequired || gameState.researchedTechs?.includes(policy.techRequired)).length === 0 && (
                <p style={{color: T.textSecondary, fontSize: '0.85rem', textAlign: 'center', padding: '20px 0'}}>Research Technologies to unlock Policies for the Fort.</p>
              )}
              {(gameState.policyDefinitions || []).filter(policy => !policy.techRequired || gameState.researchedTechs?.includes(policy.techRequired)).map(policy => {
                const isActive = (gameState.activePolicies || []).includes(policy.id);
                const ocadoPct = gameState.techConfig?.ocado?.effectPercent || 15;
                let desc = policy.description.replace('{ocadoPct}', ocadoPct);
                return (
                  <div key={policy.id} className={`policy-card ${isActive ? 'active' : ''}`}>
                    <div className="policy-header">
                      <h3>{policy.name}</h3>
                      <span className="policy-primitive">{policy.primitive}</span>
                    </div>
                    <p className="policy-desc">{desc}</p>
                    <button 
                      className={`policy-toggle ${isActive ? 'active' : ''}`}
                      onClick={() => setPolicyConfirm({...policy, isActive, desc})}
                      disabled={changeLimitReached}
                    >
                      {changeLimitReached ? 'Limit reached' : isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="modal-close" onClick={() => setShowPolicyModal(false)}>
              Close
            </button>
          </div>
        </div>
        );
      })()}

      {policyConfirm && (
        <div className="modal-overlay" onClick={() => setPolicyConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '360px'}}>
            <h2>Confirm Policy Change</h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              {policyConfirm.isActive ? 'Deactivate' : 'Activate'} <span style={{color: T.positive, fontWeight: 600}}>{policyConfirm.name}</span>?
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Policy</span>
                <span style={{color: T.textPrimary}}>{policyConfirm.name}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Affects</span>
                <span style={{color: T.textPrimary, textTransform: 'capitalize'}}>{policyConfirm.primitive}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>Action</span>
                <span style={{color: policyConfirm.isActive ? T.negative : T.positive}}>{policyConfirm.isActive ? 'Deactivate' : 'Activate'}</span>
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="action-button" style={{flex: 1}} onClick={() => handleTogglePolicy(policyConfirm.id)}>
                Confirm
              </button>
              <button className="modal-close" style={{flex: 1}} onClick={() => setPolicyConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {policyComplete && (
        <div className="modal-overlay" onClick={() => setPolicyComplete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '360px', textAlign: 'center'}}>
            <div style={{fontSize: '2rem', marginBottom: '8px'}}>{policyComplete.action === 'activated' ? '\u2705' : '\u274C'}</div>
            <h2 style={{color: policyComplete.action === 'activated' ? T.positive : T.negative}}>
              Policy {policyComplete.action === 'activated' ? 'Activated' : 'Deactivated'}
            </h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              <span style={{fontWeight: 600}}>{policyComplete.name}</span> has been {policyComplete.action}.
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'left'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>Affects</span>
                <span style={{color: T.textPrimary, textTransform: 'capitalize'}}>{policyComplete.primitive}</span>
              </div>
            </div>
            <button className="action-button" onClick={() => setPolicyComplete(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {showTechModal && (
        <div className="modal-overlay" onClick={() => setShowTechModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h2 style={{margin: 0}}>Technology Research</h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowTechModal(false); setShowTechTreeModal(true); }}
                style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: T.bg, border: `1px solid ${T.panelBorder}`, borderRadius: '6px', color: T.textSecondary, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s ease'}}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.panelBorder; e.currentTarget.style.color = T.textSecondary; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="22" x2="12" y2="8"/><polyline points="8 12 12 8 16 12"/><path d="M12 8a4 4 0 0 0-4-4H4"/><path d="M12 8a4 4 0 0 1 4-4h4"/><line x1="4" y1="2" x2="4" y2="4"/><line x1="20" y1="2" x2="20" y2="4"/></svg>
                Tech Tree
              </button>
            </div>
            {gameState.researchingTech && (() => {
              const rTech = (gameState.techTree || []).find(t => t.id === gameState.researchingTech);
              const rCfg = gameState.techConfig?.[gameState.researchingTech] || {};
              const rTreeColor = rTech?.tree === 'livingStandards' ? T.ls : rTech?.tree === 'productivity' ? T.pr : T.pt;
              return (
                <div style={{background: T.panelBg + '80', borderRadius: '8px', padding: '12px', marginBottom: '12px', borderLeft: `4px solid ${rTreeColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{fontSize: '1.2rem', animation: 'spin 2s linear infinite'}}>&#9881;</div>
                    <div>
                      <div style={{color: T.textPrimary, fontWeight: 600}}>{rTech?.name}</div>
                      <div style={{color: rTreeColor, fontSize: '0.75rem'}}>Researching... completes next week</div>
                    </div>
                  </div>
                  <button className="modal-close" style={{width: 'auto', padding: '4px 12px', fontSize: '0.75rem'}} onClick={handleCancelResearch}>Cancel</button>
                </div>
              );
            })()}
            {['livingStandards', 'productivity', 'fun'].map(treeName => {
              const treeColor = treeName === 'livingStandards' ? T.ls : treeName === 'productivity' ? T.pr : T.pt;
              const treeTechs = (gameState.techTree || []).filter(t => t.tree === treeName);
              const availableTechs = treeTechs.filter(t => {
                if (gameState.researchedTechs?.includes(t.id)) return false;
                if (!t.available) return false;
                if (t.parent && !gameState.researchedTechs?.includes(t.parent)) return false;
                return true;
              });
              const isResearching = !!gameState.researchingTech;
              
              return (
                <div key={treeName} style={{marginBottom: '8px'}}>
                  {availableTechs.length === 0 ? null : (
                    availableTechs.map(tech => {
                      const cfg = gameState.techConfig?.[tech.id] || {};
                      const cost = cfg.cost || 500;
                      const canAfford = gameState.treasury - cost >= (gameState.config?.gameOverLimit ?? -5000);
                      const isThisResearching = gameState.researchingTech === tech.id;
                      const typeLabel = tech.type === 'fixed_expense' ? 'Fixed Cost' : tech.type === 'building' ? 'Building' : tech.type === 'culture' ? 'Culture' : tech.type === 'upgrade' ? 'Upgrade' : 'Policy';
                      let effectText = '';
                      if (tech.type === 'fixed_expense') effectText = `+${cfg.effectPercent || 0}% boost, £${cfg.weeklyCost || 0}/wk`;
                      else if (tech.type === 'policy') effectText = tech.id === 'chores_rota' ? `+${cfg.effectPercent || 15}% cleanliness & maintenance + unlocks rotas` : tech.id === 'ocado' ? `+${cfg.effectPercent || 0}% ingredient efficiency` : tech.description;
                      else if (tech.type === 'building') effectText = tech.id === 'blanket_fort' ? 'Unlocks Heaven building' : tech.id === 'outdoor_plumbing' ? 'Unlocks Hot Tub building' : tech.description;
                      else if (tech.type === 'upgrade') effectText = 'Living Room upgrade (see Buildings)';
                      else if (tech.type === 'culture') effectText = tech.id === 'wellness' ? `+${cfg.effectPercent || 20}% fatigue recovery` : 'Unlocks next level technologies';
                      
                      if (isThisResearching) return null;
                      
                      return (
                        <div key={tech.id} style={{background: T.panelBg, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${treeColor}`, opacity: isResearching ? 0.4 : 1, pointerEvents: isResearching ? 'none' : 'auto'}}>
                          <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span style={{fontWeight: 600, color: T.textPrimary}}>{tech.name}</span>
                              <span style={{fontSize: '0.65rem', background: treeColor + '33', color: treeColor, padding: '1px 6px', borderRadius: '4px'}}>{typeLabel}</span>
                            </div>
                            <div style={{color: T.textSecondary, fontSize: '0.75rem', marginTop: '2px'}}>{effectText}</div>
                          </div>
                          <button
                            className="action-button"
                            style={{marginLeft: '10px', width: '80px', textAlign: 'center', flexShrink: 0, opacity: (!canAfford || isResearching) ? 0.5 : 1}}
                            disabled={!canAfford || isResearching}
                            onClick={() => setTechConfirm({...tech, cost, treeColor, effectText, typeLabel})}
                          >
                            £{cost.toLocaleString()}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
            <button className="modal-close" onClick={() => setShowTechModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showTechTreeModal && (
        <div className="modal-overlay" onClick={() => setShowTechTreeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Tech Tree</h2>
              <button className="modal-close-x" onClick={() => { setShowTechTreeModal(false); setShowTechModal(true); }}>×</button>
            </div>
            {['livingStandards', 'productivity', 'fun'].map(treeName => {
              const treeLabel = TREE_LABELS[treeName] || treeName;
              const treeColor = treeName === 'livingStandards' ? T.ls : treeName === 'productivity' ? T.pr : T.pt;
              const treeTechs = (gameState.techTree || []).filter(t => t.tree === treeName);
              const l1 = treeTechs.filter(t => t.level === 1);
              const l2 = treeTechs.filter(t => t.level === 2);
              const l3 = treeTechs.filter(t => t.level === 3);
              
              const isResearched = (id) => gameState.researchedTechs?.includes(id);
              const isDiscovered = (tech) => {
                if (isResearched(tech.id)) return true;
                if (!tech.parent) return true;
                return isResearched(tech.parent);
              };
              
              const renderTechNode = (tech) => {
                const researched = isResearched(tech.id);
                const isBeingResearched = gameState.researchingTech === tech.id;
                const discovered = isDiscovered(tech);
                const unavailable = !tech.available;
                const cfg = gameState.techConfig?.[tech.id] || {};
                const redacted = !researched && !discovered && !isBeingResearched;
                
                return (
                  <div key={tech.id} style={{
                    background: isBeingResearched ? T.panelBg + '80' : researched ? treeColor + '22' : T.bg,
                    border: `2px solid ${isBeingResearched ? T.accentBright : researched ? treeColor : discovered ? T.panelBorder : T.panelBorder + '44'}`,
                    borderLeft: `4px solid ${isBeingResearched ? T.accentBright : treeColor}${redacted ? '44' : ''}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    minWidth: '140px',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{filter: redacted ? 'blur(5px)' : 'none', userSelect: redacted ? 'none' : 'auto'}}>
                      <div style={{fontWeight: 600, fontSize: '0.8rem', color: isBeingResearched ? T.accentBright : researched ? treeColor : T.textPrimary}}>{tech.name}</div>
                      <div style={{fontSize: '0.65rem', color: T.textSecondary, textTransform: 'capitalize'}}>{tech.type.replace('_', ' ')}</div>
                    </div>
                    {isBeingResearched && (
                      <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px'}}>
                        <span style={{fontSize: '0.65rem', display: 'inline-block', animation: 'spin 2s linear infinite'}}>&#9881;</span>
                        <span style={{fontSize: '0.6rem', color: T.accentBright}}>Researching...</span>
                      </div>
                    )}
                    {researched && <div style={{fontSize: '0.6rem', color: treeColor, marginTop: '2px'}}>Researched</div>}
                    {redacted && <div style={{fontSize: '0.6rem', color: T.textMuted, marginTop: '2px'}}>???</div>}
                    {!researched && !isBeingResearched && !redacted && unavailable && <div style={{fontSize: '0.6rem', color: T.negative, marginTop: '2px'}}>Coming Soon</div>}
                    {!researched && !isBeingResearched && !redacted && !unavailable && discovered && <div style={{fontSize: '0.6rem', color: T.textSecondary, marginTop: '2px'}}>£{cfg.cost || 500}</div>}
                  </div>
                );
              };
              
              const root = l1[0];
              const children = l2.map(l2tech => ({
                tech: l2tech,
                children: l3.filter(l3tech => l3tech.parent === l2tech.id)
              }));
              
              return (
                <div key={treeName} style={{marginBottom: '24px'}}>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'stretch', paddingBottom: '8px'}}>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1}}>
                      {root && renderTechNode(root)}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', color: T.panelBorder, fontSize: '1rem'}}>
                      {children.length === 2 ? (
                        <svg width="24" height="80" viewBox="0 0 24 80" style={{flexShrink: 0}}>
                          <path d="M 0 40 L 12 40 L 12 15 L 24 15" fill="none" stroke={T.panelBorder} strokeWidth="2"/>
                          <path d="M 12 40 L 12 65 L 24 65" fill="none" stroke={T.panelBorder} strokeWidth="2"/>
                        </svg>
                      ) : <span>→</span>}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', flex: 1}}>
                      {children.map(branch => (
                        <div key={branch.tech.id}>{renderTechNode(branch.tech)}</div>
                      ))}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', flex: 1}}>
                      {children.map(branch => (
                        <div key={branch.tech.id} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <svg width="16" height={branch.children.length > 1 ? 70 : 30} viewBox={`0 0 16 ${branch.children.length > 1 ? 70 : 30}`} style={{flexShrink: 0}}>
                            {branch.children.length > 1 ? (
                              <>
                                <path d="M 0 35 L 8 35 L 8 12 L 16 12" fill="none" stroke={T.panelBorder} strokeWidth="2"/>
                                <path d="M 8 35 L 8 58 L 16 58" fill="none" stroke={T.panelBorder} strokeWidth="2"/>
                              </>
                            ) : (
                              <path d="M 0 15 L 16 15" fill="none" stroke={T.panelBorder} strokeWidth="2"/>
                            )}
                          </svg>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', flex: 1}}>
                            {branch.children.map(l3tech => renderTechNode(l3tech))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {techConfirm && (
        <div className="modal-overlay" onClick={() => setTechConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '380px'}}>
            <h2>Confirm Research</h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              Research <span style={{color: techConfirm.treeColor, fontWeight: 600}}>{techConfirm.name}</span>?
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Type</span>
                <span style={{color: techConfirm.treeColor}}>{techConfirm.typeLabel}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Effect</span>
                <span style={{color: T.textPrimary, textAlign: 'right', maxWidth: '200px', fontSize: '0.85rem'}}>{techConfirm.effectText}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Cost</span>
                <span style={{color: T.negative}}>-£{techConfirm.cost?.toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Treasury after</span>
                <span style={{color: T.textPrimary}}>£{(gameState.treasury - (techConfirm.cost || 0)).toLocaleString()}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>Completes</span>
                <span style={{color: T.accentBright}}>Next week</span>
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="action-button" style={{flex: 1}} onClick={() => handleResearch(techConfirm.id)}>
                Start Research
              </button>
              <button className="modal-close" style={{flex: 1}} onClick={() => setTechConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {techComplete && (
        <div className="modal-overlay" onClick={() => setTechComplete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '380px', textAlign: 'center'}}>
            <div style={{fontSize: '2rem', marginBottom: '8px'}}>&#128300;</div>
            <h2 style={{color: T.positive}}>Research Complete</h2>
            <p style={{color: T.textPrimary, fontSize: '0.9rem', margin: '12px 0'}}>
              <span style={{fontWeight: 600}}>{techComplete.name}</span> has been researched.
            </p>
            <div style={{background: T.bg, borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'left'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: T.textSecondary}}>Type</span>
                <span style={{color: T.textPrimary, textTransform: 'capitalize'}}>{techComplete.type?.replace('_', ' ')}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: T.textSecondary}}>Tree</span>
                <span style={{color: T.textPrimary}}>{TREE_LABELS[techComplete.tree] || techComplete.tree}</span>
              </div>
            </div>
            <button className="action-button" onClick={() => setTechComplete(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {showRecruitModal && (
        <div className="modal-overlay" onClick={() => setShowRecruitModal(false)}>
          <div className="modal recruit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Llama Recruitment</h2>
            {gameState.hasRecruitedThisWeek ? (
              <>
                {recruitedInfo?.llama ? (
                  <>
                    <p className="recruit-intro" style={{color: T.positive}}>Recruited this week</p>
                    <div className="candidate-list">
                      <div className="candidate-card" style={{border: `1px solid ${T.positive}`}}>
                        <div className="candidate-header">
                          <h3>{recruitedInfo.llama.name}</h3>
                          <span className="candidate-age">{recruitedInfo.llama.age} years old</span>
                        </div>
                        <p className="candidate-bio">{recruitedInfo.llama.bio}</p>
                        <div className="candidate-stats">
                          <div className="stat-row"><span>Sharing</span><span>{recruitedInfo.llama.stats.sharingTolerance}</span></div>
                          <div className="stat-row"><span>Cooking</span><span>{recruitedInfo.llama.stats.cookingSkill}</span></div>
                          <div className="stat-row"><span>Tidiness</span><span>{recruitedInfo.llama.stats.tidiness}</span></div>
                          <div className="stat-row"><span>Handiness</span><span>{recruitedInfo.llama.stats.handiness}</span></div>
                          <div className="stat-row"><span>Consideration</span><span>{recruitedInfo.llama.stats.consideration}</span></div>
                          <div className="stat-row"><span>Sociability</span><span>{recruitedInfo.llama.stats.sociability}</span></div>
                          <div className="stat-row"><span>Party Stamina</span><span>{recruitedInfo.llama.stats.partyStamina}</span></div>
                          <div className="stat-row"><span>Work Ethic</span><span>{recruitedInfo.llama.stats.workEthic}</span></div>
                        </div>
                        <div style={{textAlign: 'center', color: T.positive, fontSize: '0.85rem', marginTop: '8px'}}>
                          Arriving {recruitedInfo.arrivalDayName}
                        </div>
                      </div>
                      {recruitedInfo.rejected?.map(r => (
                        <div key={r.id} className="candidate-card" style={{border: `1px solid ${T.panelBorder}`, opacity: 0.5, textDecoration: 'line-through', position: 'relative'}}>
                          <div className="candidate-header">
                            <h3>{r.name}</h3>
                            <span className="candidate-age">{r.age} years old</span>
                          </div>
                          <p className="candidate-bio">{r.bio}</p>
                          <div className="candidate-stats">
                            <div className="stat-row"><span>Sharing</span><span>{r.stats.sharingTolerance}</span></div>
                            <div className="stat-row"><span>Cooking</span><span>{r.stats.cookingSkill}</span></div>
                            <div className="stat-row"><span>Tidiness</span><span>{r.stats.tidiness}</span></div>
                            <div className="stat-row"><span>Handiness</span><span>{r.stats.handiness}</span></div>
                            <div className="stat-row"><span>Consideration</span><span>{r.stats.consideration}</span></div>
                            <div className="stat-row"><span>Sociability</span><span>{r.stats.sociability}</span></div>
                            <div className="stat-row"><span>Party Stamina</span><span>{r.stats.partyStamina}</span></div>
                            <div className="stat-row"><span>Work Ethic</span><span>{r.stats.workEthic}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="recruit-intro" style={{color: T.positive}}>Recruited this week</p>
                    {gameState.pendingArrivals?.length > 0 && (
                      <div style={{background: T.panelBg, borderRadius: '8px', padding: '12px', marginBottom: '12px', borderLeft: `4px solid ${T.positive}`}}>
                        {gameState.pendingArrivals.map(r => (
                          <div key={r.id || r.name} style={{color: T.textPrimary, fontSize: '0.9rem'}}>
                            {r.name} arriving {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][r.arrivalDay-1]}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : gameState.residents + (gameState.pendingArrivals?.length || 0) >= gameState.capacity ? (
              <p className="recruit-intro" style={{color: T.negative}}>No room available. Build more bedrooms to recruit.</p>
            ) : (
              <>
                <p className="recruit-intro">Choose 1 of these 3 aspiring llamas, or pass this week.</p>
                {recruitCandidates.length === 0 ? (
                  <p className="no-candidates">No available llamas to recruit!</p>
                ) : (
                  <div className="candidate-list">
                    {recruitCandidates.map(llama => (
                      <div key={llama.id} className="candidate-card">
                        <div className="candidate-header">
                          <h3>{llama.name}</h3>
                          <span className="candidate-age">{llama.age} years old</span>
                        </div>
                        <p className="candidate-bio">{llama.bio}</p>
                        <div className="candidate-stats">
                          <div className="stat-row"><span>Sharing</span><span>{llama.stats.sharingTolerance}</span></div>
                          <div className="stat-row"><span>Cooking</span><span>{llama.stats.cookingSkill}</span></div>
                          <div className="stat-row"><span>Tidiness</span><span>{llama.stats.tidiness}</span></div>
                          <div className="stat-row"><span>Handiness</span><span>{llama.stats.handiness}</span></div>
                          <div className="stat-row"><span>Consideration</span><span>{llama.stats.consideration}</span></div>
                          <div className="stat-row"><span>Sociability</span><span>{llama.stats.sociability}</span></div>
                          <div className="stat-row"><span>Party Stamina</span><span>{llama.stats.partyStamina}</span></div>
                          <div className="stat-row"><span>Work Ethic</span><span>{llama.stats.workEthic}</span></div>
                        </div>
                        <button className="invite-button" onClick={() => setPendingInvite(llama)}>
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <button className="modal-close" onClick={() => setShowRecruitModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {pendingInvite && (
        <div className="modal-overlay" onClick={() => setPendingInvite(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Invite {pendingInvite.name}?</h2>
            <div className="confirm-buttons">
              <button className="confirm-btn confirm" onClick={() => { handleInvite(pendingInvite.id); setPendingInvite(null); }}>
                Confirm
              </button>
              <button className="confirm-btn cancel" onClick={() => setPendingInvite(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLlamaPoolEditor && (
        <div className="modal-overlay" onClick={() => setShowLlamaPoolEditor(false)}>
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
                  {editableLlamas.map(llama => (
                    <tr key={llama.id} className={gameState.communeResidents?.some(r => r.id === llama.id) ? 'in-commune' : ''}>
                      <td>
                        <input 
                          type="text" 
                          value={llama.name} 
                          onChange={(e) => updateLlamaField(llama.id, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          value={llama.gender} 
                          onChange={(e) => updateLlamaField(llama.id, 'gender', e.target.value)}
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
                          onChange={(e) => updateLlamaField(llama.id, 'age', e.target.value)}
                          min="18" max="80"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={llama.bio} 
                          onChange={(e) => updateLlamaField(llama.id, 'bio', e.target.value)}
                          className="bio-input"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.sharingTolerance} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, sharingTolerance: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.cookingSkill} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, cookingSkill: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.tidiness} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, tidiness: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.handiness} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, handiness: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.consideration} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, consideration: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.sociability} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, sociability: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.partyStamina} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, partyStamina: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={llama.stats.workEthic} 
                          onChange={(e) => updateLlamaField(llama.id, 'stats', {...llama.stats, workEthic: parseInt(e.target.value) || 0})}
                          min="1" max="20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="llama-pool-actions">
              <button className="action-button" onClick={handleSaveLlamaPool}>Apply Changes</button>
              <button className="modal-close" onClick={() => setShowLlamaPoolEditor(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBuildingsEditor && (
        <div className="modal-overlay" onClick={() => setShowBuildingsEditor(false)}>
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
                  {editableBuildings.filter(b => b.id !== 'great_hall').flatMap(b => {
                    const greatHall = b.id === 'living_room' ? editableBuildings.find(x => x.id === 'great_hall') : null;
                    const rows = [b];
                    if (greatHall) rows.push(greatHall);
                    return rows;
                  }).map(b => {
                    const techName = b.techRequired 
                      ? (gameState?.techTree || []).find(t => t.id === b.techRequired)?.name || b.techRequired
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
                          onChange={(e) => updateBuildingField(b.id, 'capacity', e.target.value)}
                          min="1"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={b.atStart ?? ''} 
                          onChange={(e) => updateBuildingField(b.id, 'atStart', e.target.value)}
                          min="0"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={b.quality ?? 1} 
                          onChange={(e) => updateBuildingField(b.id, 'quality', e.target.value)}
                          min="1"
                          max="3"
                        />
                      </td>
                      <td className="primitive-mult-cell">
                        {b.id === 'bedroom' && (
                          <div className="mult-row">
                            <label>Recovery:</label>
                            <input type="number" step="0.1" value={b.recoveryMult ?? 1.0} 
                              onChange={(e) => updateBuildingField(b.id, 'recoveryMult', e.target.value)} />
                          </div>
                        )}
                        {b.id === 'kitchen' && (
                          <>
                            <div className="mult-row">
                              <label>Food:</label>
                              <input type="number" step="0.1" value={b.foodMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'foodMult', e.target.value)} />
                            </div>
                            <div className="mult-row">
                              <label>Mess:</label>
                              <input type="number" step="0.1" value={b.messMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'messMult', e.target.value)} />
                            </div>
                          </>
                        )}
                        {b.id === 'bathroom' && (
                          <>
                            <div className="mult-row">
                              <label>Clean:</label>
                              <input type="number" step="0.1" value={b.cleanMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'cleanMult', e.target.value)} />
                            </div>
                            <div className="mult-row">
                              <label>Mess:</label>
                              <input type="number" step="0.1" value={b.messMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'messMult', e.target.value)} />
                            </div>
                          </>
                        )}
                        {b.id === 'living_room' && (
                          <>
                            <div className="mult-row">
                              <label>Fun:</label>
                              <input type="number" step="0.1" value={b.funMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'funMult', e.target.value)} />
                            </div>
                            <div className="mult-row">
                              <label>Noise:</label>
                              <input type="number" step="0.1" value={b.noiseMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'noiseMult', e.target.value)} />
                            </div>
                          </>
                        )}
                        {b.id === 'great_hall' && (
                          <>
                            <div className="mult-row">
                              <label>Fun:</label>
                              <input type="number" step="0.1" value={b.funMult ?? 1.3} 
                                onChange={(e) => updateBuildingField(b.id, 'funMult', e.target.value)} />
                            </div>
                            <div className="mult-row">
                              <label>Noise:</label>
                              <input type="number" step="0.1" value={b.noiseMult ?? 1.0} 
                                onChange={(e) => updateBuildingField(b.id, 'noiseMult', e.target.value)} />
                            </div>
                            <div className="mult-row">
                              <label>Drive:</label>
                              <input type="number" step="0.1" value={b.driveMult ?? 1.2} 
                                onChange={(e) => updateBuildingField(b.id, 'driveMult', e.target.value)} />
                            </div>
                          </>
                        )}
                        {b.id === 'utility_closet' && (
                          <div className="mult-row">
                            <label>Repair:</label>
                            <input type="number" step="0.1" value={b.repairMult ?? 1.0} 
                              onChange={(e) => updateBuildingField(b.id, 'repairMult', e.target.value)} />
                          </div>
                        )}
                        {(b.id === 'heaven' || b.id === 'hot_tub') && (
                          <div className="mult-row">
                            <label>Fun Out:</label>
                            <input type="number" step="0.5" value={b.funOutput ?? 0} 
                              onChange={(e) => updateBuildingField(b.id, 'funOutput', e.target.value)} />
                          </div>
                        )}
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={b.cost ?? ''} 
                          onChange={(e) => updateBuildingField(b.id, 'cost', e.target.value)}
                          placeholder="n/a"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.01"
                          value={b.utilitiesMultiplier ?? ''} 
                          onChange={(e) => updateBuildingField(b.id, 'utilitiesMultiplier', e.target.value)}
                          placeholder="n/a"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.01"
                          value={b.groundRentMultiplier ?? ''} 
                          onChange={(e) => updateBuildingField(b.id, 'groundRentMultiplier', e.target.value)}
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
                          onChange={(e) => updateBuildingField(b.id, 'buildable', e.target.checked)}
                        />
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
            <div className="buildings-actions">
              <button className="action-button" onClick={handleSaveBuildings}>Apply Changes</button>
              <button className="modal-close" onClick={() => setShowBuildingsEditor(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
