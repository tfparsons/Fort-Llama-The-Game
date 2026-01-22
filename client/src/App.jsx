import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '';

function App() {
  const [view, setView] = useState('dashboard');
  const [gameState, setGameState] = useState(null);
  const [config, setConfig] = useState(null);
  const [editConfig, setEditConfig] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildings, setBuildings] = useState([]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      const data = await res.json();
      setGameState(data);
      setConfig(data.config);
      if (!editConfig) {
        setEditConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  }, [editConfig]);

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

  const handleStart = async () => {
    await fetch(`${API_BASE}/api/start`, { method: 'POST' });
    fetchState();
  };

  const handlePause = async () => {
    await fetch(`${API_BASE}/api/pause`, { method: 'POST' });
    fetchState();
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    fetchState();
  };

  const handleSetRent = async (rent) => {
    await fetch(`${API_BASE}/api/action/set-rent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rent: parseInt(rent) })
    });
    fetchState();
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
    const prefix = val < 0 ? '-£' : '£';
    return `${prefix}${Math.abs(val).toLocaleString()}`;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Fort Llama: The Game</h1>
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
      </header>

      {gameState.isGameOver && (
        <div className="game-over">
          <h2>GAME OVER</h2>
          <p>The commune has gone bankrupt! Treasury: {formatCurrency(gameState.treasury)}</p>
          <button className="btn-reset" onClick={handleReset}>Try Again</button>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="dashboard">
          <div className="card">
            <h2>Status</h2>
            <div className="stat">
              <span className="stat-label">Week</span>
              <span className="stat-value">{gameState.week}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Treasury</span>
              <span className={`stat-value ${gameState.treasury >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(gameState.treasury)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Residents</span>
              <span className="stat-value">{gameState.residents} / {gameState.capacity}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Bedrooms</span>
              <span className="stat-value">{gameState.bedrooms}</span>
            </div>
            {gameState.recruitQueue > 0 && (
              <div className="stat">
                <span className="stat-label">Arriving next week</span>
                <span className="stat-value positive">+{gameState.recruitQueue}</span>
              </div>
            )}
            <div className="controls">
              {!gameState.isRunning ? (
                <button className="btn-start" onClick={handleStart}>Start</button>
              ) : (
                <button className="btn-pause" onClick={handlePause}>Pause</button>
              )}
              <button className="btn-reset" onClick={handleReset}>Reset</button>
            </div>
          </div>

          <div className="card">
            <h2>Actions</h2>
            <div className="slider-container">
              <label>Rent per Resident (£/week)</label>
              <input 
                type="range" 
                min={config.rentMin} 
                max={config.rentMax} 
                value={gameState.currentRent}
                onChange={(e) => handleSetRent(e.target.value)}
              />
              <div className="slider-value">{formatCurrency(gameState.currentRent)}</div>
            </div>
            <button 
              className="action-button"
              onClick={() => handleRecruit(1)}
              disabled={
                gameState.residents + gameState.recruitQueue >= gameState.capacity ||
                gameState.recruitsThisWeek >= config.maxRecruitPerWeek
              }
            >
              Recruit Resident ({config.maxRecruitPerWeek - (gameState.recruitsThisWeek || 0)} left this week)
            </button>
            <button 
              className="action-button"
              onClick={() => setShowBuildModal(true)}
            >
              Build...
            </button>
          </div>

          <div className="card">
            <h2>Weekly Finances</h2>
            <div className="stat">
              <span className="stat-label">Income (Rent)</span>
              <span className="stat-value positive">
                {formatCurrency(gameState.residents * gameState.currentRent)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Ground Rent</span>
              <span className="stat-value negative">
                -{formatCurrency(Math.round(config.groundRentBase * (1 + Math.max(0, gameState.bedrooms - 1) * config.groundRentBedroomModifier)))}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Utilities</span>
              <span className="stat-value negative">
                -{formatCurrency(Math.round(config.utilitiesBase * (1 + Math.max(0, gameState.bedrooms - 1) * config.utilitiesBedroomModifier)))}
              </span>
            </div>
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
      )}

      {view === 'devtools' && editConfig && (
        <div className="dev-tools">
          <h2>Developer Tools</h2>
          <p style={{color: '#aaa', marginBottom: '20px'}}>
            Warning: Applying changes will reset the simulation!
          </p>

          <div className="config-section">
            <h3>Starting Values</h3>
            <div className="config-field">
              <label>Starting Treasury (£)</label>
              <input 
                type="number" 
                value={editConfig.startingTreasury} 
                onChange={(e) => updateEditConfig('startingTreasury', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Starting Bedrooms</label>
              <input 
                type="number" 
                value={editConfig.startingBedrooms} 
                onChange={(e) => updateEditConfig('startingBedrooms', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Starting Residents</label>
              <input 
                type="number" 
                value={editConfig.startingResidents} 
                onChange={(e) => updateEditConfig('startingResidents', e.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Rent Settings</h3>
            <div className="config-field">
              <label>Minimum Rent (£)</label>
              <input 
                type="number" 
                value={editConfig.rentMin} 
                onChange={(e) => updateEditConfig('rentMin', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Maximum Rent (£)</label>
              <input 
                type="number" 
                value={editConfig.rentMax} 
                onChange={(e) => updateEditConfig('rentMax', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Default Rent (£)</label>
              <input 
                type="number" 
                value={editConfig.defaultRent} 
                onChange={(e) => updateEditConfig('defaultRent', e.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Overheads</h3>
            <div className="config-field">
              <label>Ground Rent Base (£/week)</label>
              <input 
                type="number" 
                value={editConfig.groundRentBase} 
                onChange={(e) => updateEditConfig('groundRentBase', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Ground Rent Bedroom Modifier (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={editConfig.groundRentBedroomModifier} 
                onChange={(e) => updateEditConfig('groundRentBedroomModifier', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Utilities Base (£/week)</label>
              <input 
                type="number" 
                value={editConfig.utilitiesBase} 
                onChange={(e) => updateEditConfig('utilitiesBase', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Utilities Bedroom Modifier (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={editConfig.utilitiesBedroomModifier} 
                onChange={(e) => updateEditConfig('utilitiesBedroomModifier', e.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Buildings</h3>
            <div className="config-field">
              <label>Bedroom Build Cost (£)</label>
              <input 
                type="number" 
                value={editConfig.bedroomBuildCost} 
                onChange={(e) => updateEditConfig('bedroomBuildCost', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Bedroom Capacity</label>
              <input 
                type="number" 
                value={editConfig.bedroomCapacity} 
                onChange={(e) => updateEditConfig('bedroomCapacity', e.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Residents</h3>
            <div className="config-field">
              <label>Base Churn Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={editConfig.baseChurnRate} 
                onChange={(e) => updateEditConfig('baseChurnRate', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Churn Rent Multiplier</label>
              <input 
                type="number" 
                step="0.0001"
                value={editConfig.churnRentMultiplier} 
                onChange={(e) => updateEditConfig('churnRentMultiplier', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Max Recruit Per Week</label>
              <input 
                type="number" 
                value={editConfig.maxRecruitPerWeek} 
                onChange={(e) => updateEditConfig('maxRecruitPerWeek', e.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <h3>Game Settings</h3>
            <div className="config-field">
              <label>Game Over Limit (£)</label>
              <input 
                type="number" 
                value={editConfig.gameOverLimit} 
                onChange={(e) => updateEditConfig('gameOverLimit', e.target.value)}
              />
            </div>
            <div className="config-field">
              <label>Tick Speed (ms)</label>
              <input 
                type="number" 
                value={editConfig.tickSpeed} 
                onChange={(e) => updateEditConfig('tickSpeed', e.target.value)}
              />
            </div>
          </div>

          <button className="apply-button" onClick={handleApplyConfig}>
            Apply & Reset Simulation
          </button>
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
