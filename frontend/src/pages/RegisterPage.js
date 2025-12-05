import React from 'react';
import { Link } from 'react-router-dom';
import Register from '../components/auth/Register';

const RegisterPage = ({ onLogin }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join TaskForge today</p>
        <Register onLogin={onLogin} />
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;