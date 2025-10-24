'use strict';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "./champions-summary.json";

const THREAT = {
  HARD_CC: "HARD_CC",
  SOFT_CC: "SOFT_CC",
  SHIELD_PEEL: "SHIELD_PEEL",
  GAP_CLOSE: "GAP_CLOSE",
  BURST: "BURST",
  POKE_ZONE: "POKE_ZONE"
};

const PRIORITY = [
  THREAT.HARD_CC,
  THREAT.SOFT_CC,
  THREAT.SHIELD_PEEL,
  THREAT.GAP_CLOSE,
  THREAT.BURST,
  THREAT.POKE_ZONE
];

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
// ADC LIST
// ============================================================================
const ADC_LIST = [
  { id: "Ashe", name: "Ashe" },
  { id: "Caitlyn", name: "Caitlyn" },
  { id: "Corki", name: "Corki" },
  { id: "Draven", name: "Draven" },
  { id: "Ezreal", name: "Ezreal" },
  { id: "Jhin", name: "Jhin" },
  { id: "Jinx", name: "Jinx" },
  { id: "Kaisa", name: "Kai'Sa" },
  { id: "Kalista", name: "Kalista" },
  { id: "KogMaw", name: "Kog'Maw" },
  { id: "Lucian", name: "Lucian" },
  { id: "MissFortune", name: "Miss Fortune" },
  { id: "Nilah", name: "Nilah" },
  { id: "Quinn", name: "Quinn" },
  { id: "Samira", name: "Samira" },
  { id: "Senna", name: "Senna" },
  { id: "Sivir", name: "Sivir" },
  { id: "Tristana", name: "Tristana" },
  { id: "Twitch", name: "Twitch" },
  { id: "Varus", name: "Varus" },
  { id: "Vayne", name: "Vayne" },
  { id: "Xayah", name: "Xayah" },
  { id: "Zeri", name: "Zeri" },
  { id: "Aphelios", name: "Aphelios" },
  { id: "Yunara", name: "Yunara" },
  { id: "Smolder", name: "Smolder" }
];

// ============================================================================
// SUPPORT SYNERGY DATA (Condensed - Load from separate file in production)
// ============================================================================
const GENERAL_SUPPORT_TIPS = {
  positioning: "Stay behind your support when they engage. Use them as a frontline shield.",
  trading: "When your support lands CC, immediately follow up with damage.",
  waveManagement: "Coordinate wave control. Let them tank minions when freezing.",
  allInTiming: "All-in when your support has key abilities ready AND enemies have CDs down."
};

const BEST_SUPPORTS = {
  Ashe: ["Thresh", "Nautilus", "Leona", "Zyra", "Brand"],
  Caitlyn: ["Morgana", "Lux", "Zyra", "Xerath", "Vel'Koz"],
  Jinx: ["Lulu", "Nami", "Thresh", "Braum", "Janna"],
  // ... Add all ADCs
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function normalizeChampionName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getChampionImageUrl(champId) {
  const ddragonUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champId}.png`;
  const cdragonUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${getChampionIdNumber(champId)}.png`;
  
  return ddragonUrl; // Primary, will fall back to CDragon via error handler
}

function getChampionIdNumber(champId) {
  // This would need actual mapping - simplified for demo
  return -1;
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function init() {
  try {
    // Load champion data
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Failed to load champion data');
    
    state.allChampions = await response.json();
    console.log(`✅ Loaded ${state.allChampions.length} champions`);
    
    // Initialize UI
    renderADCGrid();
    setupInputs();
    setupEventListeners();
    
    // No lock overlay - users can start immediately!
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError('Failed to load champion data. Please refresh the page.');
  }
}

// ============================================================================
// ADC GRID RENDERING
// ============================================================================
function renderADCGrid() {
  const grid = document.getElementById('adcGrid');
  if (!grid) {
    console.error('❌ ADC grid element not found');
    return;
  }
  
  grid.innerHTML = '';
  
  ADC_LIST.forEach(adc => {
    const card = document.createElement('div');
    card.className = 'adc-card';
    card.dataset.adcId = adc.id;
    
    card.innerHTML = `
      <img src="${getChampionImageUrl(adc.id)}" alt="${adc.name}" loading="lazy">
      <span class="label">${adc.name}</span>
    `;
    
    card.addEventListener('click', () => selectADC(adc));
    grid.appendChild(card);
  });
}

// ============================================================================
// ADC SELECTION
// ============================================================================
function selectADC(adc) {
  state.selectedADC = adc;
  
  // Update UI
  document.querySelectorAll('.adc-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.adcId === adc.id);
  });
  
  // Show support tips
  updateSupportTipsSection();
  
  // Re-render results to show ADC-specific tips
  render();
  
  console.log(`✅ Selected ADC: ${adc.name}`);
}

