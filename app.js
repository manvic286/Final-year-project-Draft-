const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // Added session

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

// Add session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const { protect } = require('./middleware/auth');
const Courses = require('./models/courses');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// Page routes
app.get('/', (req, res) => {
  res.render('index', { title: 'iLearn' });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', protect, (req, res) => {
  res.render('dashboard', { user: req.user, title: 'Dashboard' });
});

app.get('/courses', protect, (req, res) => {
  Courses.find()
    .then(courses => {
      res.render('courses', { user: req.user, title: 'Courses', courses });
    })
    .catch(err => {
      console.error(err);
      res.status(500).render('error', { message: 'Error fetching courses', error: err });
    });
});

app.get('/courses/create', protect, (req, res) => {
  res.render('create-course', { 
    user: req.user, 
    title: 'Create Course' 
  });
});

app.post('/courses/create', protect, (req, res) => {
  const { title, description } = req.body;
  const newCourse = new Courses({ title, description });
  newCourse.save()
    .then(() => {
      res.redirect('/courses');
    })
    .catch(err => {
      console.error(err);
      res.status(500).render('error', { message: 'Error creating course', error: err });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Something went wrong!',
    error: { status: 500 }
  });
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