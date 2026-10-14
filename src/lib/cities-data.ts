export type SeedCity = {
  name: string;
  state: string;
  state_code: string;
  latitude: number;
  longitude: number;
  zoom: number;
  ranking: number;
  description: string;
};

export const SEED_CITIES: SeedCity[] = [
  {
    name: "Louisville",
    state: "Kentucky",
    state_code: "KY",
    latitude: 38.2527,
    longitude: -85.7585,
    zoom: 12,
    ranking: 1,
    description:
      "Derby City — parks, the Ohio River, bourbon-country day trips, and a calendar that actually fills a weekend.",
  },
  { name: "Lexington", state: "Kentucky", state_code: "KY", latitude: 38.0406, longitude: -84.5037, zoom: 12, ranking: 2, description: "Horse country, Keeneland, and a compact downtown." },
  { name: "Cincinnati", state: "Ohio", state_code: "OH", latitude: 39.1031, longitude: -84.5120, zoom: 12, ranking: 3, description: "River city just up I-71 — find a reason to stay the night." },
  { name: "Nashville", state: "Tennessee", state_code: "TN", latitude: 36.1627, longitude: -86.7816, zoom: 12, ranking: 4, description: "Music City, parks, and family shows beyond Broadway." },
  { name: "Indianapolis", state: "Indiana", state_code: "IN", latitude: 39.7684, longitude: -86.1581, zoom: 12, ranking: 5, description: "Monon Trail, museums, and a surprisingly walkable mile." },
  { name: "Chicago", state: "Illinois", state_code: "IL", latitude: 41.8781, longitude: -87.6298, zoom: 11, ranking: 10, description: "Lakefront festivals, neighborhood fests, and museum campuses." },
  { name: "New York City", state: "New York", state_code: "NY", latitude: 40.7128, longitude: -74.006, zoom: 11, ranking: 11, description: "Five boroughs of free parks programming and ticketed icons." },
  { name: "Atlanta", state: "Georgia", state_code: "GA", latitude: 33.749, longitude: -84.388, zoom: 11, ranking: 12, description: "BeltLine weekends, parks, and a stacked festival calendar." },
  { name: "Austin", state: "Texas", state_code: "TX", latitude: 30.2672, longitude: -97.7431, zoom: 12, ranking: 13, description: "Barton Springs, outdoor shows, and trail days." },
  { name: "Denver", state: "Colorado", state_code: "CO", latitude: 39.7392, longitude: -104.9903, zoom: 12, ranking: 14, description: "Red Rocks days, parks, and a high-country weekend." },
  { name: "Portland", state: "Oregon", state_code: "OR", latitude: 45.5051, longitude: -122.675, zoom: 12, ranking: 15, description: "Food carts, forest-in-the-city parks, and river festivals." },
  { name: "Seattle", state: "Washington", state_code: "WA", latitude: 47.6062, longitude: -122.3321, zoom: 12, ranking: 16, description: "Waterfront, markets, and museum days between the rain." },
  { name: "New Orleans", state: "Louisiana", state_code: "LA", latitude: 29.9511, longitude: -90.0715, zoom: 13, ranking: 17, description: "Festivals that spill into the street — family hours included." },
  { name: "Boston", state: "Massachusetts", state_code: "MA", latitude: 42.3601, longitude: -71.0589, zoom: 12, ranking: 18, description: "Harborwalk, commons, and a dense cultural calendar." },
  { name: "Miami", state: "Florida", state_code: "FL", latitude: 25.7617, longitude: -80.1918, zoom: 12, ranking: 19, description: "Beaches, Art Basel season, and outdoor markets." },
];

export type SeedNeighborhood = {
  city: string;
  state_code: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  vibe: string;
};

