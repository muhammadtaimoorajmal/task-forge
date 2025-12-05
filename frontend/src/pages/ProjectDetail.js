import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTask from '../components/tasks/CreateTask';
import { projectAPI, taskAPI } from '../services/api';
import SocketService from '../services/socket';

const ProjectDetail = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socketServiceRef = useRef();

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  useEffect(() => {
    // Initialize socket connection
    socketServiceRef.current = SocketService;
    socketServiceRef.current.connect();
    
    // Join project room
    if (id) {
      socketServiceRef.current.joinProject(id);
    }

    // Set up real-time listeners
    const handleTaskCreated = (data) => {
      if (data.projectId === parseInt(id)) {
        setTasks(prevTasks => [data.task, ...prevTasks]);
      }
    };

    const handleTaskUpdated = (data) => {
      if (data.projectId === parseInt(id)) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.taskId 
              ? { ...task, status: data.newStatus }
              : task
          )
        );
      }
    };

    const handleTaskUpdatedDetails = (data) => {
      if (data.projectId === parseInt(id)) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.task.id ? data.task : task
          )
        );
      }
    };

    socketServiceRef.current.onTaskCreated(handleTaskCreated);
    socketServiceRef.current.onTaskUpdated(handleTaskUpdated);
    socketServiceRef.current.onTaskUpdatedDetails(handleTaskUpdatedDetails);

    // Cleanup on unmount
    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.offTaskCreated(handleTaskCreated);
        socketServiceRef.current.offTaskUpdated(handleTaskUpdated);
        socketServiceRef.current.offTaskUpdatedDetails(handleTaskUpdatedDetails);
      }
    };
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const [projectResponse, tasksResponse] = await Promise.all([
        projectAPI.getById(id),
        taskAPI.getByProject(id)
      ]);
      
      setProject(projectResponse.data);
      setTasks(tasksResponse.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowCreateTask(false);
    setError('');
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Updating task status:', { taskId, newStatus });
      await taskAPI.updateStatus(taskId, newStatus);
      // Real-time update handled by socket
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error.response?.data?.error || 'Failed to update task status');
      // Revert the change on error
      fetchProjectAndTasks();
    }
  };

  const handleTaskUpdate = async (taskId, updatedData) => {
    try {
      await taskAPI.update(taskId, updatedData);
      // Real-time update handled by socket
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Header user={user} onLogout={onLogout} />
          <div className="loading">Loading project details...</div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Header user={user} onLogout={onLogout} />
          <div className="error-message">
            {error}
            <button 
              onClick={handleBackToDashboard}
              className="btn btn-primary"
              style={{marginLeft: '1rem'}}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <Header user={user} onLogout={onLogout} />
          <div className="error-message">
            Project not found
            <button 
              onClick={handleBackToDashboard}
              className="btn btn-primary"
              style={{marginLeft: '1rem'}}
            >
              Back to Dashboard
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
        
        {/* Project Header */}
        <div className="card project-header">
          <div className="project-header-content">
            <div className="project-info">
              <button 
                onClick={handleBackToDashboard}
                className="btn btn-outline"
                style={{marginBottom: '1rem'}}
              >
                ← Back to Dashboard
              </button>
              <h1>{project.name}</h1>
              <p className="project-description">{project.description || 'No description provided'}</p>
              <div className="project-meta">
                <span><strong>Team:</strong> {project.team_name || 'Personal'}</span>
                <span><strong>Created by:</strong> {project.created_by_name}</span>
                <span><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="project-stats">
              <div className="stat">
                <span className="stat-number">{tasks.length}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="stat">
                <span className="stat-number">{tasks.filter(t => t.status === 'done').length}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-number">{tasks.filter(t => t.status === 'in_progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Management Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Task Management</h3>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateTask(!showCreateTask)}
            >
              {showCreateTask ? 'Cancel' : '+ New Task'}
            </button>
          </div>

          {showCreateTask && (
            <div className="create-task-container">
              <CreateTask 
                projectId={id}
                onTaskCreated={handleTaskCreated}
                onCancel={() => setShowCreateTask(false)}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
              <button 
                onClick={() => setError('')}
                className="btn btn-outline"
                style={{marginLeft: '1rem'}}
              >
                Dismiss
              </button>
            </div>
          )}

          <TaskBoard 
            tasks={tasks} 
            onTaskUpdate={handleTaskUpdate}
            onStatusChange={handleTaskStatusChange}
            currentUser={user}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;