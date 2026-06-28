const { google } = require('googleapis');
const path = require('path');

/**
 * Build an authenticated Google Calendar client using OAuth 2.0.
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env.
 */
function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

/**
 * Create a Google Calendar event with an auto-generated Google Meet link.
 *
 * @param {string} title     – Event / class title
 * @param {string} startTime – ISO-8601 datetime  (e.g. "2026-07-01T10:00:00+05:30")
 * @param {string} endTime   – ISO-8601 datetime
 * @returns {Promise<{ eventId: string, meetLink: string }>}
 */
async function createClassEvent(title, startTime, endTime) {
  const calendar = getCalendarClient();

  const event = {
    summary: title,
    start: { dateTime: startTime, timeZone: 'Asia/Colombo' },
    end: { dateTime: endTime, timeZone: 'Asia/Colombo' },
    recurrence: ['RRULE:FREQ=WEEKLY'],
    conferenceData: {
      createRequest: {
        requestId: `uvshub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
    conferenceDataVersion: 1,
  });

  const createdEvent = response.data;
  const meetLink =
    createdEvent.hangoutLink ||
    createdEvent.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
    '';

  return {
    eventId: createdEvent.id,
    meetLink,
  };
}

/**
 * Add a student to an existing calendar event (Google Meet invite).
 *
 * Checks for duplicate emails before adding. Sends an email invitation
 * to the student via `sendUpdates: 'all'`.
 *
 * @param {string} eventId      – Google Calendar event ID
 * @param {string} studentEmail – Student's email address
 * @returns {Promise<void>}
 */
async function addStudentToClass(eventId, studentEmail) {
  const calendar = getCalendarClient();

  // Fetch the current event to get existing attendees
  const { data: existingEvent } = await calendar.events.get({
    calendarId: CALENDAR_ID,
    eventId,
  });

  const attendees = existingEvent.attendees || [];

  // Skip if already invited
  const alreadyInvited = attendees.some(
    (a) => a.email.toLowerCase() === studentEmail.toLowerCase()
  );
  if (alreadyInvited) {
    console.log(`Student ${studentEmail} is already invited to event ${eventId}`);
    return;
  }

  attendees.push({ email: studentEmail });

  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    resource: { attendees },
    sendUpdates: 'all',
  });

  console.log(`Successfully invited ${studentEmail} to event ${eventId}`);
}

/**
 * Remove a student from an existing calendar event (revoke Meet access).
 *
 * Silently removes the attendee without notifying them (`sendUpdates: 'none'`).
 *
 * @param {string} eventId      – Google Calendar event ID
 * @param {string} studentEmail – Student's email address
 * @returns {Promise<void>}
 */
async function removeStudentFromClass(eventId, studentEmail) {
  const calendar = getCalendarClient();

  // Fetch the current event to get existing attendees
  const { data: existingEvent } = await calendar.events.get({
    calendarId: CALENDAR_ID,
    eventId,
  });

  const attendees = existingEvent.attendees || [];

  // Filter out the student
  const updatedAttendees = attendees.filter(
    (a) => a.email.toLowerCase() !== studentEmail.toLowerCase()
  );

  // If the student wasn't in the list, nothing to do
  if (updatedAttendees.length === attendees.length) {
    console.log(`Student ${studentEmail} was not an attendee of event ${eventId}`);
    return;
  }

  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    resource: { attendees: updatedAttendees },
    sendUpdates: 'none',
  });

  console.log(`Successfully removed ${studentEmail} from event ${eventId}`);
}

module.exports = { createClassEvent, addStudentToClass, removeStudentFromClass };
