'use strict';

// ===========================================================================
// CONFIGURATION & CONSTANTS
// ===========================================================================
const DDRAGON_VERSION = "14.14.1"; // This should be updated when champion data changes
const DATA_URL = "champions-summary.json"; // Local data file
const IMG_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/`;

const MAX_ENEMIES = 5;
const MAX_ALLIES = 4;

// Threat definitions. Using Object.freeze for immutability (good practice)
const THREAT = Object.freeze({
  HARD_CC: "HARD_CC",     // Stun, Knockup, Fear, Charm, Taunt, Suppression
  SOFT_CC: "SOFT_CC",     // Slow, Root, Blind, Silence, Cripple
  SHIELD_PEEL: "SHIELD_PEEL", // Shields, Heals, Speed-ups
  GAP_CLOSE: "GAP_CLOSE", // Dashes, Blinks, Leaps
  BURST: "BURST",       // High, fast damage
  POKE_ZONE: "POKE_ZONE"  // Long-range poke, area denial
});

// Class mapping for CSS styling
const THREAT_CLASS = Object.freeze({
  [THREAT.HARD_CC]: "hard",
  [THREAT.SOFT_CC]: "soft",
  [THREAT.SHIELD_PEEL]: "peel",
  [THREAT.GAP_CLOSE]: "gap",
  [THREAT.BURST]: "burst",
  [THREAT.POKE_ZONE]: "poke"
});

// Label mapping for UI text
const THREAT_LABEL = Object.freeze({
  [THREAT.HARD_CC]: "Hard CC",
  [THREAT.SOFT_CC]: "Soft CC",
  [THREAT.SHIELD_PEEL]: "Shield/Peel",
  [THREAT.GAP_CLOSE]: "Gap Close",
  [THREAT.BURST]: "Burst",
  [THREAT.POKE_ZONE]: "Poke/Zone"
});

// ===========================================================================
// GLOBAL STATE
// ===========================================================================
const state = {
  allChampions: [],       // Master list of champion data
  championMap: new Map(), // For fast lookups by name/slug
  selectedADC: null,      // The ADC the user is playing (string name)
  enemyChampions: new Array(MAX_ENEMIES).fill(null),
  allyChampions: new Array(MAX_ALLIES).fill(null),
  globalLevel: 1,
  compactMode: false,
};

// ===========================================================================
// DOM ELEMENT CACHE
// ===========================================================================
// Caching DOM elements improves performance by avoiding repeated queries
const dom = {
  enemyInputs: null,
  allyInputs: null,
  resultsBody: null,
  emptyState: null,
  globalLevel: null,
  globalLevelValue: null,
  compactMode: null,
  patchVersion: null,
  adcGrid: null,
  supportTipsContainer: null,
  bestSupportsGrid: null,
  supportTipsGrid: null,
  modal: null,
  modalTitle: null,
  modalMessage: null,
  modalClose: null,
};

// ===========================================================================
// INITIALIZATION
// ===========================================================================
// Waits for the DOM to be fully loaded before running setup
document.addEventListener('DOMContentLoaded', init);

/**
 * Main initialization function.
 * Caches DOM elements, fetches data, and sets up event listeners.
 */
async function init() {
  // Cache all necessary DOM elements
  dom.enemyInputs = document.getElementById('enemyInputs');
  dom.allyInputs = document.getElementById('allyInputs');
  dom.resultsBody = document.getElementById('resultsBody');
  dom.emptyState = document.getElementById('emptyState');
  dom.globalLevel = document.getElementById('globalLevel');
  dom.globalLevelValue = document.getElementById('globalLevelValue');
  dom.compactMode = document.getElementById('compactMode');
  dom.patchVersion = document.getElementById('patchVersion');
  dom.adcGrid = document.getElementById('adcGrid');
  dom.supportTipsContainer = document.getElementById('supportTipsContainer');
  dom.bestSupportsGrid = document.getElementById('bestSupportsGrid');
  dom.supportTipsGrid = document.getElementById('supportTipsGrid');
  dom.modal = document.getElementById('modal');
  dom.modalTitle = document.getElementById('modalTitle');
  dom.modalMessage = document.getElementById('modalMessage');
  dom.modalClose = document.getElementById('modalClose');
  
  // Create and append champion input fields
  createChampionInputs(dom.enemyInputs, state.enemyChampions, 'enemy');
  createChampionInputs(dom.allyInputs, state.allyChampions, 'ally');

  // Populate the ADC selection grid
  initADCGrid();
  
  // Set up all event listeners
  setupEventListeners();
  
  // Set the patch version in the footer
  if (dom.patchVersion) {
    dom.patchVersion.textContent = `Patch ${DDRAGON_VERSION}`;
  }

  // Fetch the main champion data
  await fetchData();

  // Initial render to show empty state
  renderResults();
}

/**
 * Fetches champion data from the local JSON file.
 * Handles loading and error states.
 */
async function fetchData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load champion data: ${response.statusText}`);
    }
    const data = await response.json();
    
    state.allChampions = data;
    
    // Create a Map for O(1) lookups.
    // This is much faster than .find() on a large array.
    state.championMap.clear();
    for (const champ of data) {
      // Allow lookup by internal slug (e.g., "FiddleSticks")
      state.championMap.set(champ.slug.toLowerCase(), champ);
      // Allow lookup by display name (e.g., "Fiddlesticks")
      state.championMap.set(champ.name.toLowerCase(), champ);
    }
    
    console.log(`Loaded ${state.allChampions.length} champions.`);
    
  } catch (err) {
    console.error(err);
    // Show a user-facing error message instead of just logging
    if (dom.emptyState) {
        dom.emptyState.innerHTML = `<p><strong>Error loading champion data.</strong></p><p>${err.message}</p><p>Please refresh the page to try again.</p>`;
    }
    showError('Error Loading Data', err.message);
  }
}

