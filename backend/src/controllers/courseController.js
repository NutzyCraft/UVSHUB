const { prisma } = require('../config/db');
const { createClassEvent, removeStudentFromClass } = require('../utils/googleCalendar');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if a string is a valid UUID
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * @desc    Get all published courses (now mapping to Subjects)
 * @route   GET /api/v1/courses
 * @access  Public
 */
const getCourses = async (req, res) => {
  const { category, level, search, all, includeHidden } = req.query;
  const filter = {};

  // Map Mongoose filters to Prisma Subject schema
  if (category) filter.Medium = category;
  if (level) filter.Grade = parseFloat(level);
  if (search) filter.Name = { contains: search, mode: 'insensitive' };

  // By default, public/students only see non-hidden courses
  const showAll = all === 'true' || includeHidden === 'true';
  if (!showAll) {
    filter.IsHidden = false;
  }

  const courses = await prisma.subjects.findMany({
    where: filter,
    orderBy: { id: 'desc' }
  });

  // Manually populate instructors since we don't have direct Prisma relations setup
  // Filter out any instructor values that are not valid UUIDs to prevent PostgreSQL query errors
  const instructorIds = courses.map(c => c.Instructor).filter(Boolean).filter(isUUID);
  let instructors = [];
  if (instructorIds.length > 0) {
    instructors = await prisma.student.findMany({
      where: { id: { in: instructorIds } },
      select: { id: true, Name: true }
    });
  }

  const serializedCourses = courses.map(course => {
    const instructorInfo = instructors.find(i => i.id === course.Instructor);
    const instructorName = instructorInfo?.Name || course.Instructor || 'Unknown';
    return {
      ...course,
      id: course.id.toString(),
      Grade: parseFloat(course.Grade),
      Price: parseFloat(course.Price),
      IsHidden: Boolean(course.IsHidden),
      InstructorName: instructorName,
      instructor: instructorInfo || { id: course.Instructor, name: instructorName }
    };
  });

  res.status(200).json({ success: true, count: serializedCourses.length, data: serializedCourses });
};

/**
 * @desc    Get single course by ID
 * @route   GET /api/v1/courses/:id
 * @access  Public
 */
