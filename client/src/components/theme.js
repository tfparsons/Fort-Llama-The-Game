// Design tokens — "Sky" theme v6
// Every component imports from here — single source of truth for the pixel art theme

export const T = {
  pageBg: '#87CEEB',
  bg: '#282828',
  panelBg: '#303030',
  panelBorder: '#4a4a4a',
  panelBorderLight: '#585858',
  textPrimary: '#e6e2dc',
  textSecondary: '#9c9894',
  textMuted: '#6a6866',
  accent: '#D4A035',
  accentBright: '#E8B84A',
  accentBg: 'rgba(212,160,53,0.10)',
  accentBorder: 'rgba(212,160,53,0.28)',
  ls: '#b07cc8',
  pr: '#7eaac4',
  pt: '#d475a8',
  positive: '#8cc4a0',
  negative: '#c47e7e',
  actionBg: '#2b2b2b',
  buttonBg: '#3a3a3a',
  buttonBorder: '#4a4a4a',
  buttonHover: '#444444',
};

export const FONT = "'Press Start 2P', monospace";
export const FONT_BODY = "'Share Tech Mono', monospace";

export const FS = {
  brand: '14px',
  display: '13px',
  heading: '11px',
  body: '10px',
  label: '9px',
  micro: '8px',
};

// Map tier labels to traffic-light colours
const GOOD_TIERS = ['Comfortable', 'Quiet', 'Sparkling', 'Shipshape', 'Fresh', 'Lively', 'Fed', 'Stuffed', 'Motivated', 'Driven', 'Ecstatic', 'Fun'];
const MID_TIERS = ['Cosy', 'Noisy', 'Grubby', 'Worn', 'Tired', 'Moderate', 'Peckish', 'Ambling', 'Amused'];

export function tierColor(tierLabel) {
  if (GOOD_TIERS.includes(tierLabel)) return T.positive;
  if (MID_TIERS.includes(tierLabel)) return '#b07cc8';
  return T.negative;
}

// Budget internal keys → display names and pillar colours
export const BUDGET_DISPLAY = {
  nutrition:    { name: 'Ingredients',    color: T.ls },
  fun:          { name: 'Party Supplies', color: T.pt },
  drive:        { name: 'Internet',       color: T.pr },
  cleanliness:  { name: 'Cleaning',       color: T.ls },
  maintenance:  { name: 'Repairs',        color: T.ls },
  fatigue:      { name: 'Recovery',       color: T.pt },
};

// Server stat keys → display labels
export const STAT_DISPLAY = {
  sharingTolerance: 'Sharing',
  cookingSkill:     'Cooking',
  tidiness:         'Tidiness',
  handiness:        'Handiness',
  consideration:    'Consider.',
  sociability:      'Sociable',
  partyStamina:     'Party',
  workEthic:        'Work',
};

// Noticeboard event type → icon + colour
export function evtStyle(type) {
  switch (type) {
    case 'arrival':   return { icon: '►', color: T.positive };
    case 'departure': return { icon: '◄', color: T.negative };
    case 'warning':   return { icon: '▲', color: T.ls };
    case 'good':      return { icon: '★', color: T.pr };
    default:          return { icon: '·', color: T.textMuted };
  }
}

// Tech tree accent colours — match health metric pillar they feed into
// livingStandards tree → LS metric, productivity tree → PR metric, fun tree → PT metric
export const TREE_COLORS = {
  livingStandards: T.ls,
  productivity:    T.pr,
  fun:             T.pt,
};

export const TREE_LABELS = {
  livingStandards: 'Living Standards',
  productivity:    'Productivity',
  fun:             'Leisure',
};

export const TYPE_LABELS = {
  policy:        'Policy',
  fixed_expense: 'Fixed Cost',
  building:      'Building',
  upgrade:       'Upgrade',
  culture:       'Culture',
};
