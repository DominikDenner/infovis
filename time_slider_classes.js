import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// TODO peak indicators update peak on every frame, should only update when peak value changes. currently shows a peak ring and only lights if hit
// instead: update the peak value in state when a new peak is hit, and only update the ring geometry and spike position when that happens. then in the render loop just pulse the opacity if we're at the current peak
// optional: make column glow when hitting a peak, maybe with a shader that adds a glow outline that pulses when active? or just a second mesh with additive blending that scales up and down?

const CSV_PATH = "data/seasonal.csv";
const COVID_CSV_PATH = "data/COVID_Germany_weekly_2018_2022.csv";
const PANDEMIC_START = new Date("2020-03-11T00:00:00Z");

const DATASETS = {
  seasonal: { title: "seasonal" },
  mental: { title: "mental" },
  work: { title: "work" },
  resolutions: { title: "resolutions" },
  shopping: { title: "shopping" },
  home: { title: "home" },
  travel: { title: "travel" },
  work_economy: { title: "work_economy" },
  entertainment: { title: "entertainment" },
};

const palette = [0xf4c430, 0x60cfff, 0xc084fc, 0xff6b6b, 0x79e2a7, 0xffba66, 0x8eb8ff, 0xff94ba];

const ui = {
  slider: document.getElementById("time"),
  date: document.getElementById("date"),
  toggleSeason: document.getElementById("toggle-season"),
  legend: document.getElementById("legend"),
  pandemic: document.getElementById("pandemic"),
  covidPressure: document.getElementById("covid-pressure"),
  covidFill: document.getElementById("covid-fill"),
  covidStats: document.getElementById("covid-stats"),
  season: document.getElementById("season"),
  error: document.getElementById("error"),
  errorText: document.getElementById("error-text"),
};

const state = {
  rows: [],
  keys: [],
  index: 0,
  blockWidth: 22,
  gap: 14,
  heightScale: 2.0,
  pandemicIntensity: 0,
  seasonalEnabled: true,
  summerAmount: 0.5,
  winterAmount: 0.5,
  covidByIso: new Map(),
};

let renderer, scene, camera, controls;
let bars = [];
let barCaps = [];
let peakRings = [];
let floor, shockRing, shockHalo, redLight, warmLight, coldLight, seasonSun, winterSnow;

init();

// ─── Dataset helpers ──────────────────────────────────────────────────────────

function datasetPath(key) {
  return `data/${DATASETS[key].title}.csv`;
}

async function loadDataset(key) {
  bars.forEach((b) => scene.remove(b.mesh));
  barCaps.forEach((b) => scene.remove(b.mesh));
  peakRings.forEach((r) => {
    scene.remove(r.mesh);
    scene.remove(r.spike);
  });
  bars = [];
  barCaps = [];
  peakRings = [];

  const text = await fetchCsv(datasetPath(key));
  parseData(text);
  buildBars();
  buildPeakIndicators();
  setTimeIndex(state.rows.length - 1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const [text, covidText] = await Promise.all([fetchCsv(CSV_PATH), fetchCsv(COVID_CSV_PATH)]);
    parseData(text);
    parseCovidData(covidText);
    setupScene();
    buildBars();
    buildPeakIndicators();
    bindUi();
    setTimeIndex(state.rows.length - 1);
    animate();
  } catch (err) {
    showError(err);
  }
}

async function fetchCsv(path) {
  const res = await fetch(encodeURI(path));
  if (!res.ok) throw new Error(`Could not load CSV (${res.status} ${res.statusText}).`);
  return res.text();
}

function parseCovidData(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return;

  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (name) => headers.indexOf(name);

  const iDate = idx("date");
  const iWeeklyCases = idx("covid_weekly_cases");
  const iWeeklyDeaths = idx("covid_weekly_deaths");
  const iPressure = idx("covid_pressure_index");
  if (iDate < 0 || iWeeklyCases < 0 || iWeeklyDeaths < 0 || iPressure < 0) return;

  const map = new Map();
  lines.slice(1).forEach((line) => {
    const p = line.split(",");
    const iso = (p[iDate] || "").trim();
    if (!iso) return;
    map.set(iso, {
      weeklyCases: Number(p[iWeeklyCases]) || 0,
      weeklyDeaths: Number(p[iWeeklyDeaths]) || 0,
      pressure: Number(p[iPressure]) || 0,
    });
  });

  state.covidByIso = map;
}

