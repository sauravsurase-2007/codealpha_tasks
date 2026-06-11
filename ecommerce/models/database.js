const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../ecommerce.db');
const db = new sqlite3.Database(DB_PATH);

// Initialize tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    category TEXT,
    image TEXT,
    stock INTEGER DEFAULT 100,
    rating REAL DEFAULT 4.0,
    reviews INTEGER DEFAULT 0,
    badge TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Cart table
  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  // Seed sample products
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (!err && row.count === 0) {
      const products = [
        ['Wireless Noise-Cancelling Headphones', 'Premium over-ear headphones with 30hr battery life, active noise cancellation, and crystal-clear audio. Perfect for music lovers and remote workers.', 79.99, 129.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 50, 4.8, 2341, 'Best Seller'],
        ['Minimalist Leather Watch', 'Slim profile leather strap watch with sapphire glass, Japanese movement, and 5ATM water resistance. Timeless elegance for everyday wear.', 149.99, 199.99, 'Fashion', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 30, 4.7, 892, 'New'],
        ['Smart Fitness Tracker', 'Track steps, heart rate, sleep, and calories. 7-day battery, waterproof, and syncs with iOS & Android. Your health companion.', 59.99, null, 'Electronics', 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500', 75, 4.5, 1567, null],
        ['Ceramic Pour-Over Coffee Set', 'Hand-crafted ceramic dripper with matching server. Brews a clean, nuanced cup. Includes filters and brew guide. A gift for coffee purists.', 44.99, 59.99, 'Kitchen', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', 40, 4.9, 445, 'Sale'],
        ['Running Shoes Pro', 'Lightweight mesh upper with responsive foam midsole. Designed for long-distance comfort. Available in multiple colors and widths.', 89.99, 119.99, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 60, 4.6, 3210, 'Popular'],
        ['Portable Bluetooth Speaker', 'Waterproof, dustproof speaker with 360° sound, 24hr playtime, and built-in microphone. Adventure-ready audio for any occasion.', 49.99, null, 'Electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 45, 4.4, 1023, null],
        ['Linen Throw Blanket', 'Stonewashed 100% linen throw. Breathable, hypoallergenic, and gets softer with every wash. Perfect for sofa or bed.', 34.99, 49.99, 'Home', 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=500', 80, 4.7, 678, 'Sale'],
        ['Mechanical Keyboard', 'TKL form factor with Cherry MX switches, RGB backlighting, and PBT keycaps. Built for typists and gamers who demand precision.', 119.99, 159.99, 'Electronics', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 25, 4.8, 2890, 'Hot'],
      ];

      const stmt = db.prepare(`INSERT INTO products (name, description, price, original_price, category, image, stock, rating, reviews, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      products.forEach(p => stmt.run(p));
      stmt.finalize();
      console.log('✅ Sample products seeded');
    }
  });
});

module.exports = db;
