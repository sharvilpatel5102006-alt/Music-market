const HISTORY_POINTS = 42;
const TICK_MS = 2400;
const VOLATILITY = 0.007;
const BUY_IMPACT = 0.012;
const SELL_IMPACT = -0.012;
const LISTENER_REFRESH_MS = 60000;
const TARGET_ARTIST_COUNT = 500;
const STARTING_CASH = 25000;
const KWORB_SOURCE_URLS = [
  "https://r.jina.ai/http://kworb.net/spotify/listeners.html",
  "https://r.jina.ai/http://kworb.net/spotify/listeners.html?show=all",
  "https://kworb.net/spotify/listeners.html"
];
const WIKIDATA_SPOTIFY_ARTISTS_API =
  "https://query.wikidata.org/sparql?format=json&query=" +
  encodeURIComponent(
    "SELECT ?artistLabel WHERE { " +
      "?artist wdt:P2205 ?spotifyId. " +
      "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
    "} LIMIT 2500"
  );

const TOP_ARTISTS = [
  "Bruno Mars",
  "Bad Bunny",
  "The Weeknd",
  "Rihanna",
  "Taylor Swift",
  "Justin Bieber",
  "Lady Gaga",
  "Coldplay",
  "Billie Eilish",
  "Drake",
  "Ariana Grande",
  "J Balvin",
  "Ed Sheeran",
  "David Guetta",
  "Shakira",
  "Kendrick Lamar",
  "Maroon 5",
  "Eminem",
  "SZA",
  "Calvin Harris",
  "Kanye West",
  "Sabrina Carpenter",
  "Pitbull",
  "Lana Del Rey",
  "Dua Lipa",
  "Daddy Yankee",
  "Sia",
  "Post Malone",
  "Harry Styles",
  "Katy Perry",
  "Zara Larsson",
  "Michael Jackson",
  "Olivia Dean",
  "Rauw Alejandro",
  "sombr",
  "Travis Scott",
  "Chris Brown",
  "Doja Cat",
  "Adele",
  "Black Eyed Peas",
  "Sean Paul",
  "Djo",
  "Arijit Singh",
  "Future",
  "Arctic Monkeys",
  "RAYE",
  "Beyoncé",
  "Imagine Dragons",
  "Ozuna",
  "Linkin Park",
  "Shreya Ghoshal",
  "KAROL G",
  "Miley Cyrus",
  "Halsey",
  "Sam Smith",
  "Alex Warren",
  "Queen",
  "Fleetwood Mac",
  "Tate McRae",
  "Khalid",
  "DJ Snake",
  "The Chainsmokers",
  "Marshmello",
  "Pritam",
  "Ellie Goulding",
  "Lil Wayne",
  "A.R. Rahman",
  "Olivia Rodrigo",
  "Justin Timberlake",
  "Farruko",
  "Don Toliver",
  "Charlie Puth",
  "Elton John",
  "Maluma",
  "Don Omar",
  "The Neighbourhood",
  "50 Cent",
  "OneRepublic",
  "A$AP Rocky",
  "Shawn Mendes",
  "USHER",
  "Red Hot Chili Peppers",
  "Britney Spears",
  "Ne-Yo",
  "Fuerza Regida",
  "KPop Demon Hunters Cast",
  "Peso Pluma",
  "Radiohead",
  "Nicki Minaj",
  "Playboi Carti",
  "One Direction",
  "Anuel AA",
  "Benson Boone",
  "Tame Impala",
  "JENNIE",
  "Camila Cabello",
  "The Police",
  "Wiz Khalifa",
  "Metro Boomin",
  "Daniel Caesar"
];

