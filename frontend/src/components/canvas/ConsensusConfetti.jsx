import { useEffect, useState, useMemo } from 'react';

const COLORS = ['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function ConsensusConfetti({ onDone }) {
  const [visible, setVisible] = useState(true);

  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        left: randomBetween(10, 90),
        delay: randomBetween(0, 0.8),
        duration: randomBetween(1.5, 3),
        size: randomBetween(5, 10),
        rotation: randomBetween(0, 360),
      })),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="confetti-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
