/** Prefix an absolute public path ("/assets/…", "/audio/…") with Vite's base URL so the app works under a sub-path. */
export function assetUrl(p: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return p.startsWith('/') ? base + p : p;
}
