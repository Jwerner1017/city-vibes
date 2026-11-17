import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/requireAdmin.ts';
import { fetchPage, matchEvent } from './scrape.ts';

const RECHECK_DAYS = 7;
const MAX_DEGREES = 1.5; // about 100 miles: a venue further than this from the stored pin is treated as a wrong match

async function geocode(address) {
  const url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=' +
    encodeURIComponent(address);
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;
  const hit = (await res.json())?.result?.addressMatches?.[0]?.coordinates;
  return hit ? { lat: Number(hit.y), lng: Number(hit.x) } : null;
}

function near(lat, lng, ev) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 &&
    Math.abs(lat - ev.latitude) < MAX_DEGREES && Math.abs(lng - ev.longitude) < MAX_DEGREES;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const denied = await requireAdmin(base44);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(parseInt(body.limit) || 60, 1), 120);
    const nowIso = new Date().toISOString();
    const cutoff = new Date(Date.now() - RECHECK_DAYS * 86_400_000).toISOString();
    const retryTomorrow = new Date(Date.now() - (RECHECK_DAYS - 1) * 86_400_000).toISOString();
    const Events = base44.asServiceRole.entities.Event;

    // Upcoming approved events whose page has never been read, or not in the last week. Soonest first.
    const queue = {
      status: 'approved',
      date_end: { $gte: nowIso },
      website_url: { $regex: '^https?://' },
      $or: [{ details_checked_at: { $exists: false } }, { details_checked_at: { $lt: cutoff } }],
    };
    const { items } = await Events.filter(body.event_id ? { id: String(body.event_id) } : queue, { sort: 'date_start', limit });

    const pages = new Map();
    const places = new Map();
    const once = (map, key, load) => {
      if (!map.has(key)) {
        map.set(key, load().catch((e) => {
          console.warn(`[refreshEventDetails] ${key}: ${e.message}`);
          return null;
        }));
      }
      return map.get(key);
    };
    const counts = { checked: items.length, corrected: 0, confirmed_from_page: 0, page_not_about_event: 0, page_unreachable: 0, pins_moved: 0 };

    const checkOne = async (ev) => {
      const patch = { id: ev.id, details_checked_at: nowIso };
      const page = await once(pages, ev.website_url, () => fetchPage(ev.website_url));
      if (!page) {
        counts.page_unreachable += 1;
        patch.details_checked_at = retryTomorrow; // blocked or down today: try again in a day, not a week
        return patch;
      }
      const found = matchEvent(page, ev.title, ev.date_start);
      if (!found) {
        counts.page_not_about_event += 1;
        return patch;
      }
      if (found.photo && !(ev.photos || []).length) patch.photos = [found.photo];
      if (!found.structured) return patch;

      counts.confirmed_from_page += 1;
      patch.details_verified = true;
      if (found.location_name) patch.location_name = found.location_name.slice(0, 200);
      if (found.address) patch.address = found.address.slice(0, 300);
      if (found.date_start) patch.date_start = found.date_start;
      if (found.date_end) patch.date_end = found.date_end;
      const oldDescription = ev.description || '';
      if (oldDescription.length < 80 && found.description.length > oldDescription.length) {
        patch.description = found.description.slice(0, 1000);
      }
      if (found.price_info && !ev.price_info) {
        patch.price_info = found.price_info;
        patch.is_free = found.is_free;
      }

      let { lat, lng } = found;
      if (!near(lat, lng, ev) && found.address) {
        const hit = await once(places, found.address, () => geocode(found.address));
        lat = hit?.lat;
        lng = hit?.lng;
      }
      if (near(lat, lng, ev) && (lat !== ev.latitude || lng !== ev.longitude)) {
        patch.latitude = lat;
        patch.longitude = lng;
        counts.pins_moved += 1;
      }
      return patch;
    };

    const patches = [];
    for (let i = 0; i < items.length; i += 6) {
      const chunk = items.slice(i, i + 6);
      const settled = await Promise.allSettled(chunk.map(checkOne));
      settled.forEach((r, j) => {
        if (r.status === 'rejected') console.warn(`[refreshEventDetails] ${chunk[j].id}: ${r.reason?.message}`);
        patches.push(r.status === 'fulfilled' ? r.value : { id: chunk[j].id, details_checked_at: nowIso });
      });
    }
    counts.corrected = patches.filter((p) => Object.keys(p).some((k) => !['id', 'details_checked_at', 'details_verified'].includes(k))).length;

    if (body.dry_run) return Response.json({ dry_run: true, ...counts, changes: patches.slice(0, 15) });

    if (patches.length) await Events.bulkUpdate(patches);
    const remaining = body.event_id ? null : await Events.count(queue);
    console.log('[refreshEventDetails]', JSON.stringify({ ...counts, remaining }));
    return Response.json({ ...counts, remaining });
  } catch (error) {
    console.error('[refreshEventDetails]', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}