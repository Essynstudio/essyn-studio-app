// HeroBirds v5 — Bezier-path flight + scroll parallax + thermal spirals + scroll-synced reveal
import { useRef, useEffect, useCallback } from "react";

/* ── Palette ── */
const TONES: [number, number, number][] = [
  [58, 46, 40],
  [75, 60, 50],
  [95, 76, 58],
  [120, 98, 72],
];
const GOLD: [number, number, number] = [184, 150, 90];

/* ── Bezier math ── */
function cb(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}
function cbd(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/* ── Types ── */
interface Path { x: [number, number, number, number]; y: [number, number, number, number] }

interface Bird {
  path: Path;
  t: number;
  speed: number;
  size: number;
  depth: number;        // 0.2–1 → parallax factor
  tone: [number, number, number];
  maxOpacity: number;
  wingPhase: number;
  wingBaseSpeed: number;
  nextFlap: number;
  flapEnd: number;
  isFlapping: boolean;
  delay: number;
  alive: boolean;
  // thermal spiral overlay
  hasThermal: boolean;
  thermalStart: number; // t when thermal begins
  thermalEnd: number;
  thermalCx: number;    // center x of thermal
  thermalCy: number;
  thermalR: number;     // radius
  thermalDir: number;   // 1 or -1
}

interface Feather {
  x: number; y: number; vy: number;
  rotation: number; rotSpeed: number;
  wobblePhase: number; wobbleDrift: number;
  size: number; opacity: number;
  depth: number;
  tone: [number, number, number];
}

interface Mote {
  x: number; y: number; vy: number;
  life: number; maxLife: number; r: number;
  depth: number;
  tone: [number, number, number];
}

/* ── Path generators ── */
function genPath(w: number, h: number, goRight: boolean): Path {
  const yBand = h * 0.08 + Math.random() * h * 0.5;
  const yDrift = (Math.random() - 0.5) * h * 0.22;
  const midSag = (Math.random() - 0.5) * h * 0.16;
  if (goRight) {
    return {
      x: [-80 - Math.random() * 120, w * 0.2 + Math.random() * w * 0.15, w * 0.55 + Math.random() * w * 0.2, w + 80 + Math.random() * 120],
      y: [yBand, yBand + midSag, yBand + yDrift - midSag * 0.5, yBand + yDrift],
    };
  }
  return {
    x: [w + 80 + Math.random() * 120, w * 0.75 - Math.random() * w * 0.15, w * 0.35 - Math.random() * w * 0.2, -80 - Math.random() * 120],
    y: [yBand, yBand + midSag, yBand + yDrift - midSag * 0.5, yBand + yDrift],
  };
}

function createBird(w: number, h: number, index: number): Bird {
  const depth = 0.25 + Math.random() * 0.75;
  const goRight = Math.random() < 0.75;
  const path = genPath(w, h, goRight);
  const wave = Math.floor(index / 3);
  const flapStart = 0.12 + Math.random() * 0.2;

  // ~30% of birds get a thermal spiral
  const hasThermal = Math.random() < 0.3;
  const thermalStart = 0.3 + Math.random() * 0.25;
  const thermalEnd = thermalStart + 0.08 + Math.random() * 0.06;
  const thermalCx = cb(path.x[0], path.x[1], path.x[2], path.x[3], (thermalStart + thermalEnd) / 2);
  const thermalCy = cb(path.y[0], path.y[1], path.y[2], path.y[3], (thermalStart + thermalEnd) / 2);

  return {
    path, t: 0,
    speed: 0.00014 + depth * 0.0002 + Math.random() * 0.0001,
    size: 11 + depth * 18,
    depth,
    tone: TONES[Math.floor(Math.random() * TONES.length)],
    maxOpacity: 0.14 + depth * 0.2,
    wingPhase: Math.random() * Math.PI * 2,
    wingBaseSpeed: 0.09 + Math.random() * 0.03,
    nextFlap: flapStart,
    flapEnd: flapStart + 0.03 + Math.random() * 0.04,
    isFlapping: false,
    delay: wave * 140 + Math.random() * 100 + 60,
    alive: false,
    hasThermal,
    thermalStart,
    thermalEnd,
    thermalCx,
    thermalCy,
    thermalR: 30 + Math.random() * 50,
    thermalDir: Math.random() < 0.5 ? 1 : -1,
  };
}

function createFeather(w: number, h: number, spreadY: boolean): Feather {
  const isGold = Math.random() < 0.3;
  return {
    x: w * 0.08 + Math.random() * w * 0.84,
    y: spreadY ? Math.random() * h : -10 - Math.random() * 50,
    vy: 0.1 + Math.random() * 0.15,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.006,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleDrift: (Math.random() - 0.5) * 0.1,
    size: 5 + Math.random() * 7,
    opacity: 0.1 + Math.random() * 0.15,
    depth: Math.random() * 0.5 + 0.5,
    tone: isGold ? [...GOLD] as [number, number, number] : TONES[Math.floor(Math.random() * TONES.length)],
  };
}

/* ── Drawing ── */
function drawSwallow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  heading: number, bank: number, wingAngle: number,
  opacity: number, tone: [number, number, number],
) {
  if (opacity < 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(1, 1 - Math.abs(bank) * 0.22);
  const [r, g, b] = tone;
  ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;

  // Body
  ctx.beginPath();
  ctx.moveTo(size * 0.55, 0);
  ctx.bezierCurveTo(size * 0.35, -size * 0.08, -size * 0.15, -size * 0.1, -size * 0.35, 0);
  ctx.bezierCurveTo(-size * 0.15, size * 0.1, size * 0.35, size * 0.08, size * 0.55, 0);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(size * 0.48, 0, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fork
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, 0);
  ctx.bezierCurveTo(-size * 0.55, -size * 0.01, -size * 0.75, -size * 0.14, -size * 0.92, -size * 0.12);
  ctx.lineTo(-size * 0.55, 0);
  ctx.lineTo(-size * 0.92, size * 0.12);
  ctx.bezierCurveTo(-size * 0.75, size * 0.14, -size * 0.55, size * 0.01, -size * 0.3, 0);
  ctx.fill();

  // Wings
  const wL = wingAngle * size * 0.6;
  const wT = wingAngle * size * 0.12;
  ctx.beginPath();
  ctx.moveTo(size * 0.12, -size * 0.03);
  ctx.bezierCurveTo(size * 0.02, -wL * 0.45 - size * 0.1, -size * 0.2, -wL - size * 0.06, -size * 0.6, -wL - wT);
  ctx.bezierCurveTo(-size * 0.68, -wL * 0.8 - wT * 0.4, -size * 0.72, -wL * 0.55, -size * 0.76, -wL * 0.3);
  ctx.bezierCurveTo(-size * 0.45, -wL * 0.12, -size * 0.15, -size * 0.02, size * 0.12, -size * 0.03);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.12, size * 0.03);
  ctx.bezierCurveTo(size * 0.02, wL * 0.45 + size * 0.1, -size * 0.2, wL + size * 0.06, -size * 0.6, wL + wT);
  ctx.bezierCurveTo(-size * 0.68, wL * 0.8 + wT * 0.4, -size * 0.72, wL * 0.55, -size * 0.76, wL * 0.3);
  ctx.bezierCurveTo(-size * 0.45, wL * 0.12, -size * 0.15, size * 0.02, size * 0.12, size * 0.03);
  ctx.fill();

  ctx.restore();
}