function parseData(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const keys = headers.slice(1);

  const rows = lines
    .slice(1)
    .map((line) => {
      const p = line.split(",");
      const date = new Date(p[0].trim());
      const row = { date, iso: p[0].trim() };
      keys.forEach((k, i) => {
        row[k] = Number(p[i + 1]);
      });
      return row;
    })
    .filter((r) => !Number.isNaN(r.date.getTime()));

  rows.sort((a, b) => a.date - b.date);

  state.rows = rows;
  state.keys = keys;

  ui.slider.max = String(Math.max(0, rows.length - 1));
  ui.slider.value = String(rows.length - 1);

  renderLegend();
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function setupScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x09121b);
  scene.fog = new THREE.Fog(0x09121b, 280, 1000);

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(0, 150, 290);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 44, 0);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(180, 220, 100);
  scene.add(keyLight);

  const coolFill = new THREE.DirectionalLight(0x84cfff, 0.35);
  coolFill.position.set(-200, 120, -120);
  scene.add(coolFill);

  warmLight = new THREE.PointLight(0xffd77a, 0.4, 700, 2);
  warmLight.position.set(0, 180, 120);
  scene.add(warmLight);

  coldLight = new THREE.PointLight(0xaad6ff, 0.25, 680, 2);
  coldLight.position.set(0, 120, -90);
  scene.add(coldLight);

  redLight = new THREE.PointLight(0xff6666, 0, 520, 2);
  redLight.position.set(0, 50, 0);
  scene.add(redLight);

  scene.add(new THREE.AmbientLight(0x80a2be, 0.2));

  floor = new THREE.Mesh(
    new THREE.CylinderGeometry(140, 165, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0x1a3448, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  );
  floor.position.y = -3;
  scene.add(floor);

  const grid = new THREE.GridHelper(420, 28, 0x355671, 0x223a4f);
  grid.position.y = -2;
  scene.add(grid);

  const ringGeo = new THREE.TorusGeometry(95, 2.2, 20, 96);
  shockRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xff6a6a, transparent: true, opacity: 0 }));
  shockRing.rotation.x = Math.PI / 2;
  shockRing.position.y = 1;
  scene.add(shockRing);

  shockHalo = new THREE.Mesh(new THREE.TorusGeometry(95, 6, 16, 96), new THREE.MeshBasicMaterial({ color: 0xff8f8f, transparent: true, opacity: 0 }));
  shockHalo.rotation.x = Math.PI / 2;
  shockHalo.position.y = 1;
  scene.add(shockHalo);

  seasonSun = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0 }));
  seasonSun.position.set(0, 170, -140);
  scene.add(seasonSun);

  const snowCount = 260;
  const snowPositions = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    const i3 = i * 3;
    snowPositions[i3] = (Math.random() - 0.5) * 280;
    snowPositions[i3 + 1] = 20 + Math.random() * 180;
    snowPositions[i3 + 2] = (Math.random() - 0.5) * 220;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPositions, 3));
  winterSnow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({
      color: 0xe3f4ff,
      size: 2.0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  scene.add(winterSnow);

  window.addEventListener("resize", onResize);
}

// ─── Bars ─────────────────────────────────────────────────────────────────────

function buildBars() {
  const total = state.keys.length;
  const span = total * state.blockWidth + (total - 1) * state.gap;
  const left = -span / 2 + state.blockWidth / 2;

  const bodyGeom = new THREE.BoxGeometry(1, 1, 1);
  const capGeom = new THREE.BoxGeometry(1.08, 0.9, 1.08);

  state.keys.forEach((key, i) => {
    const color = new THREE.Color(palette[i % palette.length]);

    const body = new THREE.Mesh(
      bodyGeom,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.14,
        emissive: color.clone().multiplyScalar(0.08),
      }),
    );

    const cap = new THREE.Mesh(
      capGeom,
      new THREE.MeshStandardMaterial({
        color: color.clone().lerp(new THREE.Color(0xffffff), 0.22),
        roughness: 0.4,
        metalness: 0.28,
      }),
    );

    const x = left + i * (state.blockWidth + state.gap);
    body.position.set(x, 0, 0);
    cap.position.set(x, 0, 0);
    body.scale.set(state.blockWidth, 1, state.blockWidth);
    cap.scale.set(state.blockWidth, 1, state.blockWidth);

    scene.add(body);
    scene.add(cap);

    bars.push({ key, mesh: body, x });
    barCaps.push({ mesh: cap, x });
  });
}

// ─── Peak indicators ──────────────────────────────────────────────────────────

