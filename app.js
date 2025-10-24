'use strict';

// ===========================================================================
// APPLICATION MODULE
// This wrapper creates the "ADC_THREAT" object that index.html is looking for.
// ===========================================================================
const ADC_THREAT = (function () {

  // ===========================================================================
  // CONFIGURATION & CONSTANTS
  // ===========================================================================
  const DDRAGON_VERSION = "14.14.1";
  const DATA_URL = "champions-summary.json";
  // Fallback image in case DDragon link fails
  const DUMMY_IMAGE_PATH = `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Aatrox.png`; 

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

  // This object's keys ("hard", "soft", etc.)
  // directly match your styles.css file.
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

  // This function finds all the HTML elements your index.html provides
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
  
  /**
   * This is the 'init' function that your index.html is looking for.
   */
  async function init() {
    try {
      cacheDom();
      setupEventListeners();
      await loadData();
      setupAutocomplete();
    } catch (err) {
      showError("Fatal: Could not initialize app. Check if JSON files are missing.");
      console.error(err);
    }
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
      showError("Failed to load champion data (champions-summary.json). Please refresh the page.");
      console.error(err);
    }
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================
  function setupEventListeners() {
    dom.compactMode?.addEventListener('change', e => {
      state.compactMode = e.target.checked;
      // This class matches your styles.css
      document.body.classList.toggle('compact-mode', state.compactMode);
    });

    dom.exportData?.addEventListener('click', exportData);
    dom.importData?.addEventListener('click', () => dom.importFile?.click());
    dom.importFile?.addEventListener('change', handleImport);

    // Global click listener to close autocomplete
    document.addEventListener('click', (e) => {
      if (e.target.closest && !e.target.closest('.autocomplete')) {
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
    if (!dom.adcSelect || !dom.enemyChamp || !dom.allyChamp) {
        console.error("Autocomplete inputs not found. Skipping setup.");
        return;
    }

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
    if (!input || !itemsContainer) return;
    
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

     input.addEventListener('focus', () => {
       const value = input.value.toLowerCase();
       if (value.length > 0) {
         const filtered = list.filter(item => 
           item.name.toLowerCase().startsWith(value)
         ).slice(0, 7);
         showAutocomplete(itemsContainer, filtered, onSelect);
       }
     });
  }

  function showAutocomplete(itemsContainer, items, onSelect) {
    if (!itemsContainer) return;
    // SECURE: Clear previous items
    itemsContainer.innerHTML = ''; 
    
    if (items.length === 0) {
      hideAutocomplete(itemsContainer);
      return;
    }
    
    items.forEach(item => {
      // SECURE: Create elements manually to prevent XSS
      const div = document.createElement('div');
      // This class matches your styles.css
      div.className = 'suggestion-item'; 
      
      const img = document.createElement('img');
      // Use DDragon link (from adc-list) or local path (from champions-summary)
      img.src = item.image || `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${item.portrait}.png`;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => { img.src = DUMMY_IMAGE_PATH; }; // Fallback
      
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
    if (itemsContainer) {
      itemsContainer.classList.add('hidden');
    }
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
    if (!dom.resultsBody) return;
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
    // Add team indicator classes from your styles.css
    tr.className = `team-cell ${type}`;

    // 1. Setup Cell (Remove button)
    const tdSetup = document.createElement('td');
    tdSetup.className = 'setup';
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    // Use button classes from your styles.css
    removeBtn.className = 'btn btn-ghost'; 
    removeBtn.title = `Remove ${champion.name}`;
    removeBtn.style.padding = "2px 6px"; // Small override for in-table
    removeBtn.style.lineHeight = "1.2";
    removeBtn.addEventListener('click', () => removeChampion(type, index));
    tdSetup.appendChild(removeBtn);
    tr.appendChild(tdSetup);

    // 2. Champion Cell
    const tdChamp = document.createElement('td');
    tdChamp.className = 'champ';
    // This div structure matches your .champ-cell CSS
    const champCellDiv = document.createElement('div');
    champCellDiv.className = 'champ-cell';
    const img = document.createElement('img');
    img.src = `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champion.portrait}.png`;
    img.alt = champion.name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = DUMMY_IMAGE_PATH; }; // Fallback
    
    const nameDiv = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = champion.name; // SECURE
    
    // Your CSS also styles a .title, let's add it.
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = champion.title || "the Champion"; // Assuming 'title' is in your JSON
    
    nameDiv.appendChild(nameSpan);
    nameDiv.appendChild(titleSpan);
    champCellDiv.appendChild(img);
    champCellDiv.appendChild(nameDiv);
    tdChamp.appendChild(champCellDiv);
    tr.appendChild(tdChamp);

    // 3. Role Cell
    const tdRole = document.createElement('td');
    tdRole.className = 'role-cell'; // Match your CSS
    tdRole.textContent = (champion.tags && champion.tags.length > 0) ? champion.tags.join(', ') : 'N/A'; // SECURE
    tr.appendChild(tdRole);

    // 4. Passive Cell
    const tdPassive = document.createElement('td');
    tdPassive.className = 'passive-cell'; // Match your CSS
    const passiveName = document.createElement('div');
    passiveName.className = 'name';
    if (state.selectedADC && (type === 'enemy' || champion.name === state.selectedADC)) {
      passiveName.textContent = "See 'ADC Tip' ->";
    } else {
      passiveName.textContent = champion.passive.name || 'N/A'; // SECURE
    }
    tdPassive.appendChild(passiveName);
    tr.appendChild(tdPassive);

    // 5. Abilities Cell
    const tdAbilities = document.createElement('td');
    tdAbilities.className = 'abilities';
    // This div matches your .abilities-list CSS
    const abilitiesListDiv = document.createElement('div');
    abilitiesListDiv.className = 'abilities-list';
    champion.abilities.forEach(ability => {
      const abilityDiv = document.createElement('div');
      abilityDiv.className = 'ability'; // Match your CSS

      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = ability.key; // SECURE
      abilityDiv.appendChild(key);

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = ability.name; // SECURE
      abilityDiv.appendChild(name);
      
      const cd = document.createElement('span');
      cd.className = 'cd';
      cd.textContent = ability.cd.join(' / '); // SECURE
      abilityDiv.appendChild(cd);
      
      abilitiesListDiv.appendChild(abilityDiv);
    });
    tdAbilities.appendChild(abilitiesListDiv);
    tr.appendChild(tdAbilities);
    
    // 6. Threats Cell
    const tdThreats = document.createElement('td');
    tdThreats.className = 'threats';
    // This div matches your .badge-wrap CSS
    const badgeWrapDiv = document.createElement('div');
    badgeWrapDiv.className = 'badge-wrap';
    const allThreats = new Set(champion.abilities.flatMap(a => a.threat));
    if (allThreats.size > 0) {
      PRIORITY.forEach(threatKey => {
        if (allThreats.has(threatKey)) {
          const threatSpan = document.createElement('span');
          // Use .badge and .hard, .soft, etc. classes from your CSS
          threatSpan.className = `badge ${THREAT_CLASS[threatKey]}`; 
          threatSpan.textContent = THREAT_LABEL[threatKey]; // SECURE
          badgeWrapDiv.appendChild(threatSpan);
        }
      });
    } else {
      badgeWrapDiv.textContent = 'N/A';
    }
    tdThreats.appendChild(badgeWrapDiv);
    tr.appendChild(tdThreats);

    // 7. ADC Tip Cell
    const tdAdcTip = document.createElement('td');
    tdAdcTip.className = 'notes-cell'; // Match your CSS
    if (state.selectedADC && ADC_TEMPLATES) {
      const template = ADC_TEMPLATES[state.selectedADC];
      const tip = template?.tips?.[champion.name];
      tdAdcTip.textContent = tip || '...'; // SECURE
    } else {
      tdAdcTip.textContent = '...';
    }
    tr.appendChild(tdAdcTip);
    
    // 8. Support Synergy Cell
    const tdSupportSynergy = document.createElement('td');
    tdSupportSynergy.className = 'notes-cell'; // Match your CSS
    if (state.selectedADC && SUPPORT_TEMPLATES) {
      const supportTemplate = SUPPORT_TEMPLATES[champion.name];
      const synergyTip = supportTemplate?.synergy?.[state.selectedADC];
      tdSupportSynergy.textContent = synergyTip || '...'; // SECURE
    } else {
      tdSupportSynergy.textContent = '...';
    }
    tr.appendChild(tdSupportSynergy);

    return tr;
  }
  
  function getPrimaryThreat(threats) {
    if (!threats || threats.length === 0) return null;
    for (const p of PRIORITY) {
      if (threats.includes(p)) return p;
    }
    return null;
  }

  /**
   * SECURELY renders the High-Elo macro tips for the selected ADC
   */
  function renderMacroSection() {
    if (!dom.adcMacroCard || !dom.supportSynergyCard || !dom.macroHeader) return;
    
    dom.adcMacroCard.innerHTML = '';
    dom.supportSynergyCard.innerHTML = '';

    if (!state.selectedADC) {
      dom.macroHeader.textContent = 'High-Elo Macro & Synergy';
      return;
    }

    dom.macroHeader.textContent = `${state.selectedADC} - Macro & Synergy`;
    
    if (typeof ADC_TEMPLATES !== 'undefined') {
      const template = ADC_TEMPLATES[state.selectedADC];
      if (template && template.macro) {
        dom.adcMacroCard.appendChild(createMacroCard(
          "High-Elo Macro (KR/EUW)",
          template.macro
        ));
      }
    } else {
      console.warn("ADC_TEMPLATES not found.");
    }
    
    if (typeof SUPPORT_TEMPLATES !== 'undefined') {
      const synergies = getSynergiesForADC(state.selectedADC);
      if (Object.keys(synergies).length > 0) {
        dom.supportSynergyCard.appendChild(createMacroCard(
          "Support Synergies",
          synergies,
          true // true = is list
        ));
      }
    } else {
       console.warn("SUPPORT_TEMPLATES not found.");
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
    if (typeof SUPPORT_TEMPLATES === 'undefined') {
      return synergies;
    }
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
    console.error(message);
    alert(message); // Simple fallback, as your HTML doesn't have the modal yet
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
      
      state.selectedADC = null;
      state.enemyChampions.fill(null);
      state.allyChampions.fill(null);
      
      if (data.selectedADC && ADC_LIST.some(a => a.name === data.selectedADC)) {
        selectADC(data.selectedADC);
        if(dom.adcSelect) dom.adcSelect.value = data.selectedADC;
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
      if(e.target) e.target.value = null;
    }
  }

  // ===========================================================================
  // PUBLIC API
  // This return statement is what creates the "ADC_THREAT" object
  // and fixes your error.
  // ===========================================================================
  return {
    init: init
  };

})();
