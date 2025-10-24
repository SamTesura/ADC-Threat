'use strict';

// ===========================================================================
// APPLICATION MODULE
// ===========================================================================
const ADC_THREAT = (function () {

  // ===========================================================================
  // CONFIGURATION & CONSTANTS
  // ===========================================================================
  const DATA_URL = "champions-summary.json";

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

  // ===========================================================================
  // GLOBAL STATE
  // ===========================================================================
  const state = {
    allChampions: [],       // Master list from JSON
    championMap: new Map(), // For fast lookups
    selectedADC: null,      // The user's ADC (string name)
    enemyChampions: new Array(MAX_ENEMIES).fill(null),
    allyChampions: new Array(MAX_ALLIES).fill(null),
    compactMode: false,
  };

  // ===========================================================================
  // DOM ELEMENT CACHE
  // ===========================================================================
  const dom = {};

  function cacheDom() {
    dom.adcSelect = document.getElementById('adcSelect');
    dom.adcSelectItems = document.getElementById('adcSelectItems');
    dom.enemyChamp = document.getElementById('enemyChamp');
    dom.enemyChampItems = document.getElementById('enemyChampItems');
    dom.allyChamp = document.getElementById('allyChamp');
    dom.allyChampItems = document.getElementById('allyChampItems');
    
    dom.macroSection = document.getElementById('macroSection');
    dom.macroHeader = document.getElementById('macroHeader');
    dom.adcMacroCard = document.getElementById('adcMacroCard');
    dom.supportSynergyCard = document.getElementById('supportSynergyCard');
    
    dom.tableContainer = document.getElementById('tableContainer');
    dom.resultsBody = document.getElementById('resultsBody');
    dom.emptyState = document.getElementById('emptyState');
    
    dom.compactMode = document.getElementById('compactMode');
    dom.exportData = document.getElementById('exportData');
    dom.importData = document.getElementById('importData');
    dom.importFile = document.getElementById('importFile');
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  async function init() {
    cacheDom();
    setupEventListeners();
    await loadData();
    setupAutocomplete();
  }

  async function loadData() {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      state.allChampions = data.sort((a, b) => a.name.localeCompare(b.name));
      state.allChampions.forEach(champ => {
        state.championMap.set(champ.slug.toLowerCase(), champ);
      });
    } catch (err) {
      showError("Failed to load champion data. Please refresh the page.");
      console.error(err);
    }
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================
  function setupEventListeners() {
    dom.compactMode?.addEventListener('change', e => {
      state.compactMode = e.target.checked;
      document.body.classList.toggle('compact-mode', state.compactMode);
    });

    dom.exportData?.addEventListener('click', exportData);
    dom.importData?.addEventListener('click', () => dom.importFile?.click());
    dom.importFile?.addEventListener('change', handleImport);

    // Global click listener to close autocomplete
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete')) {
        hideAutocomplete(dom.adcSelectItems);
        hideAutocomplete(dom.enemyChampItems);
        hideAutocomplete(dom.allyChampItems);
      }
    });
  }

  // ===========================================================================
  // AUTOCOMPLETE LOGIC (SECURE)
  // ===========================================================================
  function setupAutocomplete() {
    // 1. Your ADC
    setupAutocompleteFor(dom.adcSelect, dom.adcSelectItems, ADC_LIST, (item) => {
      selectADC(item.name);
      dom.adcSelect.value = item.name;
      hideAutocomplete(dom.adcSelectItems);
    });

    // 2. Enemy Champions
    setupAutocompleteFor(dom.enemyChamp, dom.enemyChampItems, state.allChampions, (item) => {
      addChampion('enemy', item.slug.toLowerCase());
      dom.enemyChamp.value = '';
      hideAutocomplete(dom.enemyChampItems);
    });

    // 3. Ally Champions
    setupAutocompleteFor(dom.allyChamp, dom.allyChampItems, state.allChampions, (item) => {
      addChampion('ally', item.slug.toLowerCase());
      dom.allyChamp.value = '';
      hideAutocomplete(dom.allyChampItems);
    });
  }

  function setupAutocompleteFor(input, itemsContainer, list, onSelect) {
    input.addEventListener('input', () => {
      const value = input.value.toLowerCase();
      if (value.length < 1) {
        hideAutocomplete(itemsContainer);
        return;
      }
      
      const filtered = list.filter(item => 
        item.name.toLowerCase().startsWith(value)
      ).slice(0, 7);
      
      showAutocomplete(itemsContainer, filtered, onSelect);
    });
  }

  function showAutocomplete(itemsContainer, items, onSelect) {
    // SECURE: Clear previous items
    itemsContainer.innerHTML = ''; 
    
    if (items.length === 0) {
      hideAutocomplete(itemsContainer);
      return;
    }
    
    items.forEach(item => {
      // SECURE: Create elements manually to prevent XSS
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      
      const img = document.createElement('img');
      img.src = item.image || `img/portraits/${item.portrait}.png`; // Adapt for ADC_LIST or champion data
      img.alt = '';
      img.loading = 'lazy';
      
      const span = document.createElement('span');
      span.textContent = item.name; // Use .textContent
      
      div.appendChild(img);
      div.appendChild(span);
      
      div.addEventListener('click', () => onSelect(item));
      itemsContainer.appendChild(div);
    });
    
    itemsContainer.classList.remove('hidden');
  }

  function hideAutocomplete(itemsContainer) {
    itemsContainer.classList.add('hidden');
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  function selectADC(adcName) {
    state.selectedADC = adcName;
    renderAll();
  }

  function addChampion(type, champSlug) {
    const list = (type === 'enemy') ? state.enemyChampions : state.allyChampions;
    const champ = state.championMap.get(champSlug);
    if (!champ) return;

    // Prevent duplicates
    if (list.some(c => c?.slug === champ.slug)) return;

    const firstEmptySlot = list.indexOf(null);
    if (firstEmptySlot !== -1) {
      list[firstEmptySlot] = champ;
      renderAll();
    } else {
      showError(`Cannot add more ${type} champions.`);
    }
  }

  function removeChampion(type, index) {
    const list = (type === 'enemy') ? state.enemyChampions : state.allyChampions;
    if (list[index]) {
      list[index] = null;
      renderAll();
    }
  }

  // ===========================================================================
  // MAIN RENDER FUNCTIONS (SECURE)
  // ===========================================================================
  function renderAll() {
    renderTable();
    renderMacroSection();
    updateLayout();
  }

  function updateLayout() {
    const hasEnemies = state.enemyChampions.some(Boolean);
    const hasAllies = state.allyChampions.some(Boolean);
    const hasContent = hasEnemies || hasAllies;
    
    dom.tableContainer.classList.toggle('hidden', !hasContent);
    dom.emptyState.classList.toggle('hidden', hasContent);
    
    const hasMacro = state.selectedADC;
    dom.macroSection.classList.toggle('hidden', !hasMacro);
  }

  function renderTable() {
    // SECURE: Clear table body
    dom.resultsBody.innerHTML = '';
    
    // Render enemies
    state.enemyChampions.forEach((champ, index) => {
      if (champ) {
        dom.resultsBody.appendChild(
          buildChampionRow(champ, 'enemy', index)
        );
      }
    });
    
    // Render allies
    state.allyChampions.forEach((champ, index) => {
      if (champ) {
        dom.resultsBody.appendChild(
          buildChampionRow(champ, 'ally', index)
        );
      }
    });
  }

  /**
   * SECURELY builds a table row for a champion.
   * This function avoids .innerHTML entirely to prevent XSS.
   */
  function buildChampionRow(champion, type, index) {
    const tr = document.createElement('tr');
    tr.className = `champ-row role-${type}`;

    // 1. Setup Cell (Remove button)
    const tdSetup = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'btn-remove';
    removeBtn.title = `Remove ${champion.name}`;
    removeBtn.addEventListener('click', () => removeChampion(type, index));
    tdSetup.appendChild(removeBtn);
    tr.appendChild(tdSetup);

    // 2. Champion Cell
    const tdChamp = document.createElement('td');
    tdChamp.className = 'champ';
    const img = document.createElement('img');
    img.src = `img/portraits/${champion.portrait}.png`;
    img.alt = champion.name;
    img.loading = 'lazy';
    const span = document.createElement('span');
    span.textContent = champion.name; // SECURE
    tdChamp.appendChild(img);
    tdChamp.appendChild(span);
    tr.appendChild(tdChamp);

    // 3. Role Cell
    const tdRole = document.createElement('td');
    tdRole.className = 'role';
    tdRole.textContent = champion.tags.join(', '); // SECURE
    tr.appendChild(tdRole);

    // 4. Passive Cell
    const tdPassive = document.createElement('td');
    tdPassive.className = 'passive';
    if (state.selectedADC) {
      const template = ADC_TEMPLATES[state.selectedADC];
      const tip = template?.tips?.[champion.name];
      if (tip) {
        tdPassive.textContent = "See 'ADC Tip' ->"; // Placeholder
      } else {
        tdPassive.textContent = champion.passive.name; // SECURE
      }
    } else {
      tdPassive.textContent = champion.passive.name; // SECURE
    }
    tr.appendChild(tdPassive);

    // 5. Abilities Cell
    const tdAbilities = document.createElement('td');
    tdAbilities.className = 'abilities';
    champion.abilities.forEach(ability => {
      const pill = document.createElement('div');
      pill.className = 'pill';
      
      // Add threat classes
      const primaryThreat = getPrimaryThreat(ability.threat);
      if (primaryThreat) {
        pill.classList.add(THREAT_CLASS[primaryThreat]);
      }

      const key = document.createElement('strong');
      key.textContent = ability.key; // SECURE
      pill.appendChild(key);

      const cd = document.createElement('span');
      cd.className = 'cd';
      cd.textContent = ability.cd.join(' / '); // SECURE
      pill.appendChild(cd);
      
      // Add 'Cleanse' badge for soft CC
      if (ability.threat.includes(THREAT.SOFT_CC) && !ability.threat.includes(THREAT.HARD_CC)) {
         const cleanse = document.createElement('span');
         cleanse.className = 'badge cleanse';
         cleanse.textContent = 'Cleanse';
         pill.appendChild(cleanse);
      }
      
      tdAbilities.appendChild(pill);
    });
    tr.appendChild(tdAbilities);
    
    // 6. Threats Cell
    const tdThreats = document.createElement('td');
    tdThreats.className = 'threats';
    const allThreats = new Set(champion.abilities.flatMap(a => a.threat));
    if (allThreats.size > 0) {
      PRIORITY.forEach(threatKey => {
        if (allThreats.has(threatKey)) {
          const threatSpan = document.createElement('span');
          threatSpan.textContent = THREAT_LABEL[threatKey]; // SECURE
          threatSpan.className = THREAT_CLASS[threatKey];
          tdThreats.appendChild(threatSpan);
        }
      });
    } else {
      tdThreats.textContent = 'N/A';
    }
    tr.appendChild(tdThreats);

    // 7. ADC Tip Cell
    const tdAdcTip = document.createElement('td');
    tdAdcTip.className = 'notes';
    if (state.selectedADC) {
      const template = ADC_TEMPLATES[state.selectedADC];
      const tip = template?.tips?.[champion.name];
      tdAdcTip.textContent = tip || '...'; // SECURE
    }
    tr.appendChild(tdAdcTip);
    
    // 8. Support Synergy Cell
    const tdSupportSynergy = document.createElement('td');
    tdSupportSynergy.className = 'support-synergy';
    if (state.selectedADC) {
      // Check if the *current* champion being rendered is a support with tips
      const supportTemplate = SUPPORT_TEMPLATES[champion.name];
      const synergyTip = supportTemplate?.synergy?.[state.selectedADC];
      tdSupportSynergy.textContent = synergyTip || '...'; // SECURE
    }
    tr.appendChild(tdSupportSynergy);

    return tr;
  }
  
  function getPrimaryThreat(threats) {
    if (threats.length === 0) return null;
    // Return the highest-priority threat for coloring
    for (const p of PRIORITY) {
      if (threats.includes(p)) return p;
    }
    return null;
  }

  /**
   * SECURELY renders the High-Elo macro tips for the selected ADC
   */
  function renderMacroSection() {
    // Clear previous content securely
    dom.adcMacroCard.innerHTML = '';
    dom.supportSynergyCard.innerHTML = '';

    if (!state.selectedADC) {
      dom.macroHeader.textContent = 'High-Elo Macro & Synergy';
      return;
    }

    dom.macroHeader.textContent = `${state.selectedADC} - Macro & Synergy`;
    
    const template = ADC_TEMPLATES[state.selectedADC];
    
    // 1. Render ADC Macro Card
    if (template && template.macro) {
      dom.adcMacroCard.appendChild(createMacroCard(
        "High-Elo Macro (KR/EUW)",
        template.macro
      ));
    }
    
    // 2. Render Support Synergy Card
    const synergies = getSynergiesForADC(state.selectedADC);
    if (Object.keys(synergies).length > 0) {
      dom.supportSynergyCard.appendChild(createMacroCard(
        "Support Synergies",
        synergies,
        true // true = is list
      ));
    }
  }

  /**
   * Helper to securely create a macro card
   */
  function createMacroCard(title, data, isList = false) {
    const fragment = document.createDocumentFragment();
    
    const h3 = document.createElement('h3');
    h3.textContent = title;
    fragment.appendChild(h3);
    
    if (isList) {
      const ul = document.createElement('ul');
      for (const [key, value] of Object.entries(data)) {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = `${key}: `;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(value)); // SECURE
        ul.appendChild(li);
      }
      fragment.appendChild(ul);
    } else {
      for (const [key, value] of Object.entries(data)) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        // Format key from "tempo_advantage" to "Tempo Advantage"
        strong.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        p.appendChild(strong);
        p.appendChild(document.createElement('br'));
        p.appendChild(document.createTextNode(value)); // SECURE
        fragment.appendChild(p);
      }
    }
    return fragment;
  }
  
  function getSynergiesForADC(adcName) {
    const synergies = {};
    for (const [supportName, template] of Object.entries(SUPPORT_TEMPLATES)) {
      if (template.synergy && template.synergy[adcName]) {
        synergies[supportName] = template.synergy[adcName];
      }
    }
    return synergies;
  }

  // ===========================================================================
  // IMPORT / EXPORT / UTILITIES
  // ===========================================================================
  function showError(message) {
    // In a real app, you'd create a toast notification
    console.error(message);
    alert(message); // Simple fallback
  }

  async function exportData() {
    try {
      const data = {
        selectedADC: state.selectedADC,
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
      
      // Reset state
      state.selectedADC = null;
      state.enemyChampions.fill(null);
      state.allyChampions.fill(null);
      
      // Validate and load data
      if (data.selectedADC && ADC_LIST.some(a => a.name === data.selectedADC)) {
        selectADC(data.selectedADC);
        dom.adcSelect.value = data.selectedADC;
      }
      if (data.enemies && Array.isArray(data.enemies)) {
        data.enemies.forEach(slug => addChampion('enemy', slug.toLowerCase()));
      }
      if (data.allies && Array.isArray(data.allies)) {
        data.allies.forEach(slug => addChampion('ally', slug.toLowerCase()));
      }
      
      renderAll();
    } catch (err) {
      showError('Error importing file. It may be corrupt.');
      console.error(err);
    } finally {
      // Reset file input
      e.target.value = null;
    }
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  return {
    init: init
  };

})();
