import React, { useState, useEffect } from 'react';
import { taskAPI, teamAPI } from '../../services/api';

const CreateTask = ({ projectId, onTaskCreated, onCancel }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '',
    priority: 'medium',
    due_date: '',
    assignee_id: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch team members if project has a team
    fetchProjectTeamMembers();
  }, [projectId]);

  const fetchProjectTeamMembers = async () => {
    try {
      // First get project details to find team_id
      // For now, we'll assume we need to get teams and their members
      const teamsResponse = await teamAPI.getAll();
      if (teamsResponse.data.length > 0) {
        // Get members from first team (you can enhance this logic)
        const teamId = teamsResponse.data[0].id;
        const membersResponse = await teamAPI.getMembers(teamId);
        setTeamMembers(membersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const taskData = {
        ...formData,
        project_id: projectId
      };
      
      const response = await taskAPI.create(taskData);
      onTaskCreated(response.data.task);
      setFormData({ 
        title: '', 
        description: '',
        priority: 'medium',
        due_date: '',
        assignee_id: ''
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-task-form">
      <h3>Create New Task</h3>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="What needs to be done?"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the task (optional)"
            rows="3"
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div className="form-group">
            <label>Assign To</label>
            <select
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username} ({member.email})
                </option>
              ))}
            </select>
          </div>
        )}

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
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;