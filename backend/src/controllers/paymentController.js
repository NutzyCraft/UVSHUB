const { prisma } = require('../config/db');
const supabaseAdmin = require('../config/supabaseAdminClient');
const { getSignedUrlIfNeeded } = require('../config/storageHelper');
const { addStudentToClass } = require('../utils/googleCalendar');

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
    Subject_ID: p.Subject_ID ? p.Subject_ID.toString() : null,
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
      Subject_ID: payment.Subject_ID
    }
  });

  if (existingEnrollment) {
    // Renew the 28-day access window
    const accessExpiresAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

    await prisma.payments.update({
      where: { id: paymentId },
      data: { Status: 'Approved' }
    });

    await prisma.enrollments.update({
      where: { id: existingEnrollment.id },
      data: { AccessExpiresAt: accessExpiresAt }
    });

    // Still invite to Meet even if already enrolled
    try {
      const subject = await prisma.subjects.findUnique({
        where: { id: payment.Subject_ID }
      });
      if (subject?.CalendarEventId && student.Email) {
        await addStudentToClass(subject.CalendarEventId, student.Email);
      }
    } catch (calendarError) {
      console.error('⚠️ Failed to invite student to Google Meet:', calendarError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment approved, but student was already enrolled.'
    });
  }

  // Create enrollment with 28-day access window
  const accessExpiresAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

  const enrollment = await prisma.enrollments.create({
    data: {
      Student_ID: payment.Student_ID,
      Studnet_Name: student.Name,
      Subject_Name: payment.Subject,
      Subject_ID: payment.Subject_ID,
      AccessExpiresAt: accessExpiresAt
    }
  });

  // Mark the payment as approved so it remains in history
  await prisma.payments.update({
    where: { id: paymentId },
    data: { Status: 'Approved' }
  });

  // Invite the student to the Google Meet for this course
  try {
    const subject = await prisma.subjects.findUnique({
      where: { id: payment.Subject_ID }
    });

    if (subject?.CalendarEventId && student.Email) {
      await addStudentToClass(subject.CalendarEventId, student.Email);
      console.log(`✅ Student ${student.Email} invited to Meet for "${payment.Subject}"`);
    }
  } catch (calendarError) {
    console.error('⚠️ Failed to invite student to Google Meet:', calendarError.message);
    // Fail-open: enrollment is the source of truth, not the calendar invite
  }

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
  const { subjectName, subjectId, amount, method } = req.body;

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
      Subject_ID: subjectId ? BigInt(subjectId) : null,
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
      Subject_ID: payment.Subject_ID ? payment.Subject_ID.toString() : null,
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
    Subject_ID: p.Subject_ID ? p.Subject_ID.toString() : null,
    Student_ID: p.Student_ID.toString(),
    Amount: p.Amount.toString(),
    Slip_Url: p.Slip_Url ? await getSignedUrlIfNeeded(p.Slip_Url) : null
  })));

  res.status(200).json({ success: true, count: payments.length, data: serializedPayments });
};

module.exports = { getPayments, approvePayment, createPayment, rejectPayment, getStudentPayments };
