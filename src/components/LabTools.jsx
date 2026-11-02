import { useMemo, useState } from 'react';
import { Download, FlaskConical, Layers3, Moon, Orbit, Target, X, Zap } from 'lucide-react';

const COLORS = ['#ef4444', '#10b981', '#8b5cf6'];
const LAUNCH_PRESETS = {
  Basketball: { velocity: 8, angle: 52, height: 2 },
  'Football kick': { velocity: 25, angle: 40, height: 0 },
  Cannonball: { velocity: 55, angle: 45, height: 1 },
  'Baseball throw': { velocity: 35, angle: 35, height: 1.8 },
  'Lunar jump': { velocity: 5, angle: 45, height: 0, gravity: 1.62, gravityChoice: 1.62 },
};

const WORLDS = [
  ['Earth', 9.81], ['Moon', 1.62], ['Mars', 3.72], ['Mercury', 3.7],
  ['Venus', 8.87], ['Jupiter', 24.79], ['Pluto', 0.62],
];

export default function LabTools({ values, setValues, trajectory, imperial, mass, setMass, comparisons, setComparisons, target, setTarget, targetMode, setTargetMode, theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('presets');
  const factor = imperial ? 3.28084 : 1;
  const unit = imperial ? 'ft' : 'm';
  const velocityMetric = imperial ? values.velocity / 3.28084 : values.velocity;
  const heightMetric = imperial ? values.height / 3.28084 : values.height;
  const energy = useMemo(() => {
    const initial = .5 * mass * velocityMetric ** 2 + mass * values.gravity * heightMetric;
    const impact = .5 * mass * trajectory.impactVelocity ** 2;
    return {
      kinetic: .5 * mass * velocityMetric ** 2,
      potential: mass * values.gravity * trajectory.maxHeight,
      impact,
      lost: Math.max(0, initial - impact),
    };
  }, [mass, velocityMetric, heightMetric, values.gravity, trajectory]);

  const missDistance = Math.min(...trajectory.points.map((point) => Math.hypot(point.x * factor - target.x, point.y * factor - target.y)));
  const applyPreset = (preset) => {
    const next = LAUNCH_PRESETS[preset];
    const lengthFactor = imperial ? 3.28084 : 1;
    setValues((current) => ({ ...current, ...next, velocity: next.velocity * lengthFactor, height: next.height * lengthFactor }));
  };
  const setWorld = (name, gravity) => setValues((current) => ({ ...current, gravity, gravityChoice: [9.81, 1.62, 3.72].includes(gravity) ? gravity : 'custom' }));
  const saveComparison = () => {
    if (comparisons.length >= 3) return;
    setComparisons((current) => [...current, { id: Date.now(), label: `Launch ${current.length + 1}`, color: COLORS[current.length], trajectory, values: { ...values } }]);
  };

  const download = (href, filename) => { const a = document.createElement('a'); a.href = href; a.download = filename; a.click(); };
  const exportCSV = () => {
    const csv = ['time,x,y', ...trajectory.points.map((p) => `${p.t.toFixed(4)},${(p.x * factor).toFixed(4)},${(p.y * factor).toFixed(4)}`)].join('\n');
    download(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), 'projectile-trajectory.csv');
  };
  const exportPNG = () => {
    const canvas = document.querySelector('.chart-wrap canvas');
    if (canvas) download(canvas.toDataURL('image/png'), 'projectile-trajectory.png');
  };

  const tabs = [
    ['presets', Orbit, 'Presets'], ['compare', Layers3, 'Compare'], ['target', Target, 'Target'],
    ['energy', Zap, 'Energy'], ['learn', FlaskConical, 'Learn'], ['export', Download, 'Export'], ['theme', Moon, 'Theme'],
  ];

  return <>
    <button type="button" className="lab-tools-button" onClick={() => setOpen(true)}><FlaskConical size={14} />Lab tools</button>
    {open && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <section className="lab-modal" role="dialog" aria-modal="true" aria-label="Lab tools">
        <header><div><span className="eyebrow">Extended laboratory</span><h2>Lab tools</h2></div><button className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button></header>
        <nav className="lab-tabs">{tabs.map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={14} /><span>{label}</span></button>)}</nav>
        <div className="lab-content">
          {tab === 'presets' && <div className="tool-section"><h3>Launch presets</h3><p>Start with a familiar real-world motion, then fine-tune it.</p><div className="choice-grid">{Object.keys(LAUNCH_PRESETS).map((name) => <button key={name} onClick={() => applyPreset(name)}>{name}</button>)}</div><h3>Environment</h3><div className="world-grid">{WORLDS.map(([name, g]) => <button key={name} onClick={() => setWorld(name, g)}><strong>{name}</strong><small>{g} m/s²</small></button>)}</div></div>}
          {tab === 'compare' && <div className="tool-section"><h3>Compare trajectories</h3><p>Save up to three launches. Saved paths appear behind the current trajectory.</p><button className="primary-tool" onClick={saveComparison} disabled={comparisons.length >= 3}>Save current launch</button><div className="saved-list">{comparisons.map((item) => <div key={item.id}><i style={{ background: item.color }} /><span>{item.label}<small>{item.values.velocity} {imperial ? 'ft/s' : 'm/s'} · {item.values.angle}°</small></span><button onClick={() => setComparisons((all) => all.filter((entry) => entry.id !== item.id))}>Remove</button></div>)}{!comparisons.length && <div className="empty-state">No saved launches yet.</div>}</div></div>}
          {tab === 'target' && <div className="tool-section"><div className="section-heading"><div><h3>Target challenge</h3><p>Turn it on, then click anywhere on the graph to place the target.</p></div><button className={`mode-switch ${targetMode ? 'active' : ''}`} onClick={() => setTargetMode(!targetMode)}>{targetMode ? 'On' : 'Off'}</button></div><div className="target-inputs"><label>Target X <div><input type="number" value={target.x} onChange={(e) => setTarget({ ...target, x: Math.max(0, Number(e.target.value)) })} /><span>{unit}</span></div></label><label>Target Y <div><input type="number" value={target.y} onChange={(e) => setTarget({ ...target, y: Math.max(0, Number(e.target.value)) })} /><span>{unit}</span></div></label></div><div className={`accuracy-card ${missDistance < 2 ? 'hit' : ''}`}><span>{missDistance < 2 ? 'Target hit!' : 'Nearest distance to target'}</span><strong>{missDistance.toFixed(2)} {unit}</strong></div></div>}
          {tab === 'energy' && <div className="tool-section"><h3>Energy dashboard</h3><p>Set projectile mass to inspect the energy balance.</p><label className="mass-field">Projectile mass <div><input type="number" min="0.01" value={mass} onChange={(e) => setMass(Math.max(.01, Number(e.target.value)))} /><span>kg</span></div></label><div className="energy-grid"><article><span>Initial kinetic</span><strong>{energy.kinetic.toFixed(1)} J</strong></article><article><span>Potential at apex</span><strong>{energy.potential.toFixed(1)} J</strong></article><article><span>Impact kinetic</span><strong>{energy.impact.toFixed(1)} J</strong></article><article><span>Lost to drag</span><strong>{energy.lost.toFixed(1)} J</strong></article></div></div>}
          {tab === 'learn' && <div className="tool-section"><h3>Equations in use</h3><div className="formula-list"><div><code>x(t) = v₀ cos(θ)t</code><span>Horizontal position</span></div><div><code>y(t) = y₀ + v₀ sin(θ)t − ½gt²</code><span>Vertical position</span></div><div><code>vᵧ(t) = v₀ sin(θ) − gt</code><span>Vertical velocity</span></div></div><h3>Live insights</h3><ul className="insights"><li>The apex occurs at <strong>{trajectory.apex.t.toFixed(2)} s</strong> and {Number(trajectory.maxHeight * factor).toFixed(2)} {unit}.</li><li>The projectile lands after <strong>{trajectory.flightTime.toFixed(2)} s</strong> at {Number(trajectory.range * factor).toFixed(2)} {unit}.</li><li>{values.drag ? 'Air resistance reduces range and mechanical energy.' : values.height === 0 && values.angle === 45 ? 'At equal launch and landing heights, 45° maximizes range.' : 'Try 45° at zero height to explore maximum range.'}</li></ul></div>}
          {tab === 'export' && <div className="tool-section"><h3>Export results</h3><p>Take the simulation data or visual with you.</p><div className="export-list"><button onClick={exportPNG}><Download size={16} /><span><strong>Trajectory image</strong><small>Download chart as PNG</small></span></button><button onClick={exportCSV}><Download size={16} /><span><strong>Simulation data</strong><small>Download coordinates as CSV</small></span></button><button onClick={() => window.print()}><Download size={16} /><span><strong>Printable report</strong><small>Print or save as PDF</small></span></button></div></div>}
          {tab === 'theme' && <div className="tool-section"><h3>Appearance</h3><p>Choose a visual mode for your workspace.</p><div className="theme-grid">{[['light','Light'],['dark','Dark'],['contrast','High contrast']].map(([key,label]) => <button className={theme === key ? 'active' : ''} key={key} onClick={() => setTheme(key)}><i className={`theme-preview ${key}`} /><strong>{label}</strong></button>)}</div></div>}
        </div>
      </section>
    </div>}
  </>;
}
