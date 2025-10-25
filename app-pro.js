/**
 * ADC Threat Pro - Professional Application
 * Enterprise-grade bot lane analytics with auto-updates
 */

'use strict';

// =============================================================================
// Application State
// =============================================================================

const AppState = {
  // Core data
  champions: [],
  selectedADC: null,
  enemyTeam: [],
  allyTeam: [],
  
  // UI state
  theme: 'dark',
  compactView: false,
  isInitialized: false,
  
  // Patch info
  currentPatch: 'Loading...',
  lastUpdate: null,
  
  // Settings
  autoUpdate: true,
  settings: {},
  
  // Filters
  adcFilter: 'all',
  adcSearchQuery: ''
};

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 ADC Threat Pro initializing...');
  
  try {
    // Show loading screen
    showLoadingProgress(0, 'Initializing...');
    
    // Initialize patch updater
    showLoadingProgress(20, 'Checking patch version...');
    const patchData = await window.patchUpdater.initialize();
    
    AppState.champions = patchData.champions;
    AppState.currentPatch = patchData.version;
    AppState.lastUpdate = new Date();
    
    showLoadingProgress(40, 'Loading champion data...');
    
    // Merge with local champion data if available
    if (typeof window.ADC_LIST !== 'undefined') {
      mergeChampionData();
    }
    
    showLoadingProgress(60, 'Setting up interface...');
    
    // Initialize UI components
    initializeUI();
    
    showLoadingProgress(80, 'Loading settings...');
    
    // Load saved settings
    loadSettings();
    
    showLoadingProgress(100, 'Ready!');
    
    // Hide loading screen
    setTimeout(() => {
      hideLoadingScreen();
      AppState.isInitialized = true;
      console.log('✅ Application initialized successfully');
      
      // Show update notification if needed
      if (patchData.isUpdate) {
        showToast('success', 'Updated!', `Champion data updated to patch ${patchData.version}`);
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    showLoadingProgress(100, 'Failed to initialize');
    setTimeout(() => {
      hideLoadingScreen();
      showToast('error', 'Initialization Failed', error.message);
    }, 1000);
  }
});

// =============================================================================
// UI Initialization
// =============================================================================

function initializeUI() {
  // Theme system
  initializeTheme();
  
  // Navigation
  setupNavigation();
  
  // ADC selection
  renderADCGrid();
  setupADCSearch();
  
  // Team composition
  renderTeamInputs();
  
  // Modals
  setupModals();
  
  // Event listeners
  setupEventListeners();
}

function setupNavigation() {
  // Patch info button
  const patchBtn = document.getElementById('patchInfoBtn');
  const patchBadge = document.getElementById('patchBadge');
  
  if (patchBadge) {
    patchBadge.textContent = `Patch ${AppState.currentPatch}`;
    document.getElementById('heroPatchVersion').textContent = AppState.currentPatch;
  }
  
  if (patchBtn) {
    patchBtn.addEventListener('click', () => openModal('patchModal'));
  }
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openModal('settingsModal'));
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function setupEventListeners() {
  // ADC filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      AppState.adcFilter = e.target.dataset.filter;
      filterADCGrid();
    });
  });
  
  // Clear team buttons
  const clearEnemies = document.getElementById('clearEnemies');
  const clearAllies = document.getElementById('clearAllies');
  
  if (clearEnemies) {
    clearEnemies.addEventListener('click', () => {
      AppState.enemyTeam = [];
      renderTeamInputs();
      renderResults();
    });
  }
  
  if (clearAllies) {
    clearAllies.addEventListener('click', () => {
      AppState.allyTeam = [];
      renderTeamInputs();
      renderResults();
      hideSynergySection();
    });
  }
  
  // Compact view toggle
  const compactToggle = document.getElementById('compactViewToggle');
  if (compactToggle) {
    compactToggle.addEventListener('change', (e) => {
      AppState.compactView = e.target.checked;
      document.body.classList.toggle('compact-view', e.target.checked);
      renderResults();
    });
  }
  
  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  // Settings modal controls
  setupSettingsControls();
}

// =============================================================================
// ADC Grid
// =============================================================================

