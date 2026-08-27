const { prisma } = require('../config/db');
const supabaseAdmin = require('../config/supabaseAdminClient');
const { getSignedUrlIfNeeded } = require('../config/storageHelper');

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  const { role } = req.query;
  let where = {};
  if (role === 'student') {
    where = {
      NOT: [
        { Role: { equals: 'instructor', mode: 'insensitive' } },
        { Role: { equals: 'admin', mode: 'insensitive' } },
      ],
    };
  } else if (role) {
    where = { Role: { equals: role, mode: 'insensitive' } };
  }

  const users = await prisma.student.findMany({
    where,
    orderBy: { Student_ID: 'asc' },
  });
  
  // Convert BigInt for JSON
  const serializedUsers = users.map(user => ({
    ...user,
    Student_ID: user.Student_ID.toString(),
    NIC: user.NIC ? user.NIC.toString() : null,
  }));

  res.status(200).json({ success: true, count: users.length, data: serializedUsers });
};


/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUser = async (req, res) => {
  const user = await prisma.student.findUnique({
    where: { id: req.params.id }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Fetch enrolled courses manually since they just share Student_ID
  const enrolledCourses = await prisma.enrollments.findMany({
    where: { Student_ID: user.Student_ID }
  });

  // Fetch corresponding Subject details to enrich the enrollment objects
  const subjectIds = enrolledCourses.map(e => e.Subject_ID).filter(Boolean);
  const subjectNames = enrolledCourses.filter(e => !e.Subject_ID).map(e => e.Subject_Name).filter(Boolean);
  
  let subjects = [];
  if (subjectIds.length > 0 || subjectNames.length > 0) {
    subjects = await prisma.subjects.findMany({
      where: {
        OR: [
          { id: { in: subjectIds } },
          { Name: { in: subjectNames } }
        ]
      }
    });
  }

  // Manually fetch instructors to get the proper InstructorName if the Instructor is a student ID
  const instructorIds = subjects.map(s => s.Instructor).filter(Boolean);
  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  const validInstructorIds = instructorIds.filter(isUUID);
  let instructors = [];
  if (validInstructorIds.length > 0) {
    instructors = await prisma.student.findMany({
      where: { id: { in: validInstructorIds } },
      select: { id: true, Name: true }
    });
  }

  const enrichedEnrollments = enrolledCourses.map(enrollment => {
    const subjectInfo = enrollment.Subject_ID 
      ? subjects.find(s => s.id === enrollment.Subject_ID)
      : subjects.find(s => s.Name === enrollment.Subject_Name);
    let instructorName = 'Unknown';
    if (subjectInfo) {
      const instInfo = instructors.find(i => i.id === subjectInfo.Instructor);
      instructorName = instInfo?.Name || subjectInfo.Instructor || 'Unknown';
    }

    return {
      ...enrollment,
      id: enrollment.id.toString(),
      Student_ID: enrollment.Student_ID ? enrollment.Student_ID.toString() : null,
      Subject_ID: enrollment.Subject_ID ? enrollment.Subject_ID.toString() : null,
      AccessExpiresAt: enrollment.AccessExpiresAt ? enrollment.AccessExpiresAt.toISOString() : null,
      Grade: subjectInfo ? parseFloat(subjectInfo.Grade) : null,
      Medium: subjectInfo ? subjectInfo.Medium : 'Unknown',
      Price: subjectInfo ? parseFloat(subjectInfo.Price) : null,
      InstructorName: instructorName,
      Instructor: subjectInfo ? subjectInfo.Instructor : null,
      MeetingLink: subjectInfo ? subjectInfo.MeetingLink : ''
    };
  });

  // Fetch payments for this student
  const payments = await prisma.payments.findMany({
    where: { Student_ID: user.Student_ID }
  });

  const serializedPayments = await Promise.all(payments.map(async p => ({
    id: p.id.toString(),
    created_at: p.created_at,
    Subject: p.Subject,
    Subject_ID: p.Subject_ID ? p.Subject_ID.toString() : null,
    Student_ID: p.Student_ID.toString(),
    Amount: p.Amount.toString(),
    Method: p.Method,
    Status: p.Status,
    Slip_Url: p.Slip_Url ? await getSignedUrlIfNeeded(p.Slip_Url) : null
  })));

  // Convert BigInt for JSON
  const serializedUser = {
    ...user,
    Student_ID: user.Student_ID.toString(),
    NIC: user.NIC ? user.NIC.toString() : null,
    enrolledCourses: enrichedEnrollments,
    payments: serializedPayments
  };

  res.status(200).json({ success: true, data: serializedUser });
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  const fieldsToUpdate = {};
  if (req.body.name) fieldsToUpdate.Name = req.body.name;
  if (req.body.whatsappNumber) fieldsToUpdate.Watsapp_Number = req.body.whatsappNumber;
  if (req.body.address) fieldsToUpdate.Address = req.body.address;
  if (req.body.guardianName) fieldsToUpdate.Gurdian_s_Name = req.body.guardianName;
  if (req.body.guardianNumber) fieldsToUpdate.Gurdians_Number = req.body.guardianNumber;

  let updatedPassword = false;

  if (req.body.password) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const error = new Error('Password updates are not configured on this server');
      error.statusCode = 500;
      throw error;
    }

    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: req.body.password,
    });

    if (passwordError) {
      const error = new Error(passwordError.message);
      error.statusCode = 400;
      throw error;
    }

    updatedPassword = true;
  }

  const user = Object.keys(fieldsToUpdate).length > 0
    ? await prisma.student.update({
        where: { id: req.user.id },
        data: fieldsToUpdate,
      })
    : req.user;

  // Convert BigInt for JSON
  const serializedUser = {
    ...user,
    Student_ID: user.Student_ID.toString(),
    NIC: user.NIC ? user.NIC.toString() : null,
  };

  res.status(200).json({
    success: true,
    data: serializedUser,
    message: updatedPassword ? 'Profile and password updated successfully' : 'Profile updated successfully',
  });
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  // Allow admins to delete any user, but students can only delete themselves
  if (req.user.Role !== 'admin' && req.user.id !== req.params.id) {
    const error = new Error('Not authorised to delete this account');
    error.statusCode = 403;
    throw error;
  }

  try {
    await prisma.student.delete({
      where: { id: req.params.id }
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }

  res.status(200).json({ success: true, data: {} });
};

module.exports = { getUsers, getUser, updateProfile, deleteUser };
