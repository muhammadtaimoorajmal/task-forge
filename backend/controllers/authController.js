const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('Registration attempt:', { username, email });

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ error: 'Error creating user' });
            }

            // Generate token
            const token = jwt.sign(
              { userId: this.lastID },
              process.env.JWT_SECRET || 'fallback-secret-key',
              { expiresIn: '24h' }
            );

            console.log('User created successfully:', this.lastID);

            res.status(201).json({
              message: 'User created successfully!',
              token,
              user: { id: this.lastID, username, email }
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || 'fallback-secret-key',
          { expiresIn: '24h' }
        );

        console.log('Login successful:', user.id);

        res.json({
          message: 'Login successful!',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchUsers = (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    db.all(
      `SELECT id, username, email FROM users 
       WHERE username LIKE ? OR email LIKE ? 
       LIMIT 10`,
      [`%${query}%`, `%${query}%`],
      (err, users) => {
        if (err) {
          console.error('Search users error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(users);
      }
    );

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile,
  searchUsers
};