const EXTRA_TOP_ARTISTS = [
  "Teddy Swims",
  "Hozier",
  "Madonna",
  "EJAE",
  "J. Cole",
  "Selena Gomez",
  "21 Savage",
  "Romeo Santos",
  "Kesha",
  "JAŸ-Z",
  "REI AMI",
  "Flo Rida",
  "Disney",
  "Gorillaz",
  "Akon",
  "HUNTR/X",
  "AUDREY NUNA",
  "Grupo Frontera",
  "Tyler, The Creator",
  "Myke Towers",
  "Kali Uchis",
  "Anitta",
  "Feid",
  "Tems",
  "Twenty One Pilots",
  "The Marías",
  "ABBA",
  "Frank Ocean",
  "Green Day",
  "Tyla",
  "Nicky Jam",
  "Swae Lee",
  "Beéle",
  "JHAYCO",
  "Avicii",
  "Gracie Abrams",
  "Ty Dolla $ign",
  "Irshad Kamil",
  "Nirvana",
  "Empire Of The Sun",
  "Cardi B",
  "Sachin-Jigar",
  "Alicia Keys",
  "The Goo Goo Dolls",
  "Manuel Turizo",
  "AC/DC",
  "Chappell Roan",
  "Lil Uzi Vert",
  "The Kid LAROI",
  "Ovy On The Drums",
  "P!nk",
  "Udit Narayan",
  "Diplo",
  "Guns N' Roses",
  "Pharrell Williams",
  "XXXTENTACION",
  "Gunna",
  "Tiësto",
  "The Beatles",
  "Bebe Rexha",
  "KATSEYE",
  "Vishal-Shekhar",
  "ROSALÍA",
  "Enrique Iglesias",
  "Demi Lovato",
  "Nelly Furtado",
  "Charli xcx",
  "Tainy",
  "Omar Courtz",
  "Amitabh Bhattacharya",
  "Snoop Dogg",
  "Chencho Corleone",
  "Morgan Wallen",
  "Paramore",
  "Mariah Carey",
  "Cigarettes After Sex",
  "Major Lazer",
  "Metallica",
  "Tanishk Bagchi",
  "Mithoon",
  "Arcángel",
  "Tinashe",
  "Clean Bandit",
  "The Killers",
  "Juice WRLD",
  "Bizarrap",
  "Bon Jovi",
  "Atif Aslam",
  "Shankar Mahadevan",
  "Anne-Marie",
  "Lil Baby",
  "Creedence Clearwater Revival",
  "Billy Joel",
  "ZAYN",
  "Noah Kahan",
  "James Arthur",
  "ROSÉ",
  "Junior H",
  "Mac Miller",
  "Jennifer Lopez",
  "Tom Odell",
  "Christina Aguilera",
  "Young Thug",
  "Childish Gambino",
  "Joji",
  "Mark Ronson",
  "Dei V",
  "Danny Ocean",
  "Sonu Nigam",
  "Neton Vega",
  "Kodak Black",
  "Cris MJ",
  "Gigi Perez",
  "Jason Derulo",
  "KK",
  "PARTYNEXTDOOR",
  "PinkPantheress",
  "Phil Collins",
  "Miguel",
  "Alan Walker",
  "Kehlani",
  "Ryan Castro",
  "Quevedo",
  "Luis Fonsi",
  "Carín León",
  "Dave",
  "Doechii",
  "SIENNA SPIRO",
  "Whitney Houston",
  "Macklemore",
  "Vishal Mishra",
  "GIVĒON",
  "Plan B",
  "Ravyn Lenae",
  "The Cranberries",
  "Wisin & Yandel",
  "Kid Cudi",
  "2Pac",
  "Ava Max",
  "Alka Yagnik",
  "Zion & Lennox",
  "Dominic Fike",
  "The Script",
  "Chinmayi",
  "Becky G",
  "Mohit Chauhan",
  "Florence + The Machine",
  "DaBaby",
  "El Alfa",
  "Ñengo Flow",
  "Oasis",
  "Pink Floyd",
  "Lewis Capaldi",
  "Manoj Muntashir",
  "French Montana",
  "Shankar-Ehsaan-Loy",
  "Blessd",
  "TOTO",
  "Bee Gees",
  "Timbaland",
  "The Rolling Stones",
  "Daft Punk",
  "Tears For Fears",
  "Bob Marley & The Wailers",
  "Lorde",
  "Sunidhi Chauhan",
  "Sean Kingston",
  "Zach Bryan",
  "Lola Young",
  "BTS",
  "Swedish House Mafia",
  "Bryan Adams",
  "Trippie Redd",
  "Tito Double P",
  "Aerosmith",
  "The Notorious B.I.G.",
  "Prince Royce",
  "Backstreet Boys",
  "Burna Boy",
  "Aventura",
  "Vance Joy",
  "Maná",
  "Lily-Rose Depp",
  "El Bogueto",
  "Himesh Reshammiya",
  "Sayeed Quadri",
  "Rema",
  "Kumaar",
  "Kapo",
  "Sade",
  "Outkast",
  "G-Eazy",
  "Luke Combs",
  "Evanescence",
  "Central Cee",
  "Brent Faiyaz",
  "Kygo",
  "System Of A Down",
  "Megan Thee Stallion",
  "Chris Stapleton",
  "Robin Schulz",
  "Nickelback",
  "Dire Straits",
  "Oscar Maydon",
  "Rels B",
  "Steve Lacy",
  "Lord Huron",
  "Fall Out Boy",
  "AFROJACK",
  "She & Him",
  "The Cure",
  "Jess Glynne",
  "Disco Lines",
  "Yandel",
  "TV Girl",
  "Keane",
  "B.o.B",
  "Shashwat Sachdev",
  "Shilpa Rao",
  "Yung Beef",
  "Dr. Dre",
  "Madison Beer",
  "Tory Lanez",
  "Shaggy",
  "Tyga",
  "Natanael Cano",
  "Kings of Leon",
  "Sebastian Yatra",
  "Anderson .Paak",
  "T-Pain",
  "Anirudh Ravichander",
  "MC Meno K",
  "Conan Gray",
  "Avril Lavigne",
  "Jack Harlow",
  "beabadoobee",
  "Nelly",
  "Vishal Dadlani",
  "Laufey",
  "Javed Ali",
  "Elvis Presley",
  "Meghan Trainor",
  "The Smiths",
  "Mitski",
  "Amit Trivedi",
  "Alok",
  "Sachet-Parampara",
  "Panic! At The Disco",
  "Fetty Wap",
  "Daryl Hall & John Oates",
  "d4vd",
  "Amy Winehouse",
  "Eagles",
  "Gwen Stefani",
  "Anu Malik",
  "De La Soul",
  "benny blanco",
  "John Legend",
  "BLACKPINK",
  "Mc Gw",
  "Kunaal Vermaa",
  "Camilo",
  "Prince",
  "Labrinth",
  "Kate Bush",
  "Limp Bizkit",
  "U2",
  "Jubin Nautiyal",
  "Måneskin",
  "Bruce Springsteen",
  "Jelly Roll",
  "Neeti Mohan",
  "Sajid-Wajid",
  "Disclosure",
  "FloyyMenor",
  "F1 The Album",
  "Daya",
  "Sachet Tandon",
  "HUGEL",
  "Diljit Dosanjh",
  "Luis Miguel",
  "Faheem Abdullah",
  "Marvin Gaye",
  "Jowell & Randy",
  "Imogen Heap",
  "Parampara Tandon",
  "Grupo Firme",
  "DJ Khaled",
  "JVKE",
  "Yo Yo Honey Singh",
  "EsDeeKid",
  "a-ha",
  "Sech",
  "MC Ryan SP",
  "Myles Smith",
  "W Sound",
  "Marc Anthony",
  "Rahat Fateh Ali Khan",
  "Martin Garrix",
  "Luis R Conriquez",
  "George Michael",
  "Lost Frequencies",
  "Amaal Mallik",
  "Mac DeMarco",
  "Mora",
  "Christian Nodal",
  "Bryson Tiller",
  "Gabito Ballesteros",
  "Fred again..",
  "R.E.M.",
  "Lata Mangeshkar",
  "Foo Fighters",
  "Glass Animals",
  "BigXthaPlug",
  "Earth, Wind & Fire",
  "The Offspring",
  "Skrillex",
  "Eladio Carrion",
  "Journey",
  "David Bowie",
  "YoungBoy Never Broke Again",
  "Nadhif Basalamah",
  "Bill Withers",
  "Aditya Rikhari",
  "Justin Quiles",
  "Bastille",
  "Julieta Venegas",
  "Keyshia Cole",
  "Coolio",
  "Reik",
  "Kailash Kher",
  "Ella Langley",
  "Roop Kumar Rathod",
  "Dido",
  "S. P. Balasubrahmanyam",
  "Jonas Blue",
  "Kausar Munir",
  "Lil Peep",
  "Chase Atlantic",
  "Lauv",
  "My Chemical Romance",
  "Led Zeppelin",
  "Natasha Bedingfield",
  "Stevie Wonder",
  "Young Miko",
  "Tulsi Kumar",
  "Xavi",
  "Karan Aujla",
  "5 Seconds of Summer",
  "Lenny Tavárez",
  "3 Doors Down",
  "Muse",
  "Summer Walker",
  "Banda MS de Sergio Lizárraga",
  "Big Sean",
  "Bryant Myers",
  "Ray Dalton",
  "Anuv Jain",
  "Stephen Sanchez",
  "Frank Sinatra",
  "Macklemore & Ryan Lewis",
  "Carly Rae Jepsen",
  "Train",
  "Devi Sri Prasad",
  "Alejandro Sanz",
  "Foreigner",
  "Mc Rodrigo do CN",
  "The 1975",
  "Hotel Ugly",
  "Rochak Kohli",
  "Lil Durk",
  "Shaarib Toshi",
  "Julión Álvarez y su Norteño Banda",
  "Céline Dion",
  "AP Dhillon",
  "Jessie J",
  "GIMS",
  "Hariharan",
  "De La Ghetto",
  "Troye Sivan",
  "DJ Japa NK",
  "Jeremih",
  "Annie Lennox",
  "Jason Mraz",
  "Noriel",
  "Lil Tecca",
  "L.V.",
  "Juanes",
  "Kelly Clarkson",
  "Migos",
  "Marco Antonio Solís",
  "blink-182",
  "Yan Block",
  "Shaboozey",
  "JID",
  "Sexyy Red",
  "Zedd",
  "Ricky Martin",
  "Calum Scott",
  "Roddy Ricch"
];

