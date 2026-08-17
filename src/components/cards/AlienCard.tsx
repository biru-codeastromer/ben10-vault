import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { memo, useRef, useState } from 'react';
import type { WallEntry } from '../../data/vault';
import { audio } from '../../lib/audio';
import { useFinePointer, useReducedMotion } from '../../lib/hooks';
import { OmnitrixIcon } from '../omnitrix/Hourglass';
import { AlienArt } from './AlienArt';
import { shortAbility } from '../../lib/text';
import './AlienCard.css';

interface Props {
  entry: WallEntry;
  onOpen?: (entry: WallEntry) => void;
  index?: number;
  /** 'wall' cards animate in and are clickable; 'showcase' is a static large card (detail view). */
  mode?: 'wall' | 'showcase';
  layoutId?: string;
}

const SERIES_SHORT: Record<string, string> = { os: 'BEN 10', af: 'ALIEN FORCE', ua: 'ULTIMATE ALIEN', ov: 'OMNIVERSE' };

export const AlienCard = memo(function AlienCard({ entry, onOpen, index = 0, mode = 'wall', layoutId }: Props) {
  const { alien, appearance, asset, powerClass } = entry;
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);

  // pointer-driven tilt + specular position
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotX = useSpring(useTransform(py, [0, 1], [9, -9]), { stiffness: 220, damping: 22 });
  const rotY = useSpring(useTransform(px, [0, 1], [-11, 11]), { stiffness: 220, damping: 22 });
  const shineX = useTransform(px, (v) => `${v * 100}%`);
  const shineY = useTransform(py, (v) => `${v * 100}%`);

  const tiltEnabled = fine && !reduced && mode === 'wall';

  const onMove = (e: React.PointerEvent) => {
    if (!tiltEnabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onEnter = () => {
    setHover(true);
    if (mode === 'wall') audio.play('card-hover', { volume: 0.35, throttleMs: 120 });
  };
  const onLeave = () => {
    setHover(false);
    px.set(0.5);
    py.set(0.5);
  };

  const tier = powerClass.tier;
  const abilities = alien.abilities.slice(0, tier >= 6 ? 2 : 3).map((a) => shortAbility(a));
  const isUltimate = alien.kind === 'ultimate';
  const isFusion = alien.kind === 'fusion';

  const inner = (
    <motion.div
      ref={ref}
      className={`acard tier-${tier}${hover ? ' is-hover' : ''}${mode === 'showcase' ? ' acard--showcase' : ''}`}
      data-era={appearance.seriesId}
      data-kind={alien.kind}
      style={tiltEnabled ? { rotateX: rotX, rotateY: rotY, ['--sx' as string]: shineX, ['--sy' as string]: shineY } : undefined}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      layoutId={layoutId}
    >
      <div className="acard__frame">
        <div className="acard__edge" aria-hidden="true" />
        <div className="acard__inner">
          <header className="acard__head">
            <h3 className="acard__name">
              {isUltimate && <span className="acard__ult">ULTIMATE</span>}
              <span className="acard__name-text">{isUltimate ? alien.name.replace(/^Ultimate\s+/i, '') : alien.name}</span>
            </h3>
            <span className="acard__badge" title={SERIES_SHORT[appearance.seriesId]}>
              <OmnitrixIcon size={22} variant={appearance.seriesId} title={SERIES_SHORT[appearance.seriesId]} />
            </span>
          </header>

          <div className="acard__art">
            <div className="acard__art-bg" aria-hidden="true" />
            {tier >= 6 && <div className="acard__stars" aria-hidden="true" />}
            <AlienArt asset={asset} alt={`${alien.name} — ${SERIES_SHORT[appearance.seriesId]} design`} className="acard__img" hover={hover && !reduced} />
            <div className="acard__art-fade" aria-hidden="true" />
            {isFusion && <span className="acard__tag acard__tag--fusion">FUSION</span>}
            {appearance.benVersionIds.every((b) => b.startsWith('ben-10k')) && appearance.benVersionIds.length > 0 && (
              <span className="acard__tag acard__tag--10k">BEN 10,000</span>
            )}
          </div>

          <footer className="acard__foot">
            <div className="acard__score" aria-label={`Power score ${alien.score.total} of 200`}>
              <span className="acard__score-num">{alien.score.total}</span>
              <span className="acard__score-den">/200</span>
            </div>
            <div className="acard__class">
              <span className="acard__class-name">{powerClass.name}</span>
              <span className="acard__class-tier">{'●'.repeat(Math.min(tier, 7))}</span>
            </div>
            <div className="acard__species">
              {alien.species}
              {alien.homeworld && alien.homeworld !== 'Unknown' ? ` · ${alien.homeworld}` : ''}
            </div>
            <ul className="acard__abilities">
              {abilities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </footer>
        </div>
        <div className="acard__shine" aria-hidden="true" />
        {tier >= 5 && <div className="acard__foil" aria-hidden="true" />}
        {tier >= 4 && <div className="acard__energy" aria-hidden="true" />}
      </div>
    </motion.div>
  );

  if (mode === 'showcase') return inner;

  return (
    <motion.button
      type="button"
      className="acard-btn"
      onClick={() => onOpen?.(entry)}
      aria-label={`${alien.name}, ${powerClass.name} class, power ${alien.score.total} of 200. Open card.`}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 14) * 0.045, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1100 }}
    >
      {inner}
    </motion.button>
  );
});
