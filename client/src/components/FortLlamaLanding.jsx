import { useState, useEffect, useRef } from "react";
import { T, FONT } from "./theme";

const PX = 4; // base pixel size for art

/* ═══════════════════════════════════════════
   PIXEL ART COMPONENTS
   Each draws on a mini canvas using "fat pixels"
   ═══════════════════════════════════════════ */

function PixelCanvas({ grid, palette, scale = PX, style = {} }) {
  const rows = grid.length;
  const cols = grid[0].length;
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cols * scale, rows * scale);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = grid[y][x];
        if (c !== "." && palette[c]) {
          ctx.fillStyle = palette[c];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }, [grid, palette, scale, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * scale}
      height={rows * scale}
      style={{ imageRendering: "pixelated", ...style }}
    />
  );
}

/* ── Castle HD — programmatic 76×50 grid ── */
function Castle({ scale = 5 }) {
  const W = 76, H = 50;
  const palette = {
    X: "#8a9aaa", B: "#7a8a9a", W: "#6a7a8a", C: "#5a6a7a",
    D: "#4a5a6a", S: "#3a4a5a", K: "#2a3a4a",
    J: "#556688", N: "#445577", O: "#334466", P: "#5a6a7a",
    1: "#c47e7e", 2: "#E8B84A", 3: "#8cc4a0", 4: "#7BB8D8", 5: "#d475a8",
    Y: "#E8B84A", V: "#D4A035", U: "#F5D576",
    A: "#5BA8C8", Q: "#82C8E0", T: "#6B5340", E: "#8B7355",
    Z: "#B8882A", I: "#C8982A",
    R: "#8B6530", F: "#7A5628", G: "#6B4820", H: "#5A3A18", L: "#D4A035",
    7: "#111111", 8: "#222222", 9: "#333333",
  };
  const g = Array.from({ length: H }, () => Array(W).fill("."));
  function rect(x, y, w, h, ch) {
    for (let r = y; r < y + h && r < H; r++)
      for (let c = x; c < x + w && c < W; c++)
        if (r >= 0 && c >= 0) g[r][c] = ch;
  }
  function px(x, y, ch) { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = ch; }
  function turretWall(x, y, w, h) {
    rect(x, y, w, h, "W"); rect(x, y, 1, h, "X"); rect(x + 1, y, 1, h, "B");
    rect(x + w - 1, y, 1, h, "D"); rect(x + w, y, 1, h, "S");
    for (let r = y + 2; r < y + h - 1; r += 3)
      for (let c = x + 2; c < x + w - 2; c += 4) px(c, r, "B");
  }
  function centralWall(x, y, w, h) {
    rect(x, y, w, h, "C");
    for (let r = y + 2; r < y + h - 1; r += 3) {
      for (let c = x + 1; c < x + w - 1; c += 5) px(c, r, "D");
      for (let c = x + 3; c < x + w - 1; c += 5) px(c, r + 1, "W");
    }
  }
  function cap(cx, y, halfW) {
    for (let row = 0; row <= halfW; row++)
      for (let c = cx - row; c <= cx + row; c++) {
        if (c < cx) px(c, y + row, "J");
        else if (c === cx) px(c, y + row, "N");
        else px(c, y + row, "O");
      }
    for (let c = cx - halfW - 1; c <= cx + halfW + 1; c++) px(c, y + halfW + 1, "B");
  }
  function window3(x, y) {
    rect(x - 1, y - 1, 5, 5, "S");
    px(x, y, "V"); px(x + 1, y, "Y"); px(x + 2, y, "V");
    px(x, y + 1, "Y"); px(x + 1, y + 1, "U"); px(x + 2, y + 1, "Y");
    px(x, y + 2, "V"); px(x + 1, y + 2, "Y"); px(x + 2, y + 2, "V");
  }
  function arrowSlit(x, y) {
    px(x, y, "K"); px(x, y + 1, "K"); px(x, y + 2, "K");
    px(x - 1, y + 1, "S"); px(x + 1, y + 1, "S");
  }
  function crenellations(x, y, w) {
    for (let c = x; c < x + w; c += 2) { px(c, y, "B"); px(c, y - 1, "B"); }
  }
  function woodenDoor(x, y, w, h) {
    for (let c = x; c < x + w; c++) {
      const plankShade = (c % 2 === 0) ? "R" : "F";
      for (let r = y; r < y + h; r++) px(c, r, plankShade);
    }
    for (let r = y; r < y + h; r++) { px(x, r, "G"); px(x + w - 1, r, "H"); }
    for (let r = y + 2; r < y + h - 1; r += 3)
      for (let c = x; c < x + w; c++) px(c, r, "G");
    px(x, y, "S"); px(x + 1, y - 1, "S");
    px(x + w - 1, y, "S"); px(x + w - 2, y - 1, "S");
    rect(x + 2, y - 1, w - 4, 1, "G");
    rect(x - 1, y - 1, 1, h + 1, "B"); rect(x + w, y - 1, 1, h + 1, "D");
    px(x + 2, y + Math.floor(h / 2), "L"); px(x + w - 3, y + Math.floor(h / 2), "L");
    rect(x, y + h, w, 1, "H");
  }

  const LT = 12, RT = 50, TW = 10, HTX = 63, GROUND = 43;
  cap(LT + 4, 3, 5);
  turretWall(LT + 1, 10, TW - 2, 5); crenellations(LT + 1, 10, TW - 2);
  arrowSlit(LT + 4, 11); arrowSlit(LT + 6, 12);
  rect(LT, 15, TW, 1, "B"); rect(LT, 16, TW, 1, "D");
  turretWall(LT, 17, TW, GROUND - 17); crenellations(LT, 17, TW);
  window3(LT + 3, 21); arrowSlit(LT + 2, 28); arrowSlit(LT + 7, 29); window3(LT + 3, 33);
  cap(RT + 4, 3, 5);
  turretWall(RT + 1, 10, TW - 2, 5); crenellations(RT + 1, 10, TW - 2);
  arrowSlit(RT + 4, 11); arrowSlit(RT + 6, 12);
  rect(RT, 15, TW, 1, "B"); rect(RT, 16, TW, 1, "D");
  turretWall(RT, 17, TW, GROUND - 17); crenellations(RT, 17, TW);
  window3(RT + 3, 21); arrowSlit(RT + 2, 28); arrowSlit(RT + 7, 29); window3(RT + 3, 33);
  px(LT + 4, 1, "D"); px(LT + 4, 2, "D"); px(RT + 4, 1, "D"); px(RT + 4, 2, "D");
  const CL = LT + TW, CW = RT - CL;
  centralWall(CL, 18, CW, GROUND - 18);
  rect(CL, 17, CW, 1, "B"); crenellations(CL, 17, CW);
  const buntColors = ["1", "2", "3", "4", "5"];
  for (let c = CL + 1, i = 0; c < RT - 1; c += 3, i++) px(c, 16, buntColors[i % 5]);
  window3(CL + 5, 22); window3(CL + 13, 22); window3(CL + 21, 22);
  rect(CL + 3, 28, 8, 1, "Z"); rect(CL + 4, 29, 6, 1, "I");
  rect(CL + 18, 28, 8, 1, "Z"); rect(CL + 19, 29, 6, 1, "I");
  const gateX = CL + 10, gateW = 8, gateY = 31, gateH = GROUND - 31;
  woodenDoor(gateX, gateY, gateW, gateH);
  window3(CL + 4, 33); window3(CL + 22, 33);
  const fLeft = LT - 2, fRight = RT + TW + 2;
  rect(fLeft, GROUND, fRight - fLeft, 1, "B");
  rect(fLeft, GROUND + 1, fRight - fLeft, 1, "D");
  rect(fLeft, GROUND + 2, fRight - fLeft, 1, "S");
  const htY = GROUND - 5;
  rect(HTX, htY, 9, 6, "E"); rect(HTX, htY, 9, 1, "T");
  rect(HTX, htY, 1, 6, "T"); rect(HTX + 8, htY, 1, 6, "T");
  rect(HTX, htY + 5, 9, 1, "T"); rect(HTX + 1, htY + 1, 7, 4, "A");
  px(HTX + 2, htY + 2, "Q"); px(HTX + 5, htY + 3, "Q");
  px(HTX + 6, htY + 2, "Q"); px(HTX + 3, htY + 4, "Q");
  rect(HTX, GROUND, 9, 1, "T"); rect(HTX + 1, GROUND + 1, 7, 1, "E");
  rect(HTX + 1, GROUND + 2, 7, 1, "T");
  return <PixelCanvas grid={g} palette={palette} scale={scale} />;
}