function renderADCGrid() {
  const grid = document.getElementById('adcGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Use ADC_LIST if available, otherwise filter champions by role
  const adcs = typeof window.ADC_LIST !== 'undefined' 
    ? window.ADC_LIST 
    : AppState.champions.filter(c => c.tags && (c.tags.includes('Marksman') || c.tags.includes('Mage')));
  
  adcs.forEach(adc => {
    const card = createADCCard(adc);
    grid.appendChild(card);
  });
  
  // Update champion count
  const countEl = document.getElementById('championCount');
  if (countEl) {
    countEl.textContent = AppState.champions.length;
  }
}

function createADCCard(adc) {
  const card = document.createElement('div');
  card.className = 'adc-card';
  card.dataset.name = adc.name;
  card.dataset.tags = (adc.tags || []).join(',');
  
  const img = document.createElement('img');
  img.className = 'adc-portrait';
  img.src = adc.image || adc.splash || `https://ddragon.leagueoflegends.com/cdn/${AppState.currentPatch}/img/champion/${adc.slug || adc.name}.png`;
  img.alt = adc.name;
  img.onerror = () => {
    img.src = 'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\"%3E%3Crect fill=\"%23374151\" width=\"80\" height=\"80\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%239CA3AF\" font-family=\"sans-serif\" font-size=\"14\"%3E' + adc.name.charAt(0) + '%3C/text%3E%3C/svg%3E';
  };
  
  const name = document.createElement('span');
  name.className = 'adc-name';
  name.textContent = adc.name;
  
  card.appendChild(img);
  card.appendChild(name);
  
  card.addEventListener('click', () => selectADC(adc));
  
  return card;
}

function selectADC(adc) {
  console.log('ADC selected:', adc.name);
  
  AppState.selectedADC = adc;
  
  // Update UI
  document.querySelectorAll('.adc-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.name === adc.name);
  });
  
  // Unlock team composition
  const sectionLock = document.getElementById('sectionLock');
  if (sectionLock) {
    sectionLock.classList.add('hidden');
  }
  
  // Re-render results
  renderResults();
  
  // Update synergy if support selected
  if (AppState.allyTeam[0]) {
    updateSynergyAnalysis();
  }
  
  showToast('info', 'ADC Selected', `Playing as ${adc.name}`);
}

function setupADCSearch() {
  const searchInput = document.getElementById('adcSearchInput');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', debounce((e) => {
    AppState.adcSearchQuery = e.target.value.toLowerCase();
    filterADCGrid();
  }, 200));
}

function filterADCGrid() {
  const cards = document.querySelectorAll('.adc-card');
  
  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const tags = card.dataset.tags.toLowerCase();
    const matchesSearch = name.includes(AppState.adcSearchQuery);
    const matchesFilter = AppState.adcFilter === 'all' || tags.includes(AppState.adcFilter.toLowerCase());
    
    card.classList.toggle('hidden', !(matchesSearch && matchesFilter));
  });
}

// =============================================================================
// Team Composition
// =============================================================================

function renderTeamInputs() {
  renderEnemyInputs();
  renderAllyInputs();
  updateTeamCounts();
}

function renderEnemyInputs() {
  const container = document.getElementById('enemyInputs');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
    const input = createChampionInput('enemy', i);
    container.appendChild(input);
  }
}

function renderAllyInputs() {
  const container = document.getElementById('allyInputs');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 4; i++) {
    const input = createChampionInput('ally', i);
    container.appendChild(input);
  }
}

function createChampionInput(team, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'champion-input-wrapper';
  wrapper.dataset.team = team;
  wrapper.dataset.index = index;
  
  const selected = team === 'enemy' ? AppState.enemyTeam[index] : AppState.allyTeam[index];
  
  if (selected) {
    wrapper.appendChild(createSelectedChampion(selected, team, index));
  } else {
    wrapper.appendChild(createSearchInput(team, index));
  }
  
  return wrapper;
}

function createSearchInput(team, index) {
  const container = document.createElement('div');
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'champion-input';
  input.placeholder = team === 'enemy' ? `Enemy ${index + 1}` : (index === 0 ? 'Support' : `Ally ${index + 1}`);
  input.autocomplete = 'off';
  
  const dropdown = document.createElement('div');
  dropdown.className = 'suggestions-dropdown';
  dropdown.style.display = 'none';
  
  input.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length > 0) {
      showSuggestions(dropdown, query, team, index);
    } else {
      dropdown.style.display = 'none';
    }
  }, 150));
  
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.style.display = 'none', 200);
  });
  
  container.appendChild(input);
  container.appendChild(dropdown);
  
  return container;
}

