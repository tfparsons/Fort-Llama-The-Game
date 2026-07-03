import { STAT_DISPLAY } from '../components/theme';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Maps raw server game state plus client-side inputs to the flat props
// consumed by the dashboard components and modals. Pure function.
export function buildDashboardProps({ gameState, config, budgetInputs, rentInput, isPaused, buildings, recruitCandidates, displayTime }) {
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
}