const MUST_INCLUDE_ARTISTS = [
  "Taylor Swift",
  "Drake",
  "The Weeknd",
  "Bad Bunny",
  "SZA",
  "Travis Scott",
  "Kendrick Lamar",
  "Post Malone",
  "Ariana Grande",
  "Olivia Rodrigo",
  "Billie Eilish",
  "Doja Cat",
  "Dua Lipa",
  "Morgan Wallen",
  "Luke Combs",
  "Zach Bryan",
  "Ed Sheeran",
  "Justin Bieber",
  "Rihanna",
  "Beyonce",
  "Bruno Mars",
  "Lady Gaga",
  "Selena Gomez",
  "Miley Cyrus",
  "Eminem",
  "Kanye West",
  "Future",
  "J. Cole",
  "21 Savage",
  "Metro Boomin",
  "Karol G",
  "Shakira",
  "BTS",
  "BLACKPINK",
  "Coldplay",
  "Imagine Dragons"
];

const assets = buildAssetsFromNames(buildFallbackArtists(TARGET_ARTIST_COUNT));

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  loginBtn: document.getElementById("loginBtn"),
  appShell: document.getElementById("appShell"),
  assetSearch: document.getElementById("assetSearch"),
  assetCount: document.getElementById("assetCount"),
  searchMeta: document.getElementById("searchMeta"),
  assetList: document.getElementById("assetList"),
  assetName: document.getElementById("assetName"),
  assetTicker: document.getElementById("assetTicker"),
  assetListeners: document.getElementById("assetListeners"),
  assetPrice: document.getElementById("assetPrice"),
  assetChange: document.getElementById("assetChange"),
  accountName: document.getElementById("accountName"),
  accountCash: document.getElementById("accountCash"),
  accountEquity: document.getElementById("accountEquity"),
  accountPnl: document.getElementById("accountPnl"),
  accountPositions: document.getElementById("accountPositions"),
  buyBtn: document.getElementById("buyBtn"),
  sellBtn: document.getElementById("sellBtn"),
  mobileBuyBtn: document.getElementById("mobileBuyBtn"),
  mobileSellBtn: document.getElementById("mobileSellBtn"),
  prevAssetBtn: document.getElementById("prevAssetBtn"),
  nextAssetBtn: document.getElementById("nextAssetBtn")
};