/**
 * Sets up all global event listeners for the application.
 */
function setupEventListeners() {
  if (dom.globalLevel) {
    dom.globalLevel.addEventListener('input', e => {
      state.globalLevel = parseInt(e.target.value, 10);
      dom.globalLevelValue.textContent = state.globalLevel;
      renderResults(); // Re-render to update cooldowns
    });
  }
  
  if (dom.compactMode) {
    dom.compactMode.addEventListener('change', e => {
      state.compactMode = e.target.checked;
      document.body.classList.toggle('compact-mode', state.compactMode);
    });
  }
  
  // Modal close buttons
  if (dom.modalClose) {
    dom.modalClose.addEventListener('click', hideError);
  }
  if (dom.modal) {
    dom.modal.addEventListener('click', (e) => {
      if (e.target === dom.modal) {
        hideError();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideError();
    }
  });

  // Data import/export
  document.getElementById('exportData')?.addEventListener('click', exportData);
  document.getElementById('importData')?.addEventListener('click', () => {
    document.getElementById('importFile')?.click();
  });
  document.getElementById('importFile')?.addEventListener('change', handleImport);
}

// ===========================================================================
// CHAMPION INPUT & AUTOCOMPLETE
// ===========================================================================

/**
 * Generates the champion input boxes for enemies and allies.
 * @param {HTMLElement} container - The parent element to append inputs to.
 * @param {Array} targetArray - The state array (enemyChampions or allyChampions).
 * @param {string} type - 'enemy' or 'ally'.
 */
function createChampionInputs(container, targetArray, type) {
  if (!container) return;
  
  // Use a document fragment for performance.
  // This builds all elements in memory before one single DOM insertion.
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < targetArray.length; i++) {
    const inputWrap = document.createElement('div');
    inputWrap.className = 'input-wrap';
    
    const icon = document.createElement('img');
    icon.className = 'champ-input-icon';
    icon.id = `${type}-icon-${i}`;
    icon.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'champ-input';
    input.placeholder = type === 'enemy' ? 'Enemy...' : 'Ally...';
    input.dataset.index = i;
    input.dataset.type = type;
    input.setAttribute('autocomplete', 'off');
    
    const suggestions = document.createElement('div');
    suggestions.className = 'suggestions-list';
    suggestions.style.display = 'none'; // Hide by default
    
    inputWrap.append(icon, input, suggestions);
    fragment.append(inputWrap);
  }
  
  container.append(fragment);
  
  // Add event listeners using event delegation on the container
  container.addEventListener('input', handleChampionInput);
  container.addEventListener('keydown', handleInputKeydown);
  container.addEventListener('focusout', (e) => {
    // Hide suggestions when focus is lost
    if (e.target.classList.contains('champ-input')) {
      const suggestions = e.target.nextElementSibling;
      if (suggestions) {
        setTimeout(() => { suggestions.style.display = 'none'; }, 150);
      }
    }
  });
  container.addEventListener('click', (e) => {
    // Re-open suggestions on click if input has text
    if (e.target.classList.contains('champ-input') && e.target.value) {
       handleChampionInput(e);
    }
  });
}

