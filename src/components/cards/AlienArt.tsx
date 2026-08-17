import { useState } from 'react';
import type { Asset } from '../../data/schema';

interface Props {
  asset: Asset | undefined;
  alt: string;
  className?: string;
  hover?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

/**
 * Lazy, aspect-aware alien artwork with a graceful fallback (silhouette + label) when an
 * asset is missing. Missing assets are surfaced in the asset manifest, never hidden.
 */
export function AlienArt({ asset, alt, className, hover, loading = 'lazy' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!asset || failed) {
    return (
      <div className={`alien-art alien-art--missing ${className ?? ''}`} role="img" aria-label={`${alt} (artwork pending)`}>
        <svg viewBox="0 0 100 140" aria-hidden="true">
          <path d="M50 8c-14 0-24 10-24 24 0 12 7 20 14 24-14 4-24 16-24 34v40h68v-40c0-18-10-30-24-34 7-4 14-12 14-24 0-14-10-24-24-24z" fill="currentColor" opacity="0.18" />
        </svg>
        <span>ARTWORK PENDING</span>
      </div>
    );
  }
  return (
    <img
      className={`alien-art ${className ?? ''}${loaded ? ' is-loaded' : ''}${hover ? ' is-hover' : ''}`}
      src={asset.path}
      alt={alt}
      width={asset.width}
      height={asset.height}
      loading={loading}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
