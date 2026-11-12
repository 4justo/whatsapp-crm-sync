import { AppointmentInfo, GoogleCalendarEvent } from '../types/calendar.js';

export class GoogleCalendarIntegration {
  private accessToken: string;
  private calendarId: string;

  constructor(accessToken: string, calendarId: string = 'primary') {
    this.accessToken = accessToken;
    this.calendarId = calendarId;
  }

  async createAppointment(appointment: AppointmentInfo): Promise<string> {
    const event: GoogleCalendarEvent = {
      summary: appointment.title,
      description: appointment.description,
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: 'UTC'
      }
    };

    if (appointment.attendeeEmail) {
      event.attendees = [{ email: appointment.attendeeEmail }];
    }

    if (appointment.location) {
      event.location = appointment.location;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }
}
