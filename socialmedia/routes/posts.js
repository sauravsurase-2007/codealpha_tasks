const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get feed (all posts or following)
router.get('/feed', (req, res) => {
  const currentUserId = req.session.userId || null;
  const type = req.query.type || 'all';

  let sql;
  let params = [];

  if (type === 'following' && currentUserId) {
    sql = `
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = '${currentUserId}') as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = '${currentUserId}'
      ) OR p.user_id = '${currentUserId}'
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
  } else {
    sql = `
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = '${currentUserId}')` : '0'} as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
  }

  const posts = query(sql, params);
  res.json(posts);
});

// Create post
router.post('/', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }
  if (content.length > 500) {
    return res.status(400).json({ error: 'Post cannot exceed 500 characters.' });
  }

  const id = uuidv4();
  run('INSERT INTO posts (id, user_id, content) VALUES (?, ?, ?)',
    [id, req.session.userId, content.trim()]);

  const posts = query(`
    SELECT p.*, u.username, u.avatar,
      0 as like_count, 0 as comment_count, 0 as user_liked
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [id]);

  res.json(posts[0]);
});

// Delete post
router.delete('/:id', requireAuth, (req, res) => {
  const post = query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (post.length === 0) return res.status(404).json({ error: 'Post not found.' });
  if (post[0].user_id !== req.session.userId) return res.status(403).json({ error: 'Not authorized.' });

  run('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
  run('DELETE FROM likes WHERE post_id = ?', [req.params.id]);
  run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Like / Unlike
router.post('/:id/like', requireAuth, (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId;

  const existing = query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);

  if (existing.length > 0) {
    run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    const count = query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
    res.json({ liked: false, count: count[0].count });
  } else {
    run('INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)', [uuidv4(), postId, userId]);
    const count = query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);
    res.json({ liked: true, count: count[0].count });
  }
});

// Get comments
router.get('/:id/comments', (req, res) => {
  const comments = query(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `, [req.params.id]);
  res.json(comments);
});

// Add comment
router.post('/:id/comments', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  const id = uuidv4();
  run('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)',
    [id, req.params.id, req.session.userId, content.trim()]);

  const comments = query(`
    SELECT c.*, u.username, u.avatar
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `, [id]);

  res.json(comments[0]);
});

// Delete comment
router.delete('/:postId/comments/:commentId', requireAuth, (req, res) => {
  const comment = query('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
  if (comment.length === 0) return res.status(404).json({ error: 'Comment not found.' });
  if (comment[0].user_id !== req.session.userId) return res.status(403).json({ error: 'Not authorized.' });

  run('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
  res.json({ success: true });
});

module.exports = router;