let selectedIndex = 0;
let chart;
let listenerReqVersion = 0;
let marketStarted = false;
let watchlistTick = 0;
let filteredIndices = assets.map((_, index) => index);
let artistDataSource = "local real shortlist";
const listenerCache = new Map();
const account = {
  name: "Sharvil Patel",
  cash: STARTING_CASH,
  positions: new Map()
};
let assetBySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));

function makeSymbol(name, index) {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  const core = (letters.slice(0, 4) || "ART").padEnd(4, "X");
  return `${core}${String(index + 1).padStart(4, "0")}`;
}

function buildAssetsFromNames(names) {
  return names.map((name, index) => {
    return seedAsset(name, makeSymbol(name, index), basePriceFromIndex(index));
  });
}

function buildFallbackArtists(totalCount) {
  const merged = [...TOP_ARTISTS, ...EXTRA_TOP_ARTISTS];
  return Array.from(new Set(merged)).slice(0, totalCount);
}

function normalizeArtistName(name) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGeneratedStyleName(name) {
  const normalized = name.toLowerCase();
  return (
    normalized.includes(" vol.") ||
    normalized.includes(" remix") ||
    normalized.includes(" sessions") ||
    normalized.includes(" collective") ||
    normalized.includes(" club") ||
    normalized.includes(" era") ||
    normalized.includes(" house") ||
    normalized.includes(" lab")
  );
}

