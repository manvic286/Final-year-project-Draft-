const Course = require('../models/courses');
const crypto = require('crypto');

// Generate unique course code
const generateCourseCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Create new course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, coverImage, isPublished } = req.body;

    // Create course with generated code and instructor
    const course = await Course.create({
      title,
      description,
      code: generateCourseCode(),
      instructor: req.user._id,
      coverImage: coverImage || '/images/default-course.webp',
      isPublished: isPublished || false
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating course'
    });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching courses'
    });
  }
};