import React from 'react';

const ProjectCard = ({ project }) => {
  return (
    <div className="card project-card">
      <div className="card-header">
        <h3 className="card-title">{project.name}</h3>
        <span className={`status-badge ${project.status || 'active'}`}>
          {project.status || 'Active'}
        </span>
      </div>
      
      <p className="project-description">
        {project.description || 'No description provided'}
      </p>
      
      <div className="project-stats">
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Members</span>
        </div>
      </div>
      
      <div className="project-footer">
        <span className="created-date">
          Created: {new Date(project.created_at).toLocaleDateString()}
        </span>
        <button className="btn btn-outline">View Details</button>
      </div>
    </div>
  );
};

export default ProjectCard;