const getCourse = async (req, res) => {
  let courseId;
  try {
    courseId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await prisma.subjects.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Manually populate instructor (only if it is a valid UUID)
  let instructor = null;
  if (course.Instructor && isUUID(course.Instructor)) {
    instructor = await prisma.student.findUnique({
      where: { id: course.Instructor },
      select: { id: true, Name: true }
    });
  }

  const serializedCourse = {
    ...course,
    id: course.id.toString(),
    Grade: parseFloat(course.Grade),
    Price: parseFloat(course.Price),
    IsHidden: Boolean(course.IsHidden),
    InstructorName: instructor?.Name || course.Instructor || 'Unknown',
    instructor: instructor || { id: course.Instructor, name: course.Instructor || 'Unknown' }
  };

  res.status(200).json({ success: true, data: serializedCourse });
};

/**
 * @desc    Create a new course
 * @route   POST /api/v1/courses
 * @access  Private (instructor, admin)
 */
const createCourse = async (req, res) => {
  // Support both old API payloads and new mapped schema
  const { title, name, level, grade, category, medium, price, meetingLink, instructor, startTime, endTime, day, isHidden, IsHidden } = req.body;

  if (!name && !title) {
    const error = new Error('Course name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!medium && !category) {
    const error = new Error('Medium is required');
    error.statusCode = 400;
    throw error;
  }

  if (!startTime || !endTime) {
    const error = new Error('startTime and endTime are required for scheduling a class');
    error.statusCode = 400;
    throw error;
  }
  
  const isAdmin = req.user?.Role?.toLowerCase() === 'admin';
  const requestedInstructor = typeof instructor === 'string' ? instructor.trim() : '';
  const instructorValue = isAdmin
    ? (requestedInstructor || req.user?.Name || String(req.user?.id || ''))
    : (req.user?.Name || String(req.user?.id || ''));

  let calendarEventId = null;
  let generatedMeetLink = meetingLink || '';

  try {
    const toISO = (timeStr, dayName) => {
        if (timeStr.includes('T')) return timeStr;
        // Get current date/time in Colombo timezone
        const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
        if (dayName) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const targetDay = days.indexOf(dayName);
          if (targetDay !== -1) {
            const currentDay = d.getDay();
            let distance = targetDay - currentDay;
            if (distance < 0) distance += 7; 
            d.setDate(d.getDate() + distance);
          }
        }
        const [h, m] = timeStr.split(':');
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        // Return without 'Z' so Google Calendar uses the provided timeZone
        return `${year}-${month}-${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
      };

    const calendarResult = await createClassEvent(name || title, toISO(startTime, day), toISO(endTime, day));
    calendarEventId = calendarResult.eventId;
    generatedMeetLink = calendarResult.meetLink || generatedMeetLink;
    console.log(`✅ Google Meet link generated: ${generatedMeetLink}`);
  } catch (calendarError) {
    console.error('⚠️ Failed to create Google Calendar event:', calendarError.message);
    // Fail-open: course is still created without a Meet link
  }

  let imageUrl = null;
  if (req.file) {
    try {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Subjects')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Subjects')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    } catch (uploadErr) {
      console.error('⚠️ Failed to upload image:', uploadErr.message);
    }
  }

  const isHiddenVal = isHidden === 'true' || isHidden === true || IsHidden === 'true' || IsHidden === true;

  const course = await prisma.subjects.create({
    data: {
      Name: name || title, 
      Grade: String(parseFloat(grade || level || 0)),
      Medium: medium || category || 'Unknown',
      Price: String(parseFloat(price || 0)),
      MeetingLink: generatedMeetLink,
      CalendarEventId: calendarEventId,
      Instructor: instructorValue,
      Day: day || null,
      StartTime: startTime || null,
      EndTime: endTime || null,
      Image: imageUrl,
      IsHidden: isHiddenVal
    }
  });

  const serializedCourse = {
    ...course,
    id: course.id.toString(),
    Grade: parseFloat(course.Grade),
    Price: parseFloat(course.Price),
    IsHidden: Boolean(course.IsHidden),
  };

  res.status(201).json({ success: true, data: serializedCourse });
};

/**
 * @desc    Update a course
 * @route   PUT /api/v1/courses/:id
 * @access  Private (instructor, admin)
 */
const updateCourse = async (req, res) => {
  let courseId;
  try {
    courseId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Course ID format');
    error.statusCode = 400;
    throw error;
  }

  let course = await prisma.subjects.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  // Ensure only the owning instructor or admin can update
  const isAdmin = req.user?.Role?.toLowerCase() === 'admin';
  const isOwner = course.Instructor === req.user.id || course.Instructor === req.user.Name;
  if (!isOwner && !isAdmin) {
    const error = new Error('Not authorised to update this course');
    error.statusCode = 403;
    throw error;
  }

  const { title, name, level, grade, category, medium, price, meetingLink, instructor, day, startTime, endTime, isHidden, IsHidden } = req.body;
  const updateData = {};
  if (name || title) updateData.Name = name || title;
  if (grade || level) updateData.Grade = String(parseFloat(grade || level));
  if (medium || category) updateData.Medium = medium || category;
  if (price) updateData.Price = String(parseFloat(price));
  if (day !== undefined) updateData.Day = day;
  if (startTime !== undefined) updateData.StartTime = startTime;
  if (endTime !== undefined) updateData.EndTime = endTime;
  if (isAdmin && instructor !== undefined) updateData.Instructor = String(instructor).trim();
  if (isHidden !== undefined) {
    updateData.IsHidden = isHidden === 'true' || isHidden === true;
  } else if (IsHidden !== undefined) {
    updateData.IsHidden = IsHidden === 'true' || IsHidden === true;
  }

  if (req.file) {
    try {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Subjects')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Subjects')
        .getPublicUrl(fileName);

      updateData.Image = publicUrl;
    } catch (uploadErr) {
      console.error('⚠️ Failed to upload image:', uploadErr.message);
    }
  }

  let generatedMeetLink = meetingLink !== undefined ? meetingLink : course.MeetingLink;
  let calendarEventId = course.CalendarEventId;

  if (startTime && endTime) {
    try {
      const toISO = (timeStr, dayName) => {
        if (timeStr.includes('T')) return timeStr;
        // Get current date/time in Colombo timezone
        const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"}));
        if (dayName) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const targetDay = days.indexOf(dayName);
          if (targetDay !== -1) {
            const currentDay = d.getDay();
            let distance = targetDay - currentDay;
            if (distance < 0) distance += 7; 
            d.setDate(d.getDate() + distance);
          }
        }
        const [h, m] = timeStr.split(':');
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        // Return without 'Z' so Google Calendar uses the provided timeZone
        return `${year}-${month}-${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
      };
      
      const targetDay = updateData.Day || course.Day;
      const calendarResult = await createClassEvent(updateData.Name || course.Name, toISO(startTime, targetDay), toISO(endTime, targetDay));
      calendarEventId = calendarResult.eventId;
      generatedMeetLink = calendarResult.meetLink || generatedMeetLink;
      console.log(`✅ New Google Meet link generated on edit: ${generatedMeetLink}`);
    } catch (error) {
      console.error('⚠️ Calendar integration failed during update:', error.message);
    }
  }

  if (startTime && endTime) {
    updateData.MeetingLink = generatedMeetLink;
    updateData.CalendarEventId = calendarEventId;
  } else if (meetingLink !== undefined) {
    updateData.MeetingLink = meetingLink;
  }

  course = await prisma.subjects.update({
    where: { id: courseId },
    data: updateData
  });

  const serializedCourse = {
    ...course,
    id: course.id.toString(),
    Grade: parseFloat(course.Grade),
    Price: parseFloat(course.Price),
    IsHidden: Boolean(course.IsHidden),
  };

  res.status(200).json({ success: true, data: serializedCourse });
};

/**
 * @desc    Delete a course
 * @route   DELETE /api/v1/courses/:id
 * @access  Private (instructor, admin)
 */
const deleteCourse = async (req, res) => {
  let courseId;
  try {
    courseId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await prisma.subjects.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = req.user?.Role?.toLowerCase() === 'admin';
  const isOwner = course.Instructor === req.user.id || course.Instructor === req.user.Name;
  if (!isOwner && !isAdmin) {
    const error = new Error('Not authorised to delete this course');
    error.statusCode = 403;
    throw error;
  }

  await prisma.subjects.delete({
    where: { id: courseId }
  });

  res.status(200).json({ success: true, data: {} });
};

/**
 * @desc    Enroll in a course
 * @route   POST /api/v1/courses/:id/enroll
 * @access  Private
 */
const enrollInCourse = async (req, res) => {
  let courseId;
  try {
    courseId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await prisma.subjects.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const student = req.user;
  if (!student) {
    const error = new Error('Not authorised');
    error.statusCode = 401;
    throw error;
  }

  // Check if enrollment already exists
  const existingEnrollment = await prisma.enrollments.findFirst({
    where: {
      Student_ID: student.Student_ID,
      Subject_ID: course.id
    }
  });

  if (existingEnrollment) {
    return res.status(200).json({
      success: true,
      message: 'Already enrolled in this course',
      data: {
        id: existingEnrollment.id.toString(),
        Student_ID: existingEnrollment.Student_ID.toString(),
        Studnet_Name: existingEnrollment.Studnet_Name,
        Subject_Name: existingEnrollment.Subject_Name
      }
    });
  }

  // Create enrollment
  const enrollment = await prisma.enrollments.create({
    data: {
      Student_ID: student.Student_ID,
      Studnet_Name: student.Name,
      Subject_Name: course.Name,
      Subject_ID: course.id
    }
  });

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: {
      id: enrollment.id.toString(),
      Student_ID: enrollment.Student_ID.toString(),
      Studnet_Name: enrollment.Studnet_Name,
      Subject_Name: enrollment.Subject_Name
    }
  });
};

/**
 * @desc    Unenroll from a course
 * @route   DELETE /api/v1/courses/:id/enroll
 * @access  Private
 */
const unenrollFromCourse = async (req, res) => {
  let courseId;
  try {
    courseId = BigInt(req.params.id);
  } catch (err) {
    const error = new Error('Invalid Course ID format');
    error.statusCode = 400;
    throw error;
  }

  const course = await prisma.subjects.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error('Course not found');
    error.statusCode = 404;
    throw error;
  }

  const student = req.user;
  if (!student) {
    const error = new Error('Not authorised');
    error.statusCode = 401;
    throw error;
  }

  // Find existing enrollment
  const existingEnrollment = await prisma.enrollments.findFirst({
    where: {
      Student_ID: student.Student_ID,
      Subject_ID: course.id
    }
  });

  if (!existingEnrollment) {
    const error = new Error('Not enrolled in this course');
    error.statusCode = 400;
    throw error;
  }

  // Remove from calendar event if it exists
  if (course.CalendarEventId && student.Email) {
    try {
      await removeStudentFromClass(course.CalendarEventId, student.Email);
    } catch (err) {
      console.error('⚠️ Failed to remove student from Google Meet:', err.message);
    }
  }

  // Delete enrollment from database
  await prisma.enrollments.delete({
    where: { id: existingEnrollment.id }
  });

  res.status(200).json({
    success: true,
    message: 'Unenrolled successfully',
    data: {}
  });
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse, enrollInCourse, unenrollFromCourse };
