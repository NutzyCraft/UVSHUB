const { prisma } = require('../config/db');
const { removeStudentFromClass } = require('../utils/googleCalendar');

/**
 * @desc    Expire access for enrollments past their 28-day window
 * @route   GET /api/v1/cron/expire-access
 * @access  Protected by CRON_SECRET
 */
const expireAccess = async (req, res) => {
  // Verify Vercel Cron Secret
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    return res.status(500).json({ success: false, message: 'CRON_SECRET not configured' });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Find all enrollments where access has expired
  const expiredEnrollments = await prisma.enrollments.findMany({
    where: {
      AccessExpiresAt: {
        not: null,
        lt: new Date(),
      },
    },
  });

  if (expiredEnrollments.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No expired enrollments found',
      expired: 0,
      errors: 0,
    });
  }

  let expiredCount = 0;
  let errorCount = 0;

  for (const enrollment of expiredEnrollments) {
    try {
      // Look up the subject to get the CalendarEventId
      let calendarEventId = null;
      if (enrollment.Subject_Name) {
        const subject = await prisma.subjects.findFirst({
          where: { Name: enrollment.Subject_Name },
        });
        calendarEventId = subject?.CalendarEventId || null;
      }

      // Look up the student to get their email
      let studentEmail = null;
      if (enrollment.Student_ID) {
        const student = await prisma.student.findUnique({
          where: { Student_ID: enrollment.Student_ID },
        });
        studentEmail = student?.Email || null;
      }

      // Remove from Google Calendar event
      if (calendarEventId && studentEmail) {
        await removeStudentFromClass(calendarEventId, studentEmail);
        console.log(`✅ Removed ${studentEmail} from event ${calendarEventId} (expired)`);
      }

      // Mark enrollment as expired by clearing AccessExpiresAt
      await prisma.enrollments.update({
        where: { id: enrollment.id },
        data: { AccessExpiresAt: null },
      });

      expiredCount++;
    } catch (err) {
      console.error(
        `⚠️ Failed to expire enrollment ${enrollment.id}:`,
        err.message
      );
      errorCount++;
    }
  }

  console.log(`Cron complete: ${expiredCount} expired, ${errorCount} errors`);

  res.status(200).json({
    success: true,
    message: `Processed ${expiredEnrollments.length} expired enrollments`,
    expired: expiredCount,
    errors: errorCount,
  });
};

module.exports = { expireAccess };