function showSuggestions(dropdown, query, team, index) {
  const matches = AppState.champions.filter(champ => 
    champ.name.toLowerCase().includes(query) ||
    (champ.slug && champ.slug.toLowerCase().includes(query))
  ).slice(0, 8);
  
  if (matches.length === 0) {
    dropdown.innerHTML = '<div class=\"suggestion-item\">No matches found</div>';
    dropdown.style.display = 'block';
    return;
  }
  
  dropdown.innerHTML = '';
  matches.forEach(champ => {
    const item = createSuggestionItem(champ, team, index);
    dropdown.appendChild(item);
  });
  dropdown.style.display = 'block';
}

function createSuggestionItem(champ, team, index) {
  const item = document.createElement('div');
  item.className = 'suggestion-item';
  
  const img = document.createElement('img');
  img.className = 'suggestion-avatar';
  img.src = champ.image || `https://ddragon.leagueoflegends.com/cdn/${AppState.currentPatch}/img/champion/${champ.slug || champ.name}.png`;
  img.alt = champ.name;
  
  const name = document.createElement('span');
  name.className = 'suggestion-name';
  name.textContent = champ.name;
  
  item.appendChild(img);
  item.appendChild(name);
  
  item.addEventListener('click', () => selectChampion(champ, team, index));
  
  return item;
}

function createSelectedChampion(champ, team, index) {
  const container = document.createElement('div');
  container.className = 'champion-selected';
  
  const img = document.createElement('img');
  img.className = 'champion-avatar';
  img.src = champ.image || `https://ddragon.leagueoflegends.com/cdn/${AppState.currentPatch}/img/champion/${champ.slug || champ.name}.png`;
  img.alt = champ.name;
  
  const info = document.createElement('div');
  info.className = 'champion-info';
  
  const name = document.createElement('div');
  name.className = 'champion-name';
  name.textContent = champ.name;
  
  const role = document.createElement('div');
  role.className = 'champion-role';
  role.textContent = (champ.tags || ['Champion']).join(', ');
  
  info.appendChild(name);
  info.appendChild(role);
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'champion-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', () => removeChampion(team, index));
  
  container.appendChild(img);
  container.appendChild(info);
  container.appendChild(removeBtn);
  
  return container;
}

function selectChampion(champ, team, index) {
  console.log(`Selected ${champ.name} for ${team} slot ${index}`);
  
  if (team === 'enemy') {
    AppState.enemyTeam[index] = champ;
  } else {
    AppState.allyTeam[index] = champ;
  }
  
  renderTeamInputs();
  renderResults();
  updateTeamCounts();
  
  // Update synergy if support (first ally)
  if (team === 'ally' && index === 0 && AppState.selectedADC) {
    updateSynergyAnalysis();
  }
  
  showToast('success', 'Champion Added', `${champ.name} added to ${team} team`);
}

function removeChampion(team, index) {
  if (team === 'enemy') {
    AppState.enemyTeam[index] = null;
  } else {
    AppState.allyTeam[index] = null;
  }
  
  renderTeamInputs();
  renderResults();
  updateTeamCounts();
  
  if (team === 'ally' && index === 0) {
    hideSynergySection();
  }
}

function updateTeamCounts() {
  const enemyCount = AppState.enemyTeam.filter(Boolean).length;
  const allyCount = AppState.allyTeam.filter(Boolean).length;
  
  const enemyCountEl = document.getElementById('enemyCount');
  const allyCountEl = document.getElementById('allyCount');
  
  if (enemyCountEl) enemyCountEl.textContent = `${enemyCount}/5`;
  if (allyCountEl) allyCountEl.textContent = `${allyCount}/4`;
}

// =============================================================================
// Synergy Analysis
// =============================================================================

function updateSynergyAnalysis() {
  if (!AppState.selectedADC || !AppState.allyTeam[0]) {
    hideSynergySection();
    return;
  }
  
  const support = AppState.allyTeam[0];
  const synergy = window.synergyEngine.analyzeSynergy(AppState.selectedADC.name, support.name);
  
  if (!synergy) {
    hideSynergySection();
    return;
  }
  
  renderSynergySection(synergy, support);
}