/* ── Llama with Sunglasses & Tights ── */
function Llama({ scale = 4, tights = null }) {
  const palette = {
    W: "#F5F0E8",
    C: "#E8DDD0",
    B: "#282828",
    N: "#c4a882",
    E: "#3a3a3a",
    P: "#D4A035",
    G: "#444444",
    L: tights || "#8B7355",
    H: "#6B5340",
  };
  const grid = [
    "..EW.....WE..",
    "..EW.....WE..",
    "..WW.....WW..",
    "..WWWWWWWWW..",
    "..WWWWWWWWW..",
    "..WPGGPGGPW..",
    "..WPGGPGGPW..",
    "..WWWWNWWWW..",
    "..WWWNNWWWW..",
    "...WWWWWWW...",
    "....WWWWW....",
    "....WWWWW....",
    "...CWWWWWC...",
    "..CCWWWWWCC..",
    "..CWWWWWWWC..",
    "..CWWWWWWWC..",
    "..CWWWWWWWC..",
    "..CWWWWWWWC..",
    "..CWWWWWWWC..",
    "..CL.CC.LC..",
    "..LL.CC.LL..",
    "..LH.LH.LH..",
    "..HH.HH.HH..",
  ].map(r => r.split(""));
  return <PixelCanvas grid={grid} palette={palette} scale={scale} />;
}

