import React, { useState, useEffect } from 'react';
import { projectAPI, teamAPI } from '../../services/api';

const CreateProject = ({ onProjectCreated, onCancel, onError }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    team_id: '' 
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    fetchUserTeams();
  }, []);

  const fetchUserTeams = async () => {
    try {
      const response = await teamAPI.getAll();
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      onError('Project name is required');
      return;
    }

    setLoading(true);
    onError('');

    try {
      console.log('Creating project with data:', formData);
      const response = await projectAPI.create(formData);
      console.log('Project created successfully:', response.data);
      onProjectCreated(response.data.project);
      setFormData({ name: '', description: '', team_id: '' });
    } catch (error) {
      console.error('Project creation error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create project';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-form">
      <h3>Create New Project</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Project Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter project name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project (optional)"
            rows="3"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Team (Optional)</label>
          <select
            name="team_id"
            value={formData.team_id}
            onChange={handleChange}
            disabled={loading || teamsLoading}
          >
            <option value="">Personal Project</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} {team.role === 'admin' ? '(Admin)' : '(Member)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;