function renderSynergySection(synergy, support) {
  const section = document.getElementById('synergySection');
  const content = document.getElementById('synergyContent');
  const rating = document.getElementById('synergyRating');
  
  if (!section || !content) return;
  
  // Set rating
  if (rating) {
    rating.textContent = getSynergyRatingText(synergy.rating);
    rating.className = 'synergy-badge ' + getSynergyRatingClass(synergy.rating);
  }
  
  // Render content
  content.innerHTML = `
    <div class=\"synergy-card\">
      <div class=\"synergy-card-header\">
        <svg class=\"synergy-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
          <path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\" stroke-width=\"2\"/>
          <circle cx=\"9\" cy=\"7\" r=\"4\" stroke-width=\"2\"/>
        </svg>
        <h4>${AppState.selectedADC.name} + ${support.name}</h4>
      </div>
      <p>${synergy.summary}</p>
    </div>
    
    <div class=\"synergy-card\">
      <div class=\"synergy-card-header\">
        <svg class=\"synergy-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
          <polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>
        </svg>
        <h4>Laning Phase Strategy</h4>
      </div>
      <div class=\"synergy-tips\">
        <div class=\"synergy-tip\">
          <svg class=\"synergy-tip-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
            <circle cx=\"12\" cy=\"12\" r=\"10\" stroke-width=\"2\"/>
            <polyline points=\"12 6 12 12 16 14\" stroke-width=\"2\" stroke-linecap=\"round\"/>
          </svg>
          <div class=\"synergy-tip-text\">
            <strong>Levels 1-3:</strong> ${synergy.laningPhase.level1_3}
          </div>
        </div>
        <div class=\"synergy-tip\">
          <svg class=\"synergy-tip-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
            <circle cx=\"12\" cy=\"12\" r=\"10\" stroke-width=\"2\"/>
            <polyline points=\"12 6 12 12 16 14\" stroke-width=\"2\" stroke-linecap=\"round\"/>
          </svg>
          <div class=\"synergy-tip-text\">
            <strong>Levels 4-6:</strong> ${synergy.laningPhase.level4_6}
          </div>
        </div>
        <div class=\"synergy-tip\">
          <svg class=\"synergy-tip-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
            <circle cx=\"12\" cy=\"12\" r=\"10\" stroke-width=\"2\"/>
            <polyline points=\"12 6 12 12 16 14\" stroke-width=\"2\" stroke-linecap=\"round\"/>
          </svg>
          <div class=\"synergy-tip-text\">
            <strong>Levels 7+:</strong> ${synergy.laningPhase.level7_9}
          </div>
        </div>
      </div>
    </div>
    
    <div class=\"synergy-card\">
      <div class=\"synergy-card-header\">
        <svg class=\"synergy-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
          <path d=\"M12 20l9-11-9-9-9 9 9 11z\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>
        </svg>
        <h4>Challenger Tips</h4>
      </div>
      <div class=\"synergy-tips\">
        ${synergy.challengerTips.map(tip => `
          <div class=\"synergy-tip\">
            <svg class=\"synergy-tip-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\">
              <polyline points=\"20 6 9 17 4 12\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>
            </svg>
            <div class=\"synergy-tip-text\">${tip}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  section.classList.remove('hidden');
}

function hideSynergySection() {
  const section = document.getElementById('synergySection');
  if (section) {
    section.classList.add('hidden');
  }
}

function getSynergyRatingText(rating) {
  if (rating >= 90) return 'Excellent';
  if (rating >= 80) return 'Very Good';
  if (rating >= 70) return 'Good';
  if (rating >= 60) return 'Average';
  return 'Below Average';
}

function getSynergyRatingClass(rating) {
  if (rating >= 80) return 'excellent';
  if (rating >= 70) return 'good';
  if (rating >= 60) return 'average';
  return 'below-average';
}

// =============================================================================
// Results Table
// =============================================================================

function renderResults() {
  const resultsEmpty = document.getElementById('resultsEmpty');
  const resultsTable = document.getElementById('resultsTable');
  const tbody = document.getElementById('threatTableBody');
  
  if (!tbody) return;
  
  const allChampions = [
    ...AppState.enemyTeam.filter(Boolean),
    ...AppState.allyTeam.filter(Boolean)
  ];
  
  if (allChampions.length === 0) {
    resultsEmpty.classList.remove('hidden');
    resultsTable.classList.add('hidden');
    return;
  }
  
  resultsEmpty.classList.add('hidden');
  resultsTable.classList.remove('hidden');
  
  tbody.innerHTML = '';
  
  // Sort: enemies first (hard CC priority), then allies
  const sorted = sortChampionsByThreat(allChampions);
  
  sorted.forEach(champ => {
    const row = createResultRow(champ);
    tbody.appendChild(row);
  });
}

