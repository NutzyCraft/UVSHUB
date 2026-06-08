const express = require('express');
const {
  getInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor
} = require('../controllers/instructorController');
const { protect, authorise } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router
  .route('/')
  .get(getInstructors)
  .post(protect, authorise('admin'), upload.single('image'), createInstructor);

router
  .route('/:id')
  .put(protect, authorise('admin'), upload.single('image'), updateInstructor)
  .delete(protect, authorise('admin'), deleteInstructor);

module.exports = router;