/**
 * Handles keydown events (ArrowUp, ArrowDown, Enter, Escape) for autocomplete.
 * @param {Event} e - The keydown event.
 */
function handleInputKeydown(e) {
  if (!e.target.classList.contains('champ-input')) return;
  
  const suggestions = e.target.nextElementSibling;
  if (!suggestions || suggestions.style.display === 'none') return;
  
  const selected = suggestions.querySelector('.selected');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    let next = selected ? selected.nextElementSibling : suggestions.firstElementChild;
    if (!next) next = suggestions.firstElementChild;
    if (selected) selected.classList.remove('selected');
    if (next) next.classList.add('selected');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    let prev = selected ? selected.previousElementSibling : suggestions.lastElementChild;
    if (!prev) prev = suggestions.lastElementChild;
    if (selected) selected.classList.remove('selected');
    if (prev) prev.classList.add('selected');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selected) {
      selectSuggestion(e.target, selected.dataset.name);
    } else if (suggestions.firstElementChild) {
      // Select the first suggestion if none is highlighted
      selectSuggestion(e.target, suggestions.firstElementChild.dataset.name);
    }
  } else if (e.key === 'Escape') {
    suggestions.style.display = 'none';
  }
}

/**
 * Handles text input to show autocomplete suggestions.
 * @param {Event} e - The input event.
 */
function handleChampionInput(e) {
  const input = e.target;
  const value = input.value.toLowerCase();
  const suggestions = input.nextElementSibling;
  
  if (!suggestions) return;
  
  // Clear suggestions if input is empty
  if (value.length === 0) {
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
    clearChampion(input); // Clear the state
    return;
  }
  
  // Find matches
  const matches = state.allChampions.filter(champ => 
    champ.name.toLowerCase().startsWith(value) || 
    champ.slug.toLowerCase().startsWith(value)
  ).slice(0, 10); // Limit to 10 suggestions
  
  // SECURELY render suggestions
  renderSuggestions(suggestions, matches, input);
}

/**
 * Renders the suggestion dropdown.
 * @param {HTMLElement} container - The suggestions-list element.
 * @param {Array} matches - The array of matching champion objects.
 * @param {HTMLElement} input - The input element.
 */
function renderSuggestions(container, matches, input) {
  if (matches.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  // Use DocumentFragment for performance
  const fragment = document.createDocumentFragment();
  
  for (const champ of matches) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.dataset.name = champ.name; // Use the canonical name
    
    const img = document.createElement('img');
    img.src = `${IMG_BASE_URL}${champ.portrait}.png`;
    img.alt = champ.name;
    
    const span = document.createElement('span');
    span.textContent = champ.name; // SECURE: Use textContent
    
    item.append(img, span);
    
    // Add click listener to select the champion
    item.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent focusout from hiding list
      selectSuggestion(input, champ.name);
    });
    
    fragment.append(item);
  }
  
  container.innerHTML = ''; // Clear old suggestions
  container.append(fragment);
  container.style.display = 'block';
}

/**
 * Selects a champion from the suggestions.
 * @param {HTMLElement} input - The input element.
 * @param {string} name - The name of the selected champion.
 */
