const HISTORY_POINTS = 42;
const TICK_MS = 2400;
const VOLATILITY = 0.007;
const BUY_IMPACT = 0.012;
const SELL_IMPACT = -0.012;

const assets = [
  seedAsset("Blinding Lights", "BLND", 142.4),
  seedAsset("Levitating", "LEVT", 116.35),
  seedAsset("As It Was", "AITW", 98.8),
  seedAsset("Cruel Summer", "CRSM", 132.7),
  seedAsset("Unholy", "UNHY", 105.95),
  seedAsset("Calm Down", "CLMD", 87.25)
];

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginBtn: document.getElementById("loginBtn"),
  appShell: document.getElementById("appShell"),
  assetList: document.getElementById("assetList"),
  assetName: document.getElementById("assetName"),
  assetTicker: document.getElementById("assetTicker"),
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
let appStarted = false;

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

function setChangeClass(el, value) {
  el.classList.remove("positive", "negative");
  el.classList.add(value >= 0 ? "positive" : "negative");
}

function selectAsset(index) {
  selectedIndex = (index + assets.length) % assets.length;
  renderWatchlist();
  renderSelectedAsset();
  updateChart();
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
          borderColor: "#0f6df5",
          pointRadius: 0,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(15, 109, 245, 0.08)"
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
          grid: { color: "#ecf1f8" },
          ticks: {
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

function initApp() {
  if (appStarted) {
    return;
  }

  appStarted = true;
  renderWatchlist();
  renderSelectedAsset();
  buildChart();
  initTrades();
  setInterval(stepSimulation, TICK_MS);
}

function enterApp() {
  ui.loginScreen.classList.add("app-hidden");
  ui.appShell.classList.remove("app-hidden");
  initApp();
}

function initLogin() {
  ui.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    enterApp();
  });

  ui.loginBtn.addEventListener("click", () => {
    enterApp();
  });

  window.enterApp = enterApp;
}

function init() {
  initLogin();
}

init();
