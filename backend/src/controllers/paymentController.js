const { prisma } = require('../config/db');
const supabaseAdmin = require('../config/supabaseAdminClient');
const { getSignedUrlIfNeeded } = require('../config/storageHelper');

/**
 * @desc    Get all payments
 * @route   GET /api/v1/payments
 * @access  Private (Admin)
 */
const getPayments = async (req, res) => {
  const payments = await prisma.payments.findMany({
    orderBy: { created_at: 'desc' }
  });
  
  // Convert BigInt for JSON serialization & sign storage URLs on-the-fly
  const serializedPayments = await Promise.all(payments.map(async p => ({
    ...p,
    id: p.id.toString(),
    Student_ID: p.Student_ID.toString(),
    Amount: p.Amount.toString(),
    Slip_Url: p.Slip_Url ? await getSignedUrlIfNeeded(p.Slip_Url) : null
  })));

  res.status(200).json({ success: true, count: payments.length, data: serializedPayments });
};

/**
 * @desc    Approve a payment and enroll the student
 * @route   POST /api/v1/payments/:id/approve
 * @access  Private (Admin)
 */
const approvePayment = async (req, res) => {
  let paymentId;
  try {
    paymentId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Payment ID format');
    error.statusCode = 400;
    throw error;
  }

  const payment = await prisma.payments.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Find the student name to write in Enrollments
  const student = await prisma.student.findUnique({
    where: { Student_ID: payment.Student_ID }
  });

  if (!student) {
    const error = new Error('Student associated with this payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if enrollment already exists
  const existingEnrollment = await prisma.enrollments.findFirst({
    where: {
      Student_ID: payment.Student_ID,
      Subject_Name: payment.Subject
    }
  });

  if (existingEnrollment) {
    await prisma.payments.update({
      where: { id: paymentId },
      data: { Status: 'Approved' }
    });
    return res.status(200).json({
      success: true,
      message: 'Payment approved, but student was already enrolled.'
    });
  }

  // Create enrollment
  const enrollment = await prisma.enrollments.create({
    data: {
      Student_ID: payment.Student_ID,
      Studnet_Name: student.Name,
      Subject_Name: payment.Subject
    }
  });

  // Mark the payment as approved so it remains in history
  await prisma.payments.update({
    where: { id: paymentId },
    data: { Status: 'Approved' }
  });

  res.status(200).json({
    success: true,
    message: 'Payment approved and student successfully enrolled',
    data: {
      id: enrollment.id.toString(),
      Student_ID: enrollment.Student_ID.toString(),
      Studnet_Name: enrollment.Studnet_Name,
      Subject_Name: enrollment.Subject_Name
    }
  });
};

/**
 * @desc    Reject a payment
 * @route   POST /api/v1/payments/:id/reject
 * @access  Private (Admin)
 */
const rejectPayment = async (req, res) => {
  let paymentId;
  try {
    paymentId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Payment ID format');
    error.statusCode = 400;
    throw error;
  }

  const payment = await prisma.payments.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Mark the payment as rejected
  await prisma.payments.update({
    where: { id: paymentId },
    data: { Status: 'Rejected' }
  });

  res.status(200).json({
    success: true,
    message: 'Payment rejected successfully'
  });
};

/**
 * @desc    Create a new payment record
 * @route   POST /api/v1/payments
 * @access  Private
 */
const createPayment = async (req, res) => {
  const { subjectName, amount, method } = req.body;

  if (!subjectName || !amount || !method) {
    const error = new Error('Subject, amount and method are required');
    error.statusCode = 400;
    throw error;
  }

  if (!req.file) {
    const error = new Error('Payment slip file is required');
    error.statusCode = 400;
    throw error;
  }

  const student = req.user;
  if (!student) {
    const error = new Error('Not authorised');
    error.statusCode = 401;
    throw error;
  }

  // Upload slip to Supabase Storage in 'Deposit Proof' bucket
  const fileExt = req.file.originalname.split('.').pop() || 'png';
  const cleanSubject = subjectName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `receipts/${student.Student_ID}_${cleanSubject}_${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin
    .storage
    .from('Deposit Proof')
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    const error = new Error('Failed to upload receipt: ' + uploadError.message);
    error.statusCode = 500;
    throw error;
  }

  // Get the public URL
  const { data: urlData } = supabaseAdmin
    .storage
    .from('Deposit Proof')
    .getPublicUrl(filename);

  const slipUrl = urlData?.publicUrl || null;

  const payment = await prisma.payments.create({
    data: {
      Subject: subjectName,
      Student_ID: student.Student_ID,
      Amount: String(parseFloat(amount)),
      Method: method,
      Status: 'Pending',
      Slip_Url: slipUrl
    }
  });

  res.status(201).json({
    success: true,
    message: 'Payment submitted successfully',
    data: {
      id: payment.id.toString(),
      Subject: payment.Subject,
      Student_ID: payment.Student_ID.toString(),
      Amount: payment.Amount.toString(),
      Method: payment.Method,
      Status: payment.Status,
      Slip_Url: payment.Slip_Url ? await getSignedUrlIfNeeded(payment.Slip_Url) : null
    }
  });
};

/**
 * @desc    Get student's own payments
 * @route   GET /api/v1/payments/history
 * @access  Private
 */
const getStudentPayments = async (req, res) => {
  const student = req.user;
  if (!student) {
    const error = new Error('Not authorised');
    error.statusCode = 401;
    throw error;
  }

  const payments = await prisma.payments.findMany({
    where: { Student_ID: student.Student_ID },
    orderBy: { created_at: 'desc' }
  });
  
  const serializedPayments = await Promise.all(payments.map(async p => ({
    ...p,
    id: p.id.toString(),
    Student_ID: p.Student_ID.toString(),
    Amount: p.Amount.toString(),
    Slip_Url: p.Slip_Url ? await getSignedUrlIfNeeded(p.Slip_Url) : null
  })));

  res.status(200).json({ success: true, count: payments.length, data: serializedPayments });
};

module.exports = { getPayments, approvePayment, createPayment, rejectPayment, getStudentPayments };
