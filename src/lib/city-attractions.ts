import type { SeedAttraction } from "./cities-data";

type Extra = Partial<Pick<SeedAttraction, "category" | "is_free" | "price_info" | "featured">>;

function place(
  title: string,
  description: string,
  latitude: number,
  longitude: number,
  address: string,
  website_url: string,
  extra: Extra = {},
): SeedAttraction {
  const is_free = extra.is_free ?? false;
  return {
    title,
    description,
    latitude,
    longitude,
    address,
    website_url,
    category: extra.category ?? "attraction",
    is_free,
    price_info: extra.price_info ?? (is_free ? undefined : "Admission charged — check the site"),
    age_min: 0,
    age_max: 18,
    featured: extra.featured,
  };
}

const FREE: Extra = { is_free: true, category: "outdoor" };
const HALL: Extra = { category: "community", price_info: "Varies by event" };
const ZOO: Extra = { featured: true };

/** Permanent places per city (zoo, convention center, family staples), keyed "Name|ST". */
export const CITY_ATTRACTIONS: Record<string, SeedAttraction[]> = {
  "Knoxville|TN": [
    place("Zoo Knoxville", "Red pandas, a big reptile house, and a splash pad in summer.", 35.9996, -83.887, "3500 Knoxville Zoo Dr, Knoxville, TN 37914", "https://www.zooknoxville.org", ZOO),
    place("Knoxville Convention Center", "Downtown hall beside World's Fair Park that hosts expos, fan conventions, and family shows.", 35.9608, -83.925, "701 Henley St, Knoxville, TN 37902", "https://www.kcc.com", HALL),
    place("World's Fair Park & Sunsphere", "Fountains to run through, a big lawn, and the Sunsphere observation deck.", 35.9617, -83.9236, "963 Worlds Fair Park Dr, Knoxville, TN 37916", "https://worldsfairpark.org", FREE),
    place("Muse Knoxville", "Hands-on children's science museum and planetarium next to the zoo.", 35.9989, -83.8853, "516 N Beaman St, Knoxville, TN 37914", "https://themuseknoxville.org", { category: "education" }),
    place("Ijams Nature Center", "Trails, a quarry lake, and a treetop adventure course minutes from downtown.", 35.956, -83.867, "2915 Island Home Ave, Knoxville, TN 37920", "https://www.ijams.org", FREE),
  ],
  "Nashville|TN": [
    place("Nashville Zoo at Grassmere", "Kangaroo walkabout, a huge jungle-gym playground, and seasonal Zoolumination nights.", 36.0893, -86.7422, "3777 Nolensville Pike, Nashville, TN 37211", "https://www.nashvillezoo.org", ZOO),
    place("Music City Center", "Nashville's downtown convention center, home to major expos and fan events.", 36.1573, -86.777, "201 Rep. John Lewis Way S, Nashville, TN 37203", "https://www.nashvillemcc.com", HALL),
    place("Adventure Science Center", "Climbing tower, planetarium, and floors of hands-on science.", 36.1466, -86.7755, "800 Fort Negley Blvd, Nashville, TN 37203", "https://www.adventuresci.org", { category: "education" }),
    place("Centennial Park & The Parthenon", "A full-size Parthenon, a lake loop, and free concerts on the lawn.", 36.1497, -86.8133, "2500 West End Ave, Nashville, TN 37203", "https://www.nashvilleparthenon.com", FREE),
    place("Cheekwood Estate & Gardens", "Botanical gardens with a model-train exhibit and seasonal festivals.", 36.0868, -86.8733, "1200 Forrest Park Dr, Nashville, TN 37205", "https://cheekwood.org", { category: "outdoor" }),
    place("Country Music Hall of Fame and Museum", "Stage costumes, gold records, and a hands-on gallery for kids.", 36.1583, -86.7762, "222 Rep. John Lewis Way S, Nashville, TN 37203", "https://www.countrymusichalloffame.org", { category: "arts" }),
  ],
  "Dallas|TX": [
    place("Dallas Zoo", "Giants of the Savanna, giraffe feeding, and a children's zoo with a stream to wade in.", 32.741, -96.8153, "650 S R.L. Thornton Fwy, Dallas, TX 75203", "https://www.dallaszoo.com", ZOO),
    place("Kay Bailey Hutchison Convention Center Dallas", "Downtown convention center for auto shows, comic cons, and big family expos.", 32.7743, -96.8003, "650 S Griffin St, Dallas, TX 75202", "https://www.dallasconventioncenter.com", HALL),
    place("Perot Museum of Nature and Science", "Dinosaurs, an earthquake simulator, and a children's museum floor.", 32.7869, -96.8066, "2201 N Field St, Dallas, TX 75201", "https://www.perotmuseum.org", { category: "education" }),
    place("Klyde Warren Park", "A park built over the freeway with a children's park, food trucks, and free programs.", 32.7894, -96.8016, "2012 Woodall Rodgers Fwy, Dallas, TX 75201", "https://www.klydewarrenpark.org", FREE),
    place("Dallas World Aquarium", "A walk-through rainforest with sloths, sharks, and penguins downtown.", 32.7835, -96.8054, "1801 N Griffin St, Dallas, TX 75202", "https://www.dwazoo.com"),
    place("Dallas Arboretum and Botanical Garden", "Lakeside gardens with a huge children's adventure garden.", 32.8236, -96.7166, "8525 Garland Rd, Dallas, TX 75218", "https://www.dallasarboretum.org", { category: "outdoor" }),
  ],
  "Houston|TX": [
    place("Houston Zoo", "Sea lions, elephants, and a Galápagos exhibit inside Hermann Park.", 29.7146, -95.3909, "6200 Hermann Park Dr, Houston, TX 77030", "https://www.houstonzoo.org", ZOO),
    place("George R. Brown Convention Center", "Downtown convention center facing Discovery Green, with expos and fan conventions year-round.", 29.752, -95.3577, "1001 Avenida De Las Americas, Houston, TX 77010", "https://www.grbhouston.com", HALL),
    place("Space Center Houston", "NASA's visitor center: rockets, mission control tram tours, and astronaut exhibits.", 29.5519, -95.0981, "1601 E NASA Pkwy, Houston, TX 77058", "https://spacecenter.org", { category: "education", featured: true }),
    place("Children's Museum Houston", "A kid-run city, water play, and maker labs in the Museum District.", 29.7227, -95.3853, "1500 Binz St, Houston, TX 77004", "https://www.cmhouston.org", { category: "education" }),
    place("Houston Museum of Natural Science", "Dinosaur hall, butterfly center, and planetarium.", 29.7221, -95.3896, "5555 Hermann Park Dr, Houston, TX 77030", "https://www.hmns.org", { category: "education" }),
    place("Discovery Green", "Downtown park with a playground, splash pad, and free concerts and movies.", 29.7534, -95.3594, "1500 McKinney St, Houston, TX 77010", "https://www.discoverygreen.com", FREE),
  ],
  "Miami|FL": [
    place("Zoo Miami", "Florida's largest zoo, with open-air habitats you can circle by rental cycle or monorail.", 25.6113, -80.3984, "12400 SW 152nd St, Miami, FL 33177", "https://www.zoomiami.org", ZOO),
    place("Miami Beach Convention Center", "The area's main convention center, host to boat shows, Art Basel, and family expos.", 25.795, -80.1335, "1901 Convention Center Dr, Miami Beach, FL 33139", "https://www.miamibeachconvention.com", HALL),
    place("Phillip and Patricia Frost Museum of Science", "A three-level aquarium, planetarium, and hands-on science downtown.", 25.7853, -80.188, "1101 Biscayne Blvd, Miami, FL 33132", "https://www.frostscience.org", { category: "education" }),
    place("Miami Children's Museum", "Pretend-play galleries, a mini cruise ship, and music rooms on Watson Island.", 25.785, -80.1767, "980 MacArthur Cswy, Miami, FL 33132", "https://www.miamichildrensmuseum.org", { category: "education" }),
    place("Bayfront Park", "Waterfront park with a playground, fountain, and free community events.", 25.7753, -80.1863, "301 Biscayne Blvd, Miami, FL 33132", "https://www.bayfrontparkmiami.com", FREE),
    place("Jungle Island", "Parrots, lemurs, and adventure courses on Watson Island.", 25.7858, -80.1745, "1111 Parrot Jungle Trail, Miami, FL 33132", "https://www.jungleisland.com"),
  ],
  "Daytona Beach|FL": [
    place("Ocean Center", "Daytona Beach's oceanfront convention center, with expos, sports tournaments, and shows.", 29.2308, -81.0097, "101 N Atlantic Ave, Daytona Beach, FL 32118", "https://www.oceancenter.com", HALL),
    place("Marine Science Center", "Sea turtle hospital, bird rehab, and a stingray touch pool — the area's stand-in for a zoo.", 29.0806, -80.9284, "100 Lighthouse Dr, Ponce Inlet, FL 32127", "https://www.marinesciencecenter.com", ZOO),
    place("Museum of Arts & Sciences", "Children's museum, planetarium, and a giant ground sloth skeleton.", 29.1996, -81.0432, "352 S Nova Rd, Daytona Beach, FL 32114", "https://www.moas.org", { category: "education" }),
    place("Daytona International Speedway", "Track tours and the Motorsports Hall of Fame of America.", 29.1852, -81.0705, "1801 W International Speedway Blvd, Daytona Beach, FL 32114", "https://www.daytonainternationalspeedway.com", { category: "sports" }),
    place("Daytona Beach Boardwalk & Pier", "Arcades, rides, and the beach itself, with summer fireworks.", 29.2278, -81.006, "12 N Ocean Ave, Daytona Beach, FL 32118", "https://www.daytonabeach.com", FREE),
    place("Ponce de Leon Inlet Lighthouse", "Climb 203 steps up Florida's tallest lighthouse.", 29.0806, -80.9281, "4931 S Peninsula Dr, Ponce Inlet, FL 32127", "https://www.ponceinlet.org"),
  ],
  "Jacksonville|FL": [
    place("Jacksonville Zoo and Gardens", "Jaguars, manatee care center, a splash ground, and botanical gardens.", 30.4039, -81.6434, "370 Zoo Pkwy, Jacksonville, FL 32218", "https://www.jacksonvillezoo.org", ZOO),
    place("Prime F. Osborn III Convention Center", "Jacksonville's convention center in the historic Union Terminal, home to expos and family shows.", 30.3275, -81.6712, "1000 Water St, Jacksonville, FL 32204", "https://www.jaxevents.com", HALL),
    place("Museum of Science & History (MOSH)", "Hands-on science, local history, and a planetarium on the Southbank.", 30.3197, -81.6594, "1025 Museum Cir, Jacksonville, FL 32207", "https://themosh.org", { category: "education" }),
    place("Cummer Museum of Art & Gardens", "Riverfront gardens and an interactive art space for kids.", 30.3152, -81.6767, "829 Riverside Ave, Jacksonville, FL 32204", "https://www.cummermuseum.org", { category: "arts" }),
    place("Riverside Arts Market", "Saturday market under the Fuller Warren Bridge with food, makers, and live music.", 30.317, -81.6745, "715 Riverside Ave, Jacksonville, FL 32204", "https://riversideartsmarket.org", { is_free: true, category: "community" }),
  ],
  "Indianapolis|IN": [
    place("Indianapolis Zoo", "Dolphin presentations, an orangutan center, and Christmas at the Zoo.", 39.7672, -86.1808, "1200 W Washington St, Indianapolis, IN 46222", "https://www.indianapoliszoo.com", ZOO),
    place("Indiana Convention Center", "Downtown convention center linked to Lucas Oil Stadium — Gen Con, auto shows, and big expos.", 39.764, -86.164, "100 S Capitol Ave, Indianapolis, IN 46225", "https://www.icclos.com", HALL),
    place("The Children's Museum of Indianapolis", "The world's largest children's museum, with dinosaurs and an outdoor sports park.", 39.8108, -86.1578, "3000 N Meridian St, Indianapolis, IN 46208", "https://www.childrensmuseum.org", { category: "education", featured: true }),
    place("White River State Park", "Canal walk, pedal boats, green space, and museums in one downtown park.", 39.7667, -86.17, "801 W Washington St, Indianapolis, IN 46204", "https://www.whiteriverstatepark.org", FREE),
    place("Indianapolis Motor Speedway Museum", "Winning Indy 500 cars and track tours at the Brickyard.", 39.7903, -86.2336, "4750 W 16th St, Indianapolis, IN 46222", "https://imsmuseum.org", { category: "sports" }),
    place("Newfields", "Art museum, gardens, and a 100-acre nature park; Winterlights in season.", 39.8259, -86.1855, "4000 Michigan Rd, Indianapolis, IN 46208", "https://discovernewfields.org", { category: "arts" }),
  ],
  "Las Vegas|NV": [
    place("Las Vegas Convention Center", "One of the largest convention centers in the country, home to CES and major public expos.", 36.1316, -115.1515, "3150 Paradise Rd, Las Vegas, NV 89109", "https://www.lvcva.com", HALL),
    place("Shark Reef Aquarium at Mandalay Bay", "Sharks, rays, and a walk-through tunnel — the Strip's stand-in for a zoo.", 36.0909, -115.1765, "3950 S Las Vegas Blvd, Las Vegas, NV 89119", "https://mandalaybay.mgmresorts.com", ZOO),
    place("Springs Preserve", "Desert gardens, trails, a playground, and two museums on 180 acres.", 36.1707, -115.1903, "333 S Valley View Blvd, Las Vegas, NV 89107", "https://springspreserve.org", { category: "outdoor" }),
    place("Discovery Children's Museum", "Three floors of hands-on play and a 70-foot climbing tower.", 36.167, -115.1543, "360 Promenade Pl, Las Vegas, NV 89106", "https://www.discoverykidslv.org", { category: "education" }),
    place("Fountains of Bellagio", "The free water-and-music show on the Strip, running afternoons and evenings.", 36.1126, -115.1767, "3600 S Las Vegas Blvd, Las Vegas, NV 89109", "https://bellagio.mgmresorts.com", FREE),
  ],
  "San Francisco|CA": [
    place("San Francisco Zoo & Gardens", "Lemur forest, grizzly gulch, a steam train, and a big playground by the ocean.", 37.733, -122.503, "Sloat Blvd & Upper Great Hwy, San Francisco, CA 94132", "https://www.sfzoo.org", ZOO),
    place("Moscone Center", "San Francisco's convention center in SoMa, next to Yerba Buena Gardens.", 37.7842, -122.4016, "747 Howard St, San Francisco, CA 94103", "https://www.moscone.com", HALL),
    place("California Academy of Sciences", "Aquarium, rainforest dome, and planetarium under one living roof.", 37.7699, -122.4661, "55 Music Concourse Dr, San Francisco, CA 94118", "https://www.calacademy.org", { category: "education", featured: true }),
    place("Exploratorium", "Hundreds of hands-on science exhibits on the waterfront.", 37.8017, -122.3973, "Pier 15, The Embarcadero, San Francisco, CA 94111", "https://www.exploratorium.edu", { category: "education" }),
    place("Golden Gate Park", "Playgrounds, a carousel, bison, gardens, and car-free JFK Promenade.", 37.7694, -122.4862, "Golden Gate Park, San Francisco, CA 94122", "https://sfrecpark.org", FREE),
    place("Aquarium of the Bay", "Walk-through tunnels of local bay sharks and rays at Pier 39.", 37.8087, -122.4098, "Pier 39, The Embarcadero, San Francisco, CA 94133", "https://www.aquariumofthebay.org"),
  ],
  "San Diego|CA": [
    place("San Diego Zoo", "One of the world's great zoos, with a guided bus tour and aerial tram in Balboa Park.", 32.7353, -117.149, "2920 Zoo Dr, San Diego, CA 92101", "https://zoo.sandiegozoo.org", ZOO),
    place("San Diego Convention Center", "Bayfront convention center, home of Comic-Con and large public expos.", 32.7064, -117.1625, "111 Harbor Dr, San Diego, CA 92101", "https://www.visitsandiego.com", HALL),
    place("Balboa Park", "Gardens, playgrounds, a carousel, and more than a dozen museums.", 32.7313, -117.1465, "1549 El Prado, San Diego, CA 92101", "https://balboapark.org", FREE),
    place("Fleet Science Center", "Hands-on science galleries and a giant dome theater in Balboa Park.", 32.7308, -117.147, "1875 El Prado, San Diego, CA 92101", "https://www.fleetscience.org", { category: "education" }),
    place("Birch Aquarium at Scripps", "Seahorses, a kelp forest tank, and tide pools overlooking La Jolla.", 32.8659, -117.2504, "2300 Expedition Way, La Jolla, CA 92037", "https://aquarium.ucsd.edu"),
    place("USS Midway Museum", "Climb through an aircraft carrier and sit in the cockpits on the flight deck.", 32.7137, -117.1751, "910 N Harbor Dr, San Diego, CA 92101", "https://www.midway.org", { category: "education" }),
  ],
  "Lexington|KY": [
    place("Kentucky Horse Park", "Horse shows, barn visits, and museums — the area's stand-in for a zoo.", 38.1486, -84.5197, "4089 Iron Works Pkwy, Lexington, KY 40511", "https://kyhorsepark.com", ZOO),
    place("Central Bank Center", "Lexington's convention center and Rupp Arena, with expos, concerts, and family shows.", 38.0494, -84.503, "430 W Vine St, Lexington, KY 40507", "https://www.centralbankcenter.com", HALL),
    place("Explorium of Lexington", "Hands-on children's museum downtown.", 38.05, -84.4985, "440 W Short St, Lexington, KY 40507", "https://explorium.com", { category: "education" }),
    place("The Arboretum, State Botanical Garden of Kentucky", "Free gardens, a paved loop, and a children's garden.", 38.0146, -84.5046, "500 Alumni Dr, Lexington, KY 40503", "https://arboretum.ca.uky.edu", FREE),
    place("Keeneland", "Morning workouts are free to watch; race meets run in April and October.", 38.0463, -84.6086, "4201 Versailles Rd, Lexington, KY 40510", "https://www.keeneland.com", { category: "sports", price_info: "Free grounds; race days ticketed" }),
  ],
};