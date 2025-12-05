import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return 'active';
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return 'active';
    return '';
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/projects', icon: '📁', label: 'Projects' },
    { path: '/teams', icon: '👥', label: 'Teams' },
    { path: '/tasks', icon: '✅', label: 'Tasks' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🚀 TaskForge</h2>
        <p className="sidebar-subtitle">Project Management</p>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`sidebar-link ${isActive(item.path)}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-stats">
          <div className="stat-item">
            <strong>Version</strong>
            <span>1.0.0</span>
          </div>
          <div className="stat-item">
            <strong>Status</strong>
            <span className="status-live">🟢 Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;