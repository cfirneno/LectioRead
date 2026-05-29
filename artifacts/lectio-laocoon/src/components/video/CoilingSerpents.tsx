import { motion } from 'framer-motion';

// Builds an Archimedean spiral path string, winding from the centre outward.
function spiralPath(
  cx: number,
  cy: number,
  turns: number,
  startR: number,
  endR: number,
  phase: number,
  points = 200,
): string {
  let d = '';
  const total = turns * Math.PI * 2;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const a = t * total + phase;
    const r = startR + (endR - startR) * t;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  }
  return d.trim();
}

function endPoint(
  cx: number,
  cy: number,
  turns: number,
  endR: number,
  phase: number,
) {
  const a = turns * Math.PI * 2 + phase;
  return { x: cx + endR * Math.cos(a), y: cy + endR * Math.sin(a), deg: (a * 180) / Math.PI };
}

function SerpentHead({ x, y, deg, delay }: { x: number; y: number; deg: number; delay: number }) {
  return (
    // Outer group: static placement only (translate + rotate via SVG attribute).
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`}>
      {/* Inner group: animated reveal only (opacity + scale), so Framer's
          transform never clobbers the static placement above. */}
      <motion.g
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {/* forked tongue, flicking */}
        <motion.path
          d="M14 0 L30 0 M30 0 L36 -4 M30 0 L36 4"
          stroke="#8C1C13"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5, delay: delay + 0.4 }}
        />
        <ellipse cx={0} cy={0} rx={19} ry={12} fill="#16331f" />
        <ellipse cx={-2} cy={0} rx={14} ry={9} fill="#244d31" />
        <circle cx={7} cy={-3.5} r={2.4} fill="#e9c46a" />
        <circle cx={7} cy={3.5} r={2.4} fill="#e9c46a" />
        <circle cx={7.6} cy={-3.5} r={1} fill="#1a1a1a" />
        <circle cx={7.6} cy={3.5} r={1} fill="#1a1a1a" />
      </motion.g>
    </g>
  );
}

export function CoilingSerpents({ className = '' }: { className?: string }) {
  const cx = 200;
  const cy = 200;
  const turns = 2.6;
  const startR = 10;
  const endR = 158;

  const serpents = [0, Math.PI].map((phase, i) => ({
    d: spiralPath(cx, cy, turns, startR, endR, phase),
    head: endPoint(cx, cy, turns, endR, phase),
    delay: 0.2 + i * 0.25,
  }));

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="serpent-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f2417" />
          <stop offset="50%" stopColor="#2f5d39" />
          <stop offset="100%" stopColor="#6b8f3a" />
        </linearGradient>
      </defs>

      {/* slow writhe of the whole knot */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={{ rotate: [0, -5, -1.5, -6, -3], scale: [1, 1.015, 1, 1.02, 1] }}
        transition={{ duration: 9, ease: 'easeInOut' }}
      >
        {serpents.map((s, i) => (
          <g key={i}>
            {/* body shadow / base */}
            <motion.path
              d={s.d}
              fill="none"
              stroke="url(#serpent-body)"
              strokeWidth={17}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.6, ease: 'easeInOut', delay: s.delay }}
            />
            {/* highlight ridge along the spine */}
            <motion.path
              d={s.d}
              fill="none"
              stroke="#a9c46a"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.55}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.6, ease: 'easeInOut', delay: s.delay }}
            />
            <SerpentHead x={s.head.x} y={s.head.y} deg={s.head.deg} delay={s.delay + 2.4} />
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
