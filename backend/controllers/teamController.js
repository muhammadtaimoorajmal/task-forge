const db = require('../config/database');

const createTeam = (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    db.run(
      `INSERT INTO teams (name, description, created_by) 
       VALUES (?, ?, ?)`,
      [name, description, created_by],
      function(err) {
        if (err) {
          console.error('Create team error:', err);
          return res.status(500).json({ error: 'Error creating team' });
        }

        // Add creator as team admin
        db.run(
          `INSERT INTO team_members (team_id, user_id, role) 
           VALUES (?, ?, 'admin')`,
          [this.lastID, created_by],
          (err) => {
            if (err) {
              console.error('Error adding team member:', err);
              return res.status(500).json({ error: 'Error setting up team' });
            }

            // Get the newly created team
            db.get(
              `SELECT t.*, u.username as created_by_name 
               FROM teams t 
               LEFT JOIN users u ON t.created_by = u.id 
               WHERE t.id = ?`,
              [this.lastID],
              (err, team) => {
                if (err) {
                  console.error('Error fetching team:', err);
                  return res.status(500).json({ error: 'Error fetching team' });
                }

                res.status(201).json({
                  message: 'Team created successfully!',
                  team: team
                });
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTeams = (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `SELECT t.*, tm.role, u.username as created_by_name
       FROM teams t
       INNER JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE tm.user_id = ?
       ORDER BY t.created_at DESC`,
      [userId],
      (err, teams) => {
        if (err) {
          console.error('Get teams error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(teams);
      }
    );

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTeamMembers = (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of this team
    db.get(
      `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, userId],
      (err, isMember) => {
        if (err || !isMember) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get all team members
        db.all(
          `SELECT u.id, u.username, u.email, tm.role, tm.joined_at
           FROM team_members tm
           INNER JOIN users u ON tm.user_id = u.id
           WHERE tm.team_id = ?
           ORDER BY 
             CASE tm.role 
               WHEN 'admin' THEN 1
               ELSE 2 
             END, u.username`,
          [teamId],
          (err, members) => {
            if (err) {
              console.error('Get team members error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            res.json(members);
          }
        );
      }
    );

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const inviteToTeam = (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const invited_by = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if team exists and user is admin
    db.get(
      `SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'admin'`,
      [teamId, invited_by],
      (err, isAdmin) => {
        if (err || !isAdmin) {
          return res.status(403).json({ error: 'Only team admins can invite members' });
        }

        // Check if user exists
        db.get(
          'SELECT id FROM users WHERE email = ?',
          [email],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
              return res.status(404).json({ error: 'User not found' });
            }

            // Check if already a member
            db.get(
              'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
              [teamId, user.id],
              (err, existingMember) => {
                if (existingMember) {
                  return res.status(400).json({ error: 'User is already a team member' });
                }

                // Add to team
                db.run(
                  `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'member')`,
                  [teamId, user.id],
                  function(err) {
                    if (err) {
                      return res.status(500).json({ error: 'Error adding team member' });
                    }

                    res.json({
                      message: 'User added to team successfully!',
                      member: { user_id: user.id, email: email, role: 'member' }
                    });
                  }
                );
              }
            );
          }
        );
      }
    );

  } catch (error) {
    console.error('Invite to team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeFromTeam = (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const currentUserId = req.user.id;

    // Verify current user is admin and not removing themselves
    db.get(
      `SELECT role FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, currentUserId],
      (err, currentUser) => {
        if (err || !currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only team admins can remove members' });
        }

        if (parseInt(userId) === currentUserId) {
          return res.status(400).json({ error: 'Cannot remove yourself from team' });
        }

        // Remove member
        db.run(
          'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
          [teamId, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error removing team member' });
            }

            res.json({ message: 'Member removed from team successfully!' });
          }
        );
      }
    );

  } catch (error) {
    console.error('Remove from team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateMemberRole = (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify current user is admin
    db.get(
      `SELECT role FROM team_members WHERE team_id = ? AND user_id = ?`,
      [teamId, currentUserId],
      (err, currentUser) => {
        if (err || !currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only team admins can update roles' });
        }

        // Update role
        db.run(
          'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?',
          [role, teamId, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error updating role' });
            }

            res.json({ message: 'Role updated successfully!' });
          }
        );
      }
    );

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { 
  createTeam, 
  getTeams, 
  getTeamMembers,
  inviteToTeam,
  removeFromTeam,  
  updateMemberRole
};