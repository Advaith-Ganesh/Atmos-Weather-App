import { useMemo } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { ConditionCategory } from '../../types/weather';

interface WeatherBackdropProps {
  condition: ConditionCategory;
  isDaylight: boolean;
}

/**
 * Purely decorative layer behind the app. It sits under `aria-hidden` and never
 * changes text or panel colours, so contrast is unaffected by the weather.
 *
 * Particles are plain absolutely positioned spans animated with a single CSS
 * transform keyframe — cheap enough to run on a phone, and far lighter than a
 * canvas or a particle library for an effect this subtle.
 */
export function WeatherBackdrop({ condition, isDaylight }: WeatherBackdropProps) {
  const reducedMotion = usePrefersReducedMotion();

  const particles = useMemo(() => {
    if (reducedMotion) return [];
    if (condition === 'RAIN' || condition === 'HEAVY_RAIN' || condition === 'THUNDERSTORM') {
      return buildParticles(condition === 'HEAVY_RAIN' ? 70 : 42, 'rain');
    }
    if (condition === 'SNOW') return buildParticles(48, 'snow');
    return [];
  }, [condition, reducedMotion]);

  const showClouds = !reducedMotion && ['CLOUDY', 'PARTLY_CLOUDY', 'FOG', 'WIND'].includes(condition);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-condition={condition}
      data-daylight={isDaylight}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, var(--sky-top) 0%, var(--sky-mid) 55%, var(--color-ink-900) 100%)',
        }}
      />

      {showClouds && (
        <>
          <CloudBand top="8%" size="52vw" duration={140} opacity={0.1} />
          <CloudBand top="26%" size="38vw" duration={200} opacity={0.07} delay={-60} />
        </>
      )}

      {particles.map((particle) => (
        <span
          key={particle.id}
          className={particle.kind === 'rain' ? 'absolute rounded-full bg-white/25' : 'absolute rounded-full bg-white/45'}
          style={{
            left: `${particle.left}%`,
            width: particle.kind === 'rain' ? '1px' : `${particle.size}px`,
            height: particle.kind === 'rain' ? `${particle.size * 10}px` : `${particle.size}px`,
            animation: `atmos-fall ${particle.duration}s linear ${particle.delay}s infinite`,
            ['--drift' as string]: `${particle.drift}px`,
            willChange: 'transform',
          }}
        />
      ))}

      {condition === 'THUNDERSTORM' && !reducedMotion && (
        <div className="absolute inset-0 bg-white" style={{ animation: 'atmos-flash 9s ease-out infinite' }} />
      )}
    </div>
  );
}

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  kind: 'rain' | 'snow';
}

function buildParticles(count: number, kind: 'rain' | 'snow'): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: kind === 'rain' ? 1.2 + Math.random() * 1.4 : 1.5 + Math.random() * 2.5,
    duration: kind === 'rain' ? 0.7 + Math.random() * 0.6 : 6 + Math.random() * 6,
    delay: -Math.random() * 8,
    drift: kind === 'rain' ? 12 + Math.random() * 14 : -30 + Math.random() * 60,
    kind,
  }));
}

interface CloudBandProps {
  top: string;
  size: string;
  duration: number;
  opacity: number;
  delay?: number;
}

function CloudBand({ top, size, duration, opacity, delay = 0 }: CloudBandProps) {
  return (
    <span
      className="absolute rounded-full blur-3xl"
      style={{
        top,
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgb(var(--sky-accent) / 0.5) 0%, transparent 70%)',
        opacity,
        animation: `atmos-drift ${duration}s linear ${delay}s infinite`,
        willChange: 'transform',
      }}
    />
  );
}