function resetMarketData(artistNames) {
  const names = artistNames.slice(0, TARGET_ARTIST_COUNT);
  const rebuiltAssets = buildAssetsFromNames(names);
  assets.length = 0;
  assets.push(...rebuiltAssets);

  assetBySymbol = new Map(assets.map((asset) => [asset.symbol, asset]));
  selectedIndex = 0;
  watchlistTick = 0;
  filteredIndices = assets.map((_, index) => index);
  listenerReqVersion = 0;
  listenerCache.clear();

  account.cash = STARTING_CASH;
  account.positions.clear();

  if (ui.assetSearch) {
    ui.assetSearch.value = "";
  }
}

function parseTopArtistsFromKworb(text) {
  const lines = text.split("\n");
  const names = [];
  const seen = new Set();
  let index = 0;

  while (index < lines.length) {
    const cleaned = lines[index].trim();
    index += 1;

    if (!cleaned) {
      continue;
    }

    const inlineMatch = cleaned.match(/^(\d{1,4})\s+(.+?)\s+(\d{1,3}(?:,\d{3})+)/);
    if (inlineMatch) {
      const rank = Number(inlineMatch[1]);
      const artistName = normalizeArtistName(inlineMatch[2]);

      if (
        !Number.isNaN(rank) &&
        rank >= 1 &&
        rank <= TARGET_ARTIST_COUNT &&
        artistName &&
        !isGeneratedStyleName(artistName) &&
        !seen.has(artistName.toLowerCase())
      ) {
        seen.add(artistName.toLowerCase());
        names.push(artistName);
      }
      continue;
    }

    if (!/^\d{1,4}$/.test(cleaned)) {
      continue;
    }

    const rank = Number(cleaned);
    if (Number.isNaN(rank) || rank < 1 || rank > TARGET_ARTIST_COUNT) {
      continue;
    }

    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }
    if (index >= lines.length) {
      break;
    }

    const artistName = normalizeArtistName(lines[index]);
    index += 1;

    if (!artistName || isGeneratedStyleName(artistName) || seen.has(artistName.toLowerCase())) {
      continue;
    }

    seen.add(artistName.toLowerCase());
    names.push(artistName);
  }

  return names;
}

function prioritizePopularArtists(names) {
  const seen = new Set();
  const normalizedToOriginal = new Map();

  names.forEach((name) => {
    const normalized = normalizeArtistName(name);
    if (!normalized || isGeneratedStyleName(normalized)) {
      return;
    }
    if (!normalizedToOriginal.has(normalized.toLowerCase())) {
      normalizedToOriginal.set(normalized.toLowerCase(), normalized);
    }
  });

  const prioritized = [];

  MUST_INCLUDE_ARTISTS.forEach((mustName) => {
    const normalizedMust = normalizeArtistName(mustName).toLowerCase();
    const match = normalizedToOriginal.get(normalizedMust);

    if (match && !seen.has(match.toLowerCase())) {
      seen.add(match.toLowerCase());
      prioritized.push(match);
      return;
    }

    const fallbackName = normalizeArtistName(mustName);
    const fallbackKey = fallbackName.toLowerCase();
    if (!seen.has(fallbackKey)) {
      seen.add(fallbackKey);
      prioritized.push(fallbackName);
    }
  });

  names.forEach((name) => {
    const normalized = normalizeArtistName(name);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key) || isGeneratedStyleName(normalized)) {
      return;
    }
    seen.add(key);
    prioritized.push(normalized);
  });

  return prioritized.slice(0, TARGET_ARTIST_COUNT);
}

