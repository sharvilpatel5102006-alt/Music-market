const HISTORY_POINTS = 42;
const TICK_MS = 2400;
const VOLATILITY = 0.007;
const BUY_IMPACT = 0.012;
const SELL_IMPACT = -0.012;
const LISTENER_REFRESH_MS = 60000;
const TARGET_ARTIST_COUNT = 500;
const STARTING_CASH = 25000;
const REAL_ARTISTS_SOURCE_URLS = [
  "https://r.jina.ai/http://chartmasters.org/most-streamed-artists-ever-on-spotify/",
  "https://r.jina.ai/http://chartmasters.org/most-streamed-artists-ever-on-spotify/?view=list"
];
const WIKIDATA_SPOTIFY_ARTISTS_API =
  "https://query.wikidata.org/sparql?format=json&query=" +
  encodeURIComponent(
    "SELECT ?artistLabel WHERE { " +
      "?artist wdt:P2205 ?spotifyId. " +
      "SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } " +
    "} LIMIT 1200"
  );

const TOP_ARTISTS = [
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
  "Sabrina Carpenter",
  "Chappell Roan",
  "Tate McRae",
  "Noah Kahan",
  "Hozier",
  "Lil Baby",
  "Future",
  "Metro Boomin",
  "21 Savage",
  "J. Cole",
  "Tyler, The Creator",
  "Playboi Carti",
  "Karol G",
  "Feid",
  "Peso Pluma",
  "Shakira",
  "Anitta",
  "Rosalia",
  "BTS",
  "Jung Kook",
  "BLACKPINK",
  "NewJeans",
  "Stray Kids",
  "Coldplay",
  "Imagine Dragons",
  "OneRepublic"
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
  return Array.from(new Set(TOP_ARTISTS)).slice(0, totalCount);
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

function parseTopArtistsFromChartmasters(text) {
  const lines = text.split("\n");
  const names = [];
  const seen = new Set();

  lines.forEach((line) => {
    const cleaned = line.trim();
    const match = cleaned.match(/^(\d{1,4})\s+(.+?)\s+(\d[\d,]*)$/);
    if (!match) {
      return;
    }

    const rank = Number(match[1]);
    const artistName = match[2].replace(/\s+/g, " ").trim();

    if (
      Number.isNaN(rank) ||
      rank < 1 ||
      rank > TARGET_ARTIST_COUNT ||
      !artistName ||
      isGeneratedStyleName(artistName) ||
      seen.has(artistName)
    ) {
      return;
    }

    seen.add(artistName);
    names.push(artistName);
  });

  return names;
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

async function loadRealTopArtists() {
  for (const sourceUrl of REAL_ARTISTS_SOURCE_URLS) {
    try {
      const sourceText = await fetchTextWithTimeout(sourceUrl, 12000);
      const parsedNames = parseTopArtistsFromChartmasters(sourceText);

      if (parsedNames.length >= TARGET_ARTIST_COUNT) {
        return parsedNames.slice(0, TARGET_ARTIST_COUNT);
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error("could not load real top artists");
}

async function loadRealArtistsFromWikidata() {
  const sourceText = await fetchTextWithTimeout(WIKIDATA_SPOTIFY_ARTISTS_API, 12000);
  const payload = JSON.parse(sourceText);
  const bindings = payload?.results?.bindings || [];
  const seen = new Set();
  const names = [];

  bindings.forEach((item) => {
    const name = (item?.artistLabel?.value || "").trim();
    if (!name || isGeneratedStyleName(name) || seen.has(name)) {
      return;
    }
    seen.add(name);
    names.push(name);
  });

  if (names.length < TARGET_ARTIST_COUNT) {
    throw new Error("wikidata returned too few artists");
  }

  return names.slice(0, TARGET_ARTIST_COUNT);
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

  try {
    const realArtists = await loadRealTopArtists();
    resetMarketData(realArtists);
    artistDataSource = "chartmasters real artists";
  } catch (error) {
    try {
      const wikidataArtists = await loadRealArtistsFromWikidata();
      resetMarketData(wikidataArtists);
      artistDataSource = "wikidata real artists";
    } catch (nestedError) {
      resetMarketData(buildFallbackArtists(TARGET_ARTIST_COUNT));
      artistDataSource = "local real shortlist";
    }
  }

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
