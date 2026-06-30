import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ZOO_LAT = 38.2057;
const ZOO_LNG = -85.7624;
const ZOO_ADDRESS = "1100 Trevilian Way, Louisville, KY 40213";
const ZOO_NAME = "Louisville Zoo";
const API_URL = "https://louisvillezoo.org/wp-json/tribe/events/v1/events?per_page=50&status=publish&start_date=2026-01-01";

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}

function guessCategory(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('light') || text.includes('lantern') || text.includes('glow') || text.includes('holiday')) return 'festival';
  if (text.includes('camp') || text.includes('class') || text.includes('education') || text.includes('learn')) return 'education';
  if (text.includes('concert') || text.includes('music') || text.includes('band')) return 'music';
  if (text.includes('5k') || text.includes('run') || text.includes('walk') || text.includes('sport')) return 'outdoor';
  if (text.includes('food') || text.includes('eat') || text.includes('dinner') || text.includes('lunch')) return 'food';
  if (text.includes('art') || text.includes('craft') || text.includes('paint') || text.includes('draw')) return 'arts';
  if (text.includes('community') || text.includes('volunteer') || text.includes('member')) return 'community';
  return 'attraction';
}

function guessHoliday(title, description, startDate) {
  const text = (title + ' ' + description).toLowerCase();
  const month = new Date(startDate).getMonth() + 1;
  if (text.includes('halloween') || text.includes('spooky') || text.includes('trick')) return 'halloween';
  if (text.includes('christmas') || text.includes('holiday lights') || text.includes('winter wonder')) return 'christmas';
  if (text.includes('easter') || text.includes('egg hunt')) return 'easter';
  if (text.includes("st. patrick") || text.includes("st patricks") || text.includes("shamrock")) return 'st_patricks';
  if (text.includes('thanksgiving')) return 'thanksgiving';
  if ((text.includes('july 4') || text.includes('fourth of july') || text.includes('firework')) && month === 7) return 'july_4th';
  if (text.includes('new year')) return 'new_years';
  if (text.includes('valentine')) return 'valentines';
  return 'none';
}

function extractPrice(description) {
  const text = stripHtml(description);
  const match = text.match(/\$[\d,]+(\+)?(\s*[-–]\s*\$[\d,]+)?/);
  return match ? match[0] : null;
}

function extractImage(event) {
  if (event.image?.url) return event.image.url;
  if (event.featured_image) return event.featured_image;
  const desc = event.description || '';
  const match = desc.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/i);
  return match ? match[1].replace(/\\\//g, '/') : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin calls and scheduled (service role) calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAuthorized = true;
    } catch (_) {
      // scheduled automation uses service role — allow it
      isAuthorized = true;
    }
    if (!isAuthorized) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch from Louisville Zoo WordPress API
    const res = await fetch(API_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'LocalVibesApp/1.0' }
    });
    if (!res.ok) throw new Error(`Zoo API returned ${res.status}`);
    const data = await res.json();
    const zooEvents = data.events || [];

    if (zooEvents.length === 0) {
      return Response.json({ message: 'No events found from Louisville Zoo API', synced: 0 });
    }

    // Get existing zoo events to avoid duplicates (match by website_url or title+date)
    const existing = await base44.asServiceRole.entities.Event.filter({
      location_name: ZOO_NAME
    }, '-date_start', 200);

    const existingUrls = new Set(existing.map(e => e.website_url).filter(Boolean));
    const existingKeys = new Set(existing.map(e => `${e.title}|${e.date_start?.slice(0,10)}`));

    const toCreate = [];
    const toSkip = [];

    for (const ze of zooEvents) {
      const startDate = ze.start_date || ze.date;
      const endDate = ze.end_date || ze.start_date || ze.date;
      const eventUrl = ze.url || '';
      const title = ze.title || 'Louisville Zoo Event';
      const dateKey = `${title}|${startDate?.slice(0,10)}`;

      if (existingUrls.has(eventUrl) || existingKeys.has(dateKey)) {
        toSkip.push(title);
        continue;
      }

      const descriptionRaw = ze.description || ze.excerpt || '';
      const description = stripHtml(descriptionRaw);
      const imageUrl = extractImage(ze);
      const priceInfo = extractPrice(descriptionRaw);
      const isFree = !priceInfo && !(descriptionRaw.toLowerCase().includes('ticket') || descriptionRaw.toLowerCase().includes('admission'));
      const category = guessCategory(title, description);
      const holiday = guessHoliday(title, description, startDate);

      // Parse venue info if available
      const venueName = ze.venue?.venue || ZOO_NAME;
      const venueAddress = ze.venue?.address
        ? `${ze.venue.address}, ${ze.venue.city || 'Louisville'}, ${ze.venue.stateprovince || 'KY'} ${ze.venue.zip || ''}`
        : ZOO_ADDRESS;

      toCreate.push({
        title,
        description,
        date_start: startDate,
        date_end: endDate,
        location_name: ZOO_NAME,
        address: venueAddress,
        latitude: ZOO_LAT,
        longitude: ZOO_LNG,
        category,
        holiday,
        photos: imageUrl ? [imageUrl] : [],
        is_free: isFree,
        price_info: priceInfo,
        age_min: 0,
        age_max: 18,
        is_permanent: false,
        website_url: eventUrl,
        status: 'approved',
        going_count: 0,
        save_count: 0,
        featured: false,
        is_sample: false,
      });
    }

    // Bulk create new events
    let created = 0;
    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Event.bulkCreate(toCreate);
      created = toCreate.length;
    }

    return Response.json({
      message: `Zoo sync complete`,
      total_from_api: zooEvents.length,
      synced: created,
      skipped_duplicates: toSkip.length,
      events_added: toCreate.map(e => e.title),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});