const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./models/database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ecommerce-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/product/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, 'public', 'orders.html')));

app.listen(PORT, () => {
  console.log(`\n🛍️  E-Commerce Store running at http://localhost:${PORT}`);
  console.log(`📦 Database initialized with sample products`);
  console.log(`✅ All routes ready\n`);
});