// ============================================================================
// SUPPORT TIPS
// ============================================================================
function updateSupportTipsSection() {
  const section = document.getElementById('supportTipsSection');
  const adcNameSpan = document.getElementById('currentAdcName');
  
  if (!state.selectedADC) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  adcNameSpan.textContent = state.selectedADC.name;
  
  // Update tips
  document.getElementById('positioningTip').textContent = GENERAL_SUPPORT_TIPS.positioning;
  document.getElementById('tradingTip').textContent = GENERAL_SUPPORT_TIPS.trading;
  document.getElementById('waveTip').textContent = GENERAL_SUPPORT_TIPS.waveManagement;
  document.getElementById('allinTip').textContent = GENERAL_SUPPORT_TIPS.allInTiming;
  
  // Render best supports
  renderBestSupports();
}

function renderBestSupports() {
  const grid = document.getElementById('bestSupportsGrid');
  if (!grid || !state.selectedADC) return;
  
  const supports = BEST_SUPPORTS[state.selectedADC.id] || [];
  
  grid.innerHTML = supports.map(support => `
    <div class="support-card">
      <img src="${getChampionImageUrl(support)}" alt="${support}" loading="lazy">
      <div class="support-info">
        <div class="support-name">${support}</div>
        <div class="support-synergy">Strong synergy</div>
      </div>
    </div>
  `).join('');
}

// ============================================================================
// INPUT SETUP
// ============================================================================
function setupInputs() {
  setupSearchGrid('enemyInputs', 5, 'enemy');
  setupSearchGrid('allyInputs', 4, 'ally');
}

function setupSearchGrid(containerId, count, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const searchBox = createSearchBox(i, type);
    container.appendChild(searchBox);
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
  
  // Event listeners
  input.addEventListener('input', handleSearch);
  input.addEventListener('focus', handleSearch);
  input.addEventListener('blur', () => {
    // Delay to allow clicking suggestions
    setTimeout(() => suggestions.classList.remove('show'), 200);
  });
  
  wrapper.appendChild(input);
  wrapper.appendChild(suggestions);
  
  return wrapper;
}

// ============================================================================
// SEARCH HANDLING
// ============================================================================
function handleSearch(e) {
  const input = e.target;
  const query = input.value.trim().toLowerCase();
  const suggestions = input.nextElementSibling;
  
  if (!query) {
    suggestions.classList.remove('show');
    return;
  }
  
  const matches = state.allChampions.filter(champ => 
    champ.name.toLowerCase().includes(query)
  ).slice(0, 8); // Limit to 8 suggestions
  
  if (matches.length === 0) {
    suggestions.classList.remove('show');
    return;
  }
  
  suggestions.innerHTML = matches.map(champ => `
    <button type="button" data-champ-id="${champ.id}">
      ${champ.name}
    </button>
  `).join('');
  
  // Add click handlers
  suggestions.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectChampion(input, btn.dataset.champId);
    });
  });
  
  suggestions.classList.add('show');
}

function selectChampion(input, champId) {
  const champion = state.allChampions.find(c => c.id === champId);
  if (!champion) return;
  
  input.value = champion.name;
  input.nextElementSibling.classList.remove('show');
  
  const type = input.dataset.type;
  const index = parseInt(input.dataset.index);
  
  if (type === 'enemy') {
    state.enemyChampions[index] = champion;
  } else {
    state.allyChampions[index] = champion;
  }
  
  render();
}

