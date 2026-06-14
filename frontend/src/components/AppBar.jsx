import { useEffect, useState } from 'react';
import logo from '../assets/images/logo.jpg';
import './AppBar.css';

export default function AppBar({ userName = 'User', onLogout, onProfile, onChangePassword }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.appbar-menu') && !event.target.closest('.appbar-user-button')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleToggleMenu = () => setMenuOpen((open) => !open);

  return (
    <header className="appbar">
      <img src={logo} alt="Talanta logo" className="appbar-logo" />

      <div className="appbar-title-wrapper">
        <span className="appbar-title">Talanta Management System</span>
      </div>

      <div className="appbar-actions">
        <button
          type="button"
          className="appbar-user-button"
          onClick={handleToggleMenu}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <span className="appbar-user-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
            </svg>
          </span>
          <span className="appbar-user-name">{userName}</span>
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
    </header>
  );
}