function selectSuggestion(input, name) {
  const champ = findChampion(name);
  if (!champ) return;
  
  const index = parseInt(input.dataset.index, 10);
  const type = input.dataset.type;
  
  input.value = champ.name;
  
  const icon = document.getElementById(`${type}-icon-${index}`);
  if (icon) {
    icon.src = `${IMG_BASE_URL}${champ.portrait}.png`;
  }
  
  if (type === 'enemy') {
    state.enemyChampions[index] = champ;
  } else {
    state.allyChampions[index] = champ;
  }
  
  // Hide suggestions
  const suggestions = input.nextElementSibling;
  if (suggestions) {
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
  }
  
  // Re-render the results table
  renderResults();
}

/**
 * Clears a champion from the state and UI.
 * @param {HTMLElement} input - The input element.
 */
function clearChampion(input) {
  const index = parseInt(input.dataset.index, 10);
  const type = input.dataset.type;

  const icon = document.getElementById(`${type}-icon-${index}`);
  if (icon) {
    icon.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel
  }

  if (type === 'enemy') {
    state.enemyChampions[index] = null;
  } else {
    state.allyChampions[index] = null;
  }

  renderResults();
}

// ===========================================================================
// ADC SELECTION & SYNERGY TIPS
// ===========================================================================

/**
 * Populates the ADC selection grid.
 * SECURE: Uses createElement and textContent.
 */
function initADCGrid() {
  if (!dom.adcGrid || !window.ADC_LIST) return;
  
  const fragment = document.createDocumentFragment();
  
  for (const adc of ADC_LIST) {
    const portrait = document.createElement('div');
    portrait.className = 'adc-portrait';
    portrait.dataset.name = adc.name;
    portrait.setAttribute('role', 'button');
    portrait.setAttribute('tabindex', '0');
    portrait.setAttribute('aria-label', `Select ${adc.name}`);
    
    const img = document.createElement('img');
    // Assuming images are locally in an 'img/' folder as per adc-list.js
    img.src = adc.image; 
    img.alt = adc.name;
    img.loading = 'lazy';
    
    const name = document.createElement('span');
    name.className = 'adc-name';
    name.textContent = adc.name; // SECURE
    
    portrait.append(img, name);
    
    // Event listener for selection
    const selectFn = () => selectADC(adc.name);
    portrait.addEventListener('click', selectFn);
    portrait.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectFn();
      }
    });
    
    fragment.append(portrait);
  }
  
  dom.adcGrid.innerHTML = ''; // Clear any existing
  dom.adcGrid.append(fragment);
}

/**
 * Handles the selection of an ADC.
 * @param {string} adcName - The name of the selected ADC.
 */
function selectADC(adcName) {
  state.selectedADC = adcName;
  
  // Update visual selection in the grid
  const portraits = dom.adcGrid.querySelectorAll('.adc-portrait');
  portraits.forEach(p => {
    p.classList.toggle('selected', p.dataset.name === adcName);
    p.setAttribute('aria-pressed', p.dataset.name === adcName);
  });
  
  // Re-render results to update ADC-specific tips
  renderResults();
  
  // **NEW**: Update the support synergy tips section
  if (state.selectedADC) {
    updateSupportTips(state.selectedADC);
    dom.supportTipsContainer.style.display = 'grid'; // Show the section
  }
}

/**
 * **NEW FUNCTION**
 * Populates the support synergy grids based on the selected ADC.
 * SECURE: Uses createElement and textContent.
 * @param {string} adcName - The name of the selected ADC.
 */
function updateSupportTips(adcName) {
  if (!dom.bestSupportsGrid || !dom.supportTipsGrid || !window.SUPPORT_SYNERGIES) return;

  // Clear previous tips
  dom.bestSupportsGrid.innerHTML = '';
  dom.supportTipsGrid.innerHTML = '';
  
  const synergies = window.SUPPORT_SYNERGIES[adcName];
  if (!synergies) {
    // No specific tips for this ADC, hide the section
    dom.supportTipsContainer.style.display = 'none';
    return;
  }

  const goodFragment = document.createDocumentFragment();
  const badFragment = document.createDocumentFragment();

  // Create "Good Synergy" cards
  if (synergies.good) {
    for (const champName of synergies.good) {
      const champData = findChampion(champName) || { name: champName, portrait: champName }; // Fallback
      const tip = synergies.tips?.[champName] || "Strong laning phase and scaling.";
      goodFragment.append(createTipCard(champData, tip));
    }
  }

  // Create "Difficult Synergy" cards
  if (synergies.bad) {
    for (const champName of synergies.bad) {
      const champData = findChampion(champName) || { name: champName, portrait: champName }; // Fallback
      const tip = synergies.tips?.[champName] || "Lacks peel or engage needed for this lane.";
      badFragment.append(createTipCard(champData, tip));
    }
  }

  dom.bestSupportsGrid.append(goodFragment);
  dom.supportTipsGrid.append(badFragment);
}

