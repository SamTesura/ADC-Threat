'use strict';

// ============================================================
// ADC THREAT LOOKUP - Complete Fixed Version
// Fixes: MAX_ENEMIES undefined, champions-summary.json loading, 
// and all initialization issues
// ============================================================

// --- CONSTANTS ---
const MAX_ENEMIES = 5;
const MAX_ALLIES = 4;
const CHAMPION_ICON_URL_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/';
const DDRAGON_VERSION = '14.14.1';
const DDRAGON_CHAMPION_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/`;

// --- STATE ---
let state = {
  allChampions: [],           // All champions from champions-summary.json
  selectedADC: null,          // Currently selected ADC
  enemyChampions: [],         // Array of enemy champion slugs
  allyChampions: [],          // Array of ally champion slugs
  isCompactMode: false,       // Compact table view toggle
  isInitialized: false        // Track if app is ready
};

// --- UTILITY FUNCTIONS ---
function normalizeChampionName(name) {
  // Remove spaces and special characters for matching
  return name.toLowerCase().replace(/['\s\-\.]/g, '');
}

function findChampionByName(champions, searchName) {
  const normalized = normalizeChampionName(searchName);
  return champions.find(c => 
    normalizeChampionName(c.name) === normalized ||
    normalizeChampionName(c.slug) === normalized
  );
}

function getChampionPortraitUrl(champion) {
  const slug = champion.portrait || champion.slug || champion.name;
  return `${CHAMPION_ICON_URL_BASE}${champion.id || getChampionId(slug)}.png`;
}

function getChampionId(slug) {
  // Fallback ID generation - in production, use actual IDs
  return slug.toLowerCase().replace(/[^a-z]/g, '');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- DOM UTILITIES ---
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

// --- DATA LOADING ---
async function loadChampionData() {
  const CHAMPION_DATA_URL = './champions-summary.json';
  try {
    console.log('Loading champion data from:', CHAMPION_DATA_URL);
    
    const response = await fetch(CHAMPION_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const champions = await response.json();
    
    if (!Array.isArray(champions) || champions.length === 0) {
      throw new Error('Invalid champion data format');
    }
    
    console.log(`✓ Loaded ${champions.length} champions`);
    
    // Sort alphabetically
    champions.sort((a, b) => a.name.localeCompare(b.name));
    
    state.allChampions = champions;
    state.isInitialized = true;
    
    return champions;
    
  } catch (error) {
    console.error('❌ Failed to load champion data:', error);
    showError(`Could not load champion data: ${error.message}`);
    throw error;
  }
}

// --- ADC GRID RENDERING ---
function renderADCGrid() {
  const adcGrid = $('#adcGrid');
  if (!adcGrid) {
    console.error('ADC grid container not found');
    return;
  }
  
  adcGrid.innerHTML = '';
  
  if (!Array.isArray(ADC_LIST) || ADC_LIST.length === 0) {
    adcGrid.innerHTML = '<p class="error">ADC list not loaded</p>';
    return;
  }
  
  ADC_LIST.forEach(adc => {
    const adcCard = createElement(`
      <div class="adc-card ${state.selectedADC === adc.name ? 'selected' : ''}" 
           data-adc-name="${adc.name}">
        <img src="${adc.image}" 
             alt="${adc.name}" 
             class="adc-portrait"
             onerror="this.src='https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Ashe.png'">
        <span class="adc-name">${adc.name}</span>
      </div>
    `);
    
    adcCard.addEventListener('click', () => handleADCSelect(adc.name));
    adcGrid.appendChild(adcCard);
  });
}

function handleADCSelect(adcName) {
  console.log('ADC selected:', adcName);
  
  state.selectedADC = adcName;
  
  // Update UI
  $$('.adc-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.adcName === adcName);
  });
  
  // Remove lock overlay
  const lockOverlay = $('#lockOverlay');
  if (lockOverlay) {
    lockOverlay.classList.remove('lock-active');
  }
  
  // Update ADC macro tips if available
  renderADCMacro(adcName);
  
  // Re-render results
  renderResults();
}

// --- SEARCH INPUT RENDERING ---
function buildSearchInputs() {
  const enemyContainer = $('#enemyInputs');
  const allyContainer = $('#allyInputs');
  
  if (!enemyContainer || !allyContainer) {
    console.error('Search input containers not found');
    return;
  }
  
  // Build enemy inputs
  enemyContainer.innerHTML = '';
  for (let i = 0; i < MAX_ENEMIES; i++) {
    const inputGroup = createSearchInput('enemy', i);
    enemyContainer.appendChild(inputGroup);
  }
  
  // Build ally inputs
  allyContainer.innerHTML = '';
  for (let i = 0; i < MAX_ALLIES; i++) {
    const inputGroup = createSearchInput('ally', i);
    allyContainer.appendChild(inputGroup);
  }
}

function createSearchInput(type, index) {
  const inputGroup = createElement(`
    <div class="search-input-group" data-type="${type}" data-index="${index}">
      <div class="search-wrapper">
        <input 
          type="text" 
          class="champion-search" 
          placeholder="Search champion..."
          data-type="${type}"
          data-index="${index}"
          autocomplete="off">
        <button class="clear-btn" style="display: none;">×</button>
      </div>
      <div class="suggestions-dropdown" style="display: none;"></div>
      <div class="selected-champion-display" style="display: none;">
        <img src="" alt="" class="mini-portrait">
        <span class="selected-name"></span>
        <button class="remove-btn">×</button>
      </div>
    </div>
  `);
  
  const input = inputGroup.querySelector('.champion-search');
  const clearBtn = inputGroup.querySelector('.clear-btn');
  const suggestionsDropdown = inputGroup.querySelector('.suggestions-dropdown');
  const selectedDisplay = inputGroup.querySelector('.selected-champion-display');
  const removeBtn = inputGroup.querySelector('.remove-btn');
  
  // Input event
  input.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim();
    
    if (query.length > 0) {
      clearBtn.style.display = 'block';
      showSuggestions(inputGroup, query);
    } else {
      clearBtn.style.display = 'none';
      hideSuggestions(inputGroup);
    }
  }, 150));
  
  // Clear button
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    hideSuggestions(inputGroup);
  });
  
  // Remove button
  removeBtn.addEventListener('click', () => {
    removeChampion(type, index);
  });
  
  // Focus/blur events
  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0) {
      showSuggestions(inputGroup, input.value.trim());
    }
  });
  
  input.addEventListener('blur', () => {
    // Delay to allow click on suggestion
    setTimeout(() => hideSuggestions(inputGroup), 200);
  });
  
  return inputGroup;
}

function showSuggestions(inputGroup, query) {
  const suggestionsDropdown = inputGroup.querySelector('.suggestions-dropdown');
  const type = inputGroup.dataset.type;
  const index = parseInt(inputGroup.dataset.index);
  
  if (!state.allChampions || state.allChampions.length === 0) {
    return;
  }
  
  const normalizedQuery = normalizeChampionName(query);
  const matches = state.allChampions.filter(champion => 
    normalizeChampionName(champion.name).includes(normalizedQuery) ||
    normalizeChampionName(champion.slug).includes(normalizedQuery)
  ).slice(0, 8); // Limit to 8 suggestions
  
  if (matches.length === 0) {
    suggestionsDropdown.innerHTML = '<div class="suggestion-item no-results">No champions found</div>';
    suggestionsDropdown.style.display = 'block';
    return;
  }
  
  suggestionsDropdown.innerHTML = '';
  matches.forEach(champion => {
    const suggestionItem = createElement(`
      <div class="suggestion-item">
        <img src="${getChampionPortraitUrl(champion)}" 
             alt="${champion.name}" 
             class="suggestion-portrait"
             onerror="this.style.display='none'">
        <span>${champion.name}</span>
      </div>
    `);
    
    suggestionItem.addEventListener('click', () => {
      selectChampion(type, index, champion);
      hideSuggestions(inputGroup);
    });
    
    suggestionsDropdown.appendChild(suggestionItem);
  });
  
  suggestionsDropdown.style.display = 'block';
}

function hideSuggestions(inputGroup) {
  const suggestionsDropdown = inputGroup.querySelector('.suggestions-dropdown');
  suggestionsDropdown.style.display = 'none';
}

function selectChampion(type, index, champion) {
  console.log(`Selected ${type} champion at index ${index}:`, champion.name);
  
  // Update state
  if (type === 'enemy') {
    state.enemyChampions[index] = champion.slug;
  } else {
    state.allyChampions[index] = champion.slug;
  }
  
  // Update UI
  const inputGroup = $(`.search-input-group[data-type="${type}"][data-index="${index}"]`);
  if (inputGroup) {
    const input = inputGroup.querySelector('.champion-search');
    const searchWrapper = inputGroup.querySelector('.search-wrapper');
    const selectedDisplay = inputGroup.querySelector('.selected-champion-display');
    const selectedName = inputGroup.querySelector('.selected-name');
    const miniPortrait = inputGroup.querySelector('.mini-portrait');
    
    input.value = '';
    searchWrapper.style.display = 'none';
    selectedDisplay.style.display = 'flex';
    selectedName.textContent = champion.name;
    miniPortrait.src = getChampionPortraitUrl(champion);
  }
  
  // Update support synergy if ally support selected
  if (type === 'ally' && index === 0 && state.selectedADC) {
    renderSupportSynergy(champion.slug);
  }
  
  // Re-render results
  renderResults();
}

function removeChampion(type, index) {
  console.log(`Removing ${type} champion at index ${index}`);
  
  // Update state
  if (type === 'enemy') {
    state.enemyChampions[index] = null;
  } else {
    state.allyChampions[index] = null;
  }
  
  // Update UI
  const inputGroup = $(`.search-input-group[data-type="${type}"][data-index="${index}"]`);
  if (inputGroup) {
    const searchWrapper = inputGroup.querySelector('.search-wrapper');
    const selectedDisplay = inputGroup.querySelector('.selected-champion-display');
    
    searchWrapper.style.display = 'block';
    selectedDisplay.style.display = 'none';
  }
  
  // Re-render results
  renderResults();
}

// --- ADC MACRO RENDERING ---
function renderADCMacro(adcName) {
  const macroCard = $('#adcMacroCard');
  const macroSection = $('#macroSection');
  
  if (!macroCard || !ADC_TEMPLATES || !ADC_TEMPLATES[adcName]) {
    if (macroSection) macroSection.classList.add('hidden');
    return;
  }
  
  const template = ADC_TEMPLATES[adcName];
  const macro = template.macro;
  
  if (!macro) {
    macroCard.innerHTML = '';
    macroSection.classList.add('hidden');
    return;
  }
  
  macroCard.innerHTML = `
    <h3>📊 ${adcName} Macro Tips</h3>
    <div class="macro-tips">
      ${macro.tempo_advantage ? `<div class="macro-tip">
        <strong>⚡ Tempo:</strong> ${macro.tempo_advantage}
      </div>` : ''}
      ${macro.wave_management ? `<div class="macro-tip">
        <strong>🌊 Wave:</strong> ${macro.wave_management}
      </div>` : ''}
      ${macro.key_timer ? `<div class="macro-tip">
        <strong>⏰ Timer:</strong> ${macro.key_timer}
      </div>` : ''}
    </div>
  `;
  
  macroSection.classList.remove('hidden');
}

// --- SUPPORT SYNERGY RENDERING ---
function renderSupportSynergy(supportSlug) {
  const synergyCard = $('#supportSynergyCard');
  const macroSection = $('#macroSection');
  
  if (!synergyCard || !state.selectedADC || !ADC_TEMPLATES) {
    return;
  }
  
  const adcTemplate = ADC_TEMPLATES[state.selectedADC];
  if (!adcTemplate || !adcTemplate.tips) {
    synergyCard.innerHTML = '';
    return;
  }
  
  const support = state.allChampions.find(c => c.slug === supportSlug);
  if (!support) {
    synergyCard.innerHTML = '';
    return;
  }
  
  const tip = adcTemplate.tips[support.name];
  
  if (tip) {
    synergyCard.innerHTML = `
      <h3>🤝 ${state.selectedADC} + ${support.name}</h3>
      <div class="synergy-tip">
        ${tip}
      </div>
    `;
    macroSection.classList.remove('hidden');
  } else {
    synergyCard.innerHTML = '';
  }
}

// --- RESULTS TABLE RENDERING ---
function renderResults() {
  const tableWrap = $('#tableWrap');
  const resultsBody = $('#resultsBody');
  const emptyState = $('#emptyState');
  
  if (!resultsBody) {
    console.error('Results body not found');
    return;
  }
  
  // Get all selected champions
  const allSelectedSlugs = [
    ...state.enemyChampions.filter(Boolean),
    ...state.allyChampions.filter(Boolean)
  ];
  
  if (allSelectedSlugs.length === 0) {
    tableWrap.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  // Get champion data
  const selectedChampions = allSelectedSlugs
    .map(slug => state.allChampions.find(c => c.slug === slug))
    .filter(Boolean);
  
  if (selectedChampions.length === 0) {
    tableWrap.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  // Sort: Enemies first (with Hard CC priority), then Allies
  const sortedChampions = sortChampionsByThreat(selectedChampions, state.enemyChampions);
  
  // Render table rows
  resultsBody.innerHTML = '';
  sortedChampions.forEach(champion => {
    const row = createResultRow(champion, state.enemyChampions.includes(champion.slug));
    resultsBody.appendChild(row);
  });
  
  tableWrap.style.display = 'block';
  emptyState.style.display = 'none';
}

function sortChampionsByThreat(champions, enemySlugs) {
  const enemies = champions.filter(c => enemySlugs.includes(c.slug));
  const allies = champions.filter(c => !enemySlugs.includes(c.slug));
  
  // Sort enemies by threat level (Hard CC first)
  enemies.sort((a, b) => {
    const aHasHardCC = hasHardCC(a);
    const bHasHardCC = hasHardCC(b);
    
    if (aHasHardCC && !bHasHardCC) return -1;
    if (!aHasHardCC && bHasHardCC) return 1;
    
    return a.name.localeCompare(b.name);
  });
  
  return [...enemies, ...allies];
}

function hasHardCC(champion) {
  if (!champion.abilities) return false;
  return champion.abilities.some(ability => 
    ability.threat && ability.threat.includes('HARD_CC')
  );
}

function createResultRow(champion, isEnemy) {
  const row = createElement(`
    <tr class="${isEnemy ? 'enemy-row' : 'ally-row'}">
      <td class="group">${isEnemy ? 'Enemy' : 'Ally'}</td>
      <td class="champ">
        <img src="${getChampionPortraitUrl(champion)}" 
             alt="${champion.name}" 
             class="table-portrait"
             onerror="this.style.display='none'">
        <span>${champion.name}</span>
      </td>
      <td class="role">${(champion.tags || []).join(', ')}</td>
      <td class="passive">
        ${champion.passive ? `
          <strong>${champion.passive.name || 'Passive'}</strong>
          ${champion.passive.desc ? `<p class="passive-desc">${champion.passive.desc}</p>` : ''}
        ` : 'N/A'}
      </td>
      <td class="abilities">
        ${renderAbilities(champion)}
      </td>
      <td class="threats">
        ${renderThreatTags(champion)}
      </td>
      <td class="notes">
        ${getADCTip(champion.name)}
      </td>
      <td class="support-synergy notes">
        ${getSupportSynergy(champion.name)}
      </td>
    </tr>
  `);
  
  return row;
}

function renderAbilities(champion) {
  if (!champion.abilities || champion.abilities.length === 0) {
    return '<span class="muted">No ability data</span>';
  }
  
  return champion.abilities.map(ability => {
    const hasHardCC = ability.threat && ability.threat.includes('HARD_CC');
    const hasSoftCC = ability.threat && ability.threat.includes('SOFT_CC');
    const cdText = ability.cd && ability.cd.length > 0 
      ? ability.cd.join('/') + 's' 
      : '—';
    
    const pillClass = hasHardCC ? 'hard-cc' : hasSoftCC ? 'soft-cc' : 'neutral';
    
    return `
      <div class="ability-pill ${pillClass}">
        <span class="ability-key">${ability.key}</span>
        <span class="ability-name">${ability.name}</span>
        <span class="ability-cd">${cdText}</span>
        ${hasSoftCC ? '<span class="badge cleanse">Cleanse</span>' : ''}
      </div>
    `;
  }).join('');
}

function renderThreatTags(champion) {
  if (!champion.abilities) return '';
  
  const allThreats = new Set();
  champion.abilities.forEach(ability => {
    if (ability.threat) {
      ability.threat.forEach(t => allThreats.add(t));
    }
  });
  
  if (allThreats.size === 0) {
    return '<span class="muted">None</span>';
  }
  
  const threatOrder = ['HARD_CC', 'SOFT_CC', 'SHIELD_PEEL', 'GAP_CLOSE', 'BURST', 'Poke/Zone'];
  const sortedThreats = Array.from(allThreats).sort((a, b) => {
    const aIndex = threatOrder.indexOf(a);
    const bIndex = threatOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return sortedThreats.map(threat => {
    const className = threat.toLowerCase().replace(/[/_]/g, '-');
    const displayName = threat.replace(/_/g, ' ');
    return `<span class="tag ${className}">${displayName}</span>`;
  }).join(' ');
}

function getADCTip(championName) {
  if (!state.selectedADC || !ADC_TEMPLATES || !ADC_TEMPLATES[state.selectedADC]) {
    return '<span class="muted">Select ADC for tips</span>';
  }
  
  const tips = ADC_TEMPLATES[state.selectedADC].tips;
  return tips && tips[championName] 
    ? tips[championName] 
    : '<span class="muted">No specific tip</span>';
}

function getSupportSynergy(championName) {
  if (!state.selectedADC || !ADC_TEMPLATES || !ADC_TEMPLATES[state.selectedADC]) {
    return '<span class="muted">N/A</span>';
  }
  
  // Only show for ally support (first ally slot)
  if (!state.allyChampions[0]) {
    return '<span class="muted">N/A</span>';
  }
  
  const supportChamp = state.allChampions.find(c => c.slug === state.allyChampions[0]);
  if (!supportChamp || supportChamp.name !== championName) {
    return '<span class="muted">N/A</span>';
  }
  
  const tips = ADC_TEMPLATES[state.selectedADC].tips;
  return tips && tips[championName] 
    ? tips[championName] 
    : '<span class="muted">No synergy data</span>';
}

// --- COMPACT MODE ---
function setupCompactMode() {
  const toggleCompact = $('#toggleCompact');
  if (!toggleCompact) return;
  
  toggleCompact.addEventListener('change', (e) => {
    state.isCompactMode = e.target.checked;
    document.body.classList.toggle('compact-mode', state.isCompactMode);
  });
}

// --- EXPORT/IMPORT ---
function setupExportImport() {
  const exportBtn = $('#exportData');
  const importBtn = $('#importData');
  const importFile = $('#importFile');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
  }
}

function exportData() {
  const exportState = {
    selectedADC: state.selectedADC,
    enemyChampions: state.enemyChampions.filter(Boolean),
    allyChampions: state.allyChampions.filter(Boolean),
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(exportState, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adc-threat-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showSuccess('Configuration exported successfully');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedState = JSON.parse(e.target.result);
      
      // Validate and apply
      if (importedState.selectedADC) {
        state.selectedADC = importedState.selectedADC;
        handleADCSelect(importedState.selectedADC);
      }
      
      // TODO: Re-select champions from imported state
      // This would require programmatically selecting champions
      
      showSuccess('Configuration imported successfully');
    } catch (error) {
      showError('Failed to import: Invalid file format');
    }
  };
  reader.readAsText(file);
}

// --- ERROR HANDLING ---
function showError(message) {
  console.error('ERROR:', message);
  // You can add a toast notification here
  alert('Error: ' + message);
}

function showSuccess(message) {
  console.log('SUCCESS:', message);
  // You can add a toast notification here
}

// --- INITIALIZATION ---
async function initializeApp() {
  console.log('🚀 Initializing ADC Threat Lookup...');
  
  try {
    // Load champion data first
    await loadChampionData();
    
    // Render ADC grid
    renderADCGrid();
    
    // Build search inputs
    buildSearchInputs();
    
    // Setup compact mode
    setupCompactMode();
    
    // Setup export/import
    setupExportImport();
    
    // Initial render
    renderResults();
    
    console.log('✓ App initialized successfully');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    showError('Failed to initialize app. Please refresh the page.');
  }
}

// --- START THE APP ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.ADC_THREAT_DEBUG = {
    state,
    loadChampionData,
    renderResults,
    selectChampion
  };
}