async function fetchTextWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`source returned ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadTopArtistsFromKworb() {
  for (const sourceUrl of KWORB_SOURCE_URLS) {
    try {
      const sourceText = await fetchTextWithTimeout(sourceUrl, 30000);
      const parsedNames = parseTopArtistsFromKworb(sourceText);

      if (parsedNames.length >= TARGET_ARTIST_COUNT) {
        return parsedNames.slice(0, TARGET_ARTIST_COUNT);
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error("could not load kworb top artists");
}

async function loadRealArtistsFromWikidata() {
  const sourceText = await fetchTextWithTimeout(WIKIDATA_SPOTIFY_ARTISTS_API, 30000);
  const payload = JSON.parse(sourceText);
  const bindings = payload?.results?.bindings || [];
  const seen = new Set();
  const names = [];

  bindings.forEach((item) => {
    const name = normalizeArtistName(item?.artistLabel?.value || "");
    if (!name || isGeneratedStyleName(name) || seen.has(name.toLowerCase())) {
      return;
    }
    seen.add(name.toLowerCase());
    names.push(name);
  });

  return prioritizePopularArtists(names).slice(0, TARGET_ARTIST_COUNT);
}

function basePriceFromIndex(index) {
  const base = 72 + index * 1.95 + (index % 6) * 2.1;
  return Number(base.toFixed(2));
}

function seedAsset(name, symbol, basePrice) {
  const history = [];
  let price = basePrice;

  for (let i = 0; i < HISTORY_POINTS; i += 1) {
    price = movePrice(price, randomStep(VOLATILITY));
    history.push(price);
  }

  return {
    name,
    symbol,
    history,
    price: history[history.length - 1],
    open: history[0]
  };
}

function randomStep(range) {
  return (Math.random() * 2 - 1) * range;
}

function movePrice(price, deltaPct) {
  const moved = price * (1 + deltaPct);
  return Math.max(1, Number(moved.toFixed(2)));
}

function pctFromOpen(asset) {
  const diff = ((asset.price - asset.open) / asset.open) * 100;
  return Number(diff.toFixed(2));
}

function tickAsset(asset) {
  const nextPrice = movePrice(asset.price, randomStep(VOLATILITY));
  asset.price = nextPrice;
  asset.history.push(nextPrice);

  if (asset.history.length > HISTORY_POINTS) {
    asset.history.shift();
  }

  asset.open = asset.history[0];
}

function impactTrade(asset, impactPct) {
  asset.price = movePrice(asset.price, impactPct);
  asset.history.push(asset.price);

  if (asset.history.length > HISTORY_POINTS) {
    asset.history.shift();
  }

  asset.open = asset.history[0];
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function formatChange(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function formatListeners(value) {
  return Number(value).toLocaleString("en-US");
}

function setChangeClass(el, value) {
  el.classList.remove("positive", "negative");
  el.classList.add(value >= 0 ? "positive" : "negative");
}

function syntheticListeners(asset) {
  const base = Math.round(asset.price * 12200);
  const jitter = Math.round((Math.sin(asset.price) + 1) * 26000);
  return Math.max(25000, base + jitter);
}

function showListeners(asset) {
  const item = listenerCache.get(asset.symbol);

  if (!item) {
    ui.assetListeners.textContent = "Active listeners: --";
    return;
  }

  ui.assetListeners.textContent = `Active listeners: ${formatListeners(item.listeners)} (${item.source})`;
}

async function refreshListenersForSelected(force) {
  const asset = assets[selectedIndex];
  const cached = listenerCache.get(asset.symbol);
  const now = Date.now();

  if (!force && cached && now - cached.fetchedAt < LISTENER_REFRESH_MS) {
    showListeners(asset);
    return;
  }

  const reqId = ++listenerReqVersion;
  ui.assetListeners.textContent = "Active listeners: loading...";

  try {
    const response = await fetch(`/api/artist-metrics?artist=${encodeURIComponent(asset.name)}`);

    if (!response.ok) {
      throw new Error(`metric api returned ${response.status}`);
    }

    const payload = await response.json();
    const listeners = Number(payload.listeners);

    if (!Number.isFinite(listeners)) {
      throw new Error("missing listeners value");
    }

    listenerCache.set(asset.symbol, {
      listeners: Math.round(listeners),
      source: payload.source || "provider",
      fetchedAt: now
    });
  } catch (error) {
    listenerCache.set(asset.symbol, {
      listeners: syntheticListeners(asset),
      source: "fallback",
      fetchedAt: now
    });
  }

  if (reqId === listenerReqVersion) {
    showListeners(asset);
  }
}

function getPortfolioValue() {
  let total = 0;
  account.positions.forEach((shares, symbol) => {
    const asset = assetBySymbol.get(symbol);
    if (asset) {
      total += shares * asset.price;
    }
  });
  return total;
}

function getOpenPositionCount() {
  let count = 0;
  account.positions.forEach((shares) => {
    if (shares > 0) {
      count += 1;
    }
  });
  return count;
}

function updateAccountPanel() {
  if (!ui.accountName || !ui.accountCash || !ui.accountEquity || !ui.accountPnl || !ui.accountPositions) {
    return;
  }

  const equity = account.cash + getPortfolioValue();
  const pnl = equity - STARTING_CASH;

  ui.accountName.textContent = account.name;
  ui.accountCash.textContent = formatCurrency(account.cash);
  ui.accountEquity.textContent = formatCurrency(equity);
  ui.accountPnl.textContent = `${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`;
  ui.accountPositions.textContent = String(getOpenPositionCount());
  setChangeClass(ui.accountPnl, pnl);
}

function updateSearchMeta() {
  if (!ui.assetCount || !ui.searchMeta || !ui.assetSearch) {
    return;
  }

  const showing = filteredIndices.length;
  const total = assets.length;
  const searchValue = ui.assetSearch.value.trim();

  ui.assetCount.textContent = `${total} artists`;
  ui.searchMeta.textContent = searchValue
    ? `Showing ${showing} match${showing === 1 ? "" : "es"} for "${searchValue}".`
    : `Tracking ${total} artists (${artistDataSource}).`;
}

function applySearchFilter() {
  if (!ui.assetSearch) {
    return;
  }

  const query = ui.assetSearch.value.trim().toLowerCase();

  if (!query) {
    filteredIndices = assets.map((_, index) => index);
  } else {
    filteredIndices = assets
      .map((asset, index) => ({ asset, index }))
      .filter(({ asset }) => {
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query)
        );
      })
      .map(({ index }) => index);
  }

  if (!filteredIndices.includes(selectedIndex)) {
    selectedIndex = filteredIndices[0] ?? 0;
  }

  updateSearchMeta();
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
  refreshListenersForSelected(true);
}

function selectAsset(index) {
  if (!Number.isInteger(index) || index < 0 || index >= assets.length) {
    return;
  }

  selectedIndex = index;
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
  refreshListenersForSelected(true);
}

function renderWatchlist() {
  ui.assetList.innerHTML = "";

  if (filteredIndices.length === 0) {
    const empty = document.createElement("li");
    empty.className = "asset-item";
    empty.textContent = "No artists found. Try another search.";
    ui.assetList.appendChild(empty);
    return;
  }

  filteredIndices.forEach((index) => {
    const asset = assets[index];
    const li = document.createElement("li");
    li.className = `asset-item${index === selectedIndex ? " active" : ""}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(index === selectedIndex));

    const change = pctFromOpen(asset);

    li.innerHTML = `
      <span class="asset-title">${asset.name}</span>
      <span class="asset-price">${formatPrice(asset.price)}</span>
      <span class="asset-symbol">${asset.symbol}</span>
      <span class="asset-change ${change >= 0 ? "positive" : "negative"}">${formatChange(change)}</span>
    `;

    li.addEventListener("click", () => {
      selectAsset(index);
    });

    ui.assetList.appendChild(li);
  });
}