export const SEED_NEIGHBORHOODS: SeedNeighborhood[] = [
  {
    city: "Louisville",
    state_code: "KY",
    name: "Downtown & Whiskey Row",
    description:
      "Slugger Museum, the Ali Center, Frazier History, and the river a few blocks north. Best first-day walk for visitors.",
    latitude: 38.2565,
    longitude: -85.761,
    radius_miles: 1.2,
    vibe: "Museums, bats, and the river",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Waterfront",
    description:
      "Waterfront Park, Big Four Bridge sunsets, Thunder Over Louisville, and free outdoor concerts all summer.",
    latitude: 38.26,
    longitude: -85.737,
    radius_miles: 1.4,
    vibe: "River, fireworks, free shows",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "NuLu",
    description:
      "East Market galleries, First Friday hops, and a compact strip of restaurants. Easy to park once and wander.",
    latitude: 38.2533,
    longitude: -85.7395,
    radius_miles: 0.8,
    vibe: "Galleries and dinner",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "The Highlands",
    description:
      "Bardstown Road from Broadway to Douglass — patio brunch, indie shops, and Cherokee Park one hill over.",
    latitude: 38.241,
    longitude: -85.72,
    radius_miles: 1.6,
    vibe: "Brunch, shops, Olmsted parks",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Old Louisville",
    description:
      "The largest Victorian neighborhood in the U.S. St. James Court Art Fair in October, ghost-tour evenings, and shade.",
    latitude: 38.229,
    longitude: -85.762,
    radius_miles: 1.1,
    vibe: "Mansions and art fair",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Germantown & Schnitzelburg",
    description:
      "Pocket parks, bakeries, and some of the city's best casual food. Quiet streets, easy bike-over from downtown.",
    latitude: 38.226,
    longitude: -85.743,
    radius_miles: 1.0,
    vibe: "Porches and parks",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Butchertown",
    description:
      "Stockyard bones, the Food Port, and a short hop to the waterfront. Daytime distillery tours if the group is mixed-age.",
    latitude: 38.258,
    longitude: -85.728,
    radius_miles: 0.9,
    vibe: "Industrial-pretty, food",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Crescent Hill & Clifton",
    description:
      "Frankfort Avenue stretch: the farmers market, independent shops, and a streetcar-era main street that still works.",
    latitude: 38.255,
    longitude: -85.69,
    radius_miles: 1.3,
    vibe: "Main street Saturday",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "Cherokee Triangle",
    description:
      "Olmsted's Cherokee Park is the weekend plan — loops, the willow pond, and Castlewood playground.",
    latitude: 38.238,
    longitude: -85.7,
    radius_miles: 1.2,
    vibe: "The park everyone means",
  },
  {
    city: "Louisville",
    state_code: "KY",
    name: "St. Matthews",
    description:
      "Mall St. Matthews plus neighborhood parks. Easy if you have kids and a stroller and want options in one stop.",
    latitude: 38.25,
    longitude: -85.63,
    radius_miles: 2.0,
    vibe: "East-end errands + play",
  },
];

export type SeedAttraction = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  is_free: boolean;
  price_info?: string;
  age_min: number;
  age_max: number;
  website_url: string;
  featured?: boolean;
};

