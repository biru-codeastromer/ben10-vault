import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BenVersion, Timeline } from '../data/schema';
import { benVersions, getAsset, getSeries } from '../data/vault';
import { audio } from '../lib/audio';
import { OmnitrixIcon } from '../components/omnitrix/Hourglass';
import './BenArchivePage.css';

const TIMELINE_LABEL: Record<Timeline, string> = {
  prime: 'Prime timeline',
  future: 'Futures',
  alternate: 'Alternate timelines',
  dimension: 'Other dimensions',
};
const TIMELINE_ORDER: Timeline[] = ['prime', 'future', 'alternate', 'dimension'];

/** Research strings carry parentheticals/qualifiers; the card label shows the head only (full text in the body). */
function compact(s: string, max = 40): string {
  const head = s.split(/\s*[(;]/)[0].trim();
  return head.length > max ? head.slice(0, max - 1).trimEnd() + '…' : head;
}

export function BenArchivePage() {
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    document.title = 'Ben Archive — Ben 10 Vault';
  }, []);
  const groups = useMemo(() => {
    const g = new Map<Timeline, BenVersion[]>();
    for (const b of benVersions) g.set(b.timeline, [...(g.get(b.timeline) ?? []), b]);
    return TIMELINE_ORDER.filter((t) => g.has(t)).map((t) => ({ timeline: t, items: g.get(t)! }));
  }, []);

  return (
    <main className="ben" data-era="ov">
      <div className="ben__bg" aria-hidden="true" />
      <header className="ben__hero page">
        <p className="eyebrow">Ben Archive</p>
        <h1 className="ben__title">Every version of Ben Tennyson</h1>
        <p className="ben__lede">
          The boy behind the watch, across ages, futures and dimensions — from the ten-year-old who found the Omnitrix in the woods to Ben
          10,000, Ben 23 and the Bens who went wrong. Classic continuity only.
        </p>
      </header>

      {benVersions.length === 0 && (
        <p className="page ben__empty">The archive is being catalogued. Check back after the data build.</p>
      )}

      {groups.map((group) => (
        <section key={group.timeline} className="ben__group page">
          <h2 className="ben__group-title">
            <span />
            {TIMELINE_LABEL[group.timeline]}
          </h2>
          <div className="ben__grid">
            {group.items.map((b, i) => {
              const asset = getAsset(b.assetId);
              const era = b.seriesIds[0] ?? 'os';
              const open = openId === b.id;
              return (
                <motion.article
                  key={b.id}
                  className={`bencard${open ? ' is-open' : ''}`}
                  data-era={era}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 + Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    className="bencard__hit"
                    onClick={() => {
                      audio.play(open ? 'card-close' : 'card-open', { volume: 0.4 });
                      setOpenId(open ? null : b.id);
                    }}
                    aria-expanded={open}
                  >
                    <div className="bencard__art">
                      {asset ? (
                        <img src={asset.path} alt={b.name} loading="lazy" width={asset.width} height={asset.height} />
                      ) : (
                        <div className="bencard__missing">ARTWORK PENDING</div>
                      )}
                    </div>
                    <div className="bencard__meta">
                      <span className="bencard__age">
                        <OmnitrixIcon size={14} variant={era} /> {compact(b.device) || '—'}
                      </span>
                      <h3 className="bencard__name">{b.name}</h3>
                      <span className="bencard__series">
                        {b.seriesIds.map((s) => getSeries(s)?.shortName).filter(Boolean).join(' · ') || '—'}
                        {b.age ? ` · age ${compact(b.age, 12)}` : ''}
                      </span>
                    </div>
                  </button>
                  <motion.div className="bencard__body" initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                    <div className="bencard__body-inner">
                      <p>{b.summary}</p>
                      {b.device && b.device !== compact(b.device) && (
                        <p className="bencard__outfit">
                          <strong>Device:</strong> {b.device}
                        </p>
                      )}
                      {b.outfit && (
                        <p className="bencard__outfit">
                          <strong>Look:</strong> {b.outfit}
                        </p>
                      )}
                      {b.signatureAliens.length > 0 && (
                        <div className="bencard__aliens">
                          <span>Signature aliens</span>
                          {b.signatureAliens.map((a) => (
                            <em key={a}>{a}</em>
                          ))}
                        </div>
                      )}
                      {b.keyEpisodes.length > 0 && (
                        <p className="bencard__eps">
                          <strong>Key episodes:</strong> {b.keyEpisodes.join(' · ')}
                        </p>
                      )}
                      {b.notes.length > 0 && (
                        <details>
                          <summary>Notes</summary>
                          <ul>
                            {b.notes.map((n, k) => (
                              <li key={k}>{n}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <p className="bencard__links">
                        {b.seriesIds.map((s) => (
                          <Link key={s} to={`/era/${s}`} data-era={s}>
                            {getSeries(s)?.shortName} wall →
                          </Link>
                        ))}
                      </p>
                    </div>
                  </motion.div>
                </motion.article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
