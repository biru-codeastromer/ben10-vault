import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Series } from '../../data/schema';
import { audio } from '../../lib/audio';
import { useFinePointer, useReducedMotion } from '../../lib/hooks';
import { runEraTransition } from '../../lib/transition';
import { DEVICE_COMPONENTS } from './deviceRegistry';
import './OmnitrixObject.css';

interface Props {
  series: Series;
  count: number;
  index: number;
}

/**
 * A large interactive Omnitrix. Hover charges the face and nudges the dial; click plays the
 * era's activation sound, snaps the dial and runs the flash transition into the era wall.
 */
export function OmnitrixObject({ series, count, index }: Props) {
  const navigate = useNavigate();
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [activating, setActivating] = useState(false);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const Device = DEVICE_COMPONENTS[series.id];

  // pointer parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 160, damping: 18 });

  const dial = hover ? 24 : 0;
  const rotation = activating ? 120 : dial;
  const charge = activating ? 1 : hover ? 0.95 : 0.45;

  const onMove = (e: React.PointerEvent) => {
    if (!fine || reduced) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    setHover(false);
    mx.set(0);
    my.set(0);
  };
  const onEnter = () => {
    setHover(true);
    audio.play('dial-tick', { volume: 0.5, throttleMs: 250 });
  };
  const activate = () => {
    if (activating) return;
    setActivating(true);
    audio.play(`omnitrix-activate-${series.id}`);
    const r = ref.current?.getBoundingClientRect();
    const origin = r
      ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
      : { x: 0.5, y: 0.5 };
    window.setTimeout(() => {
      runEraTransition(series.id, origin, () => navigate(`/era/${series.id}`));
      window.setTimeout(() => setActivating(false), 900);
    }, 260);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`omni-object${hover ? ' is-hover' : ''}${activating ? ' is-activating' : ''}`}
      data-era={series.id}
      aria-label={`Open the ${series.name} collection — ${count} aliens`}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={() => setHover(true)}
      onBlur={onLeave}
      onClick={activate}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 900 }}
    >
      <motion.span className="omni-object__scene" style={{ rotateX: reduced ? 0 : rx, rotateY: reduced ? 0 : ry }}>
        <span className="omni-object__halo" aria-hidden="true" />
        <motion.span
          className="omni-object__device"
          animate={{ scale: activating ? [1, 1.08, 1.02] : hover ? 1.04 : 1, y: hover ? -6 : 0 }}
          transition={{ duration: activating ? 0.45 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="omni-object__dial"
            animate={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: activating ? 260 : 120, damping: activating ? 14 : 16 }}
            style={{ display: 'block' }}
          >
            <Device idPrefix={`omni-${id}`} charge={charge} dialRotation={0} className="omni-object__svg" />
          </motion.span>
        </motion.span>
        <span className="omni-object__sweep" aria-hidden="true" />
      </motion.span>
      <span className="omni-object__label">
        <span className="omni-object__era" style={{ fontFamily: 'var(--era-font)' }}>
          {series.shortName}
        </span>
        <span className="omni-object__meta">
          <span className="omni-object__device-name">{deviceLabel(series.id)}</span>
          <span className="omni-object__dot">·</span>
          <span>{series.years}</span>
        </span>
        <span className="omni-object__count">
          {count} <em>aliens</em>
        </span>
      </span>
    </motion.button>
  );
}

function deviceLabel(id: Series['id']): string {
  switch (id) {
    case 'os':
      return 'Prototype Omnitrix';
    case 'af':
      return 'Recalibrated Omnitrix';
    case 'ua':
      return 'Ultimatrix';
    case 'ov':
      return 'Completed Omnitrix';
  }
}
