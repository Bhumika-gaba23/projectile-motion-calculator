import { useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Pause, Play, RotateCcw } from 'lucide-react';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function TrajectoryChart({ trajectory, imperial, comparisons = [], target, setTarget, targetMode }) {
  const factor = imperial ? 3.28084 : 1;
  const lengthUnit = imperial ? 'ft' : 'm';
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const duration = Math.min(6500, Math.max(2600, trajectory.flightTime * 700));
  const pointIndex = Math.min(trajectory.points.length - 1, Math.round(progress * (trajectory.points.length - 1)));
  const currentPoint = trajectory.points[pointIndex] || trajectory.points[0];
  const neighborPoint = trajectory.points[Math.min(trajectory.points.length - 1, pointIndex + 1)] || currentPoint;
  const previousPoint = trajectory.points[Math.max(0, pointIndex - 1)] || currentPoint;
  const velocityDt = Math.max(.0001, neighborPoint.t - previousPoint.t);
  const velocityX = (neighborPoint.x - previousPoint.x) / velocityDt;
  const velocityY = (neighborPoint.y - previousPoint.y) / velocityDt;
  const vectorScale = Math.max(0.08, trajectory.range / Math.max(1, Math.hypot(velocityX, velocityY)) * .12);

  useEffect(() => {
    setProgress(1);
    setPlaying(false);
  }, [trajectory]);

  useEffect(() => {
    if (!playing) return undefined;
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp - progress * duration;
      const next = Math.min(1, (timestamp - startRef.current) / duration);
      setProgress(next);
      if (next < 1) frameRef.current = requestAnimationFrame(animate);
      else {
        setPlaying(false);
        startRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing]);

  const togglePlayback = () => {
    if (progress >= 1) setProgress(0);
    startRef.current = null;
    setPlaying((current) => !current);
  };

  const replay = () => {
    setProgress(0);
    startRef.current = null;
    setPlaying(true);
  };

  const data = useMemo(() => ({ datasets: [
    ...comparisons.map((item) => ({
      label: item.label,
      data: item.trajectory.points.map((p) => ({ x: p.x * factor, y: p.y * factor, t: p.t })),
      parsing: false, borderColor: item.color, borderWidth: 1.5, borderDash: [5, 4],
      pointRadius: 0, tension: .2, fill: false,
    })),
    {
      label: 'Trajectory',
      data: trajectory.points.map((p) => ({ x: p.x * factor, y: p.y * factor, t: p.t })),
      parsing: false, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, .08)',
      borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 2, tension: .2, fill: true,
    },
    {
      label: 'Apex', data: [{ x: trajectory.apex.x * factor, y: trajectory.apex.y * factor, t: trajectory.apex.t }],
      parsing: false, showLine: false, pointRadius: 5, pointHoverRadius: 7,
      pointBackgroundColor: '#f5a524', pointBorderColor: '#fff', pointBorderWidth: 3,
    },
    {
      label: 'Projectile', data: [{ x: currentPoint.x * factor, y: currentPoint.y * factor, t: currentPoint.t }],
      parsing: false, showLine: false, pointRadius: 7, pointHoverRadius: 8,
      pointBackgroundColor: '#172033', pointBorderColor: '#fff', pointBorderWidth: 3,
    },
    {
      label: 'Velocity vector',
      data: [
        { x: currentPoint.x * factor, y: currentPoint.y * factor, t: currentPoint.t },
        { x: (currentPoint.x + velocityX * vectorScale) * factor, y: Math.max(0, currentPoint.y + velocityY * vectorScale) * factor, t: currentPoint.t },
      ],
      parsing: false, borderColor: '#10b981', borderWidth: 2, pointRadius: [0, 4],
      pointStyle: ['circle', 'triangle'], pointBackgroundColor: '#10b981', fill: false, tension: 0,
    },
    ...(targetMode ? [{
      label: 'Target', data: [{ x: target.x, y: target.y, t: 0 }], parsing: false, showLine: false,
      pointRadius: 9, pointHoverRadius: 11, pointStyle: 'crossRot', pointBackgroundColor: '#ef4444',
      pointBorderColor: '#ef4444', pointBorderWidth: 3,
    }] : [])
  ] }), [trajectory, factor, currentPoint, comparisons, targetMode, target, velocityX, velocityY, vectorScale]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: { duration: 180 }, interaction: { mode: 'nearest', intersect: false },
    onClick: (event, _elements, chart) => {
      if (!targetMode || !setTarget) return;
      const x = Math.max(0, chart.scales.x.getValueForPixel(event.x));
      const y = Math.max(0, chart.scales.y.getValueForPixel(event.y));
      setTarget({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#172033', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { title: (items) => items[0]?.dataset.label === 'Apex' ? 'Apex' : `t = ${items[0]?.raw.t.toFixed(2)} s`, label: (ctx) => `x ${ctx.raw.x.toFixed(2)} ${lengthUnit}  ·  y ${ctx.raw.y.toFixed(2)} ${lengthUnit}` }
      }
    },
    scales: {
      x: { type: 'linear', min: 0, title: { display: true, text: `DISTANCE / ${lengthUnit.toUpperCase()}`, color: '#8a94a6', font: { family: 'DM Mono', size: 10 } }, grid: { color: 'rgba(148,163,184,.16)' }, border: { display: false }, ticks: { color: '#8a94a6', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 7 } },
      y: { beginAtZero: true, title: { display: true, text: `HEIGHT / ${lengthUnit.toUpperCase()}`, color: '#8a94a6', font: { family: 'DM Mono', size: 10 } }, grid: { color: 'rgba(148,163,184,.16)' }, border: { display: false }, ticks: { color: '#8a94a6', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 6 } }
    }
  }), [lengthUnit, targetMode, setTarget]);

  return <section className="chart-panel panel">
    <div className="chart-header">
      <div><span className="eyebrow">Live simulation</span><h2>Flight trajectory</h2></div>
      <div className="chart-actions">
        <div className="live-readout"><span>t {currentPoint.t.toFixed(2)}s</span><span>x {(currentPoint.x * factor).toFixed(1)}{lengthUnit}</span><span>y {(currentPoint.y * factor).toFixed(1)}{lengthUnit}</span><span className="velocity-readout">vₓ {(velocityX * factor).toFixed(1)} · vᵧ {(velocityY * factor).toFixed(1)}</span></div>
        <div className="chart-legend"><span><i className="line-dot" />Path</span><span><i className="apex-dot" />Apex</span></div>
      </div>
    </div>
    <div className={`chart-wrap ${targetMode ? 'target-cursor' : ''}`}><Line data={data} options={options} /></div>
    <div className="playback-bar">
      <button type="button" className="play-button" onClick={togglePlayback} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
      <input className="timeline" type="range" min="0" max="1" step="0.001" value={progress} style={{ '--timeline-progress': `${progress * 100}%` }} onChange={(event) => { setPlaying(false); setProgress(Number(event.target.value)); startRef.current = null; }} aria-label="Flight timeline" />
      <button type="button" className="replay-button" onClick={replay} aria-label="Replay simulation"><RotateCcw size={13} /></button>
    </div>
  </section>;
}