export const LOUISVILLE_ATTRACTIONS: SeedAttraction[] = [
  {
    title: "Louisville Zoo",
    description:
      "More than 1,700 animals, a splash park, and seasonal nights like Boo at the Zoo and Wild Lights. The one place that works for a toddler and a teenager on the same ticket.",
    latitude: 38.2057,
    longitude: -85.7624,
    address: "1100 Trevilian Way, Louisville, KY 40213",
    category: "attraction",
    is_free: false,
    price_info: "Tickets from about $15",
    age_min: 0,
    age_max: 18,
    website_url: "https://louisvillezoo.org",
    featured: true,
  },
  {
    title: "Kentucky Kingdom & Hurricane Bay",
    description:
      "Coasters, kiddie rides, and a full water park on the fairgrounds. Go on a weekday if you can — weekends stack up in summer.",
    latitude: 38.1983,
    longitude: -85.7425,
    address: "937 Phillips Ln, Louisville, KY 40209",
    category: "attraction",
    is_free: false,
    price_info: "Day tickets from about $40",
    age_min: 3,
    age_max: 18,
    website_url: "https://www.kentuckykingdom.com",
  },
  {
    title: "Louisville Slugger Museum & Factory",
    description:
      "The giant bat on Main Street is the selfie. Inside: the factory tour, the museum, and a mini-bat with your name on it.",
    latitude: 38.2588,
    longitude: -85.7632,
    address: "800 W Main St, Louisville, KY 40202",
    category: "attraction",
    is_free: false,
    price_info: "About $18 adults, $11 kids",
    age_min: 3,
    age_max: 18,
    website_url: "https://www.sluggermuseum.com",
    featured: true,
  },
  {
    title: "Muhammad Ali Center",
    description:
      "A museum that is really a civics lesson with boxing gloves. Interactive, generous with kids, and right on Museum Row.",
    latitude: 38.2574,
    longitude: -85.7588,
    address: "144 N 6th St, Louisville, KY 40202",
    category: "education",
    is_free: false,
    price_info: "About $14 adults, $9 kids",
    age_min: 6,
    age_max: 18,
    website_url: "https://alicenter.org",
    featured: true,
  },
  {
    title: "Kentucky Science Center",
    description:
      "Three floors of hands-on exhibits on Main Street. Rain-day insurance, and the digital theater is worth the add-on.",
    latitude: 38.2565,
    longitude: -85.7595,
    address: "727 W Main St, Louisville, KY 40202",
    category: "education",
    is_free: false,
    price_info: "About $15 adults, $13 kids",
    age_min: 2,
    age_max: 18,
    website_url: "https://kysciencecenter.org",
  },
  {
    title: "Louisville Mega Cavern",
    description:
      "An underground former limestone mine: tram tours, a ropes course, and Lights Under Louisville in winter.",
    latitude: 38.2021,
    longitude: -85.7235,
    address: "1841 Taylor Ave, Louisville, KY 40213",
    category: "attraction",
    is_free: false,
    price_info: "$25–45 per activity",
    age_min: 3,
    age_max: 18,
    website_url: "https://louisvillemegacavern.com",
  },
  {
    title: "Speed Art Museum",
    description:
      "Kentucky's oldest and largest art museum, next to UofL. Family Sundays and a sculpture park that is free to wander.",
    latitude: 38.2178,
    longitude: -85.7607,
    address: "2035 S 3rd St, Louisville, KY 40208",
    category: "arts",
    is_free: false,
    price_info: "Tickets; sculpture park free",
    age_min: 0,
    age_max: 18,
    website_url: "https://www.speedmuseum.org",
  },
  {
    title: "Waterfront Park & Big Four Bridge",
    description:
      "The city's front porch. Playgrounds, the Lincoln memorial, and a pedestrian bridge into Jeffersonville with the best sunset in town. Always free.",
    latitude: 38.26,
    longitude: -85.737,
    address: "129 E River Rd, Louisville, KY 40202",
    category: "outdoor",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://louisvillewaterfront.com",
    featured: true,
  },
  {
    title: "Cherokee Park",
    description:
      "Olmsted's masterpiece. A 2.4-mile scenic loop, the willow pond, basketball, and enough shade to survive August.",
    latitude: 38.2385,
    longitude: -85.6975,
    address: "745 Cherokee Rd, Louisville, KY 40204",
    category: "outdoor",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://louisvilleky.gov/government/parks/park-list/cherokee-park",
  },
  {
    title: "Kentucky Derby Museum",
    description:
      "The race explained without needing to know a furlong from a furlough. Track tours when Churchill is quiet; race days when it isn't.",
    latitude: 38.2028,
    longitude: -85.7704,
    address: "704 Central Ave, Louisville, KY 40208",
    category: "sports",
    is_free: false,
    price_info: "Museum tickets from about $18",
    age_min: 5,
    age_max: 18,
    website_url: "https://derbymuseum.org",
    featured: true,
  },
  {
    title: "Frazier History Museum",
    description:
      "Home of the official Kentucky Bourbon Trail welcome experience — and a serious history museum that works for school-age kids.",
    latitude: 38.2578,
    longitude: -85.7643,
    address: "829 W Main St, Louisville, KY 40202",
    category: "education",
    is_free: false,
    price_info: "About $12 adults",
    age_min: 6,
    age_max: 18,
    website_url: "https://fraziermuseum.org",
  },
  {
    title: "Falls of the Ohio State Park",
    description:
      "Devonian fossil beds on the Indiana bank, ten minutes from downtown. Interpretive center plus the actual 400-million-year-old reef at low water.",
    latitude: 38.2765,
    longitude: -85.763,
    address: "201 W Riverside Dr, Clarksville, IN 47129",
    category: "outdoor",
    is_free: false,
    price_info: "Interpretive center modest fee; falls free",
    age_min: 0,
    age_max: 18,
    website_url: "https://www.fallsoftheohio.org",
  },
  {
    title: "Kentucky International Convention Center",
    description:
      "Downtown's big hall on Fourth Street — hundreds of thousands of square feet of exhibit space hosting the auto show, the boat show, comic cons, and cheer nationals. If something huge is in town, it is usually here, so check the calendar before planning downtown parking.",
    latitude: 38.2536,
    longitude: -85.7577,
    address: "221 S 4th St, Louisville, KY 40202",
    category: "attraction",
    is_free: false,
    price_info: "Free to walk the halls; event tickets vary",
    age_min: 0,
    age_max: 18,
    website_url: "https://www.kyconvention.org",
  },
  {
    title: "Kentucky Exposition Center",
    description:
      "The state fairgrounds south of the airport: over a million square feet of halls plus the stadium and the Kentucky State Fair every August. Concerts, livestock shows, indoor holiday markets, and the big trade shows all land here. Parking is on site and easy.",
    latitude: 38.1989,
    longitude: -85.7475,
    address: "937 Phillips Ln, Louisville, KY 40209",
    category: "attraction",
    is_free: false,
    price_info: "Depends on the show; parking fee",
    age_min: 0,
    age_max: 18,
    website_url: "https://kyexpo.org",
  },
  {
    title: "The Louisville Palace",
    description:
      "A 1928 movie palace on Fourth Street, restored to within an inch of its life — Spanish Baroque ceiling, twinkling night-sky lights, and about 2,700 seats. Now a concert and touring-show room, and easily the most beautiful place in the city to see anything.",
    latitude: 38.2508,
    longitude: -85.7585,
    address: "625 S 4th St, Louisville, KY 40202",
    category: "arts",
    is_free: false,
    price_info: "Show tickets vary",
    age_min: 0,
    age_max: 18,
    website_url: "https://www.louisvillepalace.com",
    featured: true,
  },
  {
    title: "KMAC Museum",
    description:
      "Kentucky Museum of Art and Craft on West Main. Contemporary art plus hands-on craft workshops, a free ground-floor gallery, and a shop full of locally made things. Small enough to finish with a kid in about an hour.",
    latitude: 38.2569,
    longitude: -85.7634,
    address: "715 W Main St, Louisville, KY 40202",
    category: "arts",
    is_free: false,
    price_info: "About $10 adults, $5 kids",
    age_min: 0,
    age_max: 18,
    website_url: "https://kmacmuseum.org",
  },
  {
    title: "21c Museum Hotel",
    description:
      "A hotel with a free contemporary art museum in the lobby. Walk in, look at the rotating exhibits, and let the kids hunt for the red penguins. Open to the public daily, no ticket and no lobby awkwardness required.",
    latitude: 38.2572,
    longitude: -85.7637,
    address: "700 W Main St, Louisville, KY 40202",
    category: "arts",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://www.21cmuseumhotels.com/louisville",
  },
  {
    title: "Portland Museum",
    description:
      "A small neighborhood museum west of downtown telling the story of the Portland and Shippingport communities and their river roots. Free, quiet, and a good pairing with a walk down to the riverfront.",
    latitude: 38.2699,
    longitude: -85.7765,
    address: "2308 Portland Ave, Louisville, KY 40212",
    category: "arts",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://www.portlandmuseum.org",
  },
  {
    title: "Kentucky Performing Arts",
    description:
      "The main stage for touring Broadway, the Louisville Orchestra, and the ballet — three theaters under one roof on West Main. The family series matinees are the cheapest way in, and the lobby is worth the walk-through on its own.",
    latitude: 38.2577,
    longitude: -85.7612,
    address: "501 W Main St, Louisville, KY 40202",
    category: "arts",
    is_free: false,
    price_info: "Show tickets vary",
    age_min: 3,
    age_max: 18,
    website_url: "https://kentuckyperformingarts.org",
  },
  {
    title: "Churchill Downs",
    description:
      "The Twin Spires. Live racing meets in spring and fall, the Kentucky Derby Museum runs year round next door, and morning workouts are free to watch from the track apron. Kids are welcome at the races, and the paddock is the best part.",
    latitude: 38.2028,
    longitude: -85.7704,
    address: "700 Central Ave, Louisville, KY 40208",
    category: "sports",
    is_free: false,
    price_info: "General admission from about $5 on race days",
    age_min: 0,
    age_max: 18,
    website_url: "https://www.churchilldowns.com",
    featured: true,
  },
  {
    title: "Iroquois Amphitheater",
    description:
      "An outdoor 2,400-seat amphitheater inside Iroquois Park, built in the 1930s and rebuilt since. Free summer concerts, movie nights, and Shakespeare in the park. Bring a blanket and get there early for a lawn spot.",
    latitude: 38.1676,
    longitude: -85.7817,
    address: "1080 Amphitheater Rd, Louisville, KY 40214",
    category: "music",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://louisvilleky.gov/government/parks/park-list/iroquois-park",
  },
  {
    title: "Historic Locust Grove",
    description:
      "An 1790s Georgian farmhouse on 55 acres — home to the sister of George Rogers Clark, the founder of Louisville. Guided house tours, a kitchen garden, and a genuinely lovely candlelight evening in December.",
    latitude: 38.2888,
    longitude: -85.6378,
    address: "561 Blankenbaker Ln, Louisville, KY 40207",
    category: "education",
    is_free: false,
    price_info: "About $10 adults, $5 kids",
    age_min: 4,
    age_max: 18,
    website_url: "https://locustgrove.org",
  },
  {
    title: "Farmington Historic Plantation",
    description:
      "An 1816 brick plantation house sitting in the middle of the Highlands, built from a plan by Thomas Jefferson. Tour the house and grounds, then walk five minutes to Bardstown Road for lunch. A close-in history stop.",
    latitude: 38.2113,
    longitude: -85.7018,
    address: "3033 Bardstown Rd, Louisville, KY 40205",
    category: "education",
    is_free: false,
    price_info: "About $10 adults, $5 kids",
    age_min: 5,
    age_max: 18,
    website_url: "https://www.historicfarmington.org",
  },
  {
    title: "Riverside, the Farnsley-Moremen Landing",
    description:
      "A restored 1837 Ohio River farmhouse with a working garden and its own boat landing, twenty minutes southwest of downtown. Riverside walking, living-history days, and a very good picnic lawn.",
    latitude: 38.1015,
    longitude: -85.848,
    address: "7410 Moorman Rd, Louisville, KY 40272",
    category: "education",
    is_free: false,
    price_info: "Grounds free; house tours modest fee",
    age_min: 0,
    age_max: 18,
    website_url: "https://riverside-landing.org",
  },
  {
    title: "The Parklands of Floyds Fork",
    description:
      "Nearly 4,000 acres along Floyds Fork with more than 60 miles of trails, playgrounds, a sprayground, and canoe launches. The east end's answer to a full day out, and free to wander. Beckley Creek is the easiest entrance.",
    latitude: 38.1174,
    longitude: -85.5078,
    address: "1411 Beckley Creek Pkwy, Louisville, KY 40245",
    category: "outdoor",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://theparklands.org",
  },
  {
    title: "Jefferson Memorial Forest",
    description:
      "The largest municipal urban forest in the country — about 6,500 acres south of the city with hiking trails, a nature center, and a raptor program. Free, shady, and the fall color here is the best in the county.",
    latitude: 38.0885,
    longitude: -85.7755,
    address: "11311 Mitchell Hill Rd, Fairdale, KY 40118",
    category: "outdoor",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://louisvilleky.gov/government/parks/park-list/jefferson-memorial-forest",
  },
  {
    title: "Fourth Street Live!",
    description:
      "A covered downtown entertainment block between Liberty and Muhammad Ali. Free outdoor concerts and family events in the plaza, restaurants on every side, and the Galleria next door if the weather turns.",
    latitude: 38.2534,
    longitude: -85.7573,
    address: "411 S 4th St, Louisville, KY 40202",
    category: "community",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://www.4thstlive.com",
  },
  {
    title: "The Filson Historical Society",
    description:
      "A research library and museum of Ohio Valley history in a 1905 mansion on Third Street. Rotating exhibits, lectures, and a garden that most people walk straight past. Quiet, free to browse, and a nice rainy-hour stop.",
    latitude: 38.2339,
    longitude: -85.759,
    address: "1310 S 3rd St, Louisville, KY 40208",
    category: "education",
    is_free: true,
    age_min: 6,
    age_max: 18,
    website_url: "https://filsonhistorical.org",
  },
  {
    title: "Louisville Free Public Library — Main",
    description:
      "The downtown flagship of the LFPL system, with a big children's department, storytimes, and author events. Free programs most weekdays, air conditioning in August, and a solid base for a rainy afternoon.",
    latitude: 38.2478,
    longitude: -85.7573,
    address: "301 York St, Louisville, KY 40203",
    category: "education",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://www.lfpl.org",
  },
  {
    title: "Bernheim Arboretum and Research Forest",
    description:
      "Fourteen thousand acres of forest and arboretum in Clermont, about 25 miles south of town and worth the drive. Free to enter, with 40-plus miles of trails, the giant Forest Giants sculptures, and a canopy walk through the treetops.",
    latitude: 37.9163,
    longitude: -85.6479,
    address: "2499 Clermont Rd, Clermont, KY 40110",
    category: "outdoor",
    is_free: true,
    age_min: 0,
    age_max: 18,
    website_url: "https://bernheim.org",
  },
];