/**
 * **NEW HELPER**
 * Creates a DOM element for a support tip card.
 * SECURE: Uses createElement and textContent.
 * @param {object} champ - The support champion object.
 * @param {string} tip - The synergy tip text.
 * @returns {HTMLElement} The generated tip card element.
 */
function createTipCard(champ, tip) {
  const card = document.createElement('div');
  card.className = 'tip-card';
  
  const img = document.createElement('img');
  // Use local 'img/' path if it's a known ADC/Support, otherwise try ddragon
  const localImg = (ADC_LIST.find(a => a.name === champ.name) || SUPPORT_SYNERGIES._supportList?.find(s => s.name === champ.name))?.image;
  
  if (localImg) {
    img.src = localImg;
  } else {
    img.src = `${IMG_BASE_URL}${champ.portrait}.png`;
  }
  img.alt = champ.name;
  
  const content = document.createElement('div');
  content.className = 'tip-card-content';
  
  const name = document.createElement('strong');
  name.textContent = champ.name; // SECURE
  
  const p = document.createElement('p');
  p.textContent = tip; // SECURE
  
  content.append(name, p);
  card.append(img, content);
  return card;
}


// ===========================================================================
// TABLE RENDERING (SECURE REFACTOR)
// ===========================================================================

/**
 * Main render function. Clears and rebuilds the results table.
 * SECURE: Uses DocumentFragment and DOM methods, not innerHTML.
 */
function renderResults() {
  if (!dom.resultsBody || !dom.emptyState) return;

  // Clear the table body
  dom.resultsBody.innerHTML = '';
  
  const allChamps = [
    ...state.enemyChampions.filter(Boolean),
    ...state.allyChampions.filter(Boolean)
  ];

  if (allChamps.length === 0) {
    dom.emptyState.style.display = 'block';
    return;
  }

  dom.emptyState.style.display = 'none';

  const fragment = document.createDocumentFragment();
  
  state.enemyChampions.filter(Boolean).forEach(champ => {
    fragment.append(createChampionRow(champ, 'enemy'));
  });
  
  state.allyChampions.filter(Boolean).forEach(champ => {
    fragment.append(createChampionRow(champ, 'ally'));
  });

  dom.resultsBody.append(fragment);
}

/**
 * Creates a single champion row (<tr>) for the table.
 * SECURE: All data is set via textContent or dataset.
 * @param {object} champ - The champion data object.
 * @param {string} type - 'enemy' or 'ally'.
 * @returns {HTMLElement} The generated table row (<tr>).
 */
