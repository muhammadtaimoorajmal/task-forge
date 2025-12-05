import React, { useState, useEffect } from 'react';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';
import { teamAPI, taskAPI } from '../../services/api';

const TaskDetailsModal = ({ task, isOpen, onClose, onTaskUpdate, currentUser }) => {
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [teamMembers, setTeamMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedTask(task);
    fetchTeamMembers();
  }, [task]);

  const fetchTeamMembers = async () => {
    try {
      // Get teams and their members for assignment
      const teamsResponse = await teamAPI.getAll();
      if (teamsResponse.data.length > 0) {
        const membersPromises = teamsResponse.data.map(team => 
          teamAPI.getMembers(team.id)
        );
        const membersResponses = await Promise.allSettled(membersPromises);
        const allMembers = [];
        
        membersResponses.forEach(response => {
          if (response.status === 'fulfilled') {
            allMembers.push(...response.value.data);
          }
        });
        
        setTeamMembers(allMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Here you would call an API to update the task
      // For now, we'll just update locally
      await onTaskUpdate(task.id, editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    await onTaskUpdate(task.id, { status: newStatus });
  };

  const handleAssigneeChange = async (assigneeId) => {
    try {
      // Update assignee via API
      const updatedTask = { ...task, assignee_id: assigneeId };
      await onTaskUpdate(task.id, updatedTask);
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="task-details-section">
            <div className="task-header">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  className="task-title-input"
                />
              ) : (
                <h3>{task.title}</h3>
              )}
              
              <div className="task-actions-top">
                <select 
                  value={task.status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="status-select"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            <div className="task-meta-grid">
              <div className="meta-item">
                <strong>Priority:</strong>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {task.priority || 'Not set'}
                </span>
              </div>
              
              <div className="meta-item">
                <strong>Due Date:</strong>
                <span>{formatDate(task.due_date)}</span>
              </div>
              
              <div className="meta-item">
                <strong>Assignee:</strong>
                <select 
                  value={task.assignee_id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="assignee-select"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.username} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="meta-item">
                <strong>Created by:</strong>
                <span>{task.created_by_name}</span>
              </div>
            </div>

            <div className="task-description-section">
              <strong>Description:</strong>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                  className="task-description-input"
                  rows="4"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="task-description">
                  {task.description || 'No description provided.'}
                </p>
              )}
            </div>

            {isEditing && (
              <div className="edit-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="modal-tabs">
            <button 
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
            <button 
              className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
              onClick={() => setActiveTab('attachments')}
            >
              Attachments
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="comments-section">
                <TaskComments 
                  taskId={task.id} 
                  currentUser={currentUser}
                />
              </div>
            )}
            {activeTab === 'comments' && (
              <div className="comments-section">
                <TaskComments 
                  taskId={task.id} 
                  currentUser={currentUser}
                />
              </div>
            )}
            {activeTab === 'attachments' && (
              <div className="attachments-section">
                <TaskAttachments 
                  taskId={task.id} 
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;