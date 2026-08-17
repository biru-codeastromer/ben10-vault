import { AnimatePresence, motion } from 'framer-motion';
import { useTransitionState } from '../../lib/transition';
import { hourglassPath } from '../omnitrix/hourglassPath';
import './EraTransitionOverlay.css';

/** Full-screen Omnitrix flash used when entering an era. Purely decorative. */
export function EraTransitionOverlay() {
  const t = useTransitionState();
  const visible = t.phase !== 'idle';
  return (
    <AnimatePresence>
      {visible && t.era && (
        <motion.div
          key={t.key}
          className="era-flash"
          data-era={t.era}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: t.phase === 'in' ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: t.phase === 'in' ? 0.28 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ ['--ox' as string]: `${t.origin.x * 100}%`, ['--oy' as string]: `${t.origin.y * 100}%` }}
        >
          <motion.div
            className="era-flash__burst"
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 3.2, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.svg
            className="era-flash__mark"
            viewBox="-100 -100 200 200"
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <path d={hourglassPath(t.era, 0.9)} fill="#050807" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