function createChampionRow(champ, type) {
  const tr = document.createElement('tr');
  
  // 1. Team Cell
  const tdTeam = document.createElement('td');
  tdTeam.className = `team-cell ${type}`;
  const teamName = document.createElement('span');
  teamName.className = 'team-name';
  teamName.textContent = type; // SECURE
  tdTeam.append(teamName);
  
  // 2. Champion Cell
  const tdChamp = document.createElement('td');
  tdChamp.className = 'champ-cell';
  
  const champImg = document.createElement('img');
  champImg.src = `${IMG_BASE_URL}${champ.portrait}.png`;
  champImg.alt = champ.name;
  
  const champInfo = document.createElement('div');
  champInfo.className = 'champ-info';
  
  const champName = document.createElement('div');
  champName.className = 'name';
  champName.textContent = champ.name; // SECURE
  
  const champTitle = document.createElement('div');
  champTitle.className = 'title';
  champTitle.textContent = champ.tags.join(', ').toLowerCase(); // SECURE
  
  champInfo.append(champName, champTitle);
  tdChamp.append(champImg, champInfo);
  
  // 3. Role Cell
  const tdRole = document.createElement('td');
  tdRole.className = 'role-cell';
  tdRole.textContent = champ.tags.join(', '); // SECURE

  // 4. Passive Cell
  const tdPassive = document.createElement('td');
  tdPassive.className = 'passive-cell';
  const passiveName = document.createElement('div');
  passiveName.className = 'name';
  passiveName.textContent = champ.passive.name; // SECURE
  const passiveDesc = document.createElement('div');
  passiveDesc.className = 'desc';
  passiveDesc.textContent = champ.passive.desc; // SECURE
  tdPassive.append(passiveName, passiveDesc);

  // 5. Abilities Cell
  const tdAbilities = document.createElement('td');
  tdAbilities.className = 'abilities-cell';
  tdAbilities.append(renderAbilities(champ)); // Helper returns a fragment

  // 6. Threat Tags Cell
  const tdThreats = document.createElement('td');
  tdThreats.className = 'threats-cell';
  tdThreats.append(renderThreatTags(champ)); // Helper returns a fragment

  // 7. ADC Tip Cell
  const tdNotes = document.createElement('td');
  tdNotes.className = 'notes-cell';
  tdNotes.textContent = getADCTip(champ.name); // SECURE
  
  // Append all cells to the row
  tr.append(tdTeam, tdChamp, tdRole, tdPassive, tdAbilities, tdThreats, tdNotes);
  
  return tr;
}

/**
 * Creates a DocumentFragment containing the list of abilities.
 * SECURE: All data set via textContent.
 * @param {object} champ - The champion data object.
 * @returns {DocumentFragment}
 */
function renderAbilities(champ) {
  const fragment = document.createDocumentFragment();
  const list = document.createElement('div');
  list.className = 'abilities-list';

  champ.abilities.forEach(ability => {
    const cd = ability.cd[state.globalLevel - 1] || ability.cd[ability.cd.length - 1];
    
    const abilityDiv = document.createElement('div');
    abilityDiv.className = 'ability';

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = ability.key; // SECURE
    
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = ability.name; // SECURE
    
    const cdSpan = document.createElement('span');
    cdSpan.className = 'cd';
    cdSpan.textContent = cd > 0 ? `${cd}s` : '—'; // SECURE
    if (cd === 0) {
      cdSpan.classList.add('ready');
    }
    
    abilityDiv.append(key, name, cdSpan);
    
    // Add threat badges to the ability
    ability.threat.forEach(threat => {
      const badge = createBadge(THREAT_LABEL[threat], THREAT_CLASS[threat]);
      abilityDiv.append(badge);
    });

    list.append(abilityDiv);
  });
  
  fragment.append(list);
  return fragment;
}

/**
 * Creates a DocumentFragment containing the list of threat tags.
 * SECURE: All data set via textContent.
 * @param {object} champ - The champion data object.
 * @returns {DocumentFragment}
 */
function renderThreatTags(champ) {
  const fragment = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.className = 'badge-wrap';

  // Get all unique threats from all abilities
  const allThreats = new Set(champ.abilities.flatMap(a => a.threat));
  
  // Prioritize CC
  const sortedThreats = Array.from(allThreats).sort((a, b) => {
    const aIsCC = a === THREAT.HARD_CC || a === THREAT.SOFT_CC;
    const bIsCC = b === THREAT.HARD_CC || b === THREAT.SOFT_CC;
    if (aIsCC && !bIsCC) return -1;
    if (!aIsCC && bIsCC) return 1;
    return 0;
  });

  sortedThreats.forEach(threat => {
    const badge = createBadge(THREAT_LABEL[threat], THREAT_CLASS[threat]);
    wrap.append(badge);

    // Add "Cleanse" badge for Soft CC
    if (threat === THREAT.SOFT_CC) {
      wrap.append(createBadge('Cleanse', 'cleanse'));
    }
  });
  
  fragment.append(wrap);
  return fragment;
}

