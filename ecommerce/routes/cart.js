const express = require('express');
const db = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get cart
router.get('/', requireAuth, (req, res) => {
  db.all(`
    SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
    FROM cart c JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?`, [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch cart' });
    res.json(rows);
  });
});

// Add to cart
router.post('/add', requireAuth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });

  db.get('SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
    [req.session.userId, product_id], (err, existing) => {
      if (existing) {
        db.run('UPDATE cart SET quantity = quantity + ? WHERE id = ?',
          [quantity, existing.id], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to update cart' });
            res.json({ success: true, message: 'Cart updated' });
          });
      } else {
        db.run('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [req.session.userId, product_id, quantity], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to add to cart' });
            res.json({ success: true, message: 'Added to cart' });
          });
      }
    });
});

// Update quantity
router.put('/update/:id', requireAuth, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId],
      err => err ? res.status(500).json({ error: 'Failed' }) : res.json({ success: true }));
  } else {
    db.run('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.session.userId],
      err => err ? res.status(500).json({ error: 'Failed' }) : res.json({ success: true }));
  }
});

// Remove item
router.delete('/remove/:id', requireAuth, (req, res) => {
  db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId],
    err => err ? res.status(500).json({ error: 'Failed' }) : res.json({ success: true }));
});

// Clear cart
router.delete('/clear', requireAuth, (req, res) => {
  db.run('DELETE FROM cart WHERE user_id = ?', [req.session.userId],
    err => err ? res.status(500).json({ error: 'Failed' }) : res.json({ success: true }));
});

module.exports = router;
