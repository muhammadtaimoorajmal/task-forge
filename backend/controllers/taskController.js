const { getIO } = require('../socket/socketHandler');
const db = require('../config/database');

const createTask = (req, res) => {
  try {
    const { title, description, priority, project_id, due_date, assignee_id } = req.body;
    const created_by = req.user.id;

    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and project are required' });
    }

    db.run(
      `INSERT INTO tasks (title, description, priority, project_id, due_date, assignee_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, priority, project_id, due_date, assignee_id, created_by],
      function(err) {
        if (err) {
          console.error('Create task error:', err);
          return res.status(500).json({ error: 'Error creating task' });
        }

        // Get the newly created task with assignee info
        db.get(
          `SELECT t.*, 
                  u1.username as created_by_name,
                  u2.username as assignee_name,
                  u2.email as assignee_email
           FROM tasks t 
           LEFT JOIN users u1 ON t.created_by = u1.id 
           LEFT JOIN users u2 ON t.assignee_id = u2.id
           WHERE t.id = ?`,
          [this.lastID],
          (err, task) => {
            if (err) {
              console.error('Error fetching task:', err);
              return res.status(500).json({ error: 'Error fetching task' });
            }

            // Emit real-time event
            try {
              const io = getIO();
              io.to(`project_${project_id}`).emit('task_created', {
                task: task,
                projectId: project_id
              });
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.status(201).json({
              message: 'Task created successfully!',
              task: task
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTasksByProject = (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this project
    db.get(
      `SELECT 1 FROM projects WHERE id = ? AND created_by = ?`,
      [projectId, userId],
      (err, project) => {
        if (err || !project) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get all tasks for this project
        db.all(
          `SELECT t.*, 
                  u1.username as assignee_name,
                  u1.email as assignee_email,
                  u2.username as created_by_name
           FROM tasks t
           LEFT JOIN users u1 ON t.assignee_id = u1.id
           LEFT JOIN users u2 ON t.created_by = u2.id
           WHERE t.project_id = ?
           ORDER BY 
             CASE priority 
               WHEN 'high' THEN 1 
               WHEN 'medium' THEN 2 
               WHEN 'low' THEN 3 
               ELSE 4 
             END,
             t.created_at DESC`,
          [projectId],
          (err, tasks) => {
            if (err) {
              console.error('Get tasks error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            res.json(tasks || []);
          }
        );
      }
    );

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTaskStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Updating task status:', { id, status });

    if (!['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.run(
      `UPDATE tasks SET status = ? WHERE id = ?`,
      [status, id],
      function(err) {
        if (err) {
          console.error('Update task error:', err);
          return res.status(500).json({ error: 'Error updating task status' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        console.log('Task status updated successfully:', { id, status, changes: this.changes });

        // Get project ID for real-time updates
        db.get(
          'SELECT project_id FROM tasks WHERE id = ?',
          [id],
          (err, task) => {
            if (err) {
              console.error('Error getting project ID:', err);
            }

            const projectId = task ? task.project_id : null;

            // Emit real-time event
            try {
              const io = getIO();
              if (projectId) {
                io.to(`project_${projectId}`).emit('task_updated', {
                  taskId: parseInt(id),
                  newStatus: status,
                  projectId: projectId
                });
                console.log('Real-time event emitted for task update');
              }
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.json({
              message: 'Task status updated successfully!',
              taskId: id,
              newStatus: status
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateTask = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, assignee_id } = req.body;

    // Build dynamic update query based on provided fields
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date);
    }
    if (assignee_id !== undefined) {
      updates.push('assignee_id = ?');
      params.push(assignee_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        console.error('Update task error:', err);
        return res.status(500).json({ error: 'Error updating task' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Get updated task with full details
      db.get(
        `SELECT t.*, 
                u1.username as assignee_name,
                u1.email as assignee_email,
                u2.username as created_by_name
         FROM tasks t
         LEFT JOIN users u1 ON t.assignee_id = u1.id
         LEFT JOIN users u2 ON t.created_by = u2.id
         WHERE t.id = ?`,
        [id],
        (err, task) => {
          if (err) {
            console.error('Error fetching updated task:', err);
            return res.status(500).json({ error: 'Error fetching updated task' });
          }

          // Emit real-time event for task update
          try {
            const io = getIO();
            if (task && task.project_id) {
              io.to(`project_${task.project_id}`).emit('task_updated_details', {
                task: task,
                projectId: task.project_id
              });
            }
          } catch (socketError) {
            console.error('Socket emit error:', socketError);
          }

          res.json({
            message: 'Task updated successfully!',
            task: task
          });
        }
      );
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// COMMENT FUNCTIONS
const addTaskComment = (req, res) => {
  try {
    const { taskId } = req.params;
    const { comment_text } = req.body;
    const user_id = req.user.id;

    if (!comment_text || comment_text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    db.run(
      `INSERT INTO task_comments (task_id, user_id, comment_text) 
       VALUES (?, ?, ?)`,
      [taskId, user_id, comment_text.trim()],
      function(err) {
        if (err) {
          console.error('Add comment error:', err);
          return res.status(500).json({ error: 'Error adding comment' });
        }

        // Get the newly created comment with user info
        db.get(
          `SELECT tc.*, u.username, u.email 
           FROM task_comments tc
           LEFT JOIN users u ON tc.user_id = u.id
           WHERE tc.id = ?`,
          [this.lastID],
          (err, comment) => {
            if (err) {
              console.error('Error fetching comment:', err);
              return res.status(500).json({ error: 'Error fetching comment' });
            }

            // Emit real-time event for new comment
            try {
              const io = getIO();
              io.to(`task_${taskId}`).emit('new_comment', {
                comment: comment,
                taskId: taskId
              });
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.status(201).json({
              message: 'Comment added successfully!',
              comment: comment
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTaskComments = (req, res) => {
  try {
    const { taskId } = req.params;

    db.all(
      `SELECT tc.*, u.username, u.email 
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ?
       ORDER BY tc.created_at ASC`,
      [taskId],
      (err, comments) => {
        if (err) {
          console.error('Get comments error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(comments || []);
      }
    );

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// TASK ASSIGNMENT FUNCTIONS
const assignTask = (req, res) => {
  try {
    const { id } = req.params;
    const { assignee_id } = req.body;

    db.run(
      `UPDATE tasks SET assignee_id = ? WHERE id = ?`,
      [assignee_id, id],
      function(err) {
        if (err) {
          console.error('Assign task error:', err);
          return res.status(500).json({ error: 'Error assigning task' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Get updated task with assignee info
        db.get(
          `SELECT t.*, 
                  u1.username as assignee_name,
                  u1.email as assignee_email,
                  u2.username as created_by_name
           FROM tasks t
           LEFT JOIN users u1 ON t.assignee_id = u1.id
           LEFT JOIN users u2 ON t.created_by = u2.id
           WHERE t.id = ?`,
          [id],
          (err, task) => {
            if (err) {
              console.error('Error fetching assigned task:', err);
              return res.status(500).json({ error: 'Error fetching assigned task' });
            }

            // Emit real-time event for assignment
            try {
              const io = getIO();
              if (task && task.project_id) {
                io.to(`project_${task.project_id}`).emit('task_assigned', {
                  task: task,
                  projectId: task.project_id
                });
              }
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.json({
              message: 'Task assigned successfully!',
              task: task
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTaskById = (req, res) => {
  try {
    const { id } = req.params;

    db.get(
      `SELECT t.*, 
              u1.username as assignee_name,
              u1.email as assignee_email,
              u2.username as created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assignee_id = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE t.id = ?`,
      [id],
      (err, task) => {
        if (err) {
          console.error('Get task error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
      }
    );

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// EXPORT ALL FUNCTIONS
module.exports = { 
  createTask, 
  getTasksByProject, 
  updateTaskStatus,
  updateTask,
  addTaskComment,
  getTaskComments,
  assignTask,
  getTaskById
};