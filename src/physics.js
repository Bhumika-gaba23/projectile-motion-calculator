const MAX_STEPS = 12000;

export function calculateTrajectory({ velocity, angle, height, gravity, drag, dragCoefficient }) {
  const theta = (angle * Math.PI) / 180;
  let x = 0;
  let y = Math.max(0, height);
  let vx = velocity * Math.cos(theta);
  let vy = velocity * Math.sin(theta);
  let t = 0;
  let apex = { x, y, t };
  const points = [{ x, y, t }];

  // Small fixed time-step makes the numerical drag model stable and responsive.
  const estimatedTime = (vy + Math.sqrt(vy * vy + 2 * gravity * y)) / gravity;
  const dt = Math.min(0.012, Math.max(0.002, estimatedTime / 700));
  const k = drag ? dragCoefficient : 0;

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const previous = { x, y, t, vx, vy };
    const speed = Math.hypot(vx, vy);
    const ax = -k * speed * vx;
    const ay = -gravity - k * speed * vy;

    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    t += dt;

    if (y > apex.y) apex = { x, y, t };
    if (i % 5 === 0) points.push({ x, y: Math.max(0, y), t });

    if (y <= 0 && t > dt) {
      const ratio = previous.y / (previous.y - y);
      x = previous.x + (x - previous.x) * ratio;
      t = previous.t + dt * ratio;
      vx = previous.vx + (vx - previous.vx) * ratio;
      vy = previous.vy + (vy - previous.vy) * ratio;
      points.push({ x, y: 0, t });
      break;
    }
  }

  return {
    points,
    apex,
    maxHeight: apex.y,
    flightTime: t,
    range: x,
    impactVelocity: Math.hypot(vx, vy),
  };
}

export function convertLength(value, toImperial) {
  return toImperial ? value * 3.28084 : value;
}

export function convertSpeed(value, toImperial) {
  return toImperial ? value * 3.28084 : value;
}
