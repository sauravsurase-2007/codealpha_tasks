const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'socialmedia_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Init DB then start server
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SocialApp running at http://localhost:${PORT}`);
    console.log(`   Open your browser and navigate to the URL above.\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
