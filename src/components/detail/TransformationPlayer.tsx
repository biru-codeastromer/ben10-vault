import { useCallback, useEffect, useRef, useState } from 'react';
import type { SequenceClip, SeriesId } from '../../data/schema';
import { getSeries } from '../../data/vault';
import { audio } from '../../lib/audio';
import { hourglassPath } from '../omnitrix/hourglassPath';
import './TransformationPlayer.css';

interface Props {
  clips: SequenceClip[]; // already sorted: current era first
  currentSeries: SeriesId;
  alienName: string;
}

/**
 * Plays an alien's on-screen transformation sequence (rendered from the wiki's frame libraries).
 * Click-to-play only; plays the era's Omnitrix activation cue alongside the clip when sound is on.
 */
export function TransformationPlayer({ clips, currentSeries, alienName }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clip = clips[index];

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
    setEnded(false);
  }, [clips]);

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setEnded(false);
    v.currentTime = 0;
    audio.play(`omnitrix-activate-${clip.seriesId}`, { volume: 0.8, throttleMs: 400 });
    void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [clip]);

  const select = (i: number) => {
    if (i === index) return;
    audio.play('dial-tick', { volume: 0.4, throttleMs: 80 });
    setIndex(i);
    setPlaying(false);
    setEnded(false);
  };

  if (!clip) return null;
  const series = getSeries(clip.seriesId)!;
  const inOtherEra = clip.seriesId !== currentSeries;
  const eras = Array.from(new Set(clips.map((c) => c.seriesId)));

  return (
    <section className="tplayer" data-era={clip.seriesId} aria-label={`${alienName} transformation sequence`}>
      <div className="tplayer__head">
        <h3>
          <svg viewBox="-100 -100 200 200" width="16" height="16" aria-hidden="true">
            <path d={hourglassPath(clip.seriesId, 0.9)} fill="currentColor" />
          </svg>
          Transformation sequence
        </h3>
        {eras.length > 1 && (
          <div className="tplayer__eras" role="tablist" aria-label="Era">
            {eras.map((sid) => {
              const first = clips.findIndex((c) => c.seriesId === sid);
              const on = clip.seriesId === sid;
              return (
                <button key={sid} type="button" role="tab" aria-selected={on} className={`tplayer__era${on ? ' is-on' : ''}`} data-era={sid} onClick={() => select(first)}>
                  {getSeries(sid)?.shortName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={`tplayer__stage${playing ? ' is-playing' : ''}${ended ? ' is-ended' : ''}`} style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
        <video
          key={clip.id}
          ref={videoRef}
          className="tplayer__video"
          src={clip.path}
          poster={clip.poster}
          preload="metadata"
          playsInline
          muted
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
          }}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          width={clip.width}
          height={clip.height}
          aria-label={`${alienName} transformation, ${series.shortName}${clip.episode ? `, from ${clip.episode}` : ''}`}
        />
        {!playing && (
          <button type="button" className="tplayer__play" onClick={play} aria-label={ended ? 'Replay transformation' : 'Play transformation'}>
            <span className="tplayer__dial" aria-hidden="true">
              <svg viewBox="-100 -100 200 200">
                <circle r="96" className="tplayer__dial-ring" />
                <circle r="78" className="tplayer__dial-face" />
                <path d={hourglassPath(clip.seriesId, 0.66)} className="tplayer__dial-mark" />
              </svg>
            </span>
            <span className="tplayer__cta">{ended ? 'Again' : 'Slam it'}</span>
          </button>
        )}
        <span className="tplayer__flash" aria-hidden="true" />
      </div>

      <div className="tplayer__meta">
        <span className="tplayer__episode">
          {series.name}
          {clip.episode ? ` · ${clip.episode}` : ''}
          {inOtherEra ? ' · shown from another era' : ''}
        </span>
        <span className="tplayer__dim">
          {clip.frames} frames · {clip.durationSec}s
        </span>
      </div>

      {clips.filter((c) => c.seriesId === clip.seriesId).length > 1 && (
        <div className="tplayer__variants" role="tablist" aria-label="Sequence version">
          {clips.map((c, i) =>
            c.seriesId === clip.seriesId ? (
              <button key={c.id} type="button" role="tab" aria-selected={i === index} className={`tplayer__variant${i === index ? ' is-on' : ''}`} onClick={() => select(i)}>
                Ver. {c.variant}
                {c.episode ? <em> · {c.episode}</em> : null}
              </button>
            ) : null,
          )}
        </div>
      )}

      {clip.description && <p className="tplayer__desc">{clip.description}</p>}
      <p className="tplayer__source">
        Rendered from the episode stills in the wiki's{' '}
        <a href={clip.sourcePage} target="_blank" rel="noreferrer noopener">
          transformation sequence library
        </a>
        .
      </p>
    </section>
  );
}
