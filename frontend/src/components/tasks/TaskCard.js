import React, { useState } from 'react';
import TaskDetailsModal from './TaskDetailsModal';

const TaskCard = ({ task, onStatusChange, onTaskUpdate, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', task.id.toString());
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
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date() && task.status !== 'done';
    } catch (error) {
      return false;
    }
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task.id, e.target.value);
    }
  };

  return (
    <>
      <div 
        className="task-card"
        draggable
        onDragStart={handleDragStart}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="task-header">
          <h4 className="task-title">{task.title || 'Untitled Task'}</h4>
          <span 
            className="priority-dot"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
            title={task.priority || 'No priority'}
          ></span>
        </div>
        
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-meta">
          {task.due_date && (
            <div className={`meta-item ${isOverdue(task.due_date) ? 'overdue' : ''}`}>
              <strong>Due:</strong> {formatDate(task.due_date)}
              {isOverdue(task.due_date) && ' ⚠️'}
            </div>
          )}
          {task.assignee_name && (
            <div className="meta-item">
              <strong>Assignee:</strong> {task.assignee_name}
            </div>
          )}
          {task.assignee_id && !task.assignee_name && (
            <div className="meta-item">
              <strong>Assignee:</strong> Assigned
            </div>
          )}
        </div>
        
        <div className="task-footer">
          <select 
            value={task.status || 'todo'} 
            onChange={handleStatusChange}
            className="status-select"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          
          {task.priority && (
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TaskDetailsModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTaskUpdate={onTaskUpdate}
          onStatusChange={onStatusChange}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default TaskCard;