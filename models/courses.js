// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Course title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a course description']
  },
  code: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
    trim: true,
    maxlength: [20, 'Course code cannot be more than 20 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  modules: [{
    title: String,
    description: String,
    resources: [{
      title: String,
      type: {
        type: String,
        enum: ['document', 'video', 'assignment', 'quiz', 'link'],
        default: 'document'
      },
      content: String,
      fileUrl: String,
      dueDate: Date
    }]
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  coverImage: {
    type: String,
    default: '/images/default-course.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);