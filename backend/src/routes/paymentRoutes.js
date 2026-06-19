const express = require('express');
const { getPayments, approvePayment, createPayment, rejectPayment, getStudentPayments } = require('../controllers/paymentController');
const { protect, authorise } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// Student actions
router.get('/history', getStudentPayments);
router.post('/', upload.single('slip'), createPayment);

// Admin-only actions
router.get('/', authorise('admin'), getPayments);
router.post('/:id/approve', authorise('admin'), approvePayment);
router.post('/:id/reject', authorise('admin'), rejectPayment);

module.exports = router;
