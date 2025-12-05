import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import ProjectList from '../components/projects/ProjectList';
import CreateProject from '../components/projects/CreateProject';
import { projectAPI, taskAPI, teamAPI } from '../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects, teams, and tasks
      const [projectsResponse, teamsResponse] = await Promise.all([
        projectAPI.getAll(),
        teamAPI.getAll()
      ]);
      
      setProjects(projectsResponse.data || []);
      setTeams(teamsResponse.data || []);
      
      // Fetch tasks for all projects to calculate stats
      const allTasksData = [];
      if (projectsResponse.data && projectsResponse.data.length > 0) {
        const tasksPromises = projectsResponse.data.map(project => 
          taskAPI.getByProject(project.id).catch(err => {
            console.error(`Error fetching tasks for project ${project.id}:`, err);
            return { data: [] };
          })
        );
        
        const tasksResponses = await Promise.allSettled(tasksPromises);
        
        tasksResponses.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data) {
            const projectTasks = result.value.data.map(task => ({
              ...task,
              project_id: projectsResponse.data[index].id
            }));
            allTasksData.push(...projectTasks);
          }
        });
      }
      
      setAllTasks(allTasksData);
      setError('');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setShowCreateForm(false);
    setError('');
    fetchDashboardData();
  };

  const handleCreateError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleNavigateToTeams = () => {
    navigate('/teams');
  };

  // Calculate real statistics
  const stats = {
    totalProjects: projects.length,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(task => task.status === 'done').length,
    totalTeams: teams.length,
    adminTeams: teams.filter(team => team.role === 'admin').length
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
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>{stats.totalProjects}</h3>
              <p>Total Projects</p>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.totalTasks}</h3>
              <p>Total Tasks</p>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.completedTasks}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + Create Project
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleNavigateToTeams}
              >
                👥 Manage Teams
              </button>
              <button 
                className="btn btn-outline"
                onClick={handleNavigateToTeams}
              >
                + Create Team
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Team Overview</h3>
            </div>
            <div className="team-overview">
              <div className="team-stats">
                <div className="team-stat">
                  <span className="team-stat-number">{stats.totalTeams}</span>
                  <span className="team-stat-label">Total Teams</span>
                </div>
                <div className="team-stat">
                  <span className="team-stat-number">{stats.adminTeams}</span>
                  <span className="team-stat-label">Teams You Admin</span>
                </div>
              </div>
              {teams.length > 0 && (
                <div className="recent-teams">
                  <strong>Your Teams:</strong>
                  <ul>
                    {teams.slice(0, 3).map(team => (
                      <li key={team.id}>
                        {team.name} <span className={`role-badge ${team.role}`}>{team.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Projects</h3>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={loading}
            >
              {showCreateForm ? 'Cancel' : '+ New Project'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-project-container">
              <CreateProject 
                onProjectCreated={handleProjectCreated}
                onCancel={() => setShowCreateForm(false)}
                onError={handleCreateError}
              />
            </div>
          )}

          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : (
            <ProjectList projects={projects} onProjectClick={handleProjectClick} />
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="activity-list">
            {projects.length === 0 ? (
              <p className="empty-activity">No recent activity. Create a project to get started!</p>
            ) : (
              <div>
                <p><strong>Recent Projects:</strong></p>
                <ul>
                  {projects.slice(0, 3).map(project => (
                    <li key={project.id} style={{marginBottom: '0.5rem'}}>
                      🆕 Created "{project.name}" - {new Date(project.created_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
                {allTasks.length > 0 && (
                  <>
                    <p style={{marginTop: '1rem'}}><strong>Recent Tasks:</strong></p>
                    <ul>
                      {allTasks.slice(0, 3).map(task => (
                        <li key={task.id} style={{marginBottom: '0.5rem'}}>
                          ✅ {task.title} - {task.status}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;