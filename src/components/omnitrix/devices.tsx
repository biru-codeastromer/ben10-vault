/**
 * The four era devices, drawn as SVG from official reference art (see docs/design-notes.md).
 * Each takes `dialRotation` (degrees) and `charge` (0..1 — how lit the face is).
 * ViewBox is 0 0 400 400 with the dial centred at (200,200) so they line up in a row.
 */
import type { CSSProperties } from 'react';
import { hourglassPath } from './hourglassPath';

export interface DeviceProps {
  dialRotation?: number;
  charge?: number;
  className?: string;
  style?: CSSProperties;
  idPrefix: string; // unique per instance so gradient ids never collide
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------------------------------------------------------------- */
/* 1. Prototype Omnitrix — Ben 10 (2005)                             */
/* black/dark-grey band, grey bezel with green studs, green face     */
/* with a black hourglass, light clasp tabs at the corners           */
/* ---------------------------------------------------------------- */
export function PrototypeOmnitrix({ dialRotation = 0, charge = 0.5, className, style, idPrefix: p }: DeviceProps) {
  const c = clamp01(charge);
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1e21" />
          <stop offset="0.5" stopColor="#3b3f44" />
          <stop offset="1" stopColor="#1a1c1f" />
        </linearGradient>
        <radialGradient id={`${p}-face`} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#c8ff7a" />
          <stop offset="0.45" stopColor="#7be332" />
          <stop offset="1" stopColor="#3f9d17" />
        </radialGradient>
        <linearGradient id={`${p}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9b0b8" />
          <stop offset="0.5" stopColor="#6d747b" />
          <stop offset="1" stopColor="#3f444a" />
        </linearGradient>
        <radialGradient id={`${p}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#8dff4d" stopOpacity={0.55 * c} />
          <stop offset="1" stopColor="#8dff4d" stopOpacity="0" />
        </radialGradient>
        <filter id={`${p}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ambient glow behind the device */}
      <circle cx="200" cy="200" r="190" fill={`url(#${p}-glow)`} />

      {/* band */}
      <g>
        <rect x="118" y="6" width="164" height="150" rx="34" fill={`url(#${p}-band)`} stroke="#0c0d0f" strokeWidth="5" />
        <rect x="118" y="244" width="164" height="150" rx="34" fill={`url(#${p}-band)`} stroke="#0c0d0f" strokeWidth="5" />
        {/* band ribs */}
        {[38, 66, 94].map((y) => (
          <rect key={y} x="132" y={y} width="136" height="7" rx="3" fill="#0d0e10" opacity="0.7" />
        ))}
        {[300, 328, 356].map((y) => (
          <rect key={y} x="132" y={y} width="136" height="7" rx="3" fill="#0d0e10" opacity="0.7" />
        ))}
        {/* light clasp tabs */}
        {[
          [96, 88, -18],
          [304, 88, 18],
          [96, 312, 18],
          [304, 312, -18],
        ].map(([x, y, r], i) => (
          <rect key={i} x={x - 16} y={y - 34} width="32" height="68" rx="14" fill="#e6e8e3" stroke="#0c0d0f" strokeWidth="4" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>

      {/* housing */}
      <rect x="86" y="86" width="228" height="228" rx="58" fill="#15171a" stroke="#050607" strokeWidth="6" />
      <rect x="98" y="98" width="204" height="204" rx="50" fill="none" stroke="#3a3f45" strokeWidth="3" opacity="0.7" />
      {/* green studs */}
      {[
        [122, 122],
        [278, 122],
        [122, 278],
        [278, 278],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="11" fill="#0a0c0d" />
          <circle cx={x} cy={y} r="8" fill="#5fd127" />
          <circle cx={x - 2.5} cy={y - 2.5} r="3" fill="#d1ffa4" opacity="0.8" />
        </g>
      ))}
      {/* side button */}
      <rect x="312" y="180" width="30" height="40" rx="12" fill="#0a0c0d" />
      <rect x="318" y="186" width="18" height="28" rx="9" fill="#5fd127" />

      {/* dial (rotates) */}
      <g transform={`rotate(${dialRotation} 200 200)`}>
        <circle cx="200" cy="200" r="104" fill="#0a0b0c" />
        <circle cx="200" cy="200" r="98" fill={`url(#${p}-bezel)`} stroke="#0b0c0e" strokeWidth="4" />
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x="196" y="104" width="8" height="18" rx="3" fill="#2a2e33" transform={`rotate(${a} 200 200)`} />
        ))}
        <circle cx="200" cy="200" r="82" fill="#0b0d0e" />
      </g>
      {/* face (does not rotate) */}
      <circle cx="200" cy="200" r="76" fill={`url(#${p}-face)`} />
      <circle cx="200" cy="200" r="76" fill="#8dff4d" opacity={0.25 * c} filter={`url(#${p}-soft)`} />
      <path d={hourglassPath('os', 0.92)} transform="translate(200 200)" fill="#0b0d0b" />
      {/* gloss */}
      <path d="M 140 168 A 74 74 0 0 1 258 150" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* 2. Recalibrated Omnitrix — Alien Force                            */
/* green band with a black centre stripe, grey segmented bezel,      */
/* black face with a bold green hourglass, grey side pins            */
/* ---------------------------------------------------------------- */
export function RecalibratedOmnitrix({ dialRotation = 0, charge = 0.5, className, style, idPrefix: p }: DeviceProps) {
  const c = clamp01(charge);
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#127a1c" />
          <stop offset="0.35" stopColor="#25ad2c" />
          <stop offset="0.65" stopColor="#25ad2c" />
          <stop offset="1" stopColor="#0f6a18" />
        </linearGradient>
        <linearGradient id={`${p}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b7bec6" />
          <stop offset="0.5" stopColor="#737a82" />
          <stop offset="1" stopColor="#40464d" />
        </linearGradient>
        <radialGradient id={`${p}-hg`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#b8ff70" />
          <stop offset="0.6" stopColor="#5fd627" />
          <stop offset="1" stopColor="#3aa316" />
        </radialGradient>
        <radialGradient id={`${p}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor="#6cff5a" stopOpacity={0.5 * c} />
          <stop offset="1" stopColor="#6cff5a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${p}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <circle cx="200" cy="200" r="190" fill={`url(#${p}-glow)`} />

      {/* band — tapered straps */}
      <path d="M 150 4 L 250 4 L 262 128 L 138 128 Z" fill={`url(#${p}-band)`} stroke="#061c08" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 138 272 L 262 272 L 250 396 L 150 396 Z" fill={`url(#${p}-band)`} stroke="#061c08" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 186 6 L 214 6 L 218 128 L 182 128 Z" fill="#0b0d0c" />
      <path d="M 182 272 L 218 272 L 214 394 L 186 394 Z" fill="#0b0d0c" />
      {/* strap segment lines */}
      <path d="M 146 62 L 254 62 M 142 96 L 258 96 M 142 304 L 258 304 M 146 338 L 254 338" stroke="#0a3a10" strokeWidth="3" opacity="0.8" />

      {/* side pins */}
      <rect x="66" y="184" width="46" height="32" rx="10" fill="#8a9098" stroke="#1a1d20" strokeWidth="4" />
      <rect x="288" y="184" width="46" height="32" rx="10" fill="#8a9098" stroke="#1a1d20" strokeWidth="4" />

      {/* outer green housing ring */}
      <circle cx="200" cy="200" r="120" fill="#1e9526" stroke="#06200a" strokeWidth="6" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="#67e463" strokeWidth="2" opacity="0.35" />

      {/* bezel (rotates) */}
      <g transform={`rotate(${dialRotation} 200 200)`}>
        <circle cx="200" cy="200" r="104" fill={`url(#${p}-bezel)`} stroke="#0e1113" strokeWidth="5" />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="200" y1="100" x2="200" y2="122" stroke="#23272b" strokeWidth="5" transform={`rotate(${i * 45} 200 200)`} />
        ))}
        <circle cx="200" cy="200" r="86" fill="#1c1f22" />
      </g>

      {/* face */}
      <circle cx="200" cy="200" r="78" fill="#070808" />
      <path d={hourglassPath('af', 0.9)} transform="translate(200 200)" fill="#5fd627" opacity={0.6 + 0.4 * c} filter={`url(#${p}-soft)`} />
      <path d={hourglassPath('af', 0.9)} transform="translate(200 200)" fill={`url(#${p}-hg)`} />
      <path d="M 148 160 A 78 78 0 0 1 244 134" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* 3. Ultimatrix — Ultimate Alien                                    */
/* bulky green gauntlet with black panels, grey dial ring,           */
/* black face with an angular green hourglass                        */
/* ---------------------------------------------------------------- */
export function Ultimatrix({ dialRotation = 0, charge = 0.5, className, style, idPrefix: p }: DeviceProps) {
  const c = clamp01(charge);
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35c247" />
          <stop offset="0.5" stopColor="#1f9631" />
          <stop offset="1" stopColor="#0f5f1d" />
        </linearGradient>
        <linearGradient id={`${p}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c2c8cf" />
          <stop offset="0.5" stopColor="#7a8189" />
          <stop offset="1" stopColor="#3b4046" />
        </linearGradient>
        <radialGradient id={`${p}-hg`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#c6ff8a" />
          <stop offset="0.6" stopColor="#5fe23a" />
          <stop offset="1" stopColor="#2c9a25" />
        </radialGradient>
        <radialGradient id={`${p}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor="#5cff7a" stopOpacity={0.5 * c} />
          <stop offset="1" stopColor="#5cff7a" stopOpacity="0" />
        </radialGradient>
        <filter id={`${p}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <circle cx="200" cy="200" r="195" fill={`url(#${p}-glow)`} />

      {/* gauntlet body */}
      <rect x="52" y="34" width="296" height="332" rx="70" fill={`url(#${p}-body)`} stroke="#062a0d" strokeWidth="6" />
      <rect x="66" y="48" width="268" height="304" rx="60" fill="none" stroke="#7df08a" strokeWidth="2" opacity="0.28" />
      {/* black panels / screens */}
      <rect x="92" y="52" width="216" height="46" rx="12" fill="#0d0f10" stroke="#062a0d" strokeWidth="4" />
      <rect x="104" y="60" width="192" height="30" rx="8" fill="#161a1c" />
      <rect x="112" y="66" width="60" height="18" rx="4" fill="#2ac744" opacity={0.35 + 0.5 * c} />
      <rect x="92" y="302" width="216" height="46" rx="12" fill="#0d0f10" stroke="#062a0d" strokeWidth="4" />
      <rect x="104" y="310" width="192" height="30" rx="8" fill="#161a1c" />
      {/* side vents */}
      {[130, 158, 186, 214, 242, 270].map((y) => (
        <g key={y}>
          <rect x="60" y={y} width="22" height="12" rx="4" fill="#0d1a10" opacity="0.7" />
          <rect x="318" y={y} width="22" height="12" rx="4" fill="#0d1a10" opacity="0.7" />
        </g>
      ))}

      {/* dial ring (rotates) — four lobes evoke the Ultimatrix symbol */}
      <g transform={`rotate(${dialRotation} 200 200)`}>
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x="176" y="82" width="48" height="26" rx="10" fill="#8a9199" stroke="#0e1113" strokeWidth="4" transform={`rotate(${a + 45} 200 200)`} />
        ))}
        <circle cx="200" cy="200" r="104" fill={`url(#${p}-bezel)`} stroke="#0e1113" strokeWidth="5" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="200" y1="100" x2="200" y2="112" stroke="#2c3136" strokeWidth="4" transform={`rotate(${i * 30} 200 200)`} />
        ))}
        <circle cx="200" cy="200" r="86" fill="#1a1d20" />
      </g>

