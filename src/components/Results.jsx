import { ArrowDownRight, Clock3, Mountain, Route } from 'lucide-react';

const resultItems = [
  { key: 'maxHeight', label: 'Maximum height', icon: Mountain, unit: 'length' },
  { key: 'flightTime', label: 'Flight time', icon: Clock3, unit: 'time' },
  { key: 'range', label: 'Horizontal range', icon: Route, unit: 'length' },
  { key: 'impactVelocity', label: 'Impact velocity', icon: ArrowDownRight, unit: 'speed' },
];

export default function Results({ results, imperial }) {
  const factor = imperial ? 3.28084 : 1;
  return <section className="results-grid">
    {resultItems.map(({ key, label, icon: Icon, unit }, index) => {
      const value = unit === 'time' ? results[key] : results[key] * factor;
      const suffix = unit === 'time' ? 's' : unit === 'speed' ? (imperial ? 'ft/s' : 'm/s') : (imperial ? 'ft' : 'm');
      return <article className="result-card" key={key} style={{ '--delay': `${index * 50}ms` }}>
        <div className="result-top"><span>{label}</span><Icon size={17} /></div>
        <div className="result-value">{value.toFixed(2)} <small>{suffix}</small></div>
      </article>;
    })}
  </section>;
}
