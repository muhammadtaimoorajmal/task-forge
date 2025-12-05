import React, { useState, useEffect, useRef } from 'react';
import TaskCard from './TaskCard';
import SocketService from '../../services/socket';

const TaskBoard = ({ tasks, onTaskUpdate, onStatusChange, currentUser }) => {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const socketServiceRef = useRef();

  useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);

  useEffect(() => {
    socketServiceRef.current = SocketService;
    
    // Listen for real-time task updates
    const handleTaskUpdated = (data) => {
      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === data.taskId 
            ? { ...task, status: data.newStatus }
            : task
        )
      );
    };

    const handleTaskUpdatedDetails = (data) => {
      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === data.task.id ? data.task : task
        )
      );
    };

    socketServiceRef.current.onTaskUpdated(handleTaskUpdated);
    socketServiceRef.current.onTaskUpdatedDetails(handleTaskUpdatedDetails);

    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.offTaskUpdated(handleTaskUpdated);
        socketServiceRef.current.offTaskUpdatedDetails(handleTaskUpdatedDetails);
      }
    };
  }, []);

  const columns = [
    { id: 'todo', title: '📋 To Do', color: 'bg-gray-100', count: localTasks.filter(t => t.status === 'todo').length },
    { id: 'in_progress', title: '🚧 In Progress', color: 'bg-blue-100', count: localTasks.filter(t => t.status === 'in_progress').length },
    { id: 'done', title: '✅ Done', color: 'bg-green-100', count: localTasks.filter(t => t.status === 'done').length }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  const handleTaskUpdate = (taskId, updatedData) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, updatedData);
    }
  };

  const completionRate = localTasks.length > 0 
    ? Math.round((localTasks.filter(t => t.status === 'done').length / localTasks.length) * 100)
    : 0;

  return (
    <div className="task-board">
      <div className="board-header">
        <h2>Task Board</h2>
        <div className="board-stats">
          Total Tasks: {localTasks.length}
          {localTasks.length > 0 && (
            <span className="completion-rate">
              ({completionRate}% complete)
            </span>
          )}
        </div>
      </div>
      
      <div className="columns-container">
        {columns.map(column => (
          <div 
            key={column.id}
            className={`task-column ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <h3>{column.title}</h3>
              <span className="task-count">{column.count}</span>
            </div>
            <div className="tasks-list">
              {localTasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={onStatusChange}
                    onTaskUpdate={handleTaskUpdate}
                    currentUser={currentUser}
                  />
                ))
              }
              {localTasks.filter(task => task.status === column.id).length === 0 && (
                <div className="empty-column">
                  No tasks in {column.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;