function buildPeakIndicators() {
  peakRings.forEach((r) => {
    scene.remove(r.mesh);
    scene.remove(r.spike);
  });
  peakRings = [];

  bars.forEach((bar, i) => {
    const peakValue = Math.max(...state.rows.map((r) => r[bar.key]));
    const peakHeight = Math.max(1.2, peakValue * state.heightScale);
    const color = new THREE.Color(palette[i % palette.length]);

    // Flat ring sitting at the peak height — acts as a permanent "high-water mark"
    const ringGeo = new THREE.TorusGeometry(state.blockWidth * 0.52, 0.55, 6, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color.clone().lerp(new THREE.Color(0xffffff), 0.5),
      transparent: true,
      opacity: 0.18,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(bar.x, peakHeight, 0);
    scene.add(ring);

    // Thin vertical spike above the ring — flares when the bar hits its peak
    const spikeGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
    const spikeMat = new THREE.MeshBasicMaterial({
      color: color.clone().lerp(new THREE.Color(0xffffff), 0.6),
      transparent: true,
      opacity: 0.18,
    });
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(bar.x, peakHeight + 2.5, 0);
    scene.add(spike);

    peakRings.push({ mesh: ring, spike, peakValue, peakHeight, key: bar.key, baseColor: color });
  });
}

function updatePeakIndicators(row) {
  peakRings.forEach((pr) => {
    const currentValue = row[pr.key];
    const atPeak = currentValue >= pr.peakValue * 0.99;

    if (atPeak) {
      pr.mesh.material.opacity = 1.0;
      pr.mesh.material.color.copy(pr.baseColor).lerp(new THREE.Color(0xffffff), 0.55);
      pr.mesh.scale.set(1.18, 1.18, 1.18);
      pr.spike.material.opacity = 1.0;
      pr.spike.scale.y = 2.2;
    } else {
      pr.mesh.material.opacity = 0.18;
      pr.mesh.material.color.copy(pr.baseColor).lerp(new THREE.Color(0xffffff), 0.5);
      pr.mesh.scale.set(1.0, 1.0, 1.0);
      pr.spike.material.opacity = 0.18;
      pr.spike.scale.y = 1.0;
    }
  });
}

// ─── UI ───────────────────────────────────────────────────────────────────────

function bindUi() {
  ui.slider.addEventListener("input", () => {
    setTimeIndex(Number(ui.slider.value));
  });

  ui.toggleSeason.addEventListener("change", () => {
    state.seasonalEnabled = ui.toggleSeason.checked;
    setTimeIndex(state.index);
  });

  document.getElementById("dataset-select").addEventListener("change", (e) => {
    loadDataset(e.target.value);
  });

  const playBtn = document.getElementById("play-btn");
  const speedSelect = document.getElementById("speed-select");

  let playing = false;
  let lastStepTime = 0;

  function tickPlayback(now) {
    if (!playing) return;
    requestAnimationFrame(tickPlayback);

    const interval = parseFloat(speedSelect.value) * 1000;
    if (now - lastStepTime >= interval) {
      lastStepTime = now;
      const next = state.index + 1;
      if (next >= state.rows.length) {
        playing = false;
        playBtn.textContent = "▶ Play";
        return;
      }
      ui.slider.value = String(next);
      setTimeIndex(next);
    }
  }

  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏸ Pause" : "▶ Play";

    if (playing) {
      if (state.index >= state.rows.length - 1) {
        ui.slider.value = "0";
        setTimeIndex(0);
      }
      lastStepTime = performance.now();
      requestAnimationFrame(tickPlayback);
    }
  });
}

// ─── Time ─────────────────────────────────────────────────────────────────────

function setTimeIndex(index) {
  state.index = Math.max(0, Math.min(index, state.rows.length - 1));
  const row = state.rows[state.index];

  ui.date.textContent = row.iso;

  bars.forEach((bar, i) => {
    const value = row[bar.key];
    const h = Math.max(1.2, value * state.heightScale);

    bar.mesh.position.y = h * 0.5;
    bar.mesh.scale.y = h;

    barCaps[i].mesh.position.y = h + 0.45;
  });

  updatePandemicEffect(row.date, row.iso);
  updateSeasonEffect(row.date);
  updatePeakIndicators(row);
}