/* ── Hot Tub ── */
function HotTub({ scale = 4 }) {
  const palette = {
    W: "#8B7355",
    D: "#6B5340",
    B: "#5B8FAF",
    S: "#7BB8D8",
    F: "#87CEEB",
    H: "#9a9690",
  };
  const grid = [
    "......S..S......",
    ".....S..S.S.....",
    "....S..S..S.....",
    "...HHHHHHHHHH...",
    "..HDDDDDDDDDH..",
    "..HWBBBBBBBWH...",
    "..HWBFBFBFBWH...",
    "..HWBBBBBBBWH...",
    "..HWBFBFBFBWH...",
    "..HWBBBBBBBWH...",
    "..HDDDDDDDDDH..",
    "...HHHHHHHHHH...",
    "...DWWWWWWWD....",
    "...DWWWWWWWD....",
    "...DDDDDDDDDD...",
  ].map(r => r.split(""));
  return <PixelCanvas grid={grid} palette={palette} scale={scale} />;
}

/* ── Burning Man Temple Spire ── */
function TempleSpire({ scale = 3 }) {
  const palette = {
    W: "#D4A035",
    D: "#A08040",
    F: "#E8B84A",
    R: "#c47e7e",
    O: "#e0a050",
  };
  const grid = [
    "......F......",
    ".....FRF.....",
    ".....FFF.....",
    "......W......",
    "......W......",
    ".....DWD.....",
    "....DWWWD....",
    ".....DWD.....",
    "......W......",
    "....DWWWD....",
    "...DWWWWWD...",
    "....DWWWD....",
    "...DWWWWWD...",
    "..DWWWWWWWD..",
    "..DDDDDDDDD..",
  ].map(r => r.split(""));
  return <PixelCanvas grid={grid} palette={palette} scale={scale} />;
}

/* ── Simple fire pixel animation ── */
function PixelFire({ scale = 3 }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setFrame(f => (f + 1) % 3), 250);
    return () => clearInterval(iv);
  }, []);

  const palette = {
    R: "#c47e7e",
    O: "#e0a050",
    Y: "#E8B84A",
    W: "#F5F0E8",
  };
  const frames = [
    [
      "..Y..",
      ".YOY.",
      ".ORO.",
      "ROROR",
      ".RRR.",
    ],
    [
      ".Y...",
      ".OYO.",
      "YORO.",
      ".ROR.",
      "RRORR",
    ],
    [
      "...Y.",
      ".YOY.",
      ".OOR.",
      "ROROY",
      ".RRR.",
    ],
  ];
  return <PixelCanvas grid={frames[frame].map(r => r.split(""))} palette={palette} scale={scale} />;
}

/* ═══════════════════════════════════════════
   SATELLITE DISH — garden installation
   ═══════════════════════════════════════════ */
