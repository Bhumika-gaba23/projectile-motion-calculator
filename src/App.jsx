import { useMemo, useState } from 'react';
import { Orbit, RotateCcw } from 'lucide-react';
import Controls from './components/Controls';
import Results from './components/Results';
import TrajectoryChart from './components/TrajectoryChart';
import LabTools from './components/LabTools';
import { calculateTrajectory } from './physics';

const defaults = { velocity: 20, angle: 45, height: 0, gravity: 9.81, gravityChoice: 9.81, drag: false, dragCoefficient: .008 };

export default function App() {
  const [values, setValues] = useState(defaults);
  const [imperial, setImperial] = useState(false);
  const [mass, setMass] = useState(1);
  const [comparisons, setComparisons] = useState([]);
  const [targetMode, setTargetMode] = useState(false);
  const [target, setTarget] = useState({ x: 30, y: 0 });
  const [theme, setTheme] = useState('light');

  const metricValues = useMemo(() => ({ ...values, velocity: imperial ? values.velocity / 3.28084 : values.velocity, height: imperial ? values.height / 3.28084 : values.height }), [values, imperial]);
  const trajectory = useMemo(() => calculateTrajectory(metricValues), [metricValues]);
  const resetParameters = () => {
    setImperial(false);
    setValues({ ...defaults });
    setMass(1);
    setComparisons([]);
    setTargetMode(false);
  };

  return <main className={`theme-${theme}`}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="site-header">
      <a className="brand" href="#"><span><Orbit size={19} /></span>ARC<span className="brand-suffix">/ LAB 01</span></a>
      <div className="header-actions">
        <LabTools values={values} setValues={setValues} trajectory={trajectory} imperial={imperial} mass={mass} setMass={setMass} comparisons={comparisons} setComparisons={setComparisons} target={target} setTarget={setTarget} targetMode={targetMode} setTargetMode={setTargetMode} theme={theme} setTheme={setTheme} />
        <button type="button" className="reset" onClick={resetParameters} aria-label="Reset all parameters to defaults"><RotateCcw size={14} />Reset parameters</button>
      </div>
    </header>

    <section className="hero">
      <div><span className="kicker"><i />Interactive physics instrument</span><h1>Shape the arc.<br /><em>See the science.</em></h1></div>
      <p>Explore how velocity, angle, gravity, and drag shape the path of a projectile—calculated in real time.</p>
    </section>

    <div className="app-grid">
      <Controls values={values} setValues={setValues} imperial={imperial} setImperial={setImperial} />
      <div className="workspace"><Results results={trajectory} imperial={imperial} /><TrajectoryChart trajectory={trajectory} imperial={imperial} comparisons={comparisons} target={target} setTarget={setTarget} targetMode={targetMode} /></div>
    </div>

    <footer><span>NUMERICAL MODEL / Δt ADAPTIVE</span><span>NO-DRAG MODEL ANALYTICALLY VERIFIED</span></footer>
  </main>;
}
