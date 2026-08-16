import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/shared.css';

export const Header = ({ title, onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <button className="menu-toggle" onClick={onMenuToggle}>
          ☰
        </button>
        <h1 className="header-title">{title}</h1>
        <div className="header-user">
          <span className="user-name">{user?.username}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export const Sidebar = ({ isOpen, links, onClose }) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {links.map((link, idx) => (
            <a key={idx} href={link.href} className="nav-link">
              {link.icon && <span className="nav-icon">{link.icon}</span>}
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};

export const DashboardCard = ({ title, value, icon, color = 'blue' }) => {
  return (
    <div className={`dashboard-card card-${color}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="card-value">{value}</div>
    </div>
  );
};

export const DataTable = ({ headers, rows }) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((cell, cellIdx) => (
                <td key={cellIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormInput = ({ label, type = 'text', placeholder, name, value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export const ActionButton = ({ children, onClick, variant = 'primary', disabled = false }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
