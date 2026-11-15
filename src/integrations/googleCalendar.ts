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
        timeZone: appointment.timezone || 'UTC'
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: appointment.timezone || 'UTC'
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

  async checkConflict(startTime: Date, endTime: Date): Promise<boolean> {
    const timeMin = startTime.toISOString();
    const timeMax = endTime.toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/freeBusy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: this.calendarId }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    const busy = data.calendars[this.calendarId]?.busy || [];
    return busy.length > 0;
  }

  async getAppointmentsInRange(start: Date, end: Date): Promise<AppointmentInfo[]> {
    const timeMin = start.toISOString();
    const timeMax = end.toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      title: item.summary,
      description: item.description,
      startTime: new Date(item.start.dateTime || item.start.date),
      endTime: new Date(item.end.dateTime || item.end.date),
      attendeeEmail: item.attendees?.[0]?.email,
      location: item.location
    }));
  }
}