function sortChampionsByThreat(champions) {
  const enemies = champions.filter(c => AppState.enemyTeam.includes(c));
  const allies = champions.filter(c => AppState.allyTeam.includes(c));
  
  // Sort enemies by threat (hard CC first)
  enemies.sort((a, b) => {
    const aHardCC = hasHardCC(a);
    const bHardCC = hasHardCC(b);
    if (aHardCC && !bHardCC) return -1;
    if (!aHardCC && bHardCC) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return [...enemies, ...allies];
}

function hasHardCC(champion) {
  // Check if champion has hard CC abilities
  if (!champion.abilities) return false;
  return champion.abilities.some(ability => 
    ability.threat && ability.threat.includes('HARD_CC')
  );
}

function createResultRow(champion) {
  const tr = document.createElement('tr');
  const isEnemy = AppState.enemyTeam.includes(champion);
  tr.className = isEnemy ? 'enemy-row' : 'ally-row';
  
  // Team badge
  const tdTeam = document.createElement('td');
  tdTeam.className = 'col-team';
  const teamBadge = document.createElement('span');
  teamBadge.className = `team-badge ${isEnemy ? 'enemy' : 'ally'}`;
  teamBadge.textContent = isEnemy ? 'Enemy' : 'Ally';
  tdTeam.appendChild(teamBadge);
  
  // Champion
  const tdChamp = document.createElement('td');
  tdChamp.className = 'col-champion';
  const champCell = document.createElement('div');
  champCell.className = 'champion-cell';
  const champImg = document.createElement('img');
  champImg.className = 'table-avatar';
  champImg.src = champion.image || `https://ddragon.leagueoflegends.com/cdn/${AppState.currentPatch}/img/champion/${champion.slug || champion.name}.png`;
  champImg.alt = champion.name;
  const champName = document.createElement('div');
  champName.textContent = champion.name;
  champCell.appendChild(champImg);
  champCell.appendChild(champName);
  tdChamp.appendChild(champCell);
  
  // Role
  const tdRole = document.createElement('td');
  tdRole.className = 'col-role';
  tdRole.textContent = (champion.tags || []).join(', ');
  
  // Passive (placeholder - enhance with actual data)
  const tdPassive = document.createElement('td');
  tdPassive.className = 'col-passive';
  tdPassive.textContent = champion.passive || 'N/A';
  
  // Abilities (placeholder - enhance with actual data)
  const tdAbilities = document.createElement('td');
  tdAbilities.className = 'col-abilities';
  if (champion.abilities && champion.abilities.length > 0) {
    const abilityPills = document.createElement('div');
    abilityPills.className = 'ability-pills';
    // Add ability pills here
    tdAbilities.appendChild(abilityPills);
  } else {
    tdAbilities.textContent = 'Loading...';
  }
  
  // Threat tags (placeholder)
  const tdThreats = document.createElement('td');
  tdThreats.className = 'col-threats';
  tdThreats.innerHTML = '<span class=\"threat-tag hard-cc\">Hard CC</span>';
  
  // ADC tips
  const tdTips = document.createElement('td');
  tdTips.className = 'col-notes';
  tdTips.textContent = getADCTip(champion.name);
  
  // Support synergy
  const tdSynergy = document.createElement('td');
  tdSynergy.className = 'col-synergy';
  tdSynergy.textContent = getSupportSynergy(champion.name);
  
  tr.appendChild(tdTeam);
  tr.appendChild(tdChamp);
  tr.appendChild(tdRole);
  tr.appendChild(tdPassive);
  tr.appendChild(tdAbilities);
  tr.appendChild(tdThreats);
  tr.appendChild(tdTips);
  tr.appendChild(tdSynergy);
  
  return tr;
}

function getADCTip(championName) {
  if (!AppState.selectedADC || !window.ADC_TEMPLATES) {
    return 'Select your ADC for tips';
  }
  
  const template = window.ADC_TEMPLATES[AppState.selectedADC.name];
  if (!template || !template.tips) {
    return 'No tip available';
  }
  
  return template.tips[championName] || 'No specific tip';
}

function getSupportSynergy(championName) {
  if (!AppState.allyTeam[0]) {
    return 'N/A';
  }
  
  const support = AppState.allyTeam[0];
  if (support.name !== championName) {
    return 'N/A';
  }
  
  const synergy = window.synergyEngine?.analyzeSynergy(AppState.selectedADC?.name, championName);
  return synergy ? `${synergy.rating}% synergy` : 'N/A';
}

// =============================================================================
// Theme System
// =============================================================================

function initializeTheme() {
  const savedTheme = localStorage.getItem('adc_threat_theme') || 'dark';
  AppState.theme = savedTheme;
  applyTheme(savedTheme);
}

function toggleTheme() {
  const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
  AppState.theme = newTheme;
  applyTheme(newTheme);
  localStorage.setItem('adc_threat_theme', newTheme);
}

function applyTheme(theme) {
  document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
}

// =============================================================================
// Modals
// =============================================================================

function setupModals() {
  // Settings modal
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const settingsOverlay = document.getElementById('settingsOverlay');
  
  if (closeSettings) {
    closeSettings.addEventListener('click', () => closeModal('settingsModal'));
  }
  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', () => closeModal('settingsModal'));
  }
  
  // Patch modal
  const patchModal = document.getElementById('patchModal');
  const closePatch = document.getElementById('closePatch');
  const patchOverlay = document.getElementById('patchOverlay');
  
  if (closePatch) {
    closePatch.addEventListener('click', () => closeModal('patchModal'));
  }
  if (patchOverlay) {
    patchOverlay.addEventListener('click', () => closeModal('patchModal'));
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.add('active');
  
  // Load content for specific modals
  if (modalId === 'patchModal') {
    loadPatchInfo();
  } else if (modalId === 'settingsModal') {
    updateSettingsModal();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function loadPatchInfo() {
  const body = document.getElementById('patchModalBody');
  if (!body) return;
  
  body.innerHTML = `
    <div class=\"patch-info\">
      <h3>Current Patch: ${AppState.currentPatch}</h3>
      <p><strong>Last Updated:</strong> ${AppState.lastUpdate ? AppState.lastUpdate.toLocaleString() : 'Unknown'}</p>
      <p><strong>Champions Loaded:</strong> ${AppState.champions.length}</p>
      <p><strong>Auto-Updates:</strong> ${AppState.autoUpdate ? 'Enabled' : 'Disabled'}</p>
      
      <div class=\"patch-actions\" style=\"margin-top: 20px;\">
        <button class=\"setting-btn\" id=\"checkPatchUpdate\">Check for Updates</button>
      </div>
      
      <div id=\"patchUpdateResult\" style=\"margin-top: 20px;\"></div>
    </div>
  `;
  
  const checkBtn = document.getElementById('checkPatchUpdate');
  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      checkBtn.disabled = true;
      checkBtn.textContent = 'Checking...';
      
      try {
        const result = await window.patchUpdater.checkForUpdates();
        const resultDiv = document.getElementById('patchUpdateResult');
        
        if (result.isAvailable) {
          resultDiv.innerHTML = `
            <div style=\"padding: 15px; background: #10B981; color: white; border-radius: 8px;\">
              <strong>Update Available!</strong><br>
              Current: ${result.current} → Latest: ${result.latest}
            </div>
          `;
        } else {
          resultDiv.innerHTML = `
            <div style=\"padding: 15px; background: #374151; border-radius: 8px;\">
              You're up to date! (${result.current})
            </div>
          `;
        }
      } catch (error) {
        const resultDiv = document.getElementById('patchUpdateResult');
        resultDiv.innerHTML = `
          <div style=\"padding: 15px; background: #EF4444; color: white; border-radius: 8px;\">
            Error: ${error.message}
          </div>
        `;
      } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check for Updates';
      }
    });
  }
}

