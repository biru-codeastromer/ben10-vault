import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SCORE_DIMENSIONS } from '../data/schema';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, NORMALISATION, POWER_CLASSES } from '../data/scoring';
import { aliens, assets, series, stats } from '../data/vault';
import { AUDIO_SLOTS } from '../lib/audio';
import './AboutPage.css';

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — Ben 10 Vault';
  }, []);
  const verified = assets.filter((a) => a.verification === 'verified').length;
  const highest = [...aliens].sort((a, b) => b.score.total - a.score.total).slice(0, 5);
  return (
    <main className="about page">
      <header className="about__hero">
        <p className="eyebrow">About the Vault</p>
        <h1>How this collection was built</h1>
        <p className="about__lede">
          Ben 10 Vault is an unofficial, local-only fan project: a museum of every Omnitrix transformation from the classic continuity
          — <em>Ben 10</em> (2005), <em>Alien Force</em>, <em>Ultimate Alien</em> and <em>Omniverse</em>. No Reboot. Everything on
          screen is generated from a structured dataset whose facts and artwork are traced back to their sources.
        </p>
      </header>

      <section className="about__grid">
        <article className="about__card">
          <h2>Scope &amp; canon</h2>
          <p>
            An alien gets a card on an era's wall only if a version of Ben transformed into it on-screen in that series (TV episodes and
            that era's canonical movies). Forms used only by Albedo, Kevin, Gwen or Ben 23 are noted in the data but do not get cards.
            Ben 10,000's Biomnitrix fusions in Omniverse are included as a labelled sub-collection.
          </p>
          <ul className="about__stats">
            <li>
              <strong>{stats.aliens}</strong> transformations
            </li>
            <li>
              <strong>{stats.appearances}</strong> era-specific cards
            </li>
            {series.map((s) => (
              <li key={s.id}>
                <strong>{stats.perSeries[s.id]}</strong> {s.shortName}
              </li>
            ))}
            <li>
              <strong>{stats.benVersions}</strong> versions of Ben
            </li>
          </ul>
        </article>

        <article className="about__card">
          <h2>Series-accurate artwork</h2>
          <p>
            The same alien can look very different between series — Classic Four Arms and Omniverse Four Arms are different designs — so
            every card references artwork for <em>that</em> era's design. Images are official model sheets, renders and stills sourced
            from the Ben 10 community wiki, downloaded and optimised (never redrawn), and catalogued in <code>assets/asset-manifest.json</code>{' '}
            with source, resolution and verification status. {verified} of {assets.length} assets are marked visually verified.
          </p>
        </article>

        <article className="about__card">
          <h2>Transformation clips</h2>
          <p>
            Open a card and hit <em>Slam it</em> to watch that alien's on-screen transformation sequence for that era. The clips are
            rendered (never redrawn) from the frame-by-frame episode stills in the wiki's transformation-sequence libraries — {stats.sequences}{' '}
            sequences across the four shows, each tagged with its source episode. Not every alien got a dramatised sequence: the 2005 series
            stopped animating new ones after Wildvine, and Ultimate Alien reused many Alien Force sequences (shown from that era). Where a
            form has no sequence in the current era, the player offers the other eras it does have.
          </p>
        </article>

        <article className="about__card about__card--wide">
          <h2>Power Score — an editorial system (not canon)</h2>
          <p>
            Every transformation is rated 0–10 on fourteen dimensions from demonstrated on-screen feats, plus a weakness penalty (0–5) and
            a control penalty (0–3). The weighted sum is normalised onto a 50–200 scale using fixed anchors, so a 150 is genuinely rare and
            200 is unique — Alien X is pinned there. Ultimate forms are validated to outscore their base form. Full method and calibration
            notes live in <code>docs/power-scoring.md</code>.
          </p>
          <div className="about__weights">
            {SCORE_DIMENSIONS.map((d) => (
              <span key={d}>
                {DIMENSION_LABELS[d]} <b>×{DIMENSION_WEIGHTS[d]}</b>
              </span>
            ))}
          </div>
          <p className="about__formula">
            raw = Σ weight × rating − 2.5 × weakness − 2 × control · score = piecewise-linear(raw) through{' '}
            {NORMALISATION.map((a) => `${a.raw}→${a.score}`).join(', ')}
          </p>
          <div className="about__classes">
            {POWER_CLASSES.map((c) => (
              <div key={c.id} className={`about__class tier-${c.tier}`}>
                <strong>{c.name}</strong>
                <span>
                  {c.min}
                  {c.max !== c.min ? `–${c.max}` : ''}
                </span>
                <em>{c.blurb}</em>
              </div>
            ))}
          </div>
          {highest.length > 0 && (
            <p className="about__top">
              Current top of the vault:{' '}
              {highest.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ' · '}
                  <Link to={`/era/${a.appearances[0]?.seriesId ?? 'os'}/${a.id}`}>
                    {a.name} {a.score.total}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </article>

        <article className="about__card">
          <h2>Sound</h2>
          <p>
            Sound is sparing and globally toggleable (top right). Nothing autoplays. Each device has an Omnitrix-style activation cue and
            cards have a whisper-quiet tick. The engine looks for real samples in <code>/public/audio/</code> and otherwise synthesises the
            cues with the Web Audio API — drop in files named <code>{AUDIO_SLOTS.slice(0, 4).join('.mp3, ')}.mp3</code> … to replace them.
          </p>
        </article>

        <article className="about__card">
          <h2>Sources &amp; provenance</h2>
          <p>
            Canon research draws on the Ben 10 wiki (ben10.fandom.com) — infobox facts, per-series appearance sections, powers/weaknesses
            and episode lists — cached in <code>research/</code>. Uncertain or conflicting facts are kept as notes on each card instead of
            being flattened into false certainty. See <code>research/sources.md</code> and <code>research/canon-notes.md</code>.
          </p>
          <p className="about__legal">
            Ben 10 and all related characters and artwork are © Cartoon Network / Man of Action Studios. This is a non-commercial fan
            project intended for local, personal use.
          </p>
        </article>
      </section>
    </main>
  );
}
