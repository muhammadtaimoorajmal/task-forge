import React, { useState, useEffect } from 'react';
import { teamAPI } from '../../services/api';

const TeamMembers = ({ teamId, currentUser }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    try {
      const response = await teamAPI.getMembers(teamId);
      setMembers(response.data);
    } catch (error) {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await teamAPI.removeMember(teamId, userId);
      setMembers(members.filter(member => member.id !== userId));
    } catch (error) {
      setError('Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await teamAPI.updateRole(teamId, userId, { role: newRole });
      setMembers(members.map(member => 
        member.id === userId ? { ...member, role: newRole } : member
      ));
    } catch (error) {
      setError('Failed to update role');
    }
  };

  if (loading) return <div className="loading">Loading members...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const currentUserMember = members.find(member => member.id === currentUser.id);
  const isAdmin = currentUserMember?.role === 'admin';

  return (
    <div className="team-members">
      <h4>Team Members ({members.length})</h4>
      
      <div className="members-list">
        {members.map(member => (
          <div key={member.id} className="member-item">
            <div className="member-info">
              <div className="member-name">{member.username}</div>
              <div className="member-email">{member.email}</div>
              <div className="member-role">
                <span className={`role-badge ${member.role}`}>
                  {member.role}
                </span>
              </div>
              <div className="member-joined">
                Joined: {new Date(member.joined_at).toLocaleDateString()}
              </div>
            </div>
            
            {isAdmin && member.id !== currentUser.id && (
              <div className="member-actions">
                <select 
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="role-select"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;