import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Logo1.png';
import './SportTeacherPage.css';
import '../styles/talentadmin.css';

const NAV_ITEMS = [
  ['home', 'Home', 'This is home.'],
  ['schools', 'Schools', 'Here you will manage schools.'],
  ['sport-teachers', 'Sport teachers', 'Here you will manage sport teachers.'],
  ['head-teachers', 'Head teachers', 'Here you will manage head teachers.'],
  ['students', 'Students', 'Here you will manage students.'],
  ['parents', 'Parents', 'Here you will manage parents.'],
  ['ward-managers', 'Ward managers', 'Here you will manage ward managers.'],
  ['district-managers', 'District managers', 'Here you will manage district managers.'],
  ['region-managers', 'Region managers', 'Here you will manage region managers.'],
  ['zone-managers', 'Zone managers', 'Here you will manage zone managers.'],
  ['admins', 'Admins', 'Here you will manage admins.'],
];

export default function TalentAdminPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const activeItem = NAV_ITEMS.find(([key]) => key === activeTab) || NAV_ITEMS[0];

  return (
    <div className="sport-teacher-page talent-admin-page">
      <header className="sport-teacher-app-bar">
        <div className="sport-teacher-brand">
          <img src={logo} alt="Talanta logo" />
          <span>Talanta Management System</span>
        </div>
        <button
          type="button"
          className="sport-teacher-navigation-toggle"
          onClick={() => setNavigationOpen((open) => !open)}
          aria-label="Open navigation menu"
          aria-expanded={navigationOpen}
          title="Open navigation menu"
        >
          <span /><span /><span />
        </button>
      </header>

      <aside className={`sport-teacher-navigation ${navigationOpen ? 'is-open' : ''}`}>
        <div className="sport-teacher-navigation-heading">Talent Administration</div>
        {NAV_ITEMS.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={activeTab === key ? 'active' : ''}
            aria-current={activeTab === key ? 'page' : undefined}
            onClick={() => {
              setActiveTab(key);
              setNavigationOpen(false);
            }}
          >
            {label}
          </button>
        ))}
        <button type="button" className="sport-teacher-logout-button" onClick={logout}>Logout</button>
      </aside>

      <main className="sport-teacher-prototype-content talent-admin-content">
        <section className="talent-admin-placeholder" aria-labelledby="talent-admin-page-title">
          <p className="sport-teacher-eyebrow">Talent Administration</p>
          <h1 id="talent-admin-page-title">{activeItem[1]}</h1>
          <p>{activeItem[2]}</p>
        </section>
      </main>
    </div>
  );
}
