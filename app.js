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

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseController = require('./controllers/courseController');
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

app.get('/courses/create', protect, (req, res) => {
  // Check if user is teacher or admin
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.redirect('/courses');
  }
  
  res.render('create-course', { user: req.user });
});

app.get('/courses/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return res.redirect('/courses');
    }
    
    // Check if user is enrolled or is the instructor
    const isInstructor = course.instructor._id.toString() === req.user._id.toString();
    const isEnrolled = course.students.some(student => student._id.toString() === req.user._id.toString());
    
    // If not enrolled or instructor, redirect
    if (!isEnrolled && !isInstructor && req.user.role !== 'admin') {
      return res.redirect('/courses');
    }
    
    // Helper function for resource icons
    const getResourceIcon = (type) => {
      switch(type) {
        case 'document': return '📄';
        case 'video': return '🎥';
        case 'assignment': return '✏️';
        case 'quiz': return '❓';
        case 'link': return '🔗';
        default: return '📑';
      }
    };
    
    // Helper function to format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    };
    
    res.render('course', { 
      course, 
      user: req.user, 
      isInstructor,
      isEnrolled,
      getResourceIcon,
      formatDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});