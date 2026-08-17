import { NavLink, useLocation } from 'react-router-dom';
import { series } from '../../data/vault';
import { useSoundEnabled } from '../../lib/hooks';
import { OmnitrixIcon } from '../omnitrix/Hourglass';
import './Header.css';

export function Header() {
  const [sound, toggle] = useSoundEnabled();
  const loc = useLocation();
  const onHome = loc.pathname === '/';
  return (
    <header className={`site-header${onHome ? ' site-header--home' : ''}`}>
      <div className="site-header__inner">
        <NavLink to="/" className="brand" aria-label="Ben 10 Vault — home">
          <OmnitrixIcon size={26} variant="os" className="brand__mark" />
          <span className="brand__text">
            <span className="brand__ben">BEN 10</span>
            <span className="brand__vault">VAULT</span>
          </span>
        </NavLink>
        <nav className="site-nav" aria-label="Primary">
          {series.map((s) => (
            <NavLink key={s.id} to={`/era/${s.id}`} data-era={s.id} className="site-nav__link site-nav__era">
              <span className="site-nav__dot" />
              {s.shortName}
            </NavLink>
          ))}
          <NavLink to="/ben" className="site-nav__link">
            Ben Archive
          </NavLink>
          <NavLink to="/about" className="site-nav__link">
            About
          </NavLink>
        </nav>
        <button
          type="button"
          className={`sound-toggle${sound ? ' is-on' : ''}`}
          onClick={toggle}
          aria-pressed={sound}
          aria-label={sound ? 'Sound on — click to mute' : 'Sound off — click to unmute'}
          title={sound ? 'Sound on' : 'Sound off'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            {sound ? (
              <>
                <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </>
            ) : (
              <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
          <span className="sound-toggle__label">{sound ? 'Sound' : 'Muted'}</span>
        </button>
      </div>
    </header>
  );
}
