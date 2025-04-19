// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  joinCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getCourses)
  .post(protect, authorize('teacher', 'admin'), createCourse);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('teacher', 'admin'), updateCourse)
  .delete(protect, authorize('teacher', 'admin'), deleteCourse);

router.route('/:id/join')
  .post(protect, joinCourse);

module.exports = router;