/**
 * **NEW HELPER**
 * Creates a single badge element.
 * @param {string} label - The text for the badge.
 * @param {string} className - The threat class (e.g., 'hard', 'soft').
 * @returns {HTMLElement} The generated span element.
 */
function createBadge(label, className) {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = label; // SECURE
  return badge;
}

// ===========================================================================
// HELPERS
// ===========================================================================

/**
 * Finds a champion from the state map.
 * @param {string} name - The name or slug of the champion.
 * @returns {object|undefined} The champion object or undefined.
 */
function findChampion(name) {
  if (!name) return undefined;
  return state.championMap.get(name.toLowerCase());
}

/**
 * Gets the ADC-specific tip for a given champion.
 * @param {string} enemyName - The name of the enemy champion.
 * @returns {string} The tip, or a default message.
 */
function getADCTip(enemyName) {
  if (state.selectedADC && window.ADC_TEMPLATES) {
    const adcTips = window.ADC_TEMPLATES[state.selectedADC];
    if (adcTips && adcTips.tips[enemyName]) {
      return adcTips.tips[enemyName];
    }
  }
  // Default message if no specific tip is found
  return "General threat. Watch for key ability cooldowns.";
}

// ===========================================================================
// MODAL & ERROR HANDLING (Replaces alert())
// ===========================================================================

/**
 * Shows a user-facing error modal.
 * @param {string} title - The title for the modal.
 * @param {string} message - The error message.
 */
function showError(title, message) {
  if (!dom.modal || !dom.modalTitle || !dom.modalMessage) {
    // Fallback to console if modal isn't ready
    console.error(title, message);
    // Fallback to basic alert if all else fails
    alert(`${title}: ${message}`);
    return;
  }
  
  dom.modalTitle.textContent = title; // SECURE
  dom.modalMessage.textContent = message; // SECURE
  dom.modal.style.display = 'flex';
  dom.modalClose.focus();
}

/**
 * Hides the error modal.
 */
function hideError() {
  if (!dom.modal) return;
  dom.modal.style.display = 'none';
}

// ===========================================================================
// DATA IMPORT / EXPORT
// ===========================================================================

/**
 * Exports the current team setup as a JSON file.
 */
async function exportData() {
  try {
    const data = {
      selectedADC: state.selectedADC,
      // Filter out nulls and map to just the champion slug
      enemies: state.enemyChampions.filter(Boolean).map(c => c.slug),
      allies: state.allyChampions.filter(Boolean).map(c => c.slug)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adc-threat-export.json';
    a.click();
    URL.revokeObjectURL(url);
    
  } catch (err) {
    showError('Export Error', 'Could not export data. See console for details.');
    console.error(err);
  }
}

/**
 * Handles the import of a JSON file to load a team setup.
 * @param {Event} e - The file input change event.
 */
async function handleImport(e) {
  let file;
  try {
    file = e.target.files[0];
    if (!file) return;
    
    const text = await file.text();
    const data = JSON.parse(text); // This is the risky part
    
    // Clear current state before importing
    state.enemyChampions.fill(null);
    state.allyChampions.fill(null);
    
    // Re-populate inputs based on imported data
    if (data.enemies && Array.isArray(data.enemies)) {
      data.enemies.forEach((slug, i) => {
        if (i < MAX_ENEMIES) {
          const input = dom.enemyInputs.querySelector(`input[data-index="${i}"]`);
          if (input) selectSuggestion(input, slug); // Use slug to find champ
        }
      });
    }
    
    if (data.allies && Array.isArray(data.allies)) {
      data.allies.forEach((slug, i) => {
        if (i < MAX_ALLIES) {
          const input = dom.allyInputs.querySelector(`input[data-index="${i}"]`);
          if (input) selectSuggestion(input, slug);
        }
      });
    }

    // Select the ADC
    if (data.selectedADC) {
      selectADC(data.selectedADC);
    }
    
    // Reset file input to allow importing the same file again
    e.target.value = null;

  } catch (err) {
    showError('Import Error', `Failed to import file: ${err.message}`);
    console.error(err);
    if (file) e.target.value = null;
  }
}
