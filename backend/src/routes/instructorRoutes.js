const express = require('express');
const {
  getInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructorDashboard,
  createInstructorAccount,
  listInstructorAccounts,
  markInstructorPaid,
  getInstructorPayouts,
  deleteInstructorAccount,
} = require('../controllers/instructorController');
const { protect, authorise } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ── Static named routes (must be before /:id) ─────────────────────────────
router.get('/dashboard', protect, authorise('instructor', 'admin'), getInstructorDashboard);
router.get('/payouts',   protect, authorise('instructor', 'admin'), getInstructorPayouts);

// Instructor account management (admin only)
router.route('/accounts')
  .get(protect, authorise('admin'), listInstructorAccounts)
  .post(protect, authorise('admin'), createInstructorAccount);

router.delete('/accounts/:id', protect, authorise('admin'), deleteInstructorAccount);
router.post('/accounts/:id/pay', protect, authorise('admin'), markInstructorPaid);

// ── Public instructor listing & CRUD ──────────────────────────────────────
router
  .route('/')
  .get(getInstructors)
  .post(protect, authorise('admin'), upload.single('image'), createInstructor);

router
  .route('/:id')
  .put(protect, authorise('admin'), upload.single('image'), updateInstructor)
  .delete(protect, authorise('admin'), deleteInstructor);

module.exports = router;