// ============================================================================
// RENDERING
// ============================================================================
function render() {
  const tbody = document.getElementById('resultsBody');
  const emptyState = document.getElementById('emptyState');
  
  if (!tbody) return;
  
  const allChamps = [...state.enemyChampions, ...state.allyChampions].filter(Boolean);
  
  if (allChamps.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  tbody.innerHTML = '';
  
  // Render enemy group
  if (state.enemyChampions.filter(Boolean).length > 0) {
    renderGroup('Enemy', state.enemyChampions, tbody);
  }
  
  // Render ally group  
  if (state.allyChampions.filter(Boolean).length > 0) {
    renderGroup('Ally', state.allyChampions, tbody);
  }
}

function renderGroup(groupName, champions, tbody) {
  const validChamps = champions.filter(Boolean);
  if (validChamps.length === 0) return;
  
  validChamps.forEach((champ, index) => {
    const row = document.createElement('tr');
    
    const groupCell = index === 0 ? `<td class="group" rowspan="${validChamps.length}">${groupName}</td>` : '';
    
    row.innerHTML = `
      ${groupCell}
      <td class="champ">
        <div class="cell-champ">
          <img class="portrait-sm" src="${getChampionImageUrl(champ.id)}" alt="${champ.name}" loading="lazy">
          <strong>${champ.name}</strong>
        </div>
      </td>
      <td class="role">${champ.roles ? champ.roles.join(', ') : '—'}</td>
      <td class="passive">${getPassiveSummary(champ)}</td>
      <td class="abilities">${renderAbilities(champ)}</td>
      <td class="threats">${renderThreatTags(champ)}</td>
      <td class="notes">${getADCTip(champ)}</td>
      <td class="support-synergy">${getSupportSynergy(champ)}</td>
    `;
    
    tbody.appendChild(row);
  });
}

function renderAbilities(champ) {
  if (!champ.abilities) return '—';
  
  return champ.abilities.map(ability => {
    const ccClass = ability.hardCC ? 'hard' : ability.softCC ? 'soft' : '';
    const cleanseBadge = ability.softCC ? '<span class="mini-badge cleanse">Cleanse</span>' : '';
    
    return `
      <div class="pill ${ccClass}">
        <b>${ability.slot}</b>
        <span class="cds">${ability.cooldown}s</span>
        ${cleanseBadge}
        ${ability.ccType ? `<span class="tlabel">${ability.ccType}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderThreatTags(champ) {
  if (!champ.threats) return '—';
  
  return `
    <div class="tags-mini">
      ${champ.threats.map(threat => `
        <span class="tag ${THREAT_CLASS[threat]}">${THREAT_LABEL[threat]}</span>
      `).join('')}
    </div>
  `;
}

function getPassiveSummary(champ) {
  return champ.passive || '—';
}

function getADCTip(champ) {
  if (!state.selectedADC) return '—';
  
  const template = state.adcTemplates[state.selectedADC.id];
  if (!template || !template.tips || !template.tips[champ.id]) {
    return '—';
  }
  
  return template.tips[champ.id];
}

function getSupportSynergy(champ) {
  if (!state.selectedADC) return '—';
  
  const supports = BEST_SUPPORTS[state.selectedADC.id] || [];
  
  if (supports.includes(champ.name)) {
    return `⭐ <strong>Best support for ${state.selectedADC.name}</strong>`;
  }
  
  return '—';
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Compact mode toggle
  const compactToggle = document.getElementById('toggleCompact');
  if (compactToggle) {
    compactToggle.addEventListener('change', (e) => {
      state.compactMode = e.target.checked;
      document.body.classList.toggle('compact-mode', state.compactMode);
    });
  }
  
  // Export/Import (simplified placeholders)
  const exportBtn = document.getElementById('exportData');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  const importBtn = document.getElementById('importData');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      document.getElementById('importFile')?.click();
    });
  }
  
  const importFile = document.getElementById('importFile');
  if (importFile) {
    importFile.addEventListener('change', handleImport);
  }
}

function exportData() {
  const data = {
    selectedADC: state.selectedADC,
    enemyChampions: state.enemyChampions.filter(Boolean).map(c => c.id),
    allyChampions: state.allyChampions.filter(Boolean).map(c => c.id)
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'adc-threat-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result);
      // Restore state (simplified)
      console.log('Import data:', data);
      alert('Import feature coming soon!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import data. Invalid file format.');
    }
  };
  reader.readAsText(file);
}

function showError(message) {
  // Create a simple error toast
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #e53e3e;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 9999;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 5000);
}

// ============================================================================
// START APPLICATION
// ============================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
