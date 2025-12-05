import React from 'react';
import { Link } from 'react-router-dom';
import Login from '../components/auth/Login';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome to TaskForge</h2>
        <p className="auth-subtitle">Sign in to your account</p>
        <Login onLogin={onLogin} />
        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;