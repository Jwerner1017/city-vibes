import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = "6a3ed7ba374b6378eae25755";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event } = await req.json();
    if (!event) return Response.json({ error: 'Event data required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const calendarEvent = {
      summary: event.title,
      description: event.description || '',
      location: event.address || event.location_name || '',
      start: {
        dateTime: event.date_start,
        timeZone: 'America/Louisville',
      },
      end: {
        dateTime: event.date_end || event.date_start,
        timeZone: 'America/Louisville',
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const err = await response.json();
      return Response.json({ error: err.error?.message || 'Failed to add event' }, { status: response.status });
    }

    const created = await response.json();
    return Response.json({ success: true, calendarEventId: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});