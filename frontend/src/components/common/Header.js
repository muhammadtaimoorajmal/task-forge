import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    // Navigate to settings page when created
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div>
        <h1>TaskForge Dashboard</h1>
        <p>Welcome back, {user?.username}!</p>
      </div>
      
      <div className="user-info">
        <div className="user-menu-container">
          <button 
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span>Hello, {user?.username}</span>
            <span className="user-arrow">▼</span>
          </button>
          
          {showUserMenu && (
            <div className="user-menu">
              <div className="user-menu-item" onClick={handleProfileClick}>
                👤 My Profile
              </div>
              <div className="user-menu-item" onClick={handleSettingsClick}>
                ⚙️ Settings
              </div>
              <div className="user-menu-divider"></div>
              <div className="user-menu-item logout-item" onClick={onLogout}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>
        
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;