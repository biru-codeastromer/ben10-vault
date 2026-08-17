/** Omnitrix hourglass geometry per era (200×200 design space, centred on 0,0). */
export type HourglassVariant = 'os' | 'af' | 'ua' | 'ov';

const PATHS: Record<HourglassVariant, string> = {
  os: 'M -62 -64 L 62 -64 L 9 -3 L 9 3 L 62 64 L -62 64 L -9 3 L -9 -3 Z',
  af: 'M -70 -60 L 70 -60 L 12 -2 L 12 2 L 70 60 L -70 60 L -12 2 L -12 -2 Z',
  ua: 'M -70 -60 L 70 -60 L 14 -1 L 14 1 L 70 60 L -70 60 L -14 1 L -14 -1 Z',
  ov: 'M -66 -62 L 66 -62 L 16 -2 L 16 2 L 66 62 L -66 62 L -16 2 L -16 -2 Z',
};

export function hourglassPath(variant: HourglassVariant, scale = 1): string {
  if (scale === 1) return PATHS[variant];
  return PATHS[variant].replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(parseFloat(n) * scale * 100) / 100));
}

