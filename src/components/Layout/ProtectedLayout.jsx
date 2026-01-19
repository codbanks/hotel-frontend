import React from 'react';
import Sidebar from '../Sidebar';
import './ProtectedLayout.css';

const ProtectedLayout = ({ children, onLogout }) => {
  return (
    <div className="layout-shell">
      {/* 1. Sidebar is fixed on the left */}
      <Sidebar onLogout={onLogout} />
      
      {/* 2. Main Content Area */}
      <main className="layout-main">
        <div className="layout-content-scrollable">
            {children}
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;