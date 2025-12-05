import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import TeamsPage from './pages/TeamsPage';
import TeamDetail from './pages/TeamDetail';
import ConnectionStatus from './components/common/ConnectionStatus';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading">Loading TaskForge...</div>;
  }

  return (
    <Router>
      <div className="App">
        <ConnectionStatus />
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <LoginPage onLogin={login} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!user ? <RegisterPage onLogin={login} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects" 
            element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects/:id" 
            element={user ? <ProjectDetail user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/teams" 
            element={user ? <TeamsPage user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/teams/:id" 
            element={user ? <TeamDetail user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks" 
            element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;