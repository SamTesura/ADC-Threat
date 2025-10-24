'use strict';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "/champions-summary.json";

const MAX_ENEMIES = 5;
const MAX_ALLIES = 4;

const THREAT = Object.freeze({
  HARD_CC: "HARD_CC",
  SOFT_CC: "SOFT_CC",
  SHIELD_PEEL: "SHIELD_PEEL",
  GAP_CLOSE: "GAP_CLOSE",
  BURST: "BURST",
  POKE_ZONE: "POKE_ZONE"
});

const PRIORITY = Object.values(THREAT);

const THREAT_CLASS = {
  [THREAT.HARD_CC]: "hard",
  [THREAT.SOFT_CC]: "soft",
  [THREAT.SHIELD_PEEL]: "peel",
  [THREAT.GAP_CLOSE]: "gap",
  [THREAT.BURST]: "burst",
  [THREAT.POKE_ZONE]: "poke"
};

const THREAT_LABEL = {
  [THREAT.HARD_CC]: "Hard CC",
  [THREAT.SOFT_CC]: "Soft CC",
  [THREAT.SHIELD_PEEL]: "Shield/Peel",
  [THREAT.GAP_CLOSE]: "Gap Close",
  [THREAT.BURST]: "Burst",
  [THREAT.POKE_ZONE]: "Poke/Zone"
};

// ============================================================================
// GLOBAL STATE
// ============================================================================
const state = {
  allChampions: [],
  selectedADC: null,
  enemyChampions: [],
  allyChampions: [],
  adcTemplates: {},
  passiveSummaries: {},
  compactMode: false
};

// ============================================================================
// UTILITIES
// ============================================================================
function normalizeChampionName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getChampionImageUrl(champId) {
  const ddragonUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champId}.png`;
  const cdragonUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${getChampionIdNumber(champId)}.png`;
  return ddragonUrl;
}

function getChampionIdNumber(champId) {
  // TODO: Implement real mapping logic here.
  return -1;
}

function debounce(fn, delay = 200) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function showError(message) {
  alert(message); // Replace with a modal in production
  console.error(message);
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Failed to load champion data');
    state.allChampions = await response.json();
    console.log(`✅ Loaded ${state.allChampions.length} champions`);
    renderADCGrid();
    setupInputs();
    setupEventListeners();
  } catch (err) {
    console.error('❌ Initialization error:', err);
    showError('Failed to load champion data. Please refresh the page.');
  }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================
function renderADCGrid() {
  const grid = document.getElementById('adcGrid');
  if (!grid) return console.error('ADC grid not found');

  grid.innerHTML = '';

  ADC_LIST.forEach(adc => {
    const card = document.createElement('div');
    card.className = 'adc-card';
    card.dataset.adcId = adc.id;

    const img = document.createElement('img');
    img.src = getChampionImageUrl(adc.id);
    img.alt = adc.name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = getChampionImageUrl('Placeholder'); };

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = adc.name;

    card.append(img, label);
    card.addEventListener('click', () => selectADC(adc));
    grid.appendChild(card);
  });
}

function selectADC(adc) {
  state.selectedADC = adc;
  document.querySelectorAll('.adc-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.adcId === adc.id);
  });
  updateSupportTipsSection();
  render();
  console.log(`✅ Selected ADC: ${adc.name}`);
}

function updateSupportTipsSection() {
  const section = document.getElementById('supportTipsSection');
  const adcNameSpan = document.getElementById('currentAdcName');
  if (!section || !adcNameSpan) return;

  if (!state.selectedADC) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  adcNameSpan.textContent = state.selectedADC.name;
  document.getElementById('positioningTip').textContent = GENERAL_SUPPORT_TIPS.positioning;
  document.getElementById('tradingTip').textContent = GENERAL_SUPPORT_TIPS.trading;
  document.getElementById('waveTip').textContent = GENERAL_SUPPORT_TIPS.waveManagement;
  document.getElementById('allinTip').textContent = GENERAL_SUPPORT_TIPS.allInTiming;
  renderBestSupports();
}

// ============================================================================
// SEARCH INPUTS
// ============================================================================
function setupInputs() {
  setupSearchGrid('enemyInputs', MAX_ENEMIES, 'enemy');
  setupSearchGrid('allyInputs', MAX_ALLIES, 'ally');
}

function setupSearchGrid(containerId, count, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.appendChild(createSearchBox(i, type));
  }
}

function createSearchBox(index, type) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = `${type === 'enemy' ? 'Enemy' : 'Ally'} ${index + 1}`;
  input.dataset.index = index;
  input.dataset.type = type;

  const suggestions = document.createElement('div');
  suggestions.className = 'suggestions';

  const debouncedSearch = debounce(handleSearch, 250);
  input.addEventListener('input', debouncedSearch);
  input.addEventListener('focus', debouncedSearch);
  input.addEventListener('blur', () => {
    setTimeout(() => suggestions.classList.remove('show'), 200);
  });

  wrapper.append(input, suggestions);
  return wrapper;
}

function handleSearch(e) {
  const input = e.target;
  const query = input.value.trim().toLowerCase();
  const suggestions = input.nextElementSibling;
  if (!query) return suggestions.classList.remove('show');

  const matches = state.allChampions
    .filter(c => c.name.toLowerCase().includes(query))
    .slice(0, 8);

  if (matches.length === 0) return suggestions.classList.remove('show');

  suggestions.innerHTML = '';
  matches.forEach(champ => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.champId = champ.id;
    btn.textContent = champ.name;
    btn.addEventListener('click', () => selectChampion(input, champ.id));
    suggestions.appendChild(btn);
  });
  suggestions.classList.add('show');
}

function selectChampion(input, champId) {
  const champion = state.allChampions.find(c => c.id === champId);
  if (!champion) return;

  input.value = champion.name;
  input.nextElementSibling.classList.remove('show');
  const { type, index } = input.dataset;
  const targetArray = type === 'enemy' ? state.enemyChampions : state.allyChampions;
  targetArray[Number(index)] = champion;
  render();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  const compactToggle = document.getElementById('toggleCompact');
  if (compactToggle) {
    compactToggle.addEventListener('change', e => {
      state.compactMode = e.target.checked;
      document.body.classList.toggle('compact-mode', state.compactMode);
    });
  }

  document.getElementById('exportData')?.addEventListener('click', exportData);
  document.getElementById('importData')?.addEventListener('click', () => {
    document.getElementById('importFile')?.click();
  });
  document.getElementById('importFile')?.addEventListener('change', handleImport);
}

async function exportData() {
  try {
    const data = {
      selectedADC: state.selectedADC,
      enemies: state.enemyChampions.filter(Boolean).map(c => c.id),
      allies: state.allyChampions.filter(Boolean).map(c => c.id)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adc-threat-export.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showError('Error exporting data');
    console.error(err);
  }
}

async function handleImport(e) {
  try {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    // Validate structure
    if (data.selectedADC) selectADC(data.selectedADC);
    console.log('✅ Import successful');
  } catch (err) {
    showError('Import failed. Invalid file format.');
  }
}

// Start app
window.addEventListener('DOMContentLoaded', init);
