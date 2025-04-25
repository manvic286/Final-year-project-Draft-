const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createCourse, getCourses } = require('../controllers/courseController');

router.post('/', protect, createCourse);
router.get('/', protect, getCourses);

module.exports = router;