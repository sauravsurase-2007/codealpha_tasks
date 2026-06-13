const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../db/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already taken.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();

    run('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      [id, username, email, hashed]);

    req.session.userId = id;
    req.session.username = username;

    res.json({ success: true, user: { id, username, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const users = query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check session
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  const users = query('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?', [req.session.userId]);
  if (users.length === 0) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user: users[0] });
});

module.exports = router;
