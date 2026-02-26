/**
 * SkyZone — decorative pixel cloud layer.
 * Floats behind the game UI. pointer-events: none so clicks pass through.
 */
export function SkyZone() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Large puffy cloud */}
      <div style={{ position: 'absolute', top: '20%', left: '5%', animation: 'fl-drift1 90s linear infinite', animationDelay: '-10s' }}>
        <svg width="320" height="96" viewBox="0 0 40 12" shapeRendering="crispEdges" style={{ opacity: 0.85 }}>
          <rect x="10" y="0" width="8" height="4" fill="#fff"/><rect x="22" y="0" width="6" height="4" fill="#fff"/>
          <rect x="6" y="4" width="28" height="4" fill="#fff"/>
          <rect x="2" y="8" width="36" height="4" fill="#fff"/>
        </svg>
      </div>
      {/* Medium cloud (right-to-left) */}
      <div style={{ position: 'absolute', top: '40%', left: '55%', animation: 'fl-drift2 110s linear infinite', animationDelay: '-35s' }}>
        <svg width="240" height="64" viewBox="0 0 30 8" shapeRendering="crispEdges" style={{ opacity: 0.75 }}>
          <rect x="6" y="0" width="18" height="4" fill="#fff"/>
          <rect x="2" y="4" width="26" height="4" fill="#fff"/>
        </svg>
      </div>
      {/* Small cloud */}
      <div style={{ position: 'absolute', top: '55%', left: '15%', animation: 'fl-drift3 70s linear infinite', animationDelay: '-5s' }}>
        <svg width="160" height="64" viewBox="0 0 20 8" shapeRendering="crispEdges" style={{ opacity: 0.7 }}>
          <rect x="4" y="0" width="12" height="4" fill="#fff"/>
          <rect x="0" y="4" width="20" height="4" fill="#fff"/>
        </svg>
      </div>
      {/* Large cloud - lower right */}
      <div style={{ position: 'absolute', top: '35%', left: '75%', animation: 'fl-drift1 100s linear infinite', animationDelay: '-50s' }}>
        <svg width="280" height="96" viewBox="0 0 35 12" shapeRendering="crispEdges" style={{ opacity: 0.8 }}>
          <rect x="8" y="0" width="10" height="4" fill="#fff"/><rect x="20" y="0" width="6" height="4" fill="#fff"/>
          <rect x="4" y="4" width="26" height="4" fill="#fff"/>
          <rect x="0" y="8" width="35" height="4" fill="#fff"/>
        </svg>
      </div>
      {/* Small wisp */}
      <div style={{ position: 'absolute', top: '60%', left: '40%', animation: 'fl-drift2 65s linear infinite', animationDelay: '-20s' }}>
        <svg width="120" height="48" viewBox="0 0 15 6" shapeRendering="crispEdges" style={{ opacity: 0.65 }}>
          <rect x="3" y="0" width="9" height="3" fill="#fff"/>
          <rect x="0" y="3" width="15" height="3" fill="#fff"/>
        </svg>
      </div>
    </div>
  );
}
