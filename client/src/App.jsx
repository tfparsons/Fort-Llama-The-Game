import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '';

function App() {
  const [view, setView] = useState('dashboard');
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showTechTreeModal, setShowTechTreeModal] = useState(false);
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
  
  const [displayTime, setDisplayTime] = useState({ hour: 9, minute: 0, dayIndex: 0 });
  const clockAnimationRef = useRef(null);
  const clockStartRef = useRef({ hour: 9, day: 1, realStartTime: Date.now(), synced: false });
  const wasPausedRef = useRef(true);
  
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [expandedPrimitives, setExpandedPrimitives] = useState({});

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
          vibes: data.vibesConfig
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

  const showWeeklyPanel = gameState?.isPausedForWeeklyDecision && !gameState?.isGameOver;

  // Store current pause state in ref so animation can read fresh value
  const isPausedRef = useRef(true);
  const configRef = useRef({ tickSpeed: 333, hoursPerTick: 4 });
  const gameStateRef = useRef(null);
  
  useEffect(() => {
    if (gameState?.budgets && gameState?.week !== undefined) {
      const syncKey = `${gameState.week}-${gameState.day}`;
      if (budgetSyncedWeek.current !== syncKey && showWeeklyPanel) {
        budgetSyncedWeek.current = syncKey;
        setBudgetInputs({ ...gameState.budgets });
      }
      if (budgetSyncedWeek.current === null) {
        budgetSyncedWeek.current = syncKey;
        setBudgetInputs({ ...gameState.budgets });
      }
    }
  }, [gameState?.week, gameState?.day, showWeeklyPanel]);

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

  const handleInvite = async (llamaId) => {
    try {
      const res = await fetch(`${API_BASE}/api/action/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llamaId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.invited} will arrive on ${data.arrivalDayName}!`);
        setShowRecruitModal(false);
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
          field === 'cleanMult' || field === 'funMult' || field === 'noiseMult' || field === 'repairMult') {
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
    await fetch(`${API_BASE}/api/action/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingId })
    });
    fetchState();
    fetchBuildings();
  };

  const handleBuildBedroom = async () => {
    await handleBuild('bedroom');
    setShowBuildModal(false);
  };

  const handleTogglePolicy = async (policyId) => {
    await fetch(`${API_BASE}/api/action/toggle-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyId })
    });
    fetchState();
  };

  const handleResearch = async (techId) => {
    const res = await fetch(`${API_BASE}/api/action/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId })
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
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

  const handleApplyConfig = async () => {
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
    budgetSyncedWeek.current = null;
    fetchState();
    setView('dashboard');
  };

  const handleSaveDefaults = async () => {
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
    if (editConfig.techConfig) {
      await fetch(`${API_BASE}/api/tech-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig.techConfig)
      });
    }
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

  return (
    <div className="app">
      <div className="top-bar">
        <div className="top-bar-left">
          <h1>Fort Llama</h1>
          <div className="nav-buttons">
            <button 
              className={view === 'dashboard' ? 'active' : ''} 
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={view === 'devtools' ? 'active' : ''} 
              onClick={() => { setView('devtools'); setEditConfig({
                ...config,
                health: gameState?.healthConfig,
                primitives: gameState?.primitiveConfig,
                vibes: gameState?.vibesConfig,
                budgetConfig: gameState?.budgetConfig,
                policyConfig: gameState?.policyConfig,
                techConfig: gameState?.techConfig
              }); }}
            >
              Dev Tools
            </button>
          </div>
        </div>
        <div className="top-bar-stats">
          <div className="top-stat">
            <span className="top-stat-label">Treasury</span>
            <span className={`top-stat-value ${gameState.treasury >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(gameState.treasury)}
            </span>
          </div>
          <div className="top-stat">
            <span className="top-stat-label">Residents</span>
            <span className="top-stat-value">{gameState.residents}/{gameState.capacity}</span>
          </div>
          <div className="top-stat">
            <span className="top-stat-label">Week {gameState.week}</span>
            <span className="top-stat-value">{DAY_NAMES[displayTime.dayIndex]}</span>
          </div>
          <div className="top-stat clock">
            <span className="top-stat-label">Time</span>
            <span className="top-stat-value">
              {String(displayTime.hour).padStart(2, '0')}:{String(displayTime.minute).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="game-over">
          <h2>GAME OVER</h2>
          <p>The commune has gone bankrupt! Treasury: {formatCurrency(gameState.treasury)}</p>
          <button className="btn-reset" onClick={handleReset}>Try Again</button>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="dashboard-layout">
        <div className="main-content">
          <div className="content-grid">
          <div className="vibes-banner wide">
            <div className="vibes-headline">
              <div className="headline-row">
                <span className="headline-label">Vibe:</span>
                <span className="headline-value">{gameState.vibes?.tierName || 'Decent'}</span>
                {gameState.coverageData && (
                  <span className="tier-badge">Tier {(gameState.coverageData.tier || 0) + 1}</span>
                )}
              </div>
              {gameState.vibes?.branchLabel && (
                <div className="headline-row">
                  <span className="headline-label">Reputation:</span>
                  <span className="headline-value">{gameState.vibes.branchLabel}</span>
                </div>
              )}
            </div>
            <div className="balance-section">
              <div className="health-metrics">
                {[
                  { key: 'livingStandards', label: 'Living Standards', short: 'LS' },
                  { key: 'productivity', label: 'Productivity', short: 'PR' },
                  { key: 'partytime', label: 'Partytime', short: 'PT' }
                ].map(m => {
                  const val = Math.round((gameState.healthMetrics?.[m.key] || 0.5) * 100);
                  const color = val >= 60 ? '#48bb78' : val >= 30 ? '#ed8936' : '#f56565';
                  return (
                    <div key={m.key} className="health-metric">
                      <span className="hm-label">{m.label}</span>
                      <div className="hm-bar-container">
                        <div className="hm-bar" style={{ width: `${val}%`, backgroundColor: color }}/>
                      </div>
                      <span className="hm-value">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card pressure-card">
              <div className="pressure-gauges">
                {[
                  { key: 'crowding', label: 'Crowding', icon: '👥', tiers: ['Comfortable', 'Tight', 'Crowded', 'Unliveable'] },
                  { key: 'noise', label: 'Noise', icon: '🔊', tiers: ['Quiet', 'Buzzing', 'Loud', 'Chaos'] }
                ].map(p => {
                  const val = Math.round(gameState.primitives?.[p.key] || 0);
                  const tierIndex = val < 25 ? 0 : val < 50 ? 1 : val < 75 ? 2 : 3;
                  const tierLabel = p.tiers[tierIndex];
                  const needleAngle = -135 + (val / 100) * 270;
                  const tierColors = ['#48bb78', '#ed8936', '#f56565', '#e53e3e'];
                  const tierColor = tierColors[tierIndex];
                  
                  return (
                    <div key={p.key} className="pressure-gauge">
                      <svg viewBox="0 0 100 60" className="gauge-svg">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#1a1a2e"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="url(#gaugeGradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(val / 100) * 126} 126`}
                        />
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#48bb78" />
                            <stop offset="50%" stopColor="#ed8936" />
                            <stop offset="100%" stopColor="#e53e3e" />
                          </linearGradient>
                        </defs>
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="18"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{
                            transformOrigin: '50px 50px',
                            transform: `rotate(${needleAngle}deg)`,
                            transition: 'transform 0.5s ease-out'
                          }}
                        />
                        <circle cx="50" cy="50" r="4" fill="#fff" />
                      </svg>
                      <div className="gauge-label" style={{ color: tierColor }}>
                        {tierLabel}
                      </div>
                      <div className="gauge-title">
                        <span className="gauge-icon">{p.icon}</span>
                        <span>{p.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
          <div className="card stocks-card">
              <div className="stocks-tanks">
                {[
                  { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
                  { key: 'fatigue', label: 'Fatigue', icon: '😴' }
                ].map(p => {
                  const val = Math.round(gameState.primitives?.[p.key] || 0);
                  const fillColor = val < 30 ? '#48bb78' : val < 60 ? '#ed8936' : '#f56565';
                  return (
                    <div key={p.key} className="stock-tank">
                      <div className="tank-container">
                        <div className="tank-fill" style={{ height: `${val}%`, backgroundColor: fillColor }}/>
                        <span className="tank-value">{val}</span>
                      </div>
                      <div className="tank-label">
                        <span className="tank-icon">{p.icon}</span>
                        <span>{p.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
          <div className="card instants-card wide">
              {[
                { key: 'nutrition', label: 'Nutrition', icon: '🍽️' },
                { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
                { key: 'fun', label: 'Fun', icon: '🎉' },
                { key: 'drive', label: 'Drive', icon: '💪' }
              ].map(p => {
                const val = Math.round(gameState.primitives?.[p.key] || 0);
                const coverage = gameState.coverageData?.[p.key];
                const ratio = coverage?.ratio || 1;
                const tierLabel = coverage?.label || 'Adequate';
                const labelColor = tierLabel === 'Shortfall' ? '#f56565' : 
                                   tierLabel === 'Adequate' ? '#ed8936' : 
                                   tierLabel === 'Good' ? '#48bb78' : 
                                   tierLabel === 'Great' ? '#38b2ac' : '#805ad5';
                return (
                  <div key={p.key} className="primitive-item coverage-item">
                    <span className="prim-icon">{p.icon}</span>
                    <span className="prim-label">{p.label}</span>
                    <div className="prim-bar-container">
                      <div className="prim-bar" style={{ width: `${val}%`, backgroundColor: labelColor }}/>
                    </div>
                    <span className="prim-value">{val}</span>
                    <span className="coverage-tier" style={{ color: labelColor }}>{tierLabel}</span>
                  </div>
                );
              })}
          </div>

            <div className="card">
              <h2>Weekly Projection</h2>
              <div className="stat has-tooltip">
                <span className="stat-label">Income</span>
                <span className="stat-value positive">{formatCurrency(projectedIncome)}</span>
                <div className="projection-tooltip">
                  <div className="tooltip-title">Income Breakdown</div>
                  <div className="tooltip-row">
                    <span>Residents</span>
                    <span>{gameState.communeResidents?.filter(r => !r.churned).length || 0} × {formatCurrency(gameState.currentRent)}</span>
                  </div>
                  <div className="tooltip-row total">
                    <span>Total</span>
                    <span className="positive">{formatCurrency(projectedIncome)}</span>
                  </div>
                </div>
              </div>
              <div className="stat has-tooltip">
                <span className="stat-label">Expenses</span>
                <span className="stat-value negative">-{formatCurrency(projectedGroundRent + projectedUtilities + projectedBudget)}</span>
                <div className="projection-tooltip">
                  <div className="tooltip-title">Expenses Breakdown</div>
                  <div className="tooltip-row">
                    <span>Ground Rent</span>
                    <span className="negative">-{formatCurrency(projectedGroundRent)}</span>
                  </div>
                  <div className="tooltip-row">
                    <span>Utilities</span>
                    <span className="negative">-{formatCurrency(projectedUtilities)}</span>
                  </div>
                  {projectedBudget > 0 && (
                    <div className="tooltip-row">
                      <span>Budgets</span>
                      <span className="negative">-{formatCurrency(projectedBudget)}</span>
                    </div>
                  )}
                  <div className="tooltip-row total">
                    <span>Total</span>
                    <span className="negative">-{formatCurrency(projectedGroundRent + projectedUtilities + projectedBudget)}</span>
                  </div>
                </div>
              </div>
              {(gameState.projectedFixedCosts || 0) > 0 && (
                <div className="stat">
                  <span className="stat-label">Fixed Costs</span>
                  <span className="stat-value negative">-{formatCurrency(gameState.projectedFixedCosts)}</span>
                </div>
              )}
              <div className="stat highlight">
                <span className="stat-label">Net</span>
                <span className={`stat-value ${weeklyDelta >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(weeklyDelta)}
                </span>
              </div>
            </div>

            <div className="card">
              <h2>Buildings</h2>
              {gameState.buildings?.map(b => (
                <div key={b.id} className="stat">
                  <span className="stat-label">{b.name}</span>
                  <span className="stat-value">{b.count} ({b.count * b.capacity})</span>
                </div>
              ))}
              {gameState.researchedTechs?.includes('great_hall') && (
                <div className="stat" style={{borderTop: '1px solid #4a5568', paddingTop: '4px', marginTop: '4px'}}>
                  <span className="stat-label" style={{color: '#4299e1'}}>Great Hall (Upgrade)</span>
                  <span className="stat-value" style={{color: '#4299e1', fontSize: '0.75rem'}}>Active</span>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <h2 style={{margin: 0}}>Active Policies</h2>
                <span style={{background: (gameState.activePolicies?.length || 0) > 3 ? '#e53e3e' : (gameState.activePolicies?.length || 0) > 0 ? '#48bb78' : '#4a5568', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600}}>
                  {gameState.activePolicies?.length || 0} / 3
                </span>
              </div>
              {(gameState.activePolicies?.length || 0) > 0 ? (
                <>
                  {gameState.activePolicies.map(pId => {
                    const policy = (gameState.policyDefinitions || []).find(p => p.id === pId);
                    if (!policy) return null;
                    const pct = Math.round((gameState.policyConfig?.excludePercent || 0.25) * 100);
                    const desc = policy.description.replace('{pct}', pct);
                    return (
                      <div key={pId} className="stat has-tooltip">
                        <span className="stat-label">{policy.name}</span>
                        <span className="stat-value" style={{color: '#48bb78', fontSize: '0.8rem'}}>{policy.primitive}</span>
                        <div className="projection-tooltip">
                          <div className="tooltip-title">{policy.name}</div>
                          <div className="tooltip-row"><span>{desc}</span></div>
                          <div className="tooltip-row"><span>Affects</span><span style={{textTransform: 'capitalize'}}>{policy.primitive}</span></div>
                        </div>
                      </div>
                    );
                  })}
                  {gameState.activePolicies.length > (gameState.policyConfig?.funPenalty?.threshold || 3) && (
                    <div className="panel-note" style={{color: '#f56565', marginTop: '4px', fontSize: '0.75rem'}}>
                      Fun penalty active ({gameState.activePolicies.length} policies &gt; {gameState.policyConfig?.funPenalty?.threshold || 3} threshold)
                    </div>
                  )}
                </>
              ) : (
                <div style={{color: '#718096', fontSize: '0.85rem', fontStyle: 'italic', padding: '8px 0'}}>No active policies</div>
              )}
            </div>

            {(() => {
              const cultureTechs = (gameState.techTree || []).filter(t => t.type === 'culture' && gameState.researchedTechs?.includes(t.id));
              if (cultureTechs.length === 0) return null;
              return (
                <div className="card">
                  <h2>Culture Badges</h2>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                    {cultureTechs.map(tech => {
                      const treeColor = tech.tree === 'livingStandards' ? '#48bb78' : tech.tree === 'productivity' ? '#4299e1' : '#ed8936';
                      return (
                        <span key={tech.id} style={{background: treeColor + '22', color: treeColor, border: `1px solid ${treeColor}44`, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600}}>
                          {tech.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="card residents-card">
              <h2>Residents ({gameState.communeResidents?.filter(r => !r.churned).length || 0})</h2>
              <div className="residents-list">
                {gameState.communeResidents && gameState.communeResidents.length > 0 ? (
                  gameState.communeResidents.map(resident => (
                    <div 
                      key={resident.id} 
                      className={`resident-chip${resident.churned ? ' churned' : ''}`}
                      onMouseEnter={() => setHoveredResident(resident)}
                      onMouseLeave={() => setHoveredResident(null)}
                    >
                      {resident.name}
                      {hoveredResident && hoveredResident.id === resident.id && (
                        <div className="resident-tooltip">
                          <div className="tooltip-header">
                            <strong>{resident.name}</strong>, {resident.age}
                          </div>
                          <p className="tooltip-bio">{resident.bio}</p>
                          <div className="tooltip-stats">
                            <div><span>Sharing:</span> {resident.stats.sharingTolerance}</div>
                            <div><span>Cooking:</span> {resident.stats.cookingSkill}</div>
                            <div><span>Tidiness:</span> {resident.stats.tidiness}</div>
                            <div><span>Handiness:</span> {resident.stats.handiness}</div>
                            <div><span>Consideration:</span> {resident.stats.consideration}</div>
                            <div><span>Sociability:</span> {resident.stats.sociability}</div>
                            <div><span>Party Stamina:</span> {resident.stats.partyStamina}</div>
                            <div><span>Work Ethic:</span> {resident.stats.workEthic}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-residents">No llamas yet</div>
                )}
              </div>
              {gameState.communeResidents && gameState.communeResidents.length > 0 && (() => {
                const residents = gameState.communeResidents.filter(r => !r.churned);
                const count = residents.length;
                const calcPct = (statKey) => {
                  const avg = residents.reduce((sum, r) => sum + (r.stats[statKey] || 10), 0) / count;
                  return Math.round((avg - 10) * 10);
                };
                const stats = [
                  { key: 'sharingTolerance', label: 'Sharing' },
                  { key: 'cookingSkill', label: 'Cooking' },
                  { key: 'tidiness', label: 'Tidiness' },
                  { key: 'handiness', label: 'Handiness' },
                  { key: 'consideration', label: 'Consideration' },
                  { key: 'sociability', label: 'Sociability' },
                  { key: 'partyStamina', label: 'Party' },
                  { key: 'workEthic', label: 'Work' }
                ];
                return (
                  <div className="aggregate-stats">
                    {stats.map(s => {
                      const pct = calcPct(s.key);
                      return (
                        <div key={s.key} className="agg-stat">
                          <span className="agg-label">{s.label}</span>
                          <span className={`agg-value ${pct >= 0 ? 'positive' : 'negative'}`}>
                            {pct >= 0 ? '+' : ''}{pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        {showWeeklyPanel && (
          <div className="weekly-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">Week {gameState.week} Planning</div>
            </div>
            <div className="sidebar-content">
              <div className="panel-section">
                <div className="rent-row">
                  <input 
                    type="range" 
                    min={config.rentMin} 
                    max={config.rentMax}
                    step="10"
                    value={rentInput}
                    onChange={handleRentSliderChange}
                    onMouseUp={handleRentSliderRelease}
                    onTouchEnd={handleRentSliderRelease}
                  />
                  <div className="rent-display">
                    {formatCurrency(rentInput)}
                  </div>
                </div>
                <div className="rent-info">
                  <span className="rent-tier">
                    {(() => {
                      const rent = Number(rentInput) || gameState.currentRent || 0;
                      const ls = Math.max(0, Math.min(1, gameState.healthMetrics?.livingStandards || 0.5));
                      const rentMin = config.rentMin || 50;
                      const rentMax = config.rentMax || 500;
                      const rentCurve = Math.max(0.1, gameState.healthConfig?.livingStandards?.rentCurve || 2);
                      
                      const curvedLS = Math.pow(ls, 1 / rentCurve);
                      const maxTolerantRent = rentMin + (rentMax - rentMin) * curvedLS;
                      const tierRatio = rent / maxTolerantRent;
                      
                      if (tierRatio <= 0.3) return 'Bargain';
                      if (tierRatio <= 0.5) return 'Cheap';
                      if (tierRatio <= 0.7) return 'Fair';
                      if (tierRatio <= 0.9) return 'Pricey';
                      return 'Extortionate';
                    })()}
                  </span>
                </div>
              </div>

              <div className="panel-section">
                <button 
                  className="panel-action"
                  onClick={handleOpenRecruitment}
                  disabled={
                    gameState.hasRecruitedThisWeek ||
                    gameState.residents + (gameState.pendingArrivals?.length || 0) >= gameState.capacity
                  }
                >
                  {gameState.hasRecruitedThisWeek ? 'Already recruited this week' : 'Llama Recruitment'}
                </button>
                {gameState.pendingArrivals && gameState.pendingArrivals.length > 0 && (
                  <div className="panel-note positive">
                    {gameState.pendingArrivals.map(r => `${r.name} arriving ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][r.arrivalDay-1]}`).join(', ')}
                  </div>
                )}
              </div>

              <div className="panel-section">
                <button className="panel-action" onClick={() => setShowBuildModal(true)}>
                  Build
                </button>
              </div>

              <div className="panel-section">
                <button className="panel-action" onClick={() => setShowPolicyModal(true)}>
                  Policies {(gameState.activePolicies?.length || 0) > 0 ? `(${gameState.activePolicies.length} active)` : ''}
                </button>
              </div>

              <div className="panel-section">
                <button className="panel-action" onClick={() => setShowTechModal(true)}
                  disabled={gameState.hasResearchedThisWeek}
                >
                  {gameState.hasResearchedThisWeek ? `Researched this week` : 'Technology'}
                </button>
              </div>

              <div className="panel-section">
                <button className="panel-action" onClick={() => setBudgetOpen(prev => !prev)}>
                  Budgets {budgetOpen ? '▲' : '▼'}
                </button>
                {budgetOpen && (
                  <div className="budget-items" style={{marginTop: '8px'}}>
                    {(() => {
                      const fixedCostTechs = (gameState.techTree || []).filter(t => 
                        t.type === 'fixed_expense' && gameState.researchedTechs?.includes(t.id)
                      );
                      if (fixedCostTechs.length === 0) return null;
                      return (
                        <div style={{marginBottom: '10px', borderBottom: '1px solid #4a5568', paddingBottom: '8px'}}>
                          <div style={{fontSize: '0.75rem', color: '#a0aec0', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Fixed Costs</div>
                          {fixedCostTechs.map(tech => {
                            const cfg = gameState.techConfig?.[tech.id] || {};
                            const isActive = gameState.activeFixedCosts?.includes(tech.id);
                            return (
                              <div key={tech.id} className="budget-row" style={{alignItems: 'center'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1}}>
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleToggleFixedCost(tech.id)}
                                    style={{accentColor: '#48bb78'}}
                                  />
                                  <span className="budget-label">{tech.name}</span>
                                </label>
                                <span style={{color: isActive ? '#fc8181' : '#718096', fontSize: '0.8rem', fontWeight: 600}}>
                                  £{cfg.weeklyCost || 0}/wk
                                </span>
                                <span style={{color: '#a0aec0', fontSize: '0.7rem', marginLeft: '6px'}}>
                                  +{cfg.effectPercent || 0}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {[
                      { key: 'nutrition', label: 'Ingredients', icon: '🥕', primitive: 'Nutrition' },
                      { key: 'cleanliness', label: 'Cleaning materials', icon: '🧹', primitive: 'Cleanliness' },
                      { key: 'maintenance', label: 'Handiman', icon: '🔧', primitive: 'Maintenance' },
                      { key: 'fatigue', label: 'Wellness', icon: '💆', primitive: 'Fatigue' },
                      { key: 'fun', label: 'Party supplies', icon: '🎈', primitive: 'Fun' },
                      { key: 'drive', label: 'Internet', icon: '📡', primitive: 'Drive' }
                    ].map(item => (
                      <div key={item.key} className="budget-row">
                        <span className="budget-icon">{item.icon}</span>
                        <span className="budget-label">{item.label}</span>
                        <div className="budget-stepper">
                          <button className="step-btn" onClick={() => handleBudgetStep(item.key, -50)}>--</button>
                          <button className="step-btn" onClick={() => handleBudgetStep(item.key, -10)}>-</button>
                          <div className="budget-input-wrap">
                            <span className="budget-currency">£</span>
                            <input
                              type="number"
                              min="0"
                              max="500"
                              step="10"
                              className="budget-input"
                              defaultValue={budgetInputs[item.key] || 0}
                              key={`${item.key}-${budgetInputs[item.key]}`}
                              onBlur={(e) => handleBudgetInputBlur(item.key, e.target.value)}
                              onKeyDown={(e) => handleBudgetInputKey(item.key, e)}
                            />
                          </div>
                          <button className="step-btn" onClick={() => handleBudgetStep(item.key, 10)}>+</button>
                          <button className="step-btn" onClick={() => handleBudgetStep(item.key, 50)}>++</button>
                        </div>
                      </div>
                    ))}
                    <div className="budget-total">
                      <span>Total Budget</span>
                      <span className="negative">-{formatCurrency(Object.values(budgetInputs).reduce((s, v) => s + v, 0))}/wk</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="sidebar-divider" />
              <button className="panel-confirm" onClick={handleDismissWeekly}>
                Start Week
              </button>
              <button 
                className="btn-restart"
                onClick={() => {
                  if (window.confirm('Are you sure you want to restart the game?')) {
                    handleReset();
                  }
                }}
              >
                Restart Game
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {view === 'devtools' && editConfig && (
        <div className="dev-tools">
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
                <label>Cleanliness wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.livingStandards?.cleanlinessWeight ?? 0.5} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, cleanlinessWeight: parseFloat(e.target.value)}}})} />
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
              <p className="config-hint">Lower curve = steeper progression. At LS=35, £100 is 'Fair'. At LS=100, max tolerable rent ~£500.</p>
              <div className="section-divider-line"></div>
              <div className="config-field">
                <label>Custom Scaling</label>
                <input type="checkbox" checked={editConfig?.health?.livingStandards?.useCustomScaling ?? false}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, livingStandards: {...editConfig.health?.livingStandards, useCustomScaling: e.target.checked}}})} />
              </div>
              {editConfig?.health?.livingStandards?.useCustomScaling && (
                <>
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
                </>
              )}
            </div>

            <div className="config-section">
              <h3>Productivity <span className="info-icon" onClick={() => setInfoPopup('productivity')}>&#9432;</span></h3>
              <div className="config-field">
                <label>Drive wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.productivity?.driveWeight ?? 1.0} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, driveWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Fatigue damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.productivity?.fatigueWeight ?? 0.55} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, fatigueWeight: parseFloat(e.target.value)}}})} />
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
                <label>Custom Scaling</label>
                <input type="checkbox" checked={editConfig?.health?.productivity?.useCustomScaling ?? false}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, productivity: {...editConfig.health?.productivity, useCustomScaling: e.target.checked}}})} />
              </div>
              {editConfig?.health?.productivity?.useCustomScaling && (
                <>
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
                </>
              )}
            </div>

            <div className="config-section">
              <h3>Partytime <span className="info-icon" onClick={() => setInfoPopup('partytime')}>&#9432;</span></h3>
              <div className="config-field">
                <label>Fun wt</label>
                <input type="number" step="0.1" value={editConfig?.health?.partytime?.funWeight ?? 1.0} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, funWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Fatigue damp</label>
                <input type="number" step="0.1" value={editConfig?.health?.partytime?.fatigueWeight ?? 0.45} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, fatigueWeight: parseFloat(e.target.value)}}})} />
              </div>
              <div className="config-field">
                <label>Noise boost</label>
                <input type="number" step="0.01" value={editConfig?.health?.partytime?.noiseBoostScale ?? 0.08} 
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, noiseBoostScale: parseFloat(e.target.value)}}})} />
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
                <label>Custom Scaling</label>
                <input type="checkbox" checked={editConfig?.health?.partytime?.useCustomScaling ?? false}
                  onChange={(e) => setEditConfig({...editConfig, health: {...editConfig.health, partytime: {...editConfig.health?.partytime, useCustomScaling: e.target.checked}}})} />
              </div>
              {editConfig?.health?.partytime?.useCustomScaling && (
                <>
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
                </>
              )}
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
              <p className="config-hint">Enable "Custom Scaling" on individual metrics to override.</p>
            </div>

            <div className="config-section">
              <h3>Tier Progression</h3>
              <p className="config-hint">As your commune grows, higher tiers unlock better output from buildings and adjust health metric expectations.</p>
              <div className="tier-grid">
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const brackets = gameState?.tierConfig?.brackets || [6, 12, 20, 50, 100];
                  const outputMults = gameState?.tierConfig?.outputMults || [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
                  const healthMults = gameState?.tierConfig?.healthMults || [1.0, 1.1, 1.2, 1.35, 1.5, 1.7];
                  const popRange = i === 0 ? `1-${brackets[0]}` : i === 5 ? `${brackets[4]+1}+` : `${brackets[i-1]+1}-${brackets[i]}`;
                  return (
                    <div key={i} className="tier-row">
                      <span className="tier-label">Tier {i + 1}</span>
                      <span className="tier-pop">{popRange} pop</span>
                      <span className="tier-mult">Output: {outputMults[i]}x</span>
                      <span className="tier-mult">Health: {healthMults[i]}x</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="config-section">
              <h3>Vibes Thresholds</h3>
              <div className="config-field">
                <label>Balanced spread</label>
                <input type="number" step="0.01" value={gameState?.vibesConfig?.balancedThreshold || 0.18} readOnly />
              </div>
              <div className="config-field">
                <label>Strong imbalance</label>
                <input type="number" step="0.01" value={gameState?.vibesConfig?.strongImbalanceThreshold || 0.30} readOnly />
              </div>
              <div className="vibes-tier-ladder">
                <label>Tier Ladder</label>
                <div className="tier-ladder-list">
                  {(gameState?.vibesConfig?.tierThresholds || [
                    { name: 'Shambles', min: 0, max: 0.15 },
                    { name: 'Rough', min: 0.15, max: 0.25 },
                    { name: 'Scrappy', min: 0.25, max: 0.35 },
                    { name: 'Fine', min: 0.35, max: 0.45 },
                    { name: 'Good', min: 0.45, max: 0.55 },
                    { name: 'Lovely', min: 0.55, max: 0.65 },
                    { name: 'Thriving', min: 0.65, max: 0.75 },
                    { name: 'Wonderful', min: 0.75, max: 0.85 },
                    { name: 'Glorious', min: 0.85, max: 0.95 },
                    { name: 'Utopia', min: 0.95, max: 1.01 }
                  ]).map((tier, idx) => (
                    <div key={idx} className={`tier-ladder-item ${gameState?.vibes?.tierName === tier.name ? 'current' : ''}`}>
                      <span className="tier-rank">{idx + 1}.</span>
                      <span className="tier-name">{tier.name}</span>
                      <span className="tier-range">{Math.round(tier.min * 100)}-{Math.round(tier.max * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <h3 className="section-divider">Mechanics</h3>
          <div className="dev-tools-grid three-col">
            <div className="config-section">
              <h3>Policy Settings</h3>
              <div className="config-field">
                <label title="Percentage of worst-performing residents excluded from stat average">Exclude %</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={editConfig?.policyConfig?.excludePercent ?? 0.25}
                  onChange={(e) => setEditConfig({...editConfig, policyConfig: {...(editConfig.policyConfig || {}), excludePercent: parseFloat(e.target.value)}})}
                />
              </div>
              <div className="config-field">
                <label title="Number of active policies before Fun penalty applies">Fun threshold</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={editConfig?.policyConfig?.funPenalty?.threshold ?? 3}
                  onChange={(e) => setEditConfig({...editConfig, policyConfig: {...(editConfig.policyConfig || {}), funPenalty: {...(editConfig.policyConfig?.funPenalty || {}), threshold: parseInt(e.target.value)}}})}
                />
              </div>
              <div className="config-field">
                <label title="Penalty curve steepness (K) for Fun reduction">Fun K</label>
                <input
                  type="number"
                  step="0.05"
                  value={editConfig?.policyConfig?.funPenalty?.K ?? 0.15}
                  onChange={(e) => setEditConfig({...editConfig, policyConfig: {...(editConfig.policyConfig || {}), funPenalty: {...(editConfig.policyConfig?.funPenalty || {}), K: parseFloat(e.target.value)}}})}
                />
              </div>
              <div className="config-field">
                <label title="Penalty curve exponent (P) for Fun reduction">Fun P</label>
                <input
                  type="number"
                  step="0.1"
                  value={editConfig?.policyConfig?.funPenalty?.P ?? 1.5}
                  onChange={(e) => setEditConfig({...editConfig, policyConfig: {...(editConfig.policyConfig || {}), funPenalty: {...(editConfig.policyConfig?.funPenalty || {}), P: parseFloat(e.target.value)}}})}
                />
              </div>
            </div>
            <div className="config-section">
              <h3>Budget Efficiency</h3>
              {[
                { key: 'nutrition', label: 'Ingredients', primitive: 'Nutrition', type: 'coverage' },
                { key: 'cleanliness', label: 'Cleaning materials', primitive: 'Cleanliness', type: 'coverage' },
                { key: 'fun', label: 'Party supplies', primitive: 'Fun', type: 'coverage' },
                { key: 'drive', label: 'Internet', primitive: 'Drive', type: 'coverage' },
                { key: 'maintenance', label: 'Handiman', primitive: 'Maintenance', type: 'stock' },
                { key: 'fatigue', label: 'Wellness', primitive: 'Fatigue', type: 'stock' }
              ].map(item => (
                <div key={item.key} className="config-field">
                  <label title={item.type === 'coverage' ? 'Supply boost per £1 invested' : 'Debt reduced per £1 per tick'}>
                    {item.label} <span style={{color: '#888', fontSize: '0.7rem'}}>({item.type === 'coverage' ? 'eff' : 'red'})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editConfig?.budgetConfig?.[item.key]?.[item.type === 'coverage' ? 'efficiency' : 'reductionRate'] ?? (item.type === 'coverage' ? 0.5 : 0.02)}
                    onChange={(e) => updateBudgetConfig(item.key, item.type === 'coverage' ? 'efficiency' : 'reductionRate', parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          <h3 className="section-divider">Technology</h3>
          <div className="dev-tools-grid">
            <div className="config-section" style={{gridColumn: '1 / -1'}}>
              <h3>Tech Tree Configuration</h3>
              <p style={{color: '#a0aec0', fontSize: '0.75rem', marginBottom: '8px'}}>Configure research costs and effects for each technology. Changes apply on Reset.</p>
              {['livingStandards', 'productivity', 'fun'].map(treeName => {
                const treeLabel = treeName === 'livingStandards' ? 'Quality of Life' : treeName === 'productivity' ? 'Productivity' : 'Fun';
                const treeColor = treeName === 'livingStandards' ? '#48bb78' : treeName === 'productivity' ? '#4299e1' : '#ed8936';
                const treeTechs = (gameState.techTree || []).filter(t => t.tree === treeName);
                return (
                  <div key={treeName} style={{marginBottom: '16px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: `2px solid ${treeColor}33`, paddingBottom: '4px'}}>
                      <span style={{background: treeColor, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block'}}></span>
                      <span style={{color: treeColor, fontWeight: 600, fontSize: '0.85rem'}}>{treeLabel}</span>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px'}}>
                      {treeTechs.map(tech => {
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
                        return (
                          <div key={tech.id} style={{background: '#2d3748', borderRadius: '6px', padding: '8px 10px', border: `1px solid ${tech.available ? treeColor + '44' : '#4a556833'}`}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                              <span style={{fontWeight: 600, fontSize: '0.8rem', color: tech.available ? '#e2e8f0' : '#718096'}}>{tech.name}</span>
                              <span style={{fontSize: '0.6rem', background: treeColor + '22', color: treeColor, padding: '1px 6px', borderRadius: '4px', textTransform: 'capitalize'}}>{tech.type.replace('_', ' ')}</span>
                            </div>
                            <div style={{fontSize: '0.65rem', color: '#718096', marginBottom: '6px'}}>L{tech.level} {!tech.available && '(Coming Soon)'}</div>
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
                              <>
                                <div className="config-field" style={{marginBottom: '4px'}}>
                                  <label style={{fontSize: '0.7rem'}}>Cap Boost</label>
                                  <input type="number" step="1" min="0"
                                    value={cfg.capacityBoost ?? 10}
                                    onChange={(e) => updateTechCfg('capacityBoost', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="config-field" style={{marginBottom: '4px'}}>
                                  <label style={{fontSize: '0.7rem'}}>Fun Mult +</label>
                                  <input type="number" step="0.05" min="0"
                                    value={cfg.funMultBoost ?? 0.3}
                                    onChange={(e) => updateTechCfg('funMultBoost', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="config-field" style={{marginBottom: '0'}}>
                                  <label style={{fontSize: '0.7rem'}}>Drive Mult +</label>
                                  <input type="number" step="0.05" min="0"
                                    value={cfg.driveMultBoost ?? 0.2}
                                    onChange={(e) => updateTechCfg('driveMultBoost', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
                  <div className="formula-display">maxRatio × 50 × penalty(maxRatio)</div>
                  <div className="primitive-info">
                    <span className="info-label">Ratio:</span> max of (beds, bath, kitchen, living) capacity ratios
                  </div>
                  <div className="penalty-toggle">
                    <label className="toggle-label">
                      <input type="checkbox" checked={editConfig?.primitives?.crowding?.useCustomPenalty ?? false}
                        onChange={(e) => updatePrimitiveConfig('crowding', 'useCustomPenalty', e.target.checked)} />
                      Custom Penalty K/P
                    </label>
                    {editConfig?.primitives?.crowding?.useCustomPenalty && (
                      <div className="penalty-fields">
                        <div className="config-field">
                          <label>k</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.crowding?.penaltyK ?? 2}
                            onChange={(e) => updatePrimitiveConfig('crowding', 'penaltyK', parseFloat(e.target.value))} />
                        </div>
                        <div className="config-field">
                          <label>p</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.crowding?.penaltyP ?? 2}
                            onChange={(e) => updatePrimitiveConfig('crowding', 'penaltyP', parseFloat(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Affects:</span> Living Standards, Productivity
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
                      <input type="number" step="0.5" value={editConfig?.primitives?.noise?.baseSocial ?? 5}
                        onChange={(e) => updatePrimitiveConfig('noise', 'baseSocial', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>baseAmbient</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.noise?.baseAmbient ?? 10}
                        onChange={(e) => updatePrimitiveConfig('noise', 'baseAmbient', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>socioMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.noise?.socioMult ?? 0.1}
                        onChange={(e) => updatePrimitiveConfig('noise', 'socioMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>considMult</label>
                      <input type="number" step="0.05" value={editConfig?.primitives?.noise?.considMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('noise', 'considMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="penalty-toggle">
                    <label className="toggle-label">
                      <input type="checkbox" checked={editConfig?.primitives?.noise?.useCustomPenalty ?? false}
                        onChange={(e) => updatePrimitiveConfig('noise', 'useCustomPenalty', e.target.checked)} />
                      Custom Penalty K/P
                    </label>
                    {editConfig?.primitives?.noise?.useCustomPenalty && (
                      <div className="penalty-fields">
                        <div className="config-field">
                          <label>k</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.noise?.penaltyK ?? 2}
                            onChange={(e) => updatePrimitiveConfig('noise', 'penaltyK', parseFloat(e.target.value))} />
                        </div>
                        <div className="config-field">
                          <label>p</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.noise?.penaltyP ?? 2}
                            onChange={(e) => updatePrimitiveConfig('noise', 'penaltyP', parseFloat(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Living Room (noiseMult: {gameState?.buildings?.find(b => b.id === 'living_room')?.noiseMult ?? 1.0})
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
                  <div className="formula-display">supply = min(N,cap) × outputRate × tierMult × quality × (1 + skillMult × cookSkill)</div>
                  <div className="coverage-stats">
                    <span>Supply: {gameState?.coverageData?.nutrition?.supply?.toFixed(1) || 0}</span>
                    <span>Demand: {gameState?.coverageData?.nutrition?.demand?.toFixed(1) || 0}</span>
                    <span>Ratio: {gameState?.coverageData?.nutrition?.ratio?.toFixed(2) || 1}x</span>
                  </div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.nutrition?.outputRate ?? 10}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>consumptionRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.nutrition?.consumptionRate ?? 1}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'consumptionRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.nutrition?.skillMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('nutrition', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Kitchen (cap: {gameState?.buildings?.find(b => b.id === 'kitchen')?.capacity ?? 20}, foodMult: {gameState?.buildings?.find(b => b.id === 'kitchen')?.foodMult ?? 1.0})
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
                  <div className="formula-display">supply = min(N,cap) × outputRate × tierMult × quality × (1 + skillMult × avgSocioStamina)</div>
                  <div className="coverage-stats">
                    <span>Supply: {gameState?.coverageData?.fun?.supply?.toFixed(1) || 0}</span>
                    <span>Demand: {gameState?.coverageData?.fun?.demand?.toFixed(1) || 0}</span>
                    <span>Ratio: {gameState?.coverageData?.fun?.ratio?.toFixed(2) || 1}x</span>
                  </div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.fun?.outputRate ?? 10}
                        onChange={(e) => updatePrimitiveConfig('fun', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>consumptionRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fun?.consumptionRate ?? 1}
                        onChange={(e) => updatePrimitiveConfig('fun', 'consumptionRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fun?.skillMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('fun', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Living Room (cap: {gameState?.buildings?.find(b => b.id === 'living_room')?.capacity ?? 20}, funMult: {gameState?.buildings?.find(b => b.id === 'living_room')?.funMult ?? 1.0})
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
                  <div className="formula-display">supply = min(N,cap) × outputRate × tierMult × quality × (1 + skillMult × workEthic)</div>
                  <div className="coverage-stats">
                    <span>Supply: {gameState?.coverageData?.drive?.supply?.toFixed(1) || 0}</span>
                    <span>Demand: {gameState?.coverageData?.drive?.demand?.toFixed(1) || 0}</span>
                    <span>Ratio: {gameState?.coverageData?.drive?.ratio?.toFixed(2) || 1}x</span>
                  </div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.drive?.outputRate ?? 10}
                        onChange={(e) => updatePrimitiveConfig('drive', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>slackRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.drive?.slackRate ?? 1}
                        onChange={(e) => updatePrimitiveConfig('drive', 'slackRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.drive?.skillMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('drive', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Living Room (quality affects focus)
                  </div>
                </div>
              )}
            </div>

            <div className={`primitive-section ${expandedPrimitives.cleanliness ? 'expanded' : ''}`}>
              <div className="primitive-header" onClick={() => togglePrimitiveExpanded('cleanliness')}>
                <span className="expand-icon">{expandedPrimitives.cleanliness ? '▼' : '▶'}</span>
                <span className="primitive-name">Cleanliness</span>
                <span className="primitive-type coverage">Coverage</span>
              </div>
              {expandedPrimitives.cleanliness && (
                <div className="primitive-body">
                  <div className="formula-display">supply = min(N,cap) × outputRate × tierMult × quality × (1 + skillMult × tidiness)</div>
                  <div className="coverage-stats">
                    <span>Supply: {gameState?.coverageData?.cleanliness?.supply?.toFixed(1) || 0}</span>
                    <span>Demand: {gameState?.coverageData?.cleanliness?.demand?.toFixed(1) || 0}</span>
                    <span>Ratio: {gameState?.coverageData?.cleanliness?.ratio?.toFixed(2) || 1}x</span>
                  </div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>outputRate</label>
                      <input type="number" step="1" value={editConfig?.primitives?.cleanliness?.outputRate ?? 3}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'outputRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>consumptionRate</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.cleanliness?.consumptionRate ?? 1}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'consumptionRate', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>skillMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.cleanliness?.skillMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('cleanliness', 'skillMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Bathroom (cap: {gameState?.buildings?.find(b => b.id === 'bathroom')?.capacity ?? 4}, cleanMult: {gameState?.buildings?.find(b => b.id === 'bathroom')?.cleanMult ?? 1.0})
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
                  <div className="formula-display">accumulates: wearIn × penalty - repairOut</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>wearPerResident</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.maintenance?.wearPerResident ?? 1}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'wearPerResident', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>repairBase</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.maintenance?.repairBase ?? 3}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'repairBase', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="penalty-toggle">
                    <label className="toggle-label">
                      <input type="checkbox" checked={editConfig?.primitives?.maintenance?.useCustomPenalty ?? false}
                        onChange={(e) => updatePrimitiveConfig('maintenance', 'useCustomPenalty', e.target.checked)} />
                      Custom Penalty K/P
                    </label>
                    {editConfig?.primitives?.maintenance?.useCustomPenalty && (
                      <div className="penalty-fields">
                        <div className="config-field">
                          <label>k</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.maintenance?.penaltyK ?? 2}
                            onChange={(e) => updatePrimitiveConfig('maintenance', 'penaltyK', parseFloat(e.target.value))} />
                        </div>
                        <div className="config-field">
                          <label>p</label>
                          <input type="number" step="0.1" value={editConfig?.primitives?.maintenance?.penaltyP ?? 2}
                            onChange={(e) => updatePrimitiveConfig('maintenance', 'penaltyP', parseFloat(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Utility Closet (repairMult: {gameState?.buildings?.find(b => b.id === 'utility_closet')?.repairMult ?? 1.0})
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
                  <div className="formula-display">accumulates: (exertion - recovery) / N</div>
                  <div className="primitive-controls">
                    <div className="config-field">
                      <label>exertBase</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.fatigue?.exertBase ?? 3}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'exertBase', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>recoverBase</label>
                      <input type="number" step="0.5" value={editConfig?.primitives?.fatigue?.recoverBase ?? 5}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'recoverBase', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>workMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fatigue?.workMult ?? 0.3}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'workMult', parseFloat(e.target.value))} />
                    </div>
                    <div className="config-field">
                      <label>socioMult</label>
                      <input type="number" step="0.1" value={editConfig?.primitives?.fatigue?.socioMult ?? 0.2}
                        onChange={(e) => updatePrimitiveConfig('fatigue', 'socioMult', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="linked-buildings">
                    <span className="info-label">Buildings:</span> Bedroom (recoveryMult: {gameState?.buildings?.find(b => b.id === 'bedroom')?.recoveryMult ?? 1.0})
                  </div>
                </div>
              )}
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
                  <code>LS_raw = baseline(Nutrition) × baseline(Cleanliness) × damp(Crowding) × damp(Maintenance)</code>
                  <p>Nutrition and Cleanliness provide the baseline. Crowding and Maintenance are dampeners.</p>
                </div>
                <div className="formula-section">
                  <h4>Scoring (0-100)</h4>
                  <code>M_ref = ref0 × (pop/pop0)^alpha × tierMult[tier]</code>
                  <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
                  <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
                </div>
                <div className="formula-section">
                  <h4>Primitives Used</h4>
                  <ul>
                    <li><strong>Nutrition</strong> (baseline × nutritionWeight) - Food quality from Kitchen</li>
                    <li><strong>Cleanliness</strong> (dampener × cleanlinessWeight) - Mess debt reduces LS</li>
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
                  <code>maxTolerantRent = rentMin + (rentMax - rentMin) × LS^(1/rentCurve)</code>
                  <p>Rent tier (Bargain→Cheap→Fair→Pricey→Extortionate) depends on where current rent falls relative to maxTolerantRent.</p>
                </div>
              </>
            )}
            {infoPopup === 'productivity' && (
              <>
                <h2>Productivity</h2>
                <div className="formula-section">
                  <h4>Raw Formula</h4>
                  <code>PR_raw = baseline(Drive) × damp(Fatigue) × damp(Noise) × damp(Crowding)</code>
                  <p>Drive provides the baseline. Fatigue, Noise, and Crowding are dampeners.</p>
                </div>
                <div className="formula-section">
                  <h4>Scoring (0-100)</h4>
                  <code>M_ref = ref0 × (pop/pop0)^alpha × tierMult[tier]</code>
                  <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
                  <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
                </div>
                <div className="formula-section">
                  <h4>Primitives Used</h4>
                  <ul>
                    <li><strong>Drive</strong> (baseline × driveWeight) - Motivation from workspace</li>
                    <li><strong>Fatigue</strong> (dampener × fatigueWeight) - Tiredness reduces output</li>
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
                <h2>Partytime</h2>
                <div className="formula-section">
                  <h4>Raw Formula</h4>
                  <code>PT_raw = baseline(Fun) × damp(Fatigue) × (1 + NoiseBonus)</code>
                  <p>Fun provides the baseline. Fatigue is a dampener. Noise provides a bonus (noiseBoostScale × noise / 100)!</p>
                </div>
                <div className="formula-section">
                  <h4>Scoring (0-100)</h4>
                  <code>M_ref = ref0 × (pop/pop0)^alpha × tierMult[tier]</code>
                  <code>score = 100 × (raw/M_ref)^p / (1 + (raw/M_ref)^p)</code>
                  <p>Score is normalized against a population-scaled reference. At raw = M_ref, score = 50. Higher p = steeper curve.</p>
                </div>
                <div className="formula-section">
                  <h4>Primitives Used</h4>
                  <ul>
                    <li><strong>Fun</strong> (baseline × funWeight) - Party energy from social activity</li>
                    <li><strong>Fatigue</strong> (dampener × fatigueWeight) - Too tired to party</li>
                    <li><strong>Noise</strong> (bonus × noiseBoostScale) - Unlike other metrics, noise HELPS!</li>
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
                    <li><strong>Sociability</strong> - Boosts Fun and increases Noise (both positive here!)</li>
                    <li><strong>Party Stamina</strong> - Boosts Fun and Fatigue recovery</li>
                    <li><strong>Consideration</strong> - Reduces noise (slight negative for Partytime!)</li>
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
            <h2>Build</h2>
            {gameState.buildings?.filter(b => b.buildable && b.cost !== null && (!b.techRequired || gameState.researchedTechs?.includes(b.techRequired))).map(building => (
              <div key={building.id} className="building-card">
                <h3>{building.name.replace(/s$/, '')}</h3>
                <div className="building-stats">
                  <div>Cost: £{building.cost?.toLocaleString()}</div>
                  <div>Capacity: {building.capacity} residents</div>
                  {building.groundRentMultiplier !== null && (
                    <div>Ground Rent: +{(building.groundRentMultiplier * 100).toFixed(0)}%</div>
                  )}
                  {building.utilitiesMultiplier !== null && (
                    <div>Utilities: +{(building.utilitiesMultiplier * 100).toFixed(0)}%</div>
                  )}
                  <div>Current: {building.count}</div>
                </div>
                <button 
                  className="action-button"
                  onClick={() => handleBuild(building.id)}
                  disabled={gameState.treasury < building.cost}
                >
                  {gameState.treasury < building.cost ? 'Not enough funds' : 'Build'}
                </button>
              </div>
            ))}
            <button className="modal-close" onClick={() => setShowBuildModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showPolicyModal && (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Policies</h2>
              <span style={{background: (gameState.activePolicies?.length || 0) > 3 ? '#e53e3e' : '#4a5568', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600}}>
                {gameState.activePolicies?.length || 0} / 3
              </span>
            </div>
            <p style={{color: '#a0aec0', fontSize: '0.85rem', marginBottom: '12px'}}>
              Toggle policies to improve your commune. More than 3 active policies will reduce Fun.
            </p>
            <div className="policy-list">
              {(gameState.policyDefinitions || []).map(policy => {
                const isActive = (gameState.activePolicies || []).includes(policy.id);
                const isLocked = policy.techRequired && !gameState.researchedTechs?.includes(policy.techRequired);
                const pct = Math.round((gameState.policyConfig?.excludePercent || 0.25) * 100);
                const ocadoPct = gameState.techConfig?.ocado?.effectPercent || 15;
                let desc = policy.description.replace('{pct}', pct).replace('{ocadoPct}', ocadoPct);
                return (
                  <div key={policy.id} className={`policy-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}>
                    <div className="policy-header">
                      <h3>{policy.name} {isLocked && '🔒'}</h3>
                      <span className="policy-primitive">{policy.primitive}</span>
                    </div>
                    <p className="policy-desc">{isLocked ? `Requires ${policy.techRequired} tech` : desc}</p>
                    <button 
                      className={`policy-toggle ${isActive ? 'active' : ''}`}
                      onClick={() => handleTogglePolicy(policy.id)}
                      disabled={isLocked}
                      style={isLocked ? {opacity: 0.4, cursor: 'not-allowed'} : {}}
                    >
                      {isLocked ? 'Locked' : isActive ? 'Deactivate' : 'Activate'}
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
      )}

      {showTechModal && (
        <div className="modal-overlay" onClick={() => setShowTechModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>Technology Research</h2>
              <button 
                style={{background: '#4a5568', color: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'}}
                onClick={(e) => { e.stopPropagation(); setShowTechModal(false); setShowTechTreeModal(true); }}
              >
                View Tech Tree
              </button>
            </div>
            {['livingStandards', 'productivity', 'fun'].map(treeName => {
              const treeLabel = treeName === 'livingStandards' ? 'Quality of Life' : treeName === 'productivity' ? 'Productivity' : 'Fun';
              const treeColor = treeName === 'livingStandards' ? '#48bb78' : treeName === 'productivity' ? '#4299e1' : '#ed8936';
              const treeTechs = (gameState.techTree || []).filter(t => t.tree === treeName);
              const availableTechs = treeTechs.filter(t => {
                if (gameState.researchedTechs?.includes(t.id)) return false;
                if (!t.available) return false;
                if (t.parent && !gameState.researchedTechs?.includes(t.parent)) return false;
                return true;
              });
              
              return (
                <div key={treeName} style={{marginBottom: '8px'}}>
                  {availableTechs.length === 0 ? null : (
                    availableTechs.map(tech => {
                      const cfg = gameState.techConfig?.[tech.id] || {};
                      const cost = cfg.cost || 500;
                      const canAfford = gameState.treasury >= cost;
                      const typeLabel = tech.type === 'fixed_expense' ? 'Fixed Cost' : tech.type === 'building' ? 'Building' : tech.type === 'culture' ? 'Culture' : tech.type === 'upgrade' ? 'Upgrade' : 'Policy';
                      let effectText = '';
                      if (tech.type === 'fixed_expense') effectText = `+${cfg.effectPercent || 0}% boost, £${cfg.weeklyCost || 0}/wk`;
                      else if (tech.type === 'policy') effectText = tech.id === 'chores_rota' ? 'Unlocks Cooking & Cleaning Rota' : tech.id === 'ocado' ? `+${cfg.effectPercent || 0}% ingredient efficiency` : tech.description;
                      else if (tech.type === 'building') effectText = tech.id === 'blanket_fort' ? 'Unlocks Heaven building' : tech.id === 'outdoor_plumbing' ? 'Unlocks Hot Tub building' : tech.description;
                      else if (tech.type === 'upgrade') effectText = `Cap +${cfg.capacityBoost || 0}, Fun +${Math.round((cfg.funMultBoost || 0) * 100)}%, Drive +${Math.round((cfg.driveMultBoost || 0) * 100)}%`;
                      else if (tech.type === 'culture') effectText = 'Unlocks next tier technologies';
                      
                      return (
                        <div key={tech.id} style={{background: '#2d3748', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${treeColor}`}}>
                          <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span style={{fontWeight: 600, color: '#e2e8f0'}}>{tech.name}</span>
                              <span style={{fontSize: '0.65rem', background: treeColor + '33', color: treeColor, padding: '1px 6px', borderRadius: '4px'}}>{typeLabel}</span>
                            </div>
                            <div style={{color: '#a0aec0', fontSize: '0.75rem', marginTop: '2px'}}>{effectText}</div>
                          </div>
                          <button
                            className="action-button"
                            style={{marginLeft: '10px', width: '80px', textAlign: 'center', flexShrink: 0, opacity: (!canAfford || gameState.hasResearchedThisWeek) ? 0.5 : 1}}
                            disabled={!canAfford || gameState.hasResearchedThisWeek}
                            onClick={() => handleResearch(tech.id)}
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
              <button className="close-button" onClick={() => setShowTechTreeModal(false)}>×</button>
            </div>
            {['livingStandards', 'productivity', 'fun'].map(treeName => {
              const treeLabel = treeName === 'livingStandards' ? 'Quality of Life' : treeName === 'productivity' ? 'Productivity' : 'Fun';
              const treeColor = treeName === 'livingStandards' ? '#48bb78' : treeName === 'productivity' ? '#4299e1' : '#ed8936';
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
                const discovered = isDiscovered(tech);
                const unavailable = !tech.available;
                const cfg = gameState.techConfig?.[tech.id] || {};
                const redacted = !researched && !discovered;
                
                return (
                  <div key={tech.id} style={{
                    background: researched ? treeColor + '22' : '#1a202c',
                    border: `2px solid ${researched ? treeColor : discovered ? '#4a5568' : '#4a556844'}`,
                    borderLeft: `4px solid ${treeColor}${redacted ? '44' : ''}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    minWidth: '140px',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{filter: redacted ? 'blur(5px)' : 'none', userSelect: redacted ? 'none' : 'auto'}}>
                      <div style={{fontWeight: 600, fontSize: '0.8rem', color: researched ? treeColor : '#e2e8f0'}}>{tech.name}</div>
                      <div style={{fontSize: '0.65rem', color: '#a0aec0', textTransform: 'capitalize'}}>{tech.type.replace('_', ' ')}</div>
                    </div>
                    {researched && <div style={{fontSize: '0.6rem', color: treeColor, marginTop: '2px'}}>Researched</div>}
                    {redacted && <div style={{fontSize: '0.6rem', color: '#718096', marginTop: '2px'}}>???</div>}
                    {!researched && !redacted && unavailable && <div style={{fontSize: '0.6rem', color: '#e53e3e', marginTop: '2px'}}>Coming Soon</div>}
                    {!researched && !redacted && !unavailable && discovered && <div style={{fontSize: '0.6rem', color: '#a0aec0', marginTop: '2px'}}>£{cfg.cost || 500}</div>}
                  </div>
                );
              };
              
              return (
                <div key={treeName} style={{marginBottom: '24px'}}>
                  <div style={{display: 'flex', gap: '16px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px', minWidth: '140px'}}>
                      <div style={{fontSize: '0.65rem', color: '#718096', textTransform: 'uppercase'}}>Level 1</div>
                      {l1.map(renderTechNode)}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '1.2rem'}}>→</div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px', minWidth: '140px'}}>
                      <div style={{fontSize: '0.65rem', color: '#718096', textTransform: 'uppercase'}}>Level 2</div>
                      {l2.map(renderTechNode)}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '1.2rem'}}>→</div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px', minWidth: '140px'}}>
                      <div style={{fontSize: '0.65rem', color: '#718096', textTransform: 'uppercase'}}>Level 3</div>
                      {l3.map(renderTechNode)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showRecruitModal && (
        <div className="modal-overlay" onClick={handlePassRecruitment}>
          <div className="modal recruit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Llama Recruitment</h2>
            <p className="recruit-intro">Choose a llama to join your commune, or pass on this round.</p>
            
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
                      <div className="stat-row">
                        <span>Sharing</span><span>{llama.stats.sharingTolerance}</span>
                      </div>
                      <div className="stat-row">
                        <span>Cooking</span><span>{llama.stats.cookingSkill}</span>
                      </div>
                      <div className="stat-row">
                        <span>Tidiness</span><span>{llama.stats.tidiness}</span>
                      </div>
                      <div className="stat-row">
                        <span>Handiness</span><span>{llama.stats.handiness}</span>
                      </div>
                      <div className="stat-row">
                        <span>Consideration</span><span>{llama.stats.consideration}</span>
                      </div>
                      <div className="stat-row">
                        <span>Sociability</span><span>{llama.stats.sociability}</span>
                      </div>
                      <div className="stat-row">
                        <span>Party Stamina</span><span>{llama.stats.partyStamina}</span>
                      </div>
                      <div className="stat-row">
                        <span>Work Ethic</span><span>{llama.stats.workEthic}</span>
                      </div>
                    </div>
                    <button className="invite-button" onClick={() => setPendingInvite(llama)}>
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button className="modal-close" onClick={handlePassRecruitment}>
              Pass
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
                    <th>Buildable</th>
                  </tr>
                </thead>
                <tbody>
                  {editableBuildings.map(b => (
                    <tr key={b.id}>
                      <td>{b.name}</td>
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
                        {b.id === 'utility_closet' && (
                          <div className="mult-row">
                            <label>Repair:</label>
                            <input type="number" step="0.1" value={b.repairMult ?? 1.0} 
                              onChange={(e) => updateBuildingField(b.id, 'repairMult', e.target.value)} />
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
                      <td>
                        <input 
                          type="checkbox" 
                          checked={b.buildable} 
                          onChange={(e) => updateBuildingField(b.id, 'buildable', e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
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
