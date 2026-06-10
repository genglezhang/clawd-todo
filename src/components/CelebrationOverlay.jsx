import React, { useMemo, useEffect } from 'react';

const COLORS = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#00d2d3','#ff9f43','#10ac84','#ee5a24','#ffd32a','#c8d6e5'];

const COUNTS   = [0, 20, 40, 60, 80, 100]; // by level (1-5)
const DURATIONS = [0, 2500, 3200, 4200, 5000, 5500];

function randPiece(i, total) {
  return {
    id:       i,
    color:    COLORS[i % COLORS.length],
    left:     (i / total) * 100 + (Math.random() - 0.5) * 15,
    delay:    Math.random() * 1.4,
    duration: 1.8 + Math.random() * 2,
    size:     5 + Math.random() * 9,
    driftX:   (Math.random() - 0.5) * 80,
    rotation: Math.random() * 720 - 360,
    round:    i % 3 === 0,
  };
}

export default function CelebrationOverlay({ level, onDone }) {
  const count    = COUNTS[level]    || 20;
  const duration = DURATIONS[level] || 2500;

  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => randPiece(i, count)), [count]);

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div className="celebration-overlay" aria-hidden>
      {pieces.map(p => (
        <div
          key={p.id}
          className={`confetti-piece${p.round ? ' round' : ''}`}
          style={{
            left:              `${p.left}%`,
            background:        p.color,
            width:             p.size,
            height:            p.size,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift':         `${p.driftX}px`,
            '--rot':           `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
