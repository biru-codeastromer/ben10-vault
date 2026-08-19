import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { OmnitrixObject } from '../components/omnitrix/OmnitrixObject';
import { hourglassPath } from '../components/omnitrix/hourglassPath';
import { series, stats } from '../data/vault';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home" data-era="os">
      <div className="home__bg" aria-hidden="true">
        <div className="home__bg-glow" />
        <div className="home__bg-grid" />
        <svg className="home__bg-mark" viewBox="-100 -100 200 200">
          <path d={hourglassPath('os', 0.9)} fill="none" stroke="currentColor" strokeWidth="0.6" />
        </svg>
      </div>

      <section className="home__hero page">
        <motion.p className="eyebrow home__eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          A digital Omnitrix museum · classic continuity 2005 – 2014
        </motion.p>
        <motion.h1
          className="home__title"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          <span className="home__title-ben">BEN 10</span>
          <span className="home__title-vault">VAULT</span>
        </motion.h1>
        <motion.p className="home__lede" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          Four Omnitrixes. Every transformation Ben ever slammed the dial for — from the summer of the Rust Bucket to Undertown —
          preserved as a collection of collectible alien cards. Pick a watch.
        </motion.p>
        <motion.ul className="home__stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.35 }}>
          <li>
            <strong>{stats.aliens}</strong> aliens
          </li>
          <li>
            <strong>{stats.appearances}</strong> era cards
          </li>
          <li>
            <strong>{stats.benVersions}</strong> versions of Ben
          </li>
          {stats.sequences > 0 && (
            <li>
              <strong>{stats.sequences}</strong> transformation clips
            </li>
          )}
        </motion.ul>
      </section>

      <section className="home__devices page" aria-label="Choose an era">
        {series.map((s, i) => (
          <OmnitrixObject key={s.id} series={s} count={stats.perSeries[s.id] ?? 0} index={i} />
        ))}
      </section>

      <motion.section
        className="home__more page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
      >
        <Link to="/ben" className="home__more-card">
          <span className="eyebrow">Ben Archive</span>
          <strong>Every version of Ben Tennyson</strong>
          <span>Ten-year-old summer hero, Ben 10,000, Ben 23, Mad Ben, Nega Ben and more — the boy behind the watch across timelines.</span>
        </Link>
        <Link to="/about" className="home__more-card">
          <span className="eyebrow">How it works</span>
          <strong>Power Scores, rarity classes &amp; sources</strong>
          <span>An editorial 50–200 scoring system built from on-screen feats, with every fact and image traced back to its source.</span>
        </Link>
      </motion.section>

      <footer className="home__footer page">
        <p>
          Unofficial fan project. Ben 10 and all characters © Cartoon Network / Man of Action. Artwork and canon references sourced from
          the Ben 10 community wiki — see <Link to="/about">About</Link>.
        </p>
      </footer>
    </main>
  );
}
