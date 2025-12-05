import React, { useState } from 'react';
import { teamAPI } from '../../services/api';

const InviteMember = ({ teamId, onMemberAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await teamAPI.invite(teamId, { email });
      setSuccess(response.data.message);
      setEmail('');
      if (onMemberAdded) {
        onMemberAdded(response.data.member);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-member">
      <h5>Invite Team Member</h5>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="invite-form">
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user's email address"
            disabled={loading}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Inviting...' : 'Invite to Team'}
        </button>
      </form>
    </div>
  );
};

export default InviteMember;