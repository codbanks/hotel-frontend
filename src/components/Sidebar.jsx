import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css'; 

const Sidebar = ({ onLogout }) => {
  return (
    <aside className="sidebar-container">
      {/* 1. Header / Brand */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
            <span className="pumpkin-icon">🎃</span>
            <h1 className="brand-text">Pumpkin</h1>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink to="/ledger" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">📒</span>
          <span className="nav-label">Ledger</span>
        </NavLink>

        <NavLink to="/invoice" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">🧾</span>
          <span className="nav-label">Invoice</span>
        </NavLink>

        <NavLink to="/housestatusreport" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">🏨</span>
            <span className="nav-label">House Status</span>
        </NavLink>
        
         <div className="nav-divider">Reports</div>

         <NavLink to="/occupancy-sales" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Occupancy</span>
        </NavLink>
        
        <NavLink to="/daily-revenue" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">📈</span>
            <span className="nav-label">Daily Revenue</span>
        </NavLink>

        <NavLink to="/sales-marketing" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">📢</span>
            <span className="nav-label">Sales & Mkt</span>
        </NavLink>

        <NavLink to="/dept-sales-summary" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">🏢</span>
            <span className="nav-label">Dept Sales</span>
        </NavLink>

        <NavLink to="/client-segments" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">💵</span>
            <span className="nav-label">Client Segments</span>
        </NavLink>

        <NavLink to="/staff-debtors" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Staff Debtors</span>
        </NavLink>
      </nav>

      {/* 3. Footer / Logout */}
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button">
            🚪 Logout
        </button>
        <div className="reception-badge">Reception</div>
      </div>
    </aside>
  );
};

export default Sidebar;