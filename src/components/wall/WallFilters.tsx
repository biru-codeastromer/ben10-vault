import { useEffect, useRef, useState } from 'react';
import type { PowerClassId } from '../../data/schema';
import { powerClasses } from '../../data/vault';
import { audio } from '../../lib/audio';
import { DEFAULT_FILTERS, type SortKey, type WallFilterState } from '../../lib/wallFilters';
import './WallFilters.css';

interface Props {
  value: WallFilterState;
  onChange: (v: WallFilterState) => void;
  species: string[];
  total: number;
  shown: number;
  kindCounts: { standard: number; ultimate: number; fusion: number };
}

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'debut', label: 'First appearance' },
  { id: 'power-desc', label: 'Power · high → low' },
  { id: 'power-asc', label: 'Power · low → high' },
  { id: 'name', label: 'A → Z' },
];

export function WallFilters({ value, onChange, species, total, shown, kindCounts }: Props) {
  const [q, setQ] = useState(value.q);
  const timer = useRef<number | null>(null);
  useEffect(() => setQ(value.q), [value.q]);

  const setQuery = (next: string) => {
    setQ(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ ...value, q: next }), 160);
  };
  const toggleClass = (id: PowerClassId) => {
    audio.play('dial-tick', { volume: 0.35, throttleMs: 60 });
    const has = value.classes.includes(id);
    onChange({ ...value, classes: has ? value.classes.filter((c) => c !== id) : [...value.classes, id] });
  };
  const setKind = (kind: WallFilterState['kind']) => {
    audio.play('dial-tick', { volume: 0.35, throttleMs: 60 });
    onChange({ ...value, kind });
  };
  const isDirty = value.q || value.classes.length || value.kind !== 'all' || value.sort !== 'debut' || value.species;

  return (
    <div className="wfilters" role="search">
      <div className="wfilters__row">
        <label className="wfilters__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan for an alien, species or ability…"
            aria-label="Search aliens"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="wfilters__group" role="group" aria-label="Form type">
          {(
            [
              ['all', 'All', total],
              ['standard', 'Base', kindCounts.standard],
              ['ultimate', 'Ultimate', kindCounts.ultimate],
              ['fusion', 'Fusion', kindCounts.fusion],
            ] as const
          )
            .filter(([id, , n]) => id === 'all' || n > 0)
            .map(([id, label, n]) => (
              <button key={id} type="button" className={`wchip${value.kind === id ? ' is-on' : ''}`} onClick={() => setKind(id)} aria-pressed={value.kind === id}>
                {label}
                <span className="wchip__n">{n}</span>
              </button>
            ))}
        </div>

        <label className="wfilters__select">
          <span>Sort</span>
          <select value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })} aria-label="Sort cards">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="wfilters__select">
          <span>Species</span>
          <select value={value.species} onChange={(e) => onChange({ ...value, species: e.target.value })} aria-label="Filter by species">
            <option value="">Any</option>
            {species.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="wfilters__row wfilters__row--classes" role="group" aria-label="Power class">
        {powerClasses.map((pc) => (
          <button
            key={pc.id}
            type="button"
            className={`wclass tier-${pc.tier}${value.classes.includes(pc.id) ? ' is-on' : ''}`}
            onClick={() => toggleClass(pc.id)}
            aria-pressed={value.classes.includes(pc.id)}
            title={`${pc.name} · ${pc.min}–${pc.max}`}
          >
            <span className="wclass__dot" />
            {pc.name}
            <span className="wclass__range">
              {pc.min}
              {pc.max !== pc.min ? `–${pc.max}` : ''}
            </span>
          </button>
        ))}
        <span className="wfilters__count" aria-live="polite">
          {shown === total ? `${total} cards` : `${shown} of ${total}`}
        </span>
        {isDirty ? (
          <button type="button" className="wfilters__reset" onClick={() => onChange(DEFAULT_FILTERS)}>
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
