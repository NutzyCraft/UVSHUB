const { prisma } = require('../config/db');
const { createClient } = require('@supabase/supabase-js');
const { addStudentToClass, removeStudentFromClass } = require('../utils/googleCalendar');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @desc    Get all instructors
 * @route   GET /api/v1/instructors
 * @access  Public
 */
const getInstructors = async (req, res) => {
  try {
    const instructors = await prisma.instructors.findMany({
      orderBy: { id: 'desc' }
    });

    const serializedInstructors = instructors.map(inst => ({
      ...inst,
      id: inst.id.toString(),
    }));

    res.status(200).json({ success: true, count: serializedInstructors.length, data: serializedInstructors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new instructor
 * @route   POST /api/v1/instructors
 * @access  Private (Admin)
 */
const createInstructor = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ success: false, message: 'Name and description are required' });
  }

  try {
    // Check if instructor already exists
    const existingInstructor = await prisma.instructors.findUnique({
      where: { Name: name }
    });

    if (existingInstructor) {
      return res.status(400).json({ success: false, message: 'Instructor with this name already exists' });
    }

    let imageUrl = null;

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Instructors')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Instructors')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const instructor = await prisma.instructors.create({
      data: {
        Name: name,
        Description: description,
        Image: imageUrl
      }
    });

    res.status(201).json({
      success: true,
      data: { ...instructor, id: instructor.id.toString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update an instructor
 * @route   PUT /api/v1/instructors/:id
 * @access  Private (Admin)
 */
const updateInstructor = async (req, res) => {
  const { name, description } = req.body;
  let instructorId;
  
  try {
    instructorId = BigInt(req.params.id);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid Instructor ID format' });
  }

  try {
    const instructor = await prisma.instructors.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    let imageUrl = instructor.Image;

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Instructors')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Instructors')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const updateData = {};
    if (name) updateData.Name = name;
    if (description) updateData.Description = description;
    if (imageUrl !== instructor.Image) updateData.Image = imageUrl;

    const updatedInstructor = await prisma.instructors.update({
      where: { id: instructorId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      data: { ...updatedInstructor, id: updatedInstructor.id.toString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an instructor
 * @route   DELETE /api/v1/instructors/:id
 * @access  Private (Admin)
 */
const deleteInstructor = async (req, res) => {
  let instructorId;
  
  try {
    instructorId = BigInt(req.params.id);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid Instructor ID format' });
  }

  try {
    const instructor = await prisma.instructors.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Optional: Delete image from Supabase storage if we wanted to
    // if (instructor.Image) { ... extract path and supabase.storage.from('Instructors').remove(...) }

    await prisma.instructors.delete({
      where: { id: instructorId }
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get instructor's own dashboard data (subjects, enrollments, earnings)
 * @route   GET /api/v1/instructors/dashboard
 * @access  Private (Instructor)
 */
const getInstructorDashboard = async (req, res) => {
  try {
    const instructorName = req.user.Name;

    // Fetch all subjects taught by this instructor (including hidden ones)
    const subjects = await prisma.subjects.findMany({
      where: { Instructor: instructorName },
      orderBy: { id: 'desc' }
    });

    const PLATFORM_FEE = 500; // Rs 500 per enrolled student per subject

    // For each subject, count active enrollments and calculate earnings
    const subjectData = await Promise.all(subjects.map(async (subject) => {
      const enrollmentCount = await prisma.enrollments.count({
        where: { Subject_ID: subject.id }
      });

      const price = parseFloat(subject.Price);
      const grossEarnings = price * enrollmentCount;
      const platformFeeTotal = PLATFORM_FEE * enrollmentCount;
      const netEarnings = grossEarnings - platformFeeTotal;

      return {
        id: subject.id.toString(),
        name: subject.Name,
        grade: parseFloat(subject.Grade),
        price,
        medium: subject.Medium,
        meetingLink: subject.MeetingLink,
        day: subject.Day,
        startTime: subject.StartTime,
        endTime: subject.EndTime,
        image: subject.Image,
        isHidden: Boolean(subject.IsHidden),
        enrollmentCount,
        grossEarnings,
        platformFeeTotal,
        netEarnings,
        platformFeePerStudent: PLATFORM_FEE,
      };
    }));

    // Aggregate totals
    const totalStudents = subjectData.reduce((sum, s) => sum + s.enrollmentCount, 0);
    const totalGross = subjectData.reduce((sum, s) => sum + s.grossEarnings, 0);
    const totalPlatformFee = subjectData.reduce((sum, s) => sum + s.platformFeeTotal, 0);
    const totalNet = subjectData.reduce((sum, s) => sum + s.netEarnings, 0);

    res.status(200).json({
      success: true,
      data: {
        instructor: {
          name: instructorName,
          image: null,
        },
        subjects: subjectData,
        summary: {
          totalSubjects: subjects.length,
          totalStudents,
          totalGross,
          totalPlatformFee,
          totalNet,
          platformFeePerStudent: PLATFORM_FEE,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create an instructor account (email + password, Role='instructor')
 * @route   POST /api/v1/instructors/accounts
 * @access  Private (Admin)
 */
const createInstructorAccount = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  try {
    // Check if name already used (Name is unique in Studnets)
    const existingByName = await prisma.student.findFirst({ where: { Name: name } });
    if (existingByName) {
      return res.status(400).json({ success: false, message: 'An account with this name already exists' });
    }

    // Create Supabase Auth user via admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for admin-created accounts
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    // Create the student (instructor) record
    const instructor = await prisma.student.create({
      data: {
        id: authData.user.id,
        Name: name,
        Email: email,
        Watsapp_Number: '-',
        Gurdian_s_Name: '-',
        Gurdians_Number: '-',
        Address: '-',
        Role: 'instructor',
      },
    });

    // Auto-invite instructor to all existing subjects under their name
    try {
      const assignedSubjects = await prisma.subjects.findMany({
        where: { Instructor: name },
        select: { CalendarEventId: true, Name: true },
      });
      for (const subj of assignedSubjects) {
        if (subj.CalendarEventId) {
          await addStudentToClass(subj.CalendarEventId, email);
          console.log(`✅ Instructor ${email} auto-invited to Meet for "${subj.Name}"`);
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Failed to auto-invite instructor to existing meets:', calendarError.message);
    }

    res.status(201).json({
      success: true,
      message: `Instructor account created for ${name}`,
      data: {
        id: instructor.id,
        name: instructor.Name,
        email: instructor.Email,
        role: instructor.Role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    List all instructor accounts with earnings + current month payout status
 * @route   GET /api/v1/instructors/accounts
 * @access  Private (Admin)
 */
const listInstructorAccounts = async (req, res) => {
  try {
    const PLATFORM_FEE = 500;
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const instructorUsers = await prisma.student.findMany({
      where: { Role: 'instructor' },
      orderBy: { Name: 'asc' },
    });

    const result = await Promise.all(instructorUsers.map(async (inst) => {
      // Subjects taught by this instructor
      const subjects = await prisma.subjects.findMany({
        where: { Instructor: inst.Name },
        select: { id: true, Price: true },
      });

      // Enrollment counts + earnings
      let totalStudents = 0;
      let totalGross = 0;

      await Promise.all(subjects.map(async (subj) => {
        const count = await prisma.enrollments.count({ where: { Subject_ID: subj.id } });
        totalStudents += count;
        totalGross += parseFloat(subj.Price) * count;
      }));

      const totalPlatformFee = PLATFORM_FEE * totalStudents;
      const totalNet = totalGross - totalPlatformFee;

      // Check current month payout
      const payout = await prisma.instructorPayouts.findFirst({
        where: { InstructorName: inst.Name, Month: currentMonth },
      });

      return {
        id: inst.id,
        name: inst.Name,
        email: inst.Email,
        subjectCount: subjects.length,
        totalStudents,
        totalGross,
        totalPlatformFee,
        totalNet,
        currentMonth,
        paidThisMonth: !!payout,
        paidAt: payout ? payout.PaidAt : null,
        paidAmount: payout ? parseFloat(payout.Amount) : null,
        paidByAdmin: payout ? payout.PaidByAdmin : null,
      };
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark an instructor as paid for the current month
 * @route   POST /api/v1/instructors/accounts/:id/pay
 * @access  Private (Admin)
 */
const markInstructorPaid = async (req, res) => {
  const { id } = req.params; // instructor's Student UUID
  const PLATFORM_FEE = 500;
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const instructor = await prisma.student.findUnique({ where: { id } });
    if (!instructor || instructor.Role !== 'instructor') {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Calculate net amount for this month
    const subjects = await prisma.subjects.findMany({
      where: { Instructor: instructor.Name },
      select: { id: true, Price: true },
    });

    let totalStudents = 0;
    let totalGross = 0;
    await Promise.all(subjects.map(async (subj) => {
      const count = await prisma.enrollments.count({ where: { Subject_ID: subj.id } });
      totalStudents += count;
      totalGross += parseFloat(subj.Price) * count;
    }));

    const netAmount = totalGross - PLATFORM_FEE * totalStudents;

    // Upsert the payout record
    await prisma.instructorPayouts.upsert({
      where: { unique_instructor_month: { InstructorName: instructor.Name, Month: currentMonth } },
      update: { Amount: netAmount, PaidAt: new Date(), PaidByAdmin: req.user.Name },
      create: {
        InstructorName: instructor.Name,
        Month: currentMonth,
        Amount: netAmount,
        PaidByAdmin: req.user.Name,
      },
    });

    res.status(200).json({
      success: true,
      message: `${instructor.Name} marked as paid for ${currentMonth}`,
      data: { month: currentMonth, amount: netAmount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get the logged-in instructor's payout history (last 6 months)
 * @route   GET /api/v1/instructors/payouts
 * @access  Private (Instructor)
 */
const getInstructorPayouts = async (req, res) => {
  try {
    const instructorName = req.user.Name;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const payouts = await prisma.instructorPayouts.findMany({
      where: { InstructorName: instructorName },
      orderBy: { Month: 'desc' },
      take: 6,
    });

    const currentPayout = payouts.find(p => p.Month === currentMonth) || null;

    res.status(200).json({
      success: true,
      data: {
        currentMonth,
        paidThisMonth: !!currentPayout,
        currentPayout: currentPayout ? {
          month: currentPayout.Month,
          amount: parseFloat(currentPayout.Amount),
          paidAt: currentPayout.PaidAt,
          paidByAdmin: currentPayout.PaidByAdmin,
        } : null,
        history: payouts.map(p => ({
          id: p.id.toString(),
          month: p.Month,
          amount: parseFloat(p.Amount),
          paidAt: p.PaidAt,
          paidByAdmin: p.PaidByAdmin,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an instructor account, revoke calendar invites, and delete auth user + student record
 * @route   DELETE /api/v1/instructors/accounts/:id
 * @access  Private (Admin)
 */
const deleteInstructorAccount = async (req, res) => {
  const { id } = req.params; // instructor Student UUID

  try {
    const instructor = await prisma.student.findUnique({ where: { id } });
    if (!instructor || instructor.Role !== 'instructor') {
      return res.status(404).json({ success: false, message: 'Instructor account not found' });
    }

    // 1. Remove from Google Calendar events for all assigned subjects
    try {
      const assignedSubjects = await prisma.subjects.findMany({
        where: { Instructor: instructor.Name },
        select: { CalendarEventId: true, Name: true },
      });

      for (const subj of assignedSubjects) {
        if (subj.CalendarEventId && instructor.Email) {
          await removeStudentFromClass(subj.CalendarEventId, instructor.Email);
          console.log(`✅ Removed instructor ${instructor.Email} from Meet for "${subj.Name}"`);
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Error removing instructor from calendar events:', calendarError.message);
    }

    // 2. Delete Supabase Auth User
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.error('⚠️ Error deleting auth user from Supabase:', authErr.message);
    }

    // 3. Delete Student profile record from database
    await prisma.student.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: `Instructor account for ${instructor.Name} deleted and meeting access revoked.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};

