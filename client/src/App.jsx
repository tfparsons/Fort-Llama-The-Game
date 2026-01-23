import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '';

function App() {
  const [view, setView] = useState('dashboard');
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [rentInput, setRentInput] = useState('');
  const [rentError, setRentError] = useState('');
  
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 80 });
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
        const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
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
    const val = e.target.value;
    setRentInput(val);
    setRentError('');
    handleSetRent(val);
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

  const handleRecruit = async (count = 1) => {
    await fetch(`${API_BASE}/api/action/recruit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    fetchState();
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
              {gameState.recruitQueue > 0 && (
                <div className="stat">
                  <span className="stat-label">Arriving next week</span>
                  <span className="stat-value positive">+{gameState.recruitQueue}</span>
                </div>
              )}
              <div className="controls">
                <button className="btn-reset" onClick={handleReset}>Reset Game</button>
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
                    <span className="stat-value negative">-{gameState.lastWeekSummary.churnedResidents}</span>
                  </div>
                  {gameState.lastWeekSummary.arrivingResidents > 0 && (
                    <div className="stat">
                      <span className="stat-label">New Arrivals</span>
                      <span className="stat-value positive">+{gameState.lastWeekSummary.arrivingResidents}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'devtools' && editConfig && (
        <div className="dev-tools">
          <div className="dev-tools-header">
            <h2>Developer Tools</h2>
            <button className="apply-button" onClick={handleApplyConfig}>
              Apply & Reset
            </button>
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
              <div className="config-field">
                <label>Max Recruit/Wk</label>
                <input type="number" value={editConfig.maxRecruitPerWeek} onChange={(e) => updateEditConfig('maxRecruitPerWeek', e.target.value)} />
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
                    value={gameState.currentRent}
                    onChange={handleRentSliderChange}
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
                <label>Recruit ({gameState.recruitsThisWeek}/{config.maxRecruitPerWeek} this week)</label>
                <button 
                  className="panel-action"
                  onClick={() => handleRecruit(1)}
                  disabled={
                    gameState.residents + gameState.recruitQueue >= gameState.capacity ||
                    gameState.recruitsThisWeek >= config.maxRecruitPerWeek
                  }
                >
                  +1 Resident (arrives next week)
                </button>
                {gameState.recruitQueue > 0 && (
                  <div className="panel-note positive">+{gameState.recruitQueue} arriving next week</div>
                )}
              </div>

              <div className="panel-section">
                <label>Build</label>
                <button className="panel-action" onClick={() => setShowBuildModal(true)}>
                  Build Menu (£{config.bedroomBuildCost.toLocaleString()})
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
            <h2>Build Menu</h2>
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
    </div>
  );
}

export default App;
