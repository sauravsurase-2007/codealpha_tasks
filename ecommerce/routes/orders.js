const express = require('express');
const db = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Place order
router.post('/place', requireAuth, (req, res) => {
  const { shipping_address, payment_method } = req.body;
  const userId = req.session.userId;

  // Get cart items
  db.all(`
    SELECT c.quantity, p.id as product_id, p.price, p.name, p.stock
    FROM cart c JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?`, [userId], (err, items) => {
    if (err || !items.length) return res.status(400).json({ error: 'Cart is empty' });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Create order
    db.run('INSERT INTO orders (user_id, total, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, total.toFixed(2), 'confirmed', shipping_address, payment_method],
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to place order' });
        const orderId = this.lastID;

        // Insert order items
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        items.forEach(item => stmt.run([orderId, item.product_id, item.quantity, item.price]));
        stmt.finalize();

        // Clear cart
        db.run('DELETE FROM cart WHERE user_id = ?', [userId]);

        // Update stock
        items.forEach(item => {
          db.run('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
        });

        res.json({ success: true, orderId, total: total.toFixed(2), message: 'Order placed successfully!' });
      });
  });
});

// Get user orders
router.get('/my-orders', requireAuth, (req, res) => {
  db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.session.userId], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch orders' });

    if (!orders.length) return res.json([]);

    let pending = orders.length;
    const result = [];

    orders.forEach(order => {
      db.all(`
        SELECT oi.*, p.name, p.image FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?`, [order.id], (err, items) => {
        result.push({ ...order, items: items || [] });
        if (--pending === 0) res.json(result.sort((a, b) => b.id - a.id));
      });
    });
  });
});

// Get single order
router.get('/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId], (err, order) => {
      if (err || !order) return res.status(404).json({ error: 'Order not found' });

      db.all(`SELECT oi.*, p.name, p.image FROM order_items oi
        JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
        [order.id], (err, items) => {
          res.json({ ...order, items: items || [] });
        });
    });
});

module.exports = router;
