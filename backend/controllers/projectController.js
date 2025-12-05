const db = require('../config/database');

const createProject = (req, res) => {
  try {
    const { name, description, team_id } = req.body;
    const created_by = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    db.run(
      `INSERT INTO projects (name, description, team_id, created_by) 
       VALUES (?, ?, ?, ?)`,
      [name, description, team_id, created_by],
      function(err) {
        if (err) {
          console.error('Create project error:', err);
          return res.status(500).json({ error: 'Error creating project' });
        }

        // Get the newly created project with user info
        db.get(
          `SELECT p.*, u.username as created_by_name, t.name as team_name
           FROM projects p 
           LEFT JOIN users u ON p.created_by = u.id 
           LEFT JOIN teams t ON p.team_id = t.id
           WHERE p.id = ?`,
          [this.lastID],
          (err, project) => {
            if (err) {
              console.error('Error fetching project:', err);
              return res.status(500).json({ error: 'Error fetching project' });
            }

            res.status(201).json({
              message: 'Project created successfully!',
              project: project
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProjects = (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `SELECT p.*, 
              u.username as created_by_name, 
              t.name as team_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.created_by = ?
       ORDER BY p.created_at DESC`,
      [userId],
      (err, projects) => {
        if (err) {
          console.error('Get projects error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(projects);
      }
    );

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProjectById = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    db.get(
      `SELECT p.*, u.username as created_by_name, t.name as team_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = ? AND p.created_by = ?`,
      [id, userId],
      (err, project) => {
        if (err) {
          console.error('Get project error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
      }
    );

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createProject, getProjects, getProjectById };