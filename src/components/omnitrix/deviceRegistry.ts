import { OmniverseOmnitrix, PrototypeOmnitrix, RecalibratedOmnitrix, Ultimatrix } from './devices';

export const DEVICE_COMPONENTS = {
  os: PrototypeOmnitrix,
  af: RecalibratedOmnitrix,
  ua: Ultimatrix,
  ov: OmniverseOmnitrix,
} as const;
