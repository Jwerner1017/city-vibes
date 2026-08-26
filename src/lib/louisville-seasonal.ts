import type { IncomingEvent } from "@/lib/sources";
import { startOfToday } from "@/lib/sources";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Louisville local ISO. Month is 0-based. */
function at(year: number, month: number, day: number, hour = 10, minute = 0) {
  const dst = month > 1 && month < 10; // Mar–Oct ≈ EDT; close enough for tentpoles
  const off = dst ? "-04:00" : "-05:00";
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${off}`;
}

function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month: month - 1, day };
}

function addDays(y: number, m: number, d: number, n: number) {
  const dt = new Date(Date.UTC(y, m, d + n));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth(), day: dt.getUTCDate() };
}

function lastSaturday(year: number, month: number) {
  const dt = new Date(year, month + 1, 0);
  dt.setDate(dt.getDate() - ((dt.getDay() + 1) % 7));
  return dt;
}

type Extra = Omit<IncomingEvent, "title" | "date_start" | "date_end">;

function ev(
  title: string,
  start: string,
  end: string,
  extra: Extra,
): IncomingEvent {
  return {
    title,
    date_start: start,
    date_end: end,
    is_free: extra.is_free !== false,
    featured: Boolean(extra.featured),
    source: extra.source || "seasonal",
    ...extra,
  };
}

const FISH_FRYS: Array<{
  title: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
  url: string;
}> = [
  {
    title: "Cathedral of the Assumption Fish Fry",
    address: "433 S 5th St, Louisville, KY 40202",
    lat: 38.2531,
    lng: -85.7576,
    hours: "Fridays in Lent, 4:30–8:00 p.m. Dine-in and drive-thru.",
    url: "https://www.cathedraloftheassumption.org/",
  },
  {
    title: "St. Joseph Clifton Fish Fry",
    address: "1406 E Washington St, Louisville, KY 40206",
    lat: 38.2568,
    lng: -85.7274,
    hours: "Fridays in Lent, lunch 11–1 and dinner 4:30–7:30. Dine-in and carryout.",
    url: "https://www.stjosephlouisville.org/",
  },
  {
    title: "St. Agnes Highlands Fish Fry",
    address: "1920 Newburg Rd, Louisville, KY 40205",
    lat: 38.2274,
    lng: -85.7021,
    hours: "Fridays in Lent, 5:00–7:30 p.m. Dine-in and carryout.",
    url: "https://www.stagneslouisville.org/",
  },
  {
    title: "Holy Family Fish Fry",
    address: "3926 Poplar Level Rd, Louisville, KY 40213",
    lat: 38.2095,
    lng: -85.7012,
    hours: "Fridays in Lent, lunch 11–1 and dinner 4–7. Dine-in, carryout, drive-thru.",
    url: "https://www.hfparishlouisville.org/",
  },
  {
    title: "St. Frances of Assisi Fish Fry",
    address: "1960 Bardstown Rd, Louisville, KY 40205",
    lat: 38.2318,
    lng: -85.7028,
    hours: "Fridays in Lent, 5:00–8:00 p.m. Dine-in and carryout.",
    url: "https://www.sfalouisville.org/",
  },
  {
    title: "Our Lady of Lourdes Fish Fry",
    address: "508 Breckenridge Ln, Louisville, KY 40207",
    lat: 38.2396,
    lng: -85.6418,
    hours: "Fridays in Lent, 5:30–8:30 p.m. Dine-in and carryout.",
    url: "https://www.lourdeslouisville.org/",
  },
  {
    title: "Holy Trinity Fish Fry",
    address: "501 Cherrywood Rd, Louisville, KY 40207",
    lat: 38.2564,
    lng: -85.6595,
    hours: "Fridays in Lent, 5:30–8:00 p.m. Dine-in and carryout.",
    url: "https://www.htparish.org/",
  },
  {
    title: "Good Shepherd Portland Fish Fry",
    address: "3511 W Muhammad Ali Blvd, Louisville, KY 40212",
    lat: 38.2578,
    lng: -85.8055,
    hours: "Fridays in Lent, 4:00–8:00 p.m.",
    url: "https://www.archlou.org/fish-fries-2026/",
  },
  {
    title: "St. Martin de Porres Fish Fry",
    address: "3112 Greenwood Ave, Louisville, KY 40211",
    lat: 38.2494,
    lng: -85.8038,
    hours: "Fridays in Lent, 11:00 a.m.–6:00 p.m. Dine-in and carryout.",
    url: "https://www.archlou.org/fish-fries-2026/",
  },
  {
    title: "Church of the Ascension Fish Fry",
    address: "4600 Lynnbrook Dr, Louisville, KY 40220",
    lat: 38.2174,
    lng: -85.6266,
    hours: "Fridays in Lent, 4:30–8:00 p.m. Dine-in and drive-thru.",
    url: "https://www.ascensionlouisville.org/",
  },
  {
    title: "St. Patrick Fish Fry",
    address: "1433 St. Patrick's Ct, Louisville, KY 40245",
    lat: 38.2712,
    lng: -85.4905,
    hours: "Fridays in Lent, 4:30–7:30 p.m. Dine-in and carryout.",
    url: "https://www.stpatricklouisville.org/",
  },
  {
    title: "St. Albert the Great Fish Fry",
    address: "1395 Girard Dr, Louisville, KY 40222",
    lat: 38.2728,
    lng: -85.6154,
    hours: "Fridays in Lent, 5:00–7:30 p.m. Dine-in and carryout.",
    url: "https://www.stalbert.org/",
  },
];

function fishFrys(year: number): IncomingEvent[] {
  const eas = easter(year);
  const ash = addDays(eas.year, eas.month, eas.day, -46);
  const firstFriday = addDays(ash.year, ash.month, ash.day, (5 - new Date(Date.UTC(ash.year, ash.month, ash.day)).getUTCDay() + 7) % 7 || 7);
  // If Ash Wednesday is Friday, that's day 0; otherwise next Friday.
  const ashDow = new Date(Date.UTC(ash.year, ash.month, ash.day)).getUTCDay();
  const start = ashDow === 5 ? ash : firstFriday;
  const goodFriday = addDays(eas.year, eas.month, eas.day, -2);
  const startIso = at(start.year, start.month, start.day, 11, 0);
  const endIso = at(goodFriday.year, goodFriday.month, goodFriday.day, 20, 0);
  if (new Date(endIso) < startOfToday()) return [];
  const out: IncomingEvent[] = [
    ev("Louisville Lenten Fish Fry Guide", startIso, endIso, {
      description:
        "Dozens of parish fish frys every Friday in Lent. Map the famous ones here, then check the Archdiocese guide for the full list.",
      location_name: "Louisville parishes",
      address: "Louisville, KY",
      latitude: 38.2527,
      longitude: -85.7585,
      category: "food",
      featured: true,
      website_url: "https://www.archlou.org/fish-fries-2026/",
      source: "seasonal:fishfry",
    }),
  ];
  for (const fry of FISH_FRYS) {
    out.push(
      ev(fry.title, startIso, endIso, {
        description: fry.hours,
        location_name: fry.title.replace(" Fish Fry", ""),
        address: fry.address,
        latitude: fry.lat,
        longitude: fry.lng,
        category: "food",
        website_url: fry.url,
        source: "seasonal:fishfry",
      }),
    );
  }
  return out;
}

export function louisvilleSeasonal(): IncomingEvent[] {
  const y = new Date().getFullYear();
  const today = startOfToday();
  const halloweenSat = lastSaturday(y, 9); // October
  const list: IncomingEvent[] = [
    ev("Kentucky State Fair", at(y, 7, 20, 10, 0), at(y, 7, 30, 22, 0), {
      description:
        "Eleven days of rides, 4-H, country ham, and concerts at the Expo Center. The one week the whole city shows up.",
      location_name: "Kentucky Exposition Center",
      address: "937 Phillips Ln, Louisville, KY 40209",
      latitude: 38.201,
      longitude: -85.741,
      category: "festival",
      featured: true,
      is_free: false,
      price_info: "Fair admission required",
      website_url: "https://kystatefair.org/",
    }),
    ev("Downtown Louisville Farmers Market", at(y, 4, 9, 9, 0), at(y, 9, 10, 13, 0), {
      description: "Saturdays 9 a.m.–1 p.m. on Front Street, May through early October. Produce, baked goods, and a river breeze.",
      location_name: "Front Street",
      address: "100 E Main St, Louisville, KY 40202",
      latitude: 38.2576,
      longitude: -85.7485,
      category: "food",
      website_url: "https://realfarmersmarketco.com/louisville-farmers-market/",
    }),
    ev("Gray Street Farmers Market", at(y, 5, 4, 10, 30), at(y, 9, 29, 14, 0), {
      description: "Thursdays late spring through fall on the Health Sciences campus. Lunch-hour produce and ready-to-eat.",
      location_name: "Gray Street",
      address: "500 S Preston St, Louisville, KY 40202",
      latitude: 38.2478,
      longitude: -85.7466,
      category: "food",
      website_url: "https://publichealth.louisville.edu/community-partnerships/gray-street-farmers-market",
    }),
    ev("WFPK Waterfront Wednesday", at(y, 7, 26, 17, 0), at(y, 7, 26, 22, 0), {
      description: "Free outdoor concert series at Waterfront Park. Bring a blanket.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26,
      longitude: -85.737,
      category: "music",
      featured: true,
      website_url: "https://www.lpm.org/waterfront-wednesday",
    }),
    ev("WFPK Waterfront Wednesday", at(y, 8, 23, 17, 0), at(y, 8, 23, 22, 0), {
      description: "Season closer — free outdoor concert at Waterfront Park. Bring a blanket.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26,
      longitude: -85.737,
      category: "music",
      featured: true,
      website_url: "https://www.lpm.org/waterfront-wednesday",
    }),
    ev("Music in the Park | Sun Valley Park", at(y, 7, 27, 11, 0), at(y, 7, 27, 13, 0), {
      description: "Free lunchtime concert from Louisville Parks and Recreation.",
      location_name: "Sun Valley Park",
      address: "6505 Bethany Ln, Louisville, KY 40272",
      latitude: 38.1278,
      longitude: -85.8516,
      category: "music",
      website_url: "https://louisvilleky.gov/events",
      source: "seasonal:parks",
    }),
    ev("Project Parkway: Goodbye Summer Arts Fest", at(y, 7, 29, 17, 0), at(y, 7, 29, 20, 0), {
      description: "Neighborhood arts festival to send off summer — music, makers, and kids' activities.",
      location_name: "Parkway neighborhood",
      address: "Algonquin Pkwy, Louisville, KY 40210",
      latitude: 38.2325,
      longitude: -85.7864,
      category: "arts",
      website_url: "https://louisvilleky.gov/events",
      source: "seasonal:parks",
    }),
    ev("Boo at the Zoo", at(y, 9, 1, 17, 0), at(y, 9, 17, 22, 0), {
      description:
        "Trick-or-treating for kids 11 and under, rides, and zero-scare fun on select nights in October. A Louisville tradition for 40+ years.",
      location_name: "Louisville Zoo",
      address: "1100 Trevilian Way, Louisville, KY 40213",
      latitude: 38.2057,
      longitude: -85.7624,
      category: "trick_or_treat",
      holiday: "halloween",
      featured: true,
      is_free: false,
      price_info: "Zoo ticket required",
      age_min: 0,
      age_max: 11,
      website_url: "https://louisvillezoo.org/series/boo-at-the-zoo/",
    }),
    ev("Jack O'Lantern Spectacular", at(y, 9, 1, 19, 0), at(y, 10, 1, 22, 0), {
      description:
        "Hand-carved pumpkins, trick-or-treat stations, a hay maze, and fall food — now at Kentucky Kingdom, Wednesdays through Sundays.",
      location_name: "Kentucky Kingdom",
      address: "937 Phillips Ln, Louisville, KY 40209",
      latitude: 38.1983,
      longitude: -85.7425,
      category: "holiday",
      holiday: "halloween",
      featured: true,
      is_free: false,
      price_info: "From about $20; season passholders free",
      website_url: "https://www.kentuckykingdom.com/",
    }),
    ev("Halloween Trick-or-Treat Night", at(y, 9, 31, 17, 30), at(y, 9, 31, 20, 30), {
      description:
        "Porch-light night across Louisville. Highlands, Old Louisville, Clifton, and the Crescent Hill streets fill up first. Go 5:30–8:30.",
      location_name: "Louisville neighborhoods",
      address: "Louisville, KY",
      latitude: 38.2527,
      longitude: -85.7585,
      category: "trick_or_treat",
      holiday: "halloween",
      featured: true,
      website_url: "https://louisvilleky.gov/",
    }),
    ev("Shawnee Park Trunk-or-Treat", at(y, halloweenSat.getMonth(), halloweenSat.getDate(), 16, 0), at(y, halloweenSat.getMonth(), halloweenSat.getDate(), 19, 0), {
      description:
        "Park-and-treat across from the Shawnee basketball courts. Costumes welcome, candy at the trunks — the west-end Halloween meetup.",
      location_name: "Shawnee Park",
      address: "3911 W Broadway, Louisville, KY 40211",
      latitude: 38.2538,
      longitude: -85.8195,
      category: "trick_or_treat",
      holiday: "halloween",
      website_url: "https://louisvilleky.gov/government/parks-and-recreation",
      source: "seasonal:parks",
    }),
    ev("Highlands Halloween Stroll", at(y, 9, 31, 17, 0), at(y, 9, 31, 20, 0), {
      description: "Bardstown Road and the side streets between Cherokee and Tyler Park — classic porch-to-porch trick-or-treating.",
      location_name: "The Highlands",
      address: "Bardstown Rd & Cherokee Rd, Louisville, KY 40205",
      latitude: 38.2315,
      longitude: -85.7168,
      category: "trick_or_treat",
      holiday: "halloween",
    }),
    ev("Old Louisville Trick-or-Treat", at(y, 9, 31, 17, 0), at(y, 9, 31, 20, 0), {
      description: "Victorian porches, St. James Court, and Belgravia — one of the prettiest Halloween walks in the city.",
      location_name: "Old Louisville",
      address: "St. James Court, Louisville, KY 40208",
      latitude: 38.229,
      longitude: -85.762,
      category: "trick_or_treat",
      holiday: "halloween",
    }),
  ];

  list.push(...fishFrys(y));
  list.push(...fishFrys(y + 1));

  return list.filter((e) => new Date(e.date_end || e.date_start) >= today);
}
