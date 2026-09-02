import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SportTeacherPage.css';
import logo from '../assets/Logo1.png';

const menuItems = [
  { key: 'home', label: 'Home' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'students', label: 'Students' },
  { key: 'results', label: 'Results' },
  { key: 'announcements', label: 'Announcements' },
];

const pageMessages = {
  home: 'This is home.',
  clubs: 'Here are the clubs.',
  students: 'Here are the students.',
  results: 'Here are the results.',
  announcements: 'Here are the announcements.',
};

const roleMessages = {
  talent_admin: 'This is home for the talent administrator.',
  region_manager: 'This is home for the region manager.',
  zone_manager: 'This is home for the zone manager.',
  district_manager: 'This is home for the district manager.',
  ward_manager: 'This is home for the ward manager.',
  head_teacher: 'This is home for the head teacher.',
  sport_teacher: 'This is home for the sport teacher.',
  student: 'This is home for the student.',
};

export default function CommonDashboardPage() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  const message = activePage === 'home'
    ? roleMessages[user?.role] || pageMessages.home
    : pageMessages[activePage];

  return (
    <div className="sport-teacher-page">
      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <div className="sport-teacher-app-actions">
          <div className="sport-teacher-profile">
            <button
              type="button"
              className="sport-teacher-profile-button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              title={user?.username || 'Profile'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c.8-3.5 3.5-5.5 7.5-5.5s6.7 2 7.5 5.5" />
              </svg>
            </button>
            {profileMenuOpen && (
              <div className="sport-teacher-profile-menu">
                <button type="button" onClick={() => setProfileMenuOpen(false)}>Profile</button>
                <button type="button" onClick={() => setProfileMenuOpen(false)}>Change password</button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sport-teacher-navigation-toggle"
            onClick={() => setNavigationOpen((open) => !open)}
            aria-label="Open navigation menu"
            aria-expanded={navigationOpen}
            title="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}>
        <div className="sport-teacher-navigation-heading">Navigation</div>
        {menuItems.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => {
              setActivePage(item.key);
              setNavigationOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="sport-teacher-logout-button" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="sport-teacher-prototype-content">
        <p>{message}</p>
      </main>
    </div>
  );
}
