import React from 'react';

const TeamList = ({ teams, onTeamClick }) => {
  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <h3>No teams yet</h3>
        <p>Create your first team to collaborate with others!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      {teams.map(team => (
        <div key={team.id} className="card team-card">
          <div className="card-header">
            <h3 className="card-title">{team.name}</h3>
            <span className={`role-badge ${team.role}`}>
              {team.role}
            </span>
          </div>
          <p className="team-description">
            {team.description || 'No description provided'}
          </p>
          <div className="team-meta">
            <div className="meta-item">
              <strong>Created by:</strong> {team.created_by_name}
            </div>
            <div className="meta-item">
              <strong>Role:</strong> <span className={`role-text ${team.role}`}>{team.role}</span>
            </div>
            <div className="meta-item">
              <strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="team-actions">
            <button 
              className="btn btn-primary"
              onClick={() => onTeamClick && onTeamClick(team.id)}
            >
              View Team
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;