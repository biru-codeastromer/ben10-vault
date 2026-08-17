import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset scroll on top-level route changes (but not when opening a card detail over a wall). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean);
    const isDetail = parts[0] === 'era' && parts.length === 3;
    if (!isDetail) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}
