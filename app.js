// app.js - Main application file
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-platform')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist'))); // Serve Bootstrap CSS and JS

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');

// Mount API routes
app.use('/api/auth', authRoutes);

// Page routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Collaborative Learning Platform' });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', protect, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Something went wrong!',
    error: { status: 500 }
  });
});

// Course page routes
app.get('/courses', protect, async (req, res) => {
  try {
    res.render('courses', { user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    message: err.message || 'Something went wrong!',
    error: { status: err.status || 500 },
    user: req.user || null,
    title: 'Error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});