      {/* face */}
      <circle cx="200" cy="200" r="78" fill="#050606" />
      <path d={hourglassPath('ua', 0.92)} transform="translate(200 200)" fill="#5fe23a" opacity={0.6 + 0.4 * c} filter={`url(#${p}-soft)`} />
      <path d={hourglassPath('ua', 0.92)} transform="translate(200 200)" fill={`url(#${p}-hg)`} />
      <path d="M 148 160 A 78 78 0 0 1 244 134" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* 4. Omnitrix — Omniverse (the completed Omnitrix)                  */
/* white band with green edges, green rounded housing, black square  */
/* face with green hourglass, three small dots                       */
/* ---------------------------------------------------------------- */
export function OmniverseOmnitrix({ dialRotation = 0, charge = 0.5, className, style, idPrefix: p }: DeviceProps) {
  const c = clamp01(charge);
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${p}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9d1c8" />
          <stop offset="0.3" stopColor="#f5f7f2" />
          <stop offset="0.7" stopColor="#f5f7f2" />
          <stop offset="1" stopColor="#c0c8bf" />
        </linearGradient>
        <linearGradient id={`${p}-housing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fdc55" />
          <stop offset="0.55" stopColor="#2fb63a" />
          <stop offset="1" stopColor="#1a8a2a" />
        </linearGradient>
        <radialGradient id={`${p}-hg`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#c8ff88" />
          <stop offset="0.6" stopColor="#5ee63b" />
          <stop offset="1" stopColor="#2fae2c" />
        </radialGradient>
        <radialGradient id={`${p}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor="#7cff5c" stopOpacity={0.5 * c} />
          <stop offset="1" stopColor="#7cff5c" stopOpacity="0" />
        </radialGradient>
        <filter id={`${p}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <circle cx="200" cy="200" r="190" fill={`url(#${p}-glow)`} />

      {/* white band with green edges */}
      <path d="M 146 6 L 254 6 L 258 120 L 142 120 Z" fill={`url(#${p}-band)`} stroke="#101410" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 142 280 L 258 280 L 254 394 L 146 394 Z" fill={`url(#${p}-band)`} stroke="#101410" strokeWidth="5" strokeLinejoin="round" />
      <path d="M 150 8 L 166 8 L 168 118 L 148 118 Z M 234 8 L 250 8 L 252 118 L 232 118 Z" fill="#37c53a" />
      <path d="M 148 282 L 168 282 L 166 392 L 150 392 Z M 232 282 L 252 282 L 250 392 L 234 392 Z" fill="#37c53a" />
      {/* band pin holes */}
      {[40, 70, 100].map((y) => (
        <g key={y}>
          <rect x="190" y={y} width="20" height="8" rx="4" fill="#101410" opacity="0.6" />
          <rect x="190" y={y + 260} width="20" height="8" rx="4" fill="#101410" opacity="0.6" />
        </g>
      ))}

      {/* green housing (rotates subtly like a rotating faceplate) */}
      <g transform={`rotate(${dialRotation * 0.35} 200 200)`}>
        <rect x="92" y="96" width="216" height="208" rx="52" fill={`url(#${p}-housing)`} stroke="#0e1a0f" strokeWidth="6" />
        <rect x="104" y="108" width="192" height="184" rx="44" fill="none" stroke="#c9ffb0" strokeWidth="2" opacity="0.4" />
        {/* diagonal cut detail */}
        <path d="M 108 130 L 140 104" stroke="#0e1a0f" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <path d="M 292 270 L 260 296" stroke="#0e1a0f" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* black square face */}
      <rect x="132" y="134" width="136" height="132" rx="22" fill="#070908" stroke="#0e1a0f" strokeWidth="4" />
      <path d={hourglassPath('ov', 0.78)} transform="translate(200 200)" fill="#5ee63b" opacity={0.6 + 0.4 * c} filter={`url(#${p}-soft)`} />
      <path d={hourglassPath('ov', 0.78)} transform="translate(200 200)" fill={`url(#${p}-hg)`} />
      {/* three dots */}
      {[176, 200, 224].map((x) => (
        <circle key={x} cx={x} cy="284" r="5" fill="#0e1a0f" />
      ))}
      {[176, 200, 224].map((x) => (
        <circle key={x} cx={x} cy="284" r="3" fill="#7dff65" opacity={0.5 + 0.5 * c} />
      ))}
      <path d="M 146 156 L 190 142" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
