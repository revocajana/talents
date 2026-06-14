import { useEffect, useState } from 'react';
import logo from '../assets/images/logo.jpg';
import './AppBar.css';

export default function AppBar({ userName = 'User', onLogout, onProfile, onChangePassword }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen && !drawerOpen) return undefined;

    const handleClickOutside = (event) => {
      const target = event.target;
      const clickedOutside =
        !target.closest('.appbar-menu') &&
        !target.closest('.appbar-user-button') &&
        !target.closest('.appbar-drawer') &&
        !target.closest('.appbar-hamburger-button');

      if (clickedOutside) {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, drawerOpen]);

  const handleToggleMenu = () => setMenuOpen((open) => !open);
  const handleToggleDrawer = () => setDrawerOpen((open) => !open);

  return (
    <header className="appbar">
      <img src={logo} alt="Talanta logo" className="appbar-logo" />

      <div className="appbar-title-wrapper">
        <span className="appbar-title">Talanta Management System</span>
      </div>

      <div className="appbar-actions">
        <button
          type="button"
          className="appbar-hamburger-button"
          onClick={handleToggleDrawer}
          aria-haspopup="true"
          aria-expanded={drawerOpen}
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          className="appbar-user-button"
          onClick={handleToggleMenu}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label={`Open menu for ${userName}`}
        >
          <span className="appbar-user-icon" aria-hidden="true" title={userName}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
            </svg>
          </span>
        </button>

        {menuOpen && (
          <div className="appbar-menu">
            <button type="button" className="appbar-menu-item" onClick={onProfile ?? (() => {})}>
              Profile
            </button>
            <button type="button" className="appbar-menu-item" onClick={onChangePassword ?? (() => {})}>
              Change password
            </button>
            <button type="button" className="appbar-menu-item" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {drawerOpen && (
        <>
          <div className="appbar-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="appbar-drawer" role="dialog" aria-modal="true" aria-label="Navigation drawer">
            <div className="appbar-drawer-header">
              <span>Navigation</span>
              <button type="button" className="appbar-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
                ×
              </button>
            </div>
            <nav className="appbar-drawer-nav">
              <button type="button" className="appbar-drawer-link">Dashboard</button>
              <button type="button" className="appbar-drawer-link">Users</button>
              <button type="button" className="appbar-drawer-link">Reports</button>
              <button type="button" className="appbar-drawer-link">Settings</button>
            </nav>
          </aside>
        </>
      )}
    </header>
  );
}