function renderSelectedAsset() {
  const asset = assets[selectedIndex];

  if (!asset) {
    ui.assetName.textContent = "-";
    ui.assetTicker.textContent = "-";
    ui.assetPrice.textContent = "$0.00";
    ui.assetChange.textContent = "0.00%";
    ui.assetListeners.textContent = "Active listeners: --";
    return;
  }

  const change = pctFromOpen(asset);

  ui.assetName.textContent = asset.name;
  ui.assetTicker.textContent = asset.symbol;
  ui.assetPrice.textContent = formatPrice(asset.price);
  ui.assetChange.textContent = formatChange(change);
  setChangeClass(ui.assetChange, change);
  showListeners(asset);
}

function chartLabels(size) {
  return Array.from({ length: size }, (_, i) => `${i + 1}`);
}

function buildChart() {
  if (typeof Chart === "undefined") {
    chart = null;
    return;
  }

  const asset = assets[selectedIndex];
  const ctx = document.getElementById("priceChart");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels(asset.history.length),
      datasets: [
        {
          data: asset.history,
          borderWidth: 2.4,
          borderColor: "#4da3ff",
          pointRadius: 0,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(77, 163, 255, 0.18)"
        }
      ]
    },
    options: {
      animation: {
        duration: 380,
        easing: "easeOutCubic"
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "#101a2c",
          titleColor: "#dce7fa",
          bodyColor: "#dce7fa",
          borderColor: "#2a3b5a",
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `Price: ${formatPrice(context.raw)}`;
            }
          }
        }
      },
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          grid: { color: "#24344f" },
          ticks: {
            color: "#97a9c8",
            callback(value) {
              return `$${value}`;
            }
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!chart) {
    return;
  }

  const asset = assets[selectedIndex];
  if (!asset) {
    return;
  }

  chart.data.labels = chartLabels(asset.history.length);
  chart.data.datasets[0].data = asset.history;
  chart.update();
}

