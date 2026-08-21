import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { EraTransitionOverlay } from '../components/ui/EraTransitionOverlay';
import { Header } from '../components/ui/Header';
import { HomePage } from '../pages/HomePage';
import { ScrollToTop } from './ScrollToTop';

const EraWallPage = lazy(() => import('../pages/EraWallPage').then((m) => ({ default: m.EraWallPage })));
const BenArchivePage = lazy(() => import('../pages/BenArchivePage').then((m) => ({ default: m.BenArchivePage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const SimulatorPage = lazy(() => import('../pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));

function Shell() {
  const loc = useLocation();
  return (
    <div className="app-shell grain" key="shell">
      <Header />
      <Suspense fallback={<div className="route-fallback" aria-busy="true" />}>
        <Routes location={loc}>
          <Route path="/" element={<HomePage />} />
          <Route path="/era/:seriesId" element={<EraWallPage />} />
          <Route path="/era/:seriesId/:alienId" element={<EraWallPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/simulator/:seriesId" element={<SimulatorPage />} />
          <Route path="/ben" element={<BenArchivePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
      <EraTransitionOverlay />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ScrollToTop />
      <Shell />
    </BrowserRouter>
  );
}
