// controllers/courseController.js
const Course = require('../models/courses');
const User = require('../models/user');

// @desc    Create a new course
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    // Add the user as the instructor
    req.body.instructor = req.user.id;
    
    // Generate a unique course code
    const code = generateCourseCode();
    req.body.code = code;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Course.find(JSON.parse(queryStr)).populate({
      path: 'instructor',
      select: 'name email'
    });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Course.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const courses = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination,
      data: courses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'instructor',
      select: 'name email'
    }).populate({
      path: 'students',
      select: 'name email'
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Join a course
// @route   POST /api/courses/:id/join
exports.joinCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.body.courseCode });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found with the provided code'
      });
    }

    // Check if user is already enrolled
    if (course.students.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'User already enrolled in this course'
      });
    }

    // Add user to course students
    course.students.push(req.user.id);
    await course.save();

    // Add course to user's courses
    const user = await User.findById(req.user.id);
    user.courses.push(course._id);
    await user.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to generate a random course code
function generateCourseCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Add these functions to your controllers/courseController.js file

// @desc    Add module to course
// @route   POST /api/courses/:id/modules
exports.addCourseModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Add module to course
    course.modules.push(req.body);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete module from course
// @route   DELETE /api/courses/:id/modules/:moduleIndex
exports.deleteCourseModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Check if module exists
    if (!course.modules[req.params.moduleIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Remove module
    course.modules.splice(req.params.moduleIndex, 1);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add resource to module
// @route   POST /api/courses/:id/modules/:moduleIndex/resources
exports.addModuleResource = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Check if module exists
    if (!course.modules[req.params.moduleIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Add resource to module
    course.modules[req.params.moduleIndex].resources.push(req.body);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete resource from module
// @route   DELETE /api/courses/:id/modules/:moduleIndex/resources/:resourceIndex
exports.deleteModuleResource = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course instructor
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Check if module exists
    if (!course.modules[req.params.moduleIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if resource exists
    if (!course.modules[req.params.moduleIndex].resources[req.params.resourceIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Remove resource
    course.modules[req.params.moduleIndex].resources.splice(req.params.resourceIndex, 1);
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};