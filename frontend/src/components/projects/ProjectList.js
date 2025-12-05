import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectList = ({ projects, onProjectClick }) => {
  const navigate = useNavigate();

  const handleProjectClick = (projectId) => {
    if (onProjectClick) {
      onProjectClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h3>No projects yet</h3>
        <p>Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      {projects.map(project => (
        <div 
          key={project.id} 
          className="card project-card" 
          onClick={() => handleProjectClick(project.id)}
          style={{cursor: 'pointer'}}
        >
          <div className="card-header">
            <h3 className="card-title">{project.name}</h3>
            <span className="project-status">
              {project.team_id ? 'Team Project' : 'Personal Project'}
            </span>
          </div>
          <p className="project-description">
            {project.description || 'No description provided'}
          </p>
          <div className="project-meta">
            <div className="meta-item">
              <strong>Team:</strong> {project.team_name || 'Personal'}
            </div>
            <div className="meta-item">
              <strong>Tasks:</strong> {project.task_count || 0} total, {project.completed_tasks || 0} completed
            </div>
            <div className="meta-item">
              <strong>Created by:</strong> {project.created_by_name}
            </div>
            <div className="meta-item">
              <strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="project-actions">
            <button 
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleProjectClick(project.id);
              }}
            >
              View Project
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;