const HISTORY_POINTS = 42;
const TICK_MS = 2400;
const VOLATILITY = 0.007;
const BUY_IMPACT = 0.012;
const SELL_IMPACT = -0.012;
const LISTENER_REFRESH_MS = 60000;

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

const assets = TOP_ARTISTS.map((name, index) => {
  return seedAsset(name, makeSymbol(name, index), basePriceFromIndex(index));
});

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  loginBtn: document.getElementById("loginBtn"),
  appShell: document.getElementById("appShell"),
  assetList: document.getElementById("assetList"),
  assetName: document.getElementById("assetName"),
  assetTicker: document.getElementById("assetTicker"),
  assetListeners: document.getElementById("assetListeners"),
  assetPrice: document.getElementById("assetPrice"),
  assetChange: document.getElementById("assetChange"),
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
const listenerCache = new Map();

function makeSymbol(name, index) {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  const core = (letters.slice(0, 4) || "ART").padEnd(4, "X");
  return `${core}${String(index + 1).padStart(2, "0")}`;
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

function selectAsset(index) {
  selectedIndex = (index + assets.length) % assets.length;
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
  refreshListenersForSelected(true);
}

function renderWatchlist() {
  ui.assetList.innerHTML = "";

  assets.forEach((asset, index) => {
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
  chart.data.labels = chartLabels(asset.history.length);
  chart.data.datasets[0].data = asset.history;
  chart.update();
}

function executeTrade(impactPct) {
  impactTrade(assets[selectedIndex], impactPct);
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
}

function stepSimulation() {
  assets.forEach(tickAsset);
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
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
    selectAsset(selectedIndex - 1);
  });

  ui.nextAssetBtn.addEventListener("click", () => {
    selectAsset(selectedIndex + 1);
  });
}

function initMarket() {
  if (marketStarted) {
    return;
  }

  marketStarted = true;
  renderWatchlist();
  renderSelectedAsset();
  buildChart();
  initTrades();
  refreshListenersForSelected(true);
  setInterval(stepSimulation, TICK_MS);
  setInterval(() => refreshListenersForSelected(false), LISTENER_REFRESH_MS);
}

function enterApp() {
  if (ui.loginScreen) {
    ui.loginScreen.classList.add("app-hidden");
  }

  if (ui.appShell) {
    ui.appShell.classList.remove("app-hidden");
  }

  document.body.classList.remove("login-active");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  initMarket();
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
    ui.loginBtn.addEventListener("click", enterApp);
  }
}

window.enterApp = enterApp;
init();
