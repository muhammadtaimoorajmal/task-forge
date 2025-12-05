import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Add token to requests automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Enhanced response interceptor with better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Backend might be down');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getProfile: () => API.get('/auth/profile'),
};

export const projectAPI = {
  getAll: () => API.get('/projects'),
  create: (projectData) => API.post('/projects', projectData),
  getById: (id) => API.get(`/projects/${id}`),
};

export const taskAPI = {
  getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (taskData) => API.post('/tasks', taskData),
  updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
  update: (id, taskData) => API.put(`/tasks/${id}`, taskData),
  assign: (id, assigneeId) => API.patch(`/tasks/${id}/assign`, { assignee_id: assigneeId }),
  addComment: (taskId, commentData) => API.post(`/tasks/${taskId}/comments`, commentData),
  getComments: (taskId) => API.get(`/tasks/${taskId}/comments`),
};

export const teamAPI = {
  getAll: () => API.get('/teams'),
  create: (teamData) => API.post('/teams', teamData),
  getMembers: (teamId) => API.get(`/teams/${teamId}/members`),
  invite: (teamId, inviteData) => API.post(`/teams/${teamId}/invite`, inviteData),
  removeMember: (teamId, userId) => API.delete(`/teams/${teamId}/members/${userId}`),
  updateRole: (teamId, userId, roleData) => API.patch(`/teams/${teamId}/members/${userId}/role`, roleData),
};

export const userAPI = {
  search: (query) => API.get(`/auth/search?query=${encodeURIComponent(query)}`),
};

export const attachmentAPI = {
  upload: (taskId, formData) => API.post(`/attachments/${taskId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getByTask: (taskId) => API.get(`/attachments/${taskId}`),
  delete: (attachmentId) => API.delete(`/attachments/${attachmentId}`),
  download: (attachmentId) => API.get(`/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  })
};

export default API;