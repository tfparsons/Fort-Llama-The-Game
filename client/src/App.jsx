import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '';

function App() {
  const [view, setView] = useState('dashboard');
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [showLlamaPoolEditor, setShowLlamaPoolEditor] = useState(false);
  const [editableLlamas, setEditableLlamas] = useState([]);
  const [recruitCandidates, setRecruitCandidates] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rentInput, setRentInput] = useState('');
  const [rentError, setRentError] = useState('');
  const [hoveredResident, setHoveredResident] = useState(null);
  
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ 
    x: Math.max(20, (window.innerWidth - 360) / 2), 
    y: Math.max(80, (window.innerHeight - 450) / 2) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      const data = await res.json();
      setGameState(data);
      setConfig(data.config);
      if (!editConfig) {
        setEditConfig(data.config);
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
        setPanelPosition({ x: newX, y: newY });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const showWeeklyPanel = gameState?.isPausedForWeeklyDecision && !gameState?.isGameOver;
  
  useEffect(() => {
    if (!showWeeklyPanel) {
      setIsDragging(false);
    }
  }, [showWeeklyPanel]);

  const handlePanelMouseDown = (e) => {
    if (e.target.closest('.panel-btn')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    setRentError('');
    fetchState();
  };

  const handleDismissWeekly = async () => {
    await fetch(`${API_BASE}/api/dismiss-weekly`, { method: 'POST' });
    fetchState();
  };

  const handleSetRent = async (rent) => {
    const rentNum = parseInt(rent);
    if (isNaN(rentNum) || rentNum < config.rentMin || rentNum > config.rentMax) {
      setRentError(`Rent must be between £${config.rentMin} and £${config.rentMax}`);
      return false;
    }
    setRentError('');
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
    setRentError('');
  };

  const handleRentSliderRelease = () => {
    handleSetRent(rentInput);
  };

  const handleRentInputChange = (e) => {
    setRentInput(e.target.value);
    setRentError('');
  };

  const handleRentInputBlur = () => {
    const val = parseInt(rentInput);
    if (isNaN(val) || val < config.rentMin || val > config.rentMax) {
      setRentError(`Rent must be between £${config.rentMin} and £${config.rentMax}`);
      setRentInput(String(gameState.currentRent));
    } else {
      handleSetRent(val);
    }
  };

  const handleRentInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRentInputBlur();
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

  const handleBuildBedroom = async () => {
    await fetch(`${API_BASE}/api/action/build-bedroom`, { method: 'POST' });
    fetchState();
    setShowBuildModal(false);
  };

  const handleApplyConfig = async () => {
    await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editConfig)
    });
    setRentError('');
    fetchState();
    setView('dashboard');
  };

  const handleSaveDefaults = async () => {
    await fetch(`${API_BASE}/api/save-defaults`, { method: 'POST' });
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
  const projectedGroundRent = gameState.projectedGroundRent ?? Math.round(config.groundRentBase * (1 + Math.max(0, gameState.bedrooms - 1) * config.groundRentBedroomModifier));
  const projectedUtilities = gameState.projectedUtilities ?? Math.round(config.utilitiesBase * (1 + Math.max(0, gameState.bedrooms - 1) * config.utilitiesBedroomModifier));
  const weeklyDelta = gameState.weeklyDelta ?? (projectedIncome - projectedGroundRent - projectedUtilities);

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
              onClick={() => { setView('devtools'); setEditConfig(config); }}
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
            <span className="top-stat-value">{gameState.dayName}</span>
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
        <div className="main-content">
          <div className="content-grid">
            <div className="card">
              <h2>Commune Status</h2>
              <div className="stat">
                <span className="stat-label">Bedrooms</span>
                <span className="stat-value">{gameState.bedrooms}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Weekly Rent</span>
                <span className="stat-value">{formatCurrency(gameState.currentRent)}</span>
              </div>
              {gameState.pendingArrivals && gameState.pendingArrivals.length > 0 && (
                <div className="stat">
                  <span className="stat-label">Pending Arrivals</span>
                  <span className="stat-value positive">+{gameState.pendingArrivals.length}</span>
                </div>
              )}
              <div className="controls">
                <button className="btn-reset" onClick={handleReset}>Restart</button>
              </div>
            </div>

            <div className="card">
              <h2>Weekly Projection</h2>
              <div className="stat">
                <span className="stat-label">Income (Rent)</span>
                <span className="stat-value positive">{formatCurrency(projectedIncome)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Ground Rent</span>
                <span className="stat-value negative">-{formatCurrency(projectedGroundRent)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Utilities</span>
                <span className="stat-value negative">-{formatCurrency(projectedUtilities)}</span>
              </div>
              <div className="stat highlight">
                <span className="stat-label">Net Change</span>
                <span className={`stat-value ${weeklyDelta >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(weeklyDelta)}
                </span>
              </div>
            </div>

            <div className="card">
              <h2>Game Status</h2>
              {gameState.isPausedForWeeklyDecision ? (
                <div className="status-message paused">Planning Phase - Make your weekly decisions</div>
              ) : gameState.isRunning ? (
                <div className="status-message running">Week in progress - Day {gameState.day}/7</div>
              ) : (
                <div className="status-message paused">Paused</div>
              )}
              {gameState.lastWeekSummary && (
                <div className="week-summary">
                  <h3>Last Week (Week {gameState.lastWeekSummary.week})</h3>
                  <div className="stat">
                    <span className="stat-label">Net Profit/Loss</span>
                    <span className={`stat-value ${gameState.lastWeekSummary.profit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(gameState.lastWeekSummary.profit)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Residents Churned</span>
                    <span className="stat-value negative">
                      {Array.isArray(gameState.lastWeekSummary.churnedResidents) 
                        ? `-${gameState.lastWeekSummary.churnedResidents.length}` 
                        : `-${gameState.lastWeekSummary.churnedResidents}`}
                    </span>
                  </div>
                  {gameState.lastWeekSummary.arrivedResidents && gameState.lastWeekSummary.arrivedResidents.length > 0 && (
                    <div className="stat">
                      <span className="stat-label">New Arrivals</span>
                      <span className="stat-value positive">+{gameState.lastWeekSummary.arrivedResidents.length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="residents-section">
            <div className="card full-width">
              <h2>Llamas in Residence ({gameState.communeResidents?.length || 0})</h2>
              <div className="residents-list">
                {gameState.communeResidents && gameState.communeResidents.length > 0 ? (
                  gameState.communeResidents.map(resident => (
                    <div 
                      key={resident.id} 
                      className="resident-chip"
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
                const residents = gameState.communeResidents;
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
      )}

      {view === 'devtools' && editConfig && (
        <div className="dev-tools">
          <div className="dev-tools-header">
            <h2>Developer Tools</h2>
            <div className="dev-tools-buttons">
              <button className="manage-llamas-btn" onClick={handleOpenLlamaPoolEditor}>
                Manage Llamas
              </button>
              <button className="save-defaults-button" onClick={handleSaveDefaults}>
                Save as Defaults
              </button>
              <button className="apply-button" onClick={handleApplyConfig}>
                Apply & Reset
              </button>
            </div>
          </div>

          <div className="dev-tools-grid">
            <div className="config-section">
              <h3>Starting Values</h3>
              <div className="config-field">
                <label>Treasury (£)</label>
                <input type="number" value={editConfig.startingTreasury} onChange={(e) => updateEditConfig('startingTreasury', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Bedrooms</label>
                <input type="number" value={editConfig.startingBedrooms} onChange={(e) => updateEditConfig('startingBedrooms', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Residents</label>
                <input type="number" value={editConfig.startingResidents} onChange={(e) => updateEditConfig('startingResidents', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Rent</h3>
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
            </div>

            <div className="config-section">
              <h3>Ground Rent</h3>
              <div className="config-field">
                <label>Base (£/wk)</label>
                <input type="number" value={editConfig.groundRentBase} onChange={(e) => updateEditConfig('groundRentBase', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Bedroom Mod</label>
                <input type="number" step="0.01" value={editConfig.groundRentBedroomModifier} onChange={(e) => updateEditConfig('groundRentBedroomModifier', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Utilities</h3>
              <div className="config-field">
                <label>Base (£/wk)</label>
                <input type="number" value={editConfig.utilitiesBase} onChange={(e) => updateEditConfig('utilitiesBase', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Bedroom Mod</label>
                <input type="number" step="0.01" value={editConfig.utilitiesBedroomModifier} onChange={(e) => updateEditConfig('utilitiesBedroomModifier', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Buildings</h3>
              <div className="config-field">
                <label>Build Cost (£)</label>
                <input type="number" value={editConfig.bedroomBuildCost} onChange={(e) => updateEditConfig('bedroomBuildCost', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Capacity</label>
                <input type="number" value={editConfig.bedroomCapacity} onChange={(e) => updateEditConfig('bedroomCapacity', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Churn</h3>
              <div className="config-field">
                <label>Base Rate</label>
                <input type="number" step="0.01" value={editConfig.baseChurnRate} onChange={(e) => updateEditConfig('baseChurnRate', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Rent Mult</label>
                <input type="number" step="0.0001" value={editConfig.churnRentMultiplier} onChange={(e) => updateEditConfig('churnRentMultiplier', e.target.value)} />
              </div>
            </div>

            <div className="config-section">
              <h3>Game</h3>
              <div className="config-field">
                <label>Game Over (£)</label>
                <input type="number" value={editConfig.gameOverLimit} onChange={(e) => updateEditConfig('gameOverLimit', e.target.value)} />
              </div>
              <div className="config-field">
                <label>Tick (ms)</label>
                <input type="number" value={editConfig.tickSpeed} onChange={(e) => updateEditConfig('tickSpeed', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="llama-pool-section">
            <h3>Llama Pool ({gameState?.communeResidents?.length || 0} in commune)</h3>
            <p className="pool-info">
              Total llamas: 20 | Available for recruitment: {20 - (gameState?.communeResidents?.length || 0) - (gameState?.pendingArrivals?.length || 0)}
            </p>
            <div className="llama-pool-grid">
              {gameState?.communeResidents?.map(r => (
                <div key={r.id} className="pool-llama in-commune">
                  <span className="pool-name">{r.name}</span>
                  <span className="pool-status">In Commune</span>
                </div>
              ))}
              {gameState?.pendingArrivals?.map(r => (
                <div key={r.id} className="pool-llama pending">
                  <span className="pool-name">{r.name}</span>
                  <span className="pool-status">Arriving</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showWeeklyPanel && (
        <div 
          className={`floating-panel ${panelMinimized ? 'minimized' : ''}`}
          ref={panelRef}
          style={{ left: panelPosition.x, top: panelPosition.y }}
        >
          <div className="panel-header" onMouseDown={handlePanelMouseDown}>
            <div className="panel-title">Week {gameState.week} Planning</div>
            <div className="panel-controls">
              <button className="panel-btn minimize" onClick={() => setPanelMinimized(!panelMinimized)}>
                {panelMinimized ? '+' : '−'}
              </button>
            </div>
          </div>
          
          {!panelMinimized && (
            <div className="panel-content">
              <div className="panel-section">
                <label>Set Rent</label>
                <div className="rent-row">
                  <input 
                    type="range" 
                    min={config.rentMin} 
                    max={config.rentMax} 
                    value={rentInput}
                    onChange={handleRentSliderChange}
                    onMouseUp={handleRentSliderRelease}
                    onTouchEnd={handleRentSliderRelease}
                  />
                  <div className="rent-value">
                    <span>£</span>
                    <input
                      type="number"
                      value={rentInput}
                      onChange={handleRentInputChange}
                      onBlur={handleRentInputBlur}
                      onKeyDown={handleRentInputKeyDown}
                      min={config.rentMin}
                      max={config.rentMax}
                    />
                  </div>
                </div>
                {rentError && <div className="panel-error">{rentError}</div>}
              </div>

              <div className="panel-section">
                <label>Recruit</label>
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
                <label>Build</label>
                <button className="panel-action" onClick={() => setShowBuildModal(true)}>
                  Build
                </button>
              </div>

              <div className="panel-projection">
                <div className="proj-row">
                  <span>Income</span>
                  <span className="positive">{formatCurrency(projectedIncome)}</span>
                </div>
                <div className="proj-row">
                  <span>Expenses</span>
                  <span className="negative">-{formatCurrency(projectedGroundRent + projectedUtilities)}</span>
                </div>
                <div className="proj-row total">
                  <span>Net</span>
                  <span className={weeklyDelta >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(weeklyDelta)}
                  </span>
                </div>
              </div>

              <button className="panel-confirm" onClick={handleDismissWeekly}>
                Start Week
              </button>
            </div>
          )}
        </div>
      )}

      {showBuildModal && (
        <div className="modal-overlay" onClick={() => setShowBuildModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Build</h2>
            {buildings.map(building => (
              <div key={building.id} className="building-card">
                <h3>{building.name}</h3>
                <div className="building-stats">
                  <div>Cost: £{building.cost.toLocaleString()}</div>
                  <div>Capacity: +{building.capacity} residents</div>
                  <div>Ground Rent: {building.groundRentIncrease}</div>
                  <div>Utilities: {building.utilitiesIncrease}</div>
                </div>
                <button 
                  className="action-button"
                  onClick={handleBuildBedroom}
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
                    <button className="invite-button" onClick={() => handleInvite(llama.id)}>
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
    </div>
  );
}

export default App;
