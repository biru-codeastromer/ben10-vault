/**
 * The Omnitrix hourglass mark. `variant` follows the eras: the 2005 mark is a slimmer bow-tie,
 * the later marks are heavier with a thicker waist.
 */
import { hourglassPath, type HourglassVariant } from './hourglassPath';

export interface HourglassProps extends React.SVGProps<SVGPathElement> {
  variant?: HourglassVariant;
  scale?: number;
}

/** Renders the mark centred on (0,0) in a 200×200 design space (use transform to place). */
export function Hourglass({ variant = 'af', scale = 1, ...rest }: HourglassProps) {
  return <path d={hourglassPath(variant, scale)} {...rest} />;
}

/** Standalone icon: green disc, dark hourglass — the badge as it appears on the aliens. */
export function OmnitrixIcon({
  size = 20,
  variant = 'af',
  className,
  title = 'Omnitrix',
}: {
  size?: number;
  variant?: HourglassVariant;
  className?: string;
  title?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" className={className} role="img" aria-label={title}>
      <circle r="98" fill="#1b1f1c" />
      <circle r="90" fill="#8fa19a" />
      <circle r="76" fill="var(--era, #5ad72a)" />
      <path d={hourglassPath(variant, 0.62)} fill="#0a0d0b" />
    </svg>
  );
}
