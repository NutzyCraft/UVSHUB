const { google } = require('googleapis');
const path = require('path');

/**
 * Build an authenticated Google Calendar client using the service account.
 *
 * Supports two credential strategies:
 *  1. GOOGLE_APPLICATION_CREDENTIALS_JSON  – base64-encoded JSON (for serverless)
 *  2. GOOGLE_APPLICATION_CREDENTIALS       – file path (local / VM)
 */
function getCalendarClient() {
  let auth;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Serverless: credentials stored as a base64-encoded env var
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 'base64').toString('utf-8')
    );
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  } else {
    // Local / VM: credentials file path
    const keyFilePath = path.resolve(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS || ''
    );
    auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  }

  return google.calendar({ version: 'v3', auth });
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
    start: { dateTime: startTime },
    end: { dateTime: endTime },
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
