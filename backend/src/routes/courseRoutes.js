const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
} = require('../controllers/courseController');
const { protect, authorise } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router
  .route('/')
  .get(getCourses)
  .post(protect, authorise('instructor', 'admin'), upload.single('image'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorise('instructor', 'admin'), upload.single('image'), updateCourse)
  .delete(protect, authorise('instructor', 'admin'), deleteCourse);

router.post('/:id/enroll', protect, enrollInCourse);
router.delete('/:id/enroll', protect, unenrollFromCourse);

module.exports = router;
