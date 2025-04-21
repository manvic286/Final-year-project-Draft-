// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  joinCourse,
  addCourseModule,
  deleteCourseModule,
  addModuleResource,
  deleteModuleResource
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

// Module routes
router.route('/:id/modules')
  .post(protect, authorize('teacher', 'admin'), addCourseModule);

router.route('/:id/modules/:moduleIndex')
  .delete(protect, authorize('teacher', 'admin'), deleteCourseModule);

// Resource routes
router.route('/:id/modules/:moduleIndex/resources')
  .post(protect, authorize('teacher', 'admin'), addModuleResource);

router.route('/:id/modules/:moduleIndex/resources/:resourceIndex')
  .delete(protect, authorize('teacher', 'admin'), deleteModuleResource);

module.exports = router;