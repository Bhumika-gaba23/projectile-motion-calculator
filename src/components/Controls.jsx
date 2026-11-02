import { useEffect, useState } from 'react';
import { Gauge, MoveUpRight, Ruler, Sparkles } from 'lucide-react';

const GRAVITIES = [
  { label: 'Earth', value: 9.81 },
  { label: 'Moon', value: 1.62 },
  { label: 'Mars', value: 3.72 },
  { label: 'Custom', value: 'custom' },
];

function NumberField({ label, icon: Icon, value, min, max, step, unit, onChange }) {
  const id = `field-${label.replaceAll(' ', '-').toLowerCase()}`;
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleChange = (event) => {
    const next = event.target.value;
    setDraft(next);
    if (next === '' || next === '-' || next === '.' || next === '-.') return;
    const parsed = Number(next);
    if (Number.isFinite(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || draft.trim() === '') {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="field-block parameter-field">
      <label htmlFor={id}><Icon size={15} />{label}</label>
      <div className="parameter-input">
        <input id={id} type="text" inputMode="decimal" value={draft} onChange={handleChange} onBlur={handleBlur} aria-label={`${label} in ${unit}`} />
        <span>{unit}</span>
      </div>
    </div>
  );
}

function CustomGravityInput({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleChange = (event) => {
    const next = event.target.value;
    setDraft(next);
    if (next === '' || next === '.' || next === '-') return;
    const parsed = Number(next);
    if (Number.isFinite(parsed) && parsed > 0) onChange(parsed);
  };

  const handleBlur = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0.01) {
      const fallback = Math.max(0.01, value || 9.81);
      onChange(fallback);
      setDraft(String(fallback));
      return;
    }
    const clamped = Math.min(100, parsed);
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="input-shell custom-gravity">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label="Custom gravity in metres per second squared"
      />
      <span>m/s²</span>
    </div>
  );
}

export default function Controls({ values, setValues, imperial, setImperial }) {
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const changeUnitSystem = (nextImperial) => {
    if (nextImperial === imperial) return;
    const factor = nextImperial ? 3.28084 : 1 / 3.28084;
    setValues((current) => ({
      ...current,
      velocity: Number((current.velocity * factor).toFixed(2)),
      height: Number((current.height * factor).toFixed(2)),
    }));
    setImperial(nextImperial);
  };

  return (
    <aside className="controls panel">
      <div className="panel-title-row">
        <div><span className="eyebrow">Parameters</span><h2>Launch setup</h2></div>
      </div>

      <div className="unit-section">
        <span className="unit-section-label">Unit system</span>
        <div className="unit-options" role="group" aria-label="Unit system">
          <button className={!imperial ? 'active' : ''} onClick={() => changeUnitSystem(false)}>
            <strong>Metric</strong><small>m · m/s</small>
          </button>
          <button className={imperial ? 'active' : ''} onClick={() => changeUnitSystem(true)}>
            <strong>Imperial</strong><small>ft · ft/s</small>
          </button>
        </div>
      </div>

      <NumberField label="Initial velocity" icon={Gauge} value={values.velocity} min={imperial ? 3.28 : 1} max={imperial ? 328.08 : 100} step={1} unit={imperial ? 'ft/s' : 'm/s'} onChange={(v) => update('velocity', v)} />
      <NumberField label="Launch angle" icon={MoveUpRight} value={values.angle} min={0} max={90} step={1} unit="°" onChange={(v) => update('angle', v)} />
      <NumberField label="Initial height" icon={Ruler} value={values.height} min={0} max={imperial ? 32808.4 : 10000} step={0.5} unit={imperial ? 'ft' : 'm'} onChange={(v) => update('height', v)} />

      <div className="field-block">
        <label>Gravity</label>
        <div className="gravity-grid">
          {GRAVITIES.map((item) => (
            <button key={item.label} className={values.gravityChoice === item.value ? 'active' : ''} onClick={() => {
              update('gravityChoice', item.value);
              if (item.value !== 'custom') update('gravity', item.value);
            }}>{item.label}<small>{item.value === 'custom' ? 'set value' : `${item.value} m/s²`}</small></button>
          ))}
        </div>
        {values.gravityChoice === 'custom' && <CustomGravityInput value={values.gravity} onChange={(value) => update('gravity', value)} />}
      </div>

      <div className="drag-card">
        <div className="drag-copy"><Sparkles size={16} /><div><strong>Air resistance</strong><span>Quadratic drag model</span></div></div>
        <button className={`switch ${values.drag ? 'on' : ''}`} role="switch" aria-checked={values.drag} onClick={() => update('drag', !values.drag)}><span /></button>
      </div>
      {values.drag && <div className="drag-coefficient"><label>Drag coefficient <span>{values.dragCoefficient.toFixed(3)}</span></label><input className="range" style={{ '--progress': `${((values.dragCoefficient - .001) / .029) * 100}%` }} type="range" min="0.001" max="0.03" step="0.001" value={values.dragCoefficient} onChange={(e) => update('dragCoefficient', Number(e.target.value))} /></div>}
    </aside>
  );
}