function executeTrade(impactPct) {
  const asset = assets[selectedIndex];
  if (!asset) {
    return;
  }

  const currentShares = account.positions.get(asset.symbol) || 0;

  if (impactPct > 0) {
    if (account.cash < asset.price) {
      return;
    }
    account.cash = Number((account.cash - asset.price).toFixed(2));
    account.positions.set(asset.symbol, currentShares + 1);
  } else {
    if (currentShares <= 0) {
      return;
    }
    account.cash = Number((account.cash + asset.price).toFixed(2));
    account.positions.set(asset.symbol, currentShares - 1);
  }

  impactTrade(asset, impactPct);
  renderWatchlist();
  renderSelectedAsset();
  updateAccountPanel();
  updateChart();
}

function stepSimulation() {
  assets.forEach(tickAsset);
  watchlistTick += 1;
  if (watchlistTick % 3 === 0) {
    renderWatchlist();
  }
  renderSelectedAsset();
  updateAccountPanel();
  updateChart();
}

function selectByOffset(offset) {
  if (filteredIndices.length === 0) {
    return;
  }

  const currentPos = filteredIndices.indexOf(selectedIndex);
  const safePos = currentPos === -1 ? 0 : currentPos;
  const nextPos = (safePos + offset + filteredIndices.length) % filteredIndices.length;
  selectAsset(filteredIndices[nextPos]);
}

function initTrades() {
  ui.buyBtn.addEventListener("click", () => {
    executeTrade(BUY_IMPACT);
  });

  ui.sellBtn.addEventListener("click", () => {
    executeTrade(SELL_IMPACT);
  });

  ui.mobileBuyBtn.addEventListener("click", () => {
    executeTrade(BUY_IMPACT);
  });

  ui.mobileSellBtn.addEventListener("click", () => {
    executeTrade(SELL_IMPACT);
  });

  ui.prevAssetBtn.addEventListener("click", () => {
    selectByOffset(-1);
  });

  ui.nextAssetBtn.addEventListener("click", () => {
    selectByOffset(1);
  });
}

async function initMarket() {
  if (marketStarted) {
    return;
  }

  resetMarketData(buildFallbackArtists(TARGET_ARTIST_COUNT));
  artistDataSource = "kworb top 500 static list";

  marketStarted = true;
  renderWatchlist();
  renderSelectedAsset();
  buildChart();
  initTrades();
  updateAccountPanel();
  updateSearchMeta();
  refreshListenersForSelected(true);
  setInterval(stepSimulation, TICK_MS);
  setInterval(() => refreshListenersForSelected(false), LISTENER_REFRESH_MS);
}

async function enterApp() {
  if (ui.loginScreen) {
    ui.loginScreen.classList.add("app-hidden");
  }

  if (ui.appShell) {
    ui.appShell.classList.remove("app-hidden");
  }

  document.body.classList.remove("login-active");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  await initMarket();
}

function init() {
  if (ui.loginScreen) {
    ui.loginScreen.classList.remove("app-hidden");
  }

  if (ui.appShell) {
    ui.appShell.classList.add("app-hidden");
  }

  document.body.classList.add("login-active");

  if (ui.loginBtn) {
    ui.loginBtn.addEventListener("click", () => {
      void enterApp();
    });
  }

  if (ui.assetSearch) {
    ui.assetSearch.addEventListener("input", applySearchFilter);
  }
}

window.enterApp = enterApp;
init();