function drawFeather(ctx: CanvasRenderingContext2D, f: Feather) {
  if (f.opacity < 0.01) return;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rotation);
  const [r, g, b] = f.tone;
  ctx.fillStyle = `rgba(${r},${g},${b},${f.opacity * 0.28})`;
  const s = f.size;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.18, -s * 0.25, s * 0.22, s * 0.1, 0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.22, s * 0.1, -s * 0.18, -s * 0.25, 0, -s * 0.5);
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},${f.opacity * 0.12})`;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.lineTo(0, s * 0.5);
  ctx.stroke();
  ctx.restore();
}

/* ── Angle utils ── */
function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/* ══════════════════════════════════════════
   Component
   ══════════════════════════════════════════ */
const BIRD_COUNT = 7;
const FEATHER_COUNT = 4;

export function HeroBirds() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    birds: Bird[]; feathers: Feather[]; motes: Mote[];
    w: number; h: number; frame: number;
    prevHeadings: number[];
    scrollY: number;          // current scroll offset
    scrollProgress: number;   // 0-1 how far hero is scrolled
  }>({
    birds: [], feathers: [], motes: [],
    w: 0, h: 0, frame: 0, prevHeadings: [],
    scrollY: 0, scrollProgress: 0,
  });
  const rafRef = useRef(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const birds: Bird[] = [];
    for (let i = 0; i < BIRD_COUNT; i++) birds.push(createBird(w, h, i));
    const feathers: Feather[] = [];
    for (let i = 0; i < FEATHER_COUNT; i++) feathers.push(createFeather(w, h, true));

    stateRef.current = {
      birds, feathers, motes: [],
      w, h, frame: 0,
      prevHeadings: new Array(BIRD_COUNT).fill(0),
      scrollY: 0, scrollProgress: 0,
    };
  }, []);

  useEffect(() => {
    init();
    const onResize = () => init();
    window.addEventListener("resize", onResize);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ── Scroll tracking ── */
    const heroSection = canvas.closest("section");
    const onScroll = () => {
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      const heroH = rect.height;
      // scrollProgress: 0 = hero fully visible, 1 = hero scrolled away
      const progress = Math.max(0, Math.min(1, -rect.top / heroH));
      stateRef.current.scrollY = window.scrollY;
      stateRef.current.scrollProgress = progress;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let running = true;

    const animate = () => {
      if (!running) return;
      const st = stateRef.current;
      const { w, h, birds, feathers, motes, scrollProgress } = st;
      st.frame++;
      ctx.clearRect(0, 0, w, h);

      // ── Scroll-synced reveal: birds only start appearing after slight scroll ──
      // scrollProgress 0→0.02 = reveal zone
      const revealFactor = Math.min(1, scrollProgress / 0.015);
      // But also visible at top (revealFactor baseline)
      const globalReveal = Math.max(
        // Time-based: fade in over first 3 seconds (180 frames)
        Math.min(1, st.frame / 180),
        revealFactor,
      );

      /* ── Feathers with parallax ── */
      for (const f of feathers) {
        f.wobblePhase += 0.01;
        f.x += f.wobbleDrift + Math.sin(f.wobblePhase) * 0.3;
        f.y += f.vy;
        f.rotation += f.rotSpeed;
        if (f.y > h * 0.8) f.opacity -= 0.001;
        // Depth-based parallax — far feathers (low depth) drift less
        const fParallax = (1 - f.depth) * 0.15 + 0.03;
        const drawX = f.x - scrollProgress * w * fParallax * 0.03;
        const drawY = f.y - scrollProgress * h * fParallax;
        const savedX = f.x;
        const savedY = f.y;
        f.x = drawX;
        f.y = drawY;
        // Fade with scroll
        const savedOp = f.opacity;
        f.opacity *= (1 - scrollProgress * 0.6) * globalReveal;
        drawFeather(ctx, f);
        f.x = savedX;
        f.y = savedY;
        f.opacity = savedOp;
        if (f.y > h + 15 || f.opacity <= 0) Object.assign(f, createFeather(w, h, false));
      }

      /* ── Motes with depth parallax ── */
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.y += m.vy;
        m.life--;
        const ratio = m.life / m.maxLife;
        if (ratio > 0) {
          const [mr, mg, mb] = m.tone;
          const mParallax = (1 - m.depth) * 0.1 + 0.02;
          const mDrawY = m.y - scrollProgress * h * mParallax;
          const mDrawX = m.x - scrollProgress * w * mParallax * 0.03;
          const mAlpha = ratio * 0.18 * (1 - scrollProgress * 0.6);
          ctx.beginPath();
          ctx.arc(mDrawX, mDrawY, m.r * ratio, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${mr},${mg},${mb},${mAlpha})`;
          ctx.fill();
        }
        if (m.life <= 0) motes.splice(i, 1);
      }

      /* ── Birds ── */
      for (let bi = 0; bi < birds.length; bi++) {
        const bird = birds[bi];

        if (bird.delay > 0) { bird.delay--; continue; }
        if (!bird.alive) bird.alive = true;

        bird.t += bird.speed;
        if (bird.t > 1) {
          const nb = createBird(w, h, bi);
          nb.delay = 40 + Math.random() * 120;
          nb.alive = false;
          Object.assign(bird, nb);
          st.prevHeadings[bi] = 0;
          continue;
        }

        const t = bird.t;

        // ── Base position from bezier ──
        let px = cb(bird.path.x[0], bird.path.x[1], bird.path.x[2], bird.path.x[3], t);
        let py = cb(bird.path.y[0], bird.path.y[1], bird.path.y[2], bird.path.y[3], t);

        // ── Thermal spiral overlay ──
        let thermalHeadingOffset = 0;
        if (bird.hasThermal && t >= bird.thermalStart && t <= bird.thermalEnd) {
          const thermalT = (t - bird.thermalStart) / (bird.thermalEnd - bird.thermalStart);
          // Smooth ease in/out for the spiral
          const ease = Math.sin(thermalT * Math.PI); // 0→1→0
          const angle = thermalT * Math.PI * 2 * bird.thermalDir; // one full circle
          px += Math.cos(angle) * bird.thermalR * ease * 0.6;
          py += Math.sin(angle) * bird.thermalR * ease * 0.4 - bird.thermalR * ease * 0.15; // drift upward in thermal
          thermalHeadingOffset = bird.thermalDir * ease * 0.4;
        }

        // ── Scroll parallax — deeper birds shift less ──
        const parallaxFactor = (1 - bird.depth) * 0.12 + 0.02; // 0.02–0.14
        const scrollShiftY = scrollProgress * h * parallaxFactor;
        const scrollShiftX = scrollProgress * w * parallaxFactor * 0.05;
        const finalX = px - scrollShiftX;
        const finalY = py - scrollShiftY;

        // ── Heading from bezier tangent ──
        const dx = cbd(bird.path.x[0], bird.path.x[1], bird.path.x[2], bird.path.x[3], t);
        const dy = cbd(bird.path.y[0], bird.path.y[1], bird.path.y[2], bird.path.y[3], t);
        const rawHeading = Math.atan2(dy, dx) + thermalHeadingOffset;

        let prevH = st.prevHeadings[bi];
        const heading = lerpAngle(prevH, rawHeading, 0.06);
        st.prevHeadings[bi] = heading;

        let diff = rawHeading - prevH;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const bankAngle = Math.max(-0.5, Math.min(0.5, diff * 4));

        // ── Opacity: bell curve + scroll reveal ──
        let opacity: number;
        if (t < 0.12) opacity = (t / 0.12) * bird.maxOpacity;
        else if (t > 0.85) opacity = ((1 - t) / 0.15) * bird.maxOpacity;
        else opacity = bird.maxOpacity;
        opacity *= globalReveal;
        // Fade down as hero scrolls away
        opacity *= 1 - scrollProgress * 0.7;

        // ── Flap scheduling ──
        if (t >= bird.nextFlap && t < bird.flapEnd) {
          bird.isFlapping = true;
        } else if (t >= bird.flapEnd) {
          bird.isFlapping = false;
          const gap = 0.12 + Math.random() * 0.2;
          bird.nextFlap = bird.flapEnd + gap;
          bird.flapEnd = bird.nextFlap + 0.03 + Math.random() * 0.04;
        }
        if (bird.isFlapping) bird.wingPhase += bird.wingBaseSpeed;

        const wingAngle = bird.isFlapping
          ? Math.sin(bird.wingPhase) * 0.7
          : 0.3 + Math.sin(st.frame * 0.003 + bird.depth * 3) * 0.04;

        drawSwallow(ctx, finalX, finalY, bird.size, heading, bankAngle, wingAngle, opacity, bird.tone);

        // ── Sparse golden motes ──
        if (opacity > 0.06 && Math.random() < 0.04 && motes.length < 40) {
          motes.push({
            x: finalX - dx * 0.12 + (Math.random() - 0.5) * 5,
            y: finalY - dy * 0.12 + (Math.random() - 0.5) * 4,
            vy: 0.015 + Math.random() * 0.03,
            life: 80 + Math.random() * 100,
            maxLife: 80 + Math.random() * 100,
            r: 0.6 + Math.random() * 1.2,
            depth: bird.depth * 0.8 + Math.random() * 0.2,
            tone: Math.random() < 0.5 ? GOLD : bird.tone,
          });
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 500);

    return () => {
      running = false;
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}