function updateSettingsModal() {
  const patchVersion = document.getElementById('settingsPatchVersion');
  const lastUpdate = document.getElementById('settingsLastUpdate');
  const championCount = document.getElementById('settingsChampionCount');
  
  if (patchVersion) patchVersion.textContent = AppState.currentPatch;
  if (lastUpdate) lastUpdate.textContent = AppState.lastUpdate ? AppState.lastUpdate.toLocaleString() : '—';
  if (championCount) championCount.textContent = AppState.champions.length;
}

function setupSettingsControls() {
  // Theme select
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = AppState.theme;
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      } else {
        applyTheme(theme);
        AppState.theme = theme;
        localStorage.setItem('adc_threat_theme', theme);
      }
    });
  }
  
  // Auto-update toggle
  const autoUpdateToggle = document.getElementById('autoUpdateToggle');
  if (autoUpdateToggle) {
    autoUpdateToggle.checked = AppState.autoUpdate;
    autoUpdateToggle.addEventListener('change', (e) => {
      AppState.autoUpdate = e.target.checked;
      localStorage.setItem('adc_threat_auto_update', e.target.checked);
    });
  }
  
  // Check updates button
  const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
  if (checkUpdatesBtn) {
    checkUpdatesBtn.addEventListener('click', async () => {
      checkUpdatesBtn.disabled = true;
      checkUpdatesBtn.textContent = 'Checking...';
      
      try {
        await window.patchUpdater.update();
        location.reload();
      } catch (error) {
        showToast('error', 'Update Failed', error.message);
      } finally {
        checkUpdatesBtn.disabled = false;
        checkUpdatesBtn.textContent = 'Check Now';
      }
    });
  }
  
  // Clear cache button
  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      if (confirm('Clear all cached data? This will reload the page.')) {
        window.patchUpdater.clearCache();
        localStorage.clear();
        location.reload();
      }
    });
  }
}

// =============================================================================
// Export/Import
// =============================================================================

function exportData() {
  const data = {
    version: '2.0.0',
    patch: AppState.currentPatch,
    timestamp: new Date().toISOString(),
    selectedADC: AppState.selectedADC?.name,
    enemyTeam: AppState.enemyTeam.filter(Boolean).map(c => c.name),
    allyTeam: AppState.allyTeam.filter(Boolean).map(c => c.name),
    settings: {
      theme: AppState.theme,
      compactView: AppState.compactView
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adc-threat-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('success', 'Exported', 'Configuration exported successfully');
}

// =============================================================================
// Toast Notifications
// =============================================================================

function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg class=\"toast-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><polyline points=\"20 6 9 17 4 12\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>',
    error: '<svg class=\"toast-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><circle cx=\"12\" cy=\"12\" r=\"10\" stroke-width=\"2\"/><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>',
    warning: '<svg class=\"toast-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\" stroke-width=\"2\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>',
    info: '<svg class=\"toast-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><circle cx=\"12\" cy=\"12\" r=\"10\" stroke-width=\"2\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\" stroke-width=\"2\" stroke-linecap=\"round\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>'
  };
  
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class=\"toast-content\">
      <div class=\"toast-title\">${title}</div>
      ${message ? `<div class=\"toast-message\">${message}</div>` : ''}
    </div>
    <button class=\"toast-close\">×</button>
  `;
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  container.appendChild(toast);
  
  setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  setTimeout(() => toast.remove(), 300);
}

// =============================================================================
// Loading Screen
// =============================================================================

function showLoadingProgress(percent, text) {
  const progress = document.getElementById('loadingProgress');
  const loadingText = document.querySelector('.loading-text');
  
  if (progress) {
    progress.style.width = `${percent}%`;
  }
  if (loadingText) {
    loadingText.textContent = text;
  }
}

function hideLoadingScreen() {
  const screen = document.getElementById('loadingScreen');
  if (screen) {
    screen.classList.add('hidden');
  }
}

// =============================================================================
// Utilities
// =============================================================================

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

function mergeChampionData() {
  // Merge ADC_LIST data with patch updater data
  if (typeof window.ADC_LIST !== 'undefined') {
    AppState.champions.forEach(champ => {
      const adcData = window.ADC_LIST.find(adc => adc.name === champ.name);
      if (adcData) {
        Object.assign(champ, adcData);
      }
    });
  }
}

function loadSettings() {
  // Load saved settings from localStorage
  const theme = localStorage.getItem('adc_threat_theme');
  const autoUpdate = localStorage.getItem('adc_threat_auto_update');
  
  if (theme) {
    AppState.theme = theme;
    applyTheme(theme);
  }
  
  if (autoUpdate !== null) {
    AppState.autoUpdate = autoUpdate === 'true';
  }
}

// =============================================================================
// Expose for debugging
// =============================================================================

if (typeof window !== 'undefined') {
  window.ADC_THREAT_PRO = {
    state: AppState,
    selectADC,
    selectChampion,
    renderResults,
    exportData
  };
}