function SatelliteDish({ scale = 3 }) {
  const palette = {
    G: "#222",
    D: "#111",
    S: "#333",
    P: "#222",
    R: "#333",
    _: null,
  };
  const grid = [
    "_________R",
    "________R_",
    "_DDGGGG___",
    "DDGGGGGS__",
    "DGGGGGSS__",
    "DGGGGSS___",
    "_DGGSS____",
    "___PP_____",
    "___PP_____",
    "___PP_____",
    "__PPPP____",
  ].map(r => r.split(""));
  return <PixelCanvas grid={grid} palette={palette} scale={scale} />;
}

/* ═══════════════════════════════════════════
   GRASS STRIP — repeating pixel pattern
   ═══════════════════════════════════════════ */
function GrassStrip() {
  return (
    <div style={{
      width: "100%",
      height: "60px",
      background: `
        linear-gradient(to bottom,
          #5ab87a 0%,
          #4a9a68 40%,
          #3d8558 100%)
      `,
      position: "relative",
      overflow: "hidden",
      imageRendering: "pixelated",
    }}>
      <svg width="100%" height="24" style={{ position: "absolute", top: -12 }}>
        <defs>
          <pattern id="grass" x="0" y="0" width="16" height="24" patternUnits="userSpaceOnUse">
            <rect x="2" y="8" width="4" height="16" fill="#5ab87a" />
            <rect x="6" y="4" width="4" height="20" fill="#4a9a68" />
            <rect x="10" y="10" width="4" height="14" fill="#6bc88a" />
            <rect x="0" y="6" width="4" height="18" fill="#4a9a68" />
            <rect x="12" y="2" width="4" height="22" fill="#5ab87a" />
          </pattern>
        </defs>
        <rect width="100%" height="24" fill="url(#grass)" />
      </svg>
      <div style={{
        position: "absolute", bottom: 0, width: "100%", height: "20px",
        background: "#3d7a50",
      }} />
      <div style={{
        position: "absolute", bottom: 0, width: "100%", height: "8px",
        background: "#8B7355",
        borderTop: "4px solid #6B5340",
      }} />
    </div>
  );
}


/* ═══════════════════════════════════════════
   LEADERBOARD MODAL
   ═══════════════════════════════════════════ */
function LeaderboardModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.panelBg,
          border: `3px solid ${T.accent}`,
          padding: "32px 40px",
          maxWidth: 520,
          width: "90%",
          textAlign: "center",
        }}
      >
        <h2 style={{
          fontFamily: FONT, fontSize: "14px", color: T.accent,
          letterSpacing: "2px", margin: "0 0 24px",
        }}>
          LEADERBOARD
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderBottom: `2px solid ${T.panelBorderLight}`,
          paddingBottom: 8,
          marginBottom: 12,
        }}>
          {["PLAYER", "VERSION", "SCORE"].map(h => (
            <span key={h} style={{
              fontFamily: FONT, fontSize: "8px",
              color: T.accent, letterSpacing: "1px",
            }}>{h}</span>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              padding: "8px 0",
              borderBottom: `1px solid ${T.panelBorder}`,
            }}>
              {["---", "---", "---"].map((v, j) => (
                <span key={j} style={{
                  fontFamily: FONT, fontSize: "7px",
                  color: T.textMuted,
                }}>{v}</span>
              ))}
            </div>
          ))}

          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(48,48,48,0.55)",
            backdropFilter: "blur(2px)",
          }}>
            <div style={{
              padding: "14px 32px",
              background: "rgba(90,184,122,0.15)",
              border: `2px solid rgba(90,184,122,0.5)`,
            }}>
              <span style={{
                fontFamily: FONT, fontSize: "12px",
                color: "#5ab87a", letterSpacing: "3px",
              }}>
                COMING SOON
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              fontFamily: FONT, fontSize: "8px",
              background: T.buttonBg,
              color: T.textSecondary,
              border: `2px solid ${T.buttonBorder}`,
              padding: "8px 20px",
              cursor: "pointer",
              letterSpacing: "1px",
            }}
            onMouseEnter={e => {
              e.target.style.background = T.buttonHover;
              e.target.style.color = T.textPrimary;
            }}
            onMouseLeave={e => {
              e.target.style.background = T.buttonBg;
              e.target.style.color = T.textSecondary;
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════ */
export default function FortLlamaLanding({ onStartGame, onContinueGame }) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hovCTA, setHovCTA] = useState(false);
  const [hovContinue, setHovContinue] = useState(false);
  const [hovLB, setHovLB] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [wide, setWide] = useState(typeof window !== "undefined" ? window.innerWidth >= 640 : true);
  const [saveMeta, setSaveMeta] = useState(null);
  const [checkingState, setCheckingState] = useState(true);

  useEffect(() => {
    fetch('/api/has-save')
      .then(r => r.json())
      .then(data => {
        if (data.hasSave) setSaveMeta(data.meta);
      })
      .catch(() => {})
      .finally(() => setCheckingState(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(to bottom, #6BB8E0 0%, #87CEEB 30%, #9BD8F0 100%)`,
      fontFamily: FONT,
      color: T.textPrimary,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes fl-drift1 { 0% { transform: translateX(-20%); } 100% { transform: translateX(120%); } }
        @keyframes fl-drift2 { 0% { transform: translateX(120%); } 100% { transform: translateX(-20%); } }
        @keyframes fl-drift3 { 0% { transform: translateX(-10%); } 100% { transform: translateX(110%); } }
        @keyframes fl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fl-jump1 {
          0%, 65%, 100% { transform: translateY(0); }
          12% { transform: translateY(-24px); }
          25% { transform: translateY(0); }
          35% { transform: translateY(-10px); }
          45% { transform: translateY(0); }
        }
        @keyframes fl-jump2 {
          0%, 55%, 100% { transform: translateY(0); }
          10% { transform: translateY(-16px); }
          22% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
          38% { transform: translateY(0); }
        }
        @keyframes fl-jump3 {
          0%, 72%, 100% { transform: translateY(0); }
          14% { transform: translateY(-30px); }
          30% { transform: translateY(0); }
          42% { transform: translateY(-14px); }
          54% { transform: translateY(0); }
        }
        @keyframes fl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes fl-fadein { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fl-sun-glow { 0%, 100% { box-shadow: 0 0 60px 20px rgba(232,184,74,0.3); } 50% { box-shadow: 0 0 80px 30px rgba(232,184,74,0.45); } }
        @keyframes fl-steam {
          0% { opacity: 0.6; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(1.5); }
        }
        @keyframes fl-flag {
          0%, 100% { transform: skewX(0deg); }
          50% { transform: skewX(-5deg); }
        }
        @keyframes fl-flag-l {
          0%, 100% { transform: skewX(0deg) scaleX(1); }
          20% { transform: skewX(-10deg) scaleX(0.88); }
          45% { transform: skewX(5deg) scaleX(1.05); }
          70% { transform: skewX(-4deg) scaleX(0.94); }
        }
        @keyframes fl-flag-r {
          0%, 100% { transform: skewX(0deg) scaleX(1); }
          30% { transform: skewX(8deg) scaleX(0.9); }
          55% { transform: skewX(-6deg) scaleX(1.06); }
          80% { transform: skewX(3deg) scaleX(0.95); }
        }
        @keyframes fl-dish-scan {
          0%, 100% { transform: scaleX(1); }
          40%      { transform: scaleX(0.6); }
          60%      { transform: scaleX(0.7); }
        }
        @keyframes fl-pulseA {
          0%, 100% { background: rgba(232,184,74,0.4); }
          8%       { background: rgba(212,117,168,0.85); }
          20%      { background: rgba(232,184,74,0.4); }
          50%      { background: rgba(232,184,74,0.4); }
          58%      { background: rgba(168,85,200,0.75); }
          70%      { background: rgba(232,184,74,0.4); }
        }
        @keyframes fl-pulseB {
          0%, 100% { background: rgba(232,184,74,0.4); }
          8%       { background: rgba(91,168,200,0.8); }
          20%      { background: rgba(232,184,74,0.4); }
          50%      { background: rgba(232,184,74,0.4); }
          58%      { background: rgba(212,117,168,0.8); }
          70%      { background: rgba(232,184,74,0.4); }
        }
        @keyframes fl-doorspill {
          0%, 100% { box-shadow: 0 6px 14px 4px rgba(232,184,74,0.3); }
          8%       { box-shadow: 0 6px 24px 8px rgba(212,117,168,0.5); }
          20%      { box-shadow: 0 6px 14px 4px rgba(232,184,74,0.3); }
          50%      { box-shadow: 0 6px 14px 4px rgba(232,184,74,0.3); }
          58%      { box-shadow: 0 6px 24px 8px rgba(168,85,200,0.45); }
          70%      { box-shadow: 0 6px 14px 4px rgba(232,184,74,0.3); }
        }
      `}</style>

      {/* ── Clouds ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {[
          { w: 220, top: "6%", opacity: 0.5, dur: "80s", anim: "fl-drift1", delay: "0s" },
          { w: 340, top: "12%", opacity: 0.4, dur: "110s", anim: "fl-drift2", delay: "-30s" },
          { w: 180, top: "3%", opacity: 0.55, dur: "70s", anim: "fl-drift3", delay: "-15s" },
          { w: 280, top: "18%", opacity: 0.35, dur: "95s", anim: "fl-drift1", delay: "-50s" },
          { w: 160, top: "9%", opacity: 0.45, dur: "65s", anim: "fl-drift2", delay: "-10s" },
          { w: 400, top: "22%", opacity: 0.3, dur: "120s", anim: "fl-drift3", delay: "-40s" },
        ].map((c, i) => (
          <div key={i} style={{
            position: "absolute", top: c.top,
            width: c.w, height: 50,
            background: "radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)",
            filter: "blur(6px)",
            opacity: c.opacity,
            animation: `${c.anim} ${c.dur} linear infinite`,
            animationDelay: c.delay,
          }} />
        ))}
      </div>

      {/* ── Sun ── */}
      <div style={{
        position: "absolute",
        top: "5%",
        right: "12%",
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: "radial-gradient(circle, #F5E6A8 0%, #E8B84A 50%, rgba(232,184,74,0) 70%)",
        animation: "fl-sun-glow 4s ease-in-out infinite",
        zIndex: 0,
      }} />

      {/* ── Content wrapper ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}>

        {/* ══ TITLE AREA ══ */}
        <div style={{
          marginTop: "5vh",
          textAlign: "center",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease-out",
        }}>
          <h1 style={{
            fontFamily: FONT,
            fontSize: "clamp(24px, 5.5vw, 52px)",
            color: T.accent,
            letterSpacing: "5px",
            margin: 0,
            textShadow: `
              4px 4px 0 ${T.bg},
              -1px -1px 0 ${T.bg},
              1px -1px 0 ${T.bg},
              -1px 1px 0 ${T.bg},
              0 0 30px rgba(212,160,53,0.5)
            `,
            lineHeight: 1.3,
          }}>
            WELCOME TO<br />FORT LLAMA
          </h1>
          <p style={{
            fontFamily: FONT,
            fontSize: "clamp(7px, 1.3vw, 11px)",
            color: T.bg,
            letterSpacing: "3px",
            marginTop: 16,
            textShadow: "1px 1px 0 rgba(255,255,255,0.3)",
            opacity: 0.8,
          }}>
            FIGHT ENTROPY / NURTURE COMMUNITY / HERD LLAMAS
          </p>
        </div>

        {/* ══ SCENE ══ */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1000,
          padding: "0 20px",
          position: "relative",
          alignSelf: "center",
          marginTop: 24,
          marginBottom: -40,
        }}>

          {wide && (
            <div style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s ease-out 0.3s",
              zIndex: 2,
              position: "relative",
            }}>
              {/* Satellite dish */}
              <div style={{
                position: "absolute",
                right: "100%",
                bottom: 20,
                marginRight: 14,
                opacity: loaded ? 1 : 0,
                transition: "all 1s ease-out 0.4s",
                transformOrigin: "center center",
                animation: "fl-dish-scan 6s ease-in-out infinite",
              }}>
                <SatelliteDish scale={5} />
              </div>

              {/* Left flag */}
              <div style={{
                position: "absolute",
                top: 5 * 1, left: 5 * 17,
                width: 20, height: 14,
                background: "linear-gradient(135deg, #D4A035, #E8B84A)",
                clipPath: "polygon(0 0, 100% 15%, 80% 50%, 100% 85%, 0 100%)",
                animation: "fl-flag-l 1.8s ease-in-out infinite",
                transformOrigin: "left center", zIndex: 6,
              }} />

              {/* Right flag */}
              <div style={{
                position: "absolute",
                top: 5 * 1, left: 5 * 55,
                width: 20, height: 14,
                background: "linear-gradient(225deg, #d475a8, #e088b8)",
                clipPath: "polygon(100% 0, 0 15%, 20% 50%, 0 85%, 100% 100%)",
                animation: "fl-flag-r 2.1s ease-in-out infinite",
                transformOrigin: "right center", zIndex: 6,
              }} />

              {/* Party windows */}
              {[
                { gx: 15, gy: 21, anim: "fl-pulseA" },
                { gx: 15, gy: 33, anim: "fl-pulseB" },
                { gx: 35, gy: 22, anim: "fl-pulseA" },
                { gx: 26, gy: 33, anim: "fl-pulseB" },
                { gx: 53, gy: 21, anim: "fl-pulseB" },
                { gx: 53, gy: 33, anim: "fl-pulseA" },
                { gx: 27, gy: 22, anim: "fl-pulseB" },
                { gx: 43, gy: 22, anim: "fl-pulseA" },
                { gx: 44, gy: 33, anim: "fl-pulseB" },
              ].map((w, i) => (
                <div key={`g-${i}`} style={{
                  position: "absolute",
                  left: w.gx * 5,
                  top: w.gy * 5,
                  width: 3 * 5,
                  height: 3 * 5,
                  borderRadius: 2,
                  animation: `${w.anim} 1.6s linear infinite`,
                  pointerEvents: "none",
                  zIndex: 6,
                }} />
              ))}

              {/* Door warm light spill */}
              <div style={{
                position: "absolute",
                left: 5 * 31, top: 5 * 43,
                width: 5 * 10, height: 5 * 3,
                borderRadius: "50%",
                animation: "fl-doorspill 1.6s linear infinite",
                pointerEvents: "none", zIndex: 1,
              }} />

              {/* Steam wisps */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: "absolute",
                  left: 5 * (64 + i * 3),
                  top: 5 * 36,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "rgba(255,255,255,0.55)",
                  animation: "fl-steam 2s ease-out infinite",
                  animationDelay: `${i * 0.6}s`, zIndex: 5,
                }} />
              ))}

              {/* Llamas — right of castle */}
              <div style={{
                position: "absolute",
                left: "100%",
                bottom: 0,
                marginLeft: 16,
                display: "flex",
                alignItems: "flex-end",
              }}>
                {[
                  { tights: "#d475a8", anim: "fl-jump1", dur: "2.2s", delay: "0s" },
                  { tights: "#5BA8C8", anim: "fl-jump2", dur: "1.8s", delay: "0.6s" },
                  { tights: "#E8B84A", anim: "fl-jump3", dur: "2.8s", delay: "1.3s" },
                ].map((llama, i) => (
                  <div key={i} style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "translateY(0)" : "translateY(30px)",
                    transition: `all 1s ease-out ${0.5 + i * 0.15}s`,
                    animation: loaded ? `${llama.anim} ${llama.dur} ease-in-out infinite` : "none",
                    animationDelay: llama.delay,
                    zIndex: 3,
                    marginLeft: i > 0 ? -4 : 0,
                  }}>
                    <Llama scale={4} tights={llama.tights} />
                  </div>
                ))}
              </div>

              <Castle scale={5} />
            </div>
          )}

          {/* Llamas — mobile layout (no castle) */}
          {!wide && [
            { tights: "#d475a8", anim: "fl-jump1", dur: "2.2s", delay: "0s" },
            { tights: "#5BA8C8", anim: "fl-jump2", dur: "1.8s", delay: "0.6s" },
            { tights: "#E8B84A", anim: "fl-jump3", dur: "2.8s", delay: "1.3s" },
          ].map((llama, i) => (
            <div key={i} style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transition: `all 1s ease-out ${0.5 + i * 0.15}s`,
              animation: loaded ? `${llama.anim} ${llama.dur} ease-in-out infinite` : "none",
              animationDelay: llama.delay,
              zIndex: 3,
              marginLeft: i === 0 ? 0 : -4,
            }}>
              <Llama scale={5} tights={llama.tights} />
            </div>
          ))}

        </div>

        {/* ══ GRASS ══ */}
        <GrassStrip />

        {/* ══ CTA AREA ══ */}
        <div style={{
          background: `linear-gradient(to bottom, #3d7a50 0%, ${T.bg} 35%)`,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 20px 20px",
          gap: 16,
        }}>

          {/* Continue Game button — shown when a save exists */}
          {saveMeta && (
            <button
              onMouseEnter={() => setHovContinue(true)}
              onMouseLeave={() => setHovContinue(false)}
              onClick={onContinueGame}
              style={{
                fontFamily: FONT,
                fontSize: "clamp(10px, 2vw, 14px)",
                letterSpacing: "3px",
                color: hovContinue ? "#fff" : T.bg,
                background: hovContinue
                  ? `linear-gradient(to bottom, #E8B84A, #D4A035)`
                  : `linear-gradient(to bottom, #D4A035, #B8882A)`,
                border: `3px solid ${hovContinue ? "#E8B84A" : T.accent}`,
                padding: "16px 48px",
                cursor: "pointer",
                textShadow: hovContinue ? "0 0 10px rgba(255,255,255,0.4)" : "none",
                boxShadow: hovContinue
                  ? "0 0 30px rgba(212,160,53,0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "0 4px 0 #8B6B20, 0 6px 12px rgba(0,0,0,0.3)",
                transform: hovContinue ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.15s ease-out",
                position: "relative",
              }}
            >
              CONTINUE GAME
              <span style={{
                display: "block",
                fontFamily: FONT,
                fontSize: "clamp(5px, 0.9vw, 7px)",
                letterSpacing: "1px",
                color: hovContinue ? "rgba(255,255,255,0.7)" : "rgba(48,48,48,0.6)",
                marginTop: 4,
              }}>
                WEEK {saveMeta.week} · {saveMeta.residents} RESIDENTS · {(saveMeta.vibes || '').toUpperCase()}
              </span>
            </button>
          )}

          {/* Start New Game button */}
          <button
            onMouseEnter={() => setHovCTA(true)}
            onMouseLeave={() => setHovCTA(false)}
            onClick={() => {
              if (saveMeta) {
                if (!window.confirm('This will erase your saved game. Are you sure?')) return;
              }
              onStartGame();
            }}
            style={{
              fontFamily: FONT,
              fontSize: saveMeta ? "clamp(7px, 1.3vw, 10px)" : "clamp(10px, 2vw, 14px)",
              letterSpacing: saveMeta ? "2px" : "3px",
              color: saveMeta
                ? (hovCTA ? T.accent : T.textSecondary)
                : (hovCTA ? "#fff" : T.bg),
              background: saveMeta
                ? "transparent"
                : (hovCTA
                    ? `linear-gradient(to bottom, #E8B84A, #D4A035)`
                    : `linear-gradient(to bottom, #D4A035, #B8882A)`),
              border: saveMeta
                ? `1px solid ${hovCTA ? T.accentBorder : T.panelBorder}`
                : `3px solid ${hovCTA ? "#E8B84A" : T.accent}`,
              padding: saveMeta ? "8px 24px" : "16px 48px",
              cursor: "pointer",
              textShadow: !saveMeta && hovCTA ? "0 0 10px rgba(255,255,255,0.4)" : "none",
              boxShadow: saveMeta
                ? "none"
                : (hovCTA
                    ? "0 0 30px rgba(212,160,53,0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
                    : "0 4px 0 #8B6B20, 0 6px 12px rgba(0,0,0,0.3)"),
              transform: !saveMeta && hovCTA ? "translateY(-2px)" : "translateY(0)",
              transition: "all 0.15s ease-out",
              position: "relative",
            }}
          >
            START NEW GAME
          </button>

          {/* Leaderboard link */}
          <button
            onMouseEnter={() => setHovLB(true)}
            onMouseLeave={() => setHovLB(false)}
            onClick={() => setShowLeaderboard(true)}
            style={{
              fontFamily: FONT,
              fontSize: "clamp(6px, 1vw, 8px)",
              letterSpacing: "2px",
              color: hovLB ? T.accent : T.textSecondary,
              background: "transparent",
              border: `1px solid ${hovLB ? T.accentBorder : T.panelBorder}`,
              padding: "8px 24px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            LEADERBOARD
          </button>

          {/* Footer */}
          <p style={{
            fontFamily: FONT,
            fontSize: "6px",
            color: T.textMuted,
            letterSpacing: "1px",
            marginTop: 8,
          }}>
            FortLlama:TheGame v.0.6 · 10-1 Games, 2026
          </p>
        </div>
      </div>

      {/* ── Leaderboard Modal ── */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
