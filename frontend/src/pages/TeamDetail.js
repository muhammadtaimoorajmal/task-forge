import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import TeamMembers from '../components/teams/TeamMembers';
import InviteMember from '../components/teams/InviteMember';
import { teamAPI } from '../services/api';

const TeamDetail = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      // Since we don't have a specific team detail endpoint, use teams list
      const response = await teamAPI.getAll();
      const foundTeam = response.data.find(t => t.id === parseInt(id));
      
      if (foundTeam) {
        setTeam(foundTeam);
      } else {
        setError('Team not found');
      }
    } catch (error) {
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAdded = () => {
    // Refresh members list
    fetchTeam();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Header user={user} onLogout={onLogout} />
          <div className="loading">Loading team details...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Header user={user} onLogout={onLogout} />
          <div className="error-message">
            {error || 'Team not found'}
            <button 
              onClick={() => navigate('/teams')}
              className="btn btn-primary"
              style={{marginLeft: '1rem'}}
            >
              Back to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="main-content">
        <Header user={user} onLogout={onLogout} />
        
        {/* Team Header */}
        <div className="card team-header">
          <div className="team-header-content">
            <div className="team-info">
              <button 
                onClick={() => navigate('/teams')}
                className="btn btn-outline"
                style={{marginBottom: '1rem'}}
              >
                ← Back to Teams
              </button>
              <h1>{team.name}</h1>
              <p className="team-description">{team.description || 'No description provided'}</p>
              <div className="team-meta">
                <span><strong>Created by:</strong> {team.created_by_name}</span>
                <span><strong>Your Role:</strong> <span className={`role-text ${team.role}`}>{team.role}</span></span>
                <span><strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Management Tabs */}
        <div className="card">
          <div className="modal-tabs">
            <button 
              className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Team Members
            </button>
            <button 
              className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
              onClick={() => setActiveTab('invite')}
            >
              Invite Members
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'members' ? (
              <TeamMembers teamId={id} currentUser={user} />
            ) : (
              <InviteMember teamId={id} onMemberAdded={handleMemberAdded} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;