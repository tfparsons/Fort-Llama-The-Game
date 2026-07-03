import React, { useState, useRef, useCallback, useEffect } from 'react';
import { T, TREE_COLORS, TREE_LABELS } from '../theme';

// Dev tools section: research cost/effect configuration for every tech,
// laid out per tree with SVG connector lines between parent and child nodes.
// Connector geometry is measured from the DOM after render (and on resize).
export function TechTreeEditor({ techTree, buildings, techConfig, onUpdateTechConfig }) {
  const containerRef = useRef(null);
  const [connectors, setConnectors] = useState({});

  const measure = useCallback(() => {
    const container = containerRef.current;
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
      setConnectors(newConnectors);
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const timer = setTimeout(measure, 100);
    const container = containerRef.current;
    const ro = new ResizeObserver(() => measure());
    if (container) ro.observe(container);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [techTree, buildings, techConfig, measure]);

  return (
    <div className="dev-tools-grid">
      <div className="config-section" style={{gridColumn: '1 / -1'}}>
        <h3>Tech Tree Configuration</h3>
        <p style={{color: T.textSecondary, fontSize: '0.75rem', marginBottom: '8px'}}>Configure research costs and effects for each technology. Changes apply on Reset.</p>
        <div ref={containerRef}>
        {['livingStandards', 'productivity', 'fun'].map(treeName => {
          const treeLabel = TREE_LABELS[treeName] || treeName;
          const treeColor = TREE_COLORS[treeName] || T.textMuted;
          const treeTechs = (techTree || []).filter(t => t.tree === treeName);
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
                  const cfg = techConfig?.[tech.id] || {};
                  const unlockedBuilding = (buildings || []).find(b => b.techRequired === tech.id);
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
                          onChange={(e) => onUpdateTechConfig(tech.id, 'cost', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      {tech.type === 'fixed_expense' && (
                        <>
                          <div className="config-field" style={{marginBottom: '4px'}}>
                            <label style={{fontSize: '0.7rem'}}>Weekly Cost</label>
                            <input type="number" step="10" min="0"
                              value={cfg.weeklyCost ?? 0}
                              onChange={(e) => onUpdateTechConfig(tech.id, 'weeklyCost', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="config-field" style={{marginBottom: '0'}}>
                            <label style={{fontSize: '0.7rem'}}>Effect %</label>
                            <input type="number" step="1" min="0"
                              value={cfg.effectPercent ?? 0}
                              onChange={(e) => onUpdateTechConfig(tech.id, 'effectPercent', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </>
                      )}
                      {tech.type === 'policy' && tech.id === 'ocado' && (
                        <div className="config-field" style={{marginBottom: '0'}}>
                          <label style={{fontSize: '0.7rem'}}>Effect %</label>
                          <input type="number" step="1" min="0"
                            value={cfg.effectPercent ?? 15}
                            onChange={(e) => onUpdateTechConfig(tech.id, 'effectPercent', parseInt(e.target.value) || 0)}
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
              {connectors[treeName] && (
                <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible'}}
                  viewBox={`0 0 ${connectors[treeName].width} ${connectors[treeName].height}`}
                  preserveAspectRatio="none">
                  {connectors[treeName].paths.map((d, i) => (
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
  );
}