function updatePandemicEffect(currentDate, iso) {
  const covid = state.covidByIso.get(iso);
  if (covid) {
    const intensity = Math.max(0, Math.min(1, covid.pressure / 100));
    state.pandemicIntensity = intensity;
    ui.pandemic.innerHTML = `Pandemic effect: <strong>${intensity > 0.02 ? "active" : "low"} (${Math.round(intensity * 100)}%)</strong>`;
    ui.covidPressure.textContent = `${Math.round(covid.pressure)}%`;
    ui.covidFill.style.width = `${Math.max(0, Math.min(100, covid.pressure))}%`;
    ui.covidStats.textContent = `Weekly cases: ${Math.round(covid.weeklyCases).toLocaleString()} · Weekly deaths: ${Math.round(covid.weeklyDeaths).toLocaleString()}`;
    return;
  }

  const currentMs = currentDate.getTime();
  const startMs = PANDEMIC_START.getTime();

  if (currentMs < startMs) {
    state.pandemicIntensity = 0;
    ui.pandemic.innerHTML = "Pandemic effect: <strong>inactive</strong>";
    ui.covidPressure.textContent = "0%";
    ui.covidFill.style.width = "0%";
    ui.covidStats.textContent = "Weekly cases: 0 · Weekly deaths: 0";
    return;
  }

  const weeksSince = (currentMs - startMs) / (1000 * 60 * 60 * 24 * 7);
  const intensity = Math.exp(-weeksSince / 120);

  state.pandemicIntensity = Math.max(0, Math.min(1, intensity));
  ui.pandemic.innerHTML = `Pandemic effect: <strong>active (${Math.round(state.pandemicIntensity * 100)}%)</strong>`;
  ui.covidPressure.textContent = `${Math.round(state.pandemicIntensity * 100)}%`;
  ui.covidFill.style.width = `${Math.round(state.pandemicIntensity * 100)}%`;
  ui.covidStats.textContent = "Weekly cases: n/a · Weekly deaths: n/a";
}

function updateSeasonEffect(currentDate) {
  if (!state.seasonalEnabled) {
    state.summerAmount = 0.5;
    state.winterAmount = 0.5;
    ui.season.innerHTML = "Season: <strong>effects disabled</strong>";
    return;
  }

  const day = dayOfYear(currentDate);
  const phase = ((day - 172) / 365) * Math.PI * 2;
  const summer = (Math.cos(phase) + 1) * 0.5;
  const winter = 1 - summer;

  state.summerAmount = summer;
  state.winterAmount = winter;

  const label = summer >= winter ? "summer-like" : "winter-like";
  ui.season.innerHTML = `Season: <strong>${label} (${Math.round(Math.max(summer, winter) * 100)}%)</strong>`;
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);

  const t = performance.now() * 0.001;
  const pulse = 0.5 + Math.sin(t * 2.6) * 0.5;
  const intensity = state.pandemicIntensity;
  const summer = state.summerAmount;
  const winter = state.winterAmount;

  const bg = new THREE.Color(0x09121b).lerp(new THREE.Color(0x1d3550), summer * 0.8);
  bg.lerp(new THREE.Color(0x10273c), winter * 0.35);
  scene.background.copy(bg);
  scene.fog.color.copy(bg);

  warmLight.intensity = 0.12 + summer * 0.9;
  coldLight.intensity = 0.08 + winter * 0.82;

  seasonSun.material.opacity = summer * 0.9;
  seasonSun.position.y = 150 + summer * 34;
  seasonSun.scale.setScalar(0.8 + summer * 0.35);

  winterSnow.material.opacity = winter * 0.72;
  winterSnow.rotation.y += 0.0008 + winter * 0.0016;

  shockRing.material.opacity = intensity * (0.35 + pulse * 0.45);
  shockHalo.material.opacity = intensity * (0.08 + pulse * 0.15);

  const baseScale = 1 + intensity * (0.12 + pulse * 0.08);
  shockRing.scale.set(baseScale, baseScale, baseScale);
  shockHalo.scale.set(baseScale * 1.06, baseScale * 1.06, baseScale * 1.06);

  floor.material.color.setRGB(
    0.11 + summer * 0.12 + intensity * 0.22,
    0.2 + summer * 0.06 - winter * 0.03 - intensity * 0.05,
    0.3 + summer * 0.04 + winter * 0.07 - intensity * 0.1,
  );

  redLight.intensity = intensity * (0.8 + pulse * 0.8);

  controls.update();
  renderer.render(scene, camera);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderLegend() {
  ui.legend.innerHTML = "";
  state.keys.forEach((key, i) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = `#${new THREE.Color(palette[i % palette.length]).getHexString()}`;

    const text = document.createElement("span");
    text.textContent = key;

    item.appendChild(swatch);
    item.appendChild(text);
    ui.legend.appendChild(item);
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function dayOfYear(date) {
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 0, 0);
  const now = Date.UTC(y, date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / 86400000);
}

function showError(err) {
  ui.error.style.display = "flex";
  ui.errorText.textContent = `${err.message || String(err)}\n\nUse a local server and open time_slider_classes.html via http://localhost:PORT.`;
}
