import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import TeamList from '../components/teams/TeamList';
import CreateTeam from '../components/teams/CreateTeam';
import { teamAPI } from '../services/api';

const TeamsPage = ({ user, onLogout }) => {
  const [teams, setTeams] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getAll();
      setTeams(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = (newTeam) => {
    setTeams([newTeam, ...teams]);
    setShowCreateForm(false);
    setError('');
  };

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const stats = {
    totalTeams: teams.length,
    adminTeams: teams.filter(team => team.role === 'admin').length,
    memberTeams: teams.filter(team => team.role === 'member').length
  };

  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="main-content">
        <Header user={user} onLogout={onLogout} />
        
        {error && (
          <div className="error-message" style={{marginBottom: '1rem'}}>
            {error}
          </div>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-3">
          <div className="card stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalTeams}</h3>
              <p>Total Teams</p>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-content">
              <h3>{stats.adminTeams}</h3>
              <p>Teams You Admin</p>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-content">
              <h3>{stats.memberTeams}</h3>
              <p>Teams You're In</p>
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Teams</h3>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={loading}
            >
              {showCreateForm ? 'Cancel' : '+ New Team'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-team-container">
              <CreateTeam 
                onTeamCreated={handleTeamCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {loading ? (
            <div className="loading">Loading teams...</div>
          ) : (
            <TeamList teams={teams} onTeamClick={handleTeamClick} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;