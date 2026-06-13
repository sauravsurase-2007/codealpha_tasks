const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get user profile
router.get('/:username', (req, res) => {
  const { username } = req.params;
  const currentUserId = req.session.userId || null;

  const users = query('SELECT id, username, email, bio, avatar, created_at FROM users WHERE username = ?', [username]);
  if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

  const user = users[0];

  const posts = query(`
    SELECT p.*, u.username, u.avatar,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = '${currentUserId}')` : '0'} as user_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [user.id]);

  const followerCount = query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [user.id]);
  const followingCount = query('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [user.id]);
  const isFollowing = currentUserId
    ? query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, user.id])
    : [];

  res.json({
    user,
    posts,
    followerCount: followerCount[0].count,
    followingCount: followingCount[0].count,
    isFollowing: isFollowing.length > 0,
    isOwnProfile: currentUserId === user.id
  });
});

// Update profile
router.put('/profile/update', requireAuth, (req, res) => {
  const { bio } = req.body;
  run('UPDATE users SET bio = ? WHERE id = ?', [bio || '', req.session.userId]);
  res.json({ success: true });
});

// Follow / Unfollow
router.post('/:id/follow', requireAuth, (req, res) => {
  const { id } = req.params;
  const followerId = req.session.userId;

  if (id === followerId) return res.status(400).json({ error: 'Cannot follow yourself.' });

  const existing = query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, id]);

  if (existing.length > 0) {
    run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, id]);
    res.json({ following: false });
  } else {
    run('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)', [uuidv4(), followerId, id]);
    res.json({ following: true });
  }
});

// Search users
router.get('/search/users', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const users = query('SELECT id, username, avatar, bio FROM users WHERE username LIKE ? LIMIT 10', [`%${q}%`]);
  res.json(users);
});

// Get followers
router.get('/:id/followers', (req, res) => {
  const followers = query(`
    SELECT u.id, u.username, u.avatar, u.bio
    FROM follows f JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
  `, [req.params.id]);
  res.json(followers);
});

// Get following
router.get('/:id/following', (req, res) => {
  const following = query(`
    SELECT u.id, u.username, u.avatar, u.bio
    FROM follows f JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
  `, [req.params.id]);
  res.json(following);
});

module.exports = router;
