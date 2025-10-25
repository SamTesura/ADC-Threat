/**
 * ADC Threat - Challenger Reference
 * Challenger-level analysis with CC type-based coloring
 * Data from EUW, KR, and China Challenger meta
 */

const CONFIG = {
  PATCH_API: 'https://ddragon.leagueoflegends.com/api/versions.json',
  CHAMPION_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json',
  CHAMPION_DETAIL_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championId}.json',
  CHAMPION_IMG: 'https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png',
  PATCH_NOTES_URL: 'https://www.leagueoflegends.com/en-us/news/game-updates/patch-25-21-notes/'
};

let state = {
  patch: null,
  champions: {},
  selectedADC: null,
  enemies: [],
  allies: []
};

// CC Classification (based on League of Legends mechanics)
const CC_TYPES = {
  HARD_NON_CLEANSABLE: ['suppression', 'airborne', 'knock', 'pull'],
  SOFT_CLEANSABLE: ['stun', 'root', 'snare', 'slow', 'charm', 'fear', 'taunt', 'silence', 'blind', 'disarm']
};

// Challenger-level tips database
const CHALLENGER_TIPS = {
  general: {
    enemy: "Respect ability cooldowns. Trade when key spells are down. Position behind minions vs hooks.",
    ally: "Sync abilities with your ally. Watch their cooldowns and follow their engage/disengage."
  }
};

// Initialize
async function init() {
  try {
    state.patch = await fetchPatch();
    state.champions = await fetchChampions(state.patch);
    setupPatchNotesLink();
    setupADCInput();
    createInputs();
    setupListeners();
    updateUIState();
  } catch (error) {
    console.error('Init failed:', error);
    alert('Failed to load champion data. Please refresh.');
  }
}

async function fetchPatch() {
  const res = await fetch(CONFIG.PATCH_API);
  const versions = await res.json();
  return versions[0];
}

async function fetchChampions(patch) {
  const url = CONFIG.CHAMPION_API.replace('{version}', patch);
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

async function fetchChampionDetail(championId) {
  const url = CONFIG.CHAMPION_DETAIL_API
    .replace('{version}', state.patch)
    .replace('{championId}', championId);
  const res = await fetch(url);
  const data = await res.json();
  return data.data[championId];
}

function setupPatchNotesLink() {
  const link = document.getElementById('patchNotesLink');
  if (link && state.patch) {
    const patchVersion = state.patch.split('.').slice(0, 2).join('-');
    link.href = CONFIG.PATCH_NOTES_URL.replace('{version}', patchVersion);
  }
}

function setupADCInput() {
  const input = document.getElementById('adcInput');
  
  input.addEventListener('input', (e) => handleADCInput(e.target));
  input.addEventListener('focus', (e) => handleADCInput(e.target));
  input.addEventListener('blur', () => {
    setTimeout(() => clearADCAutocomplete(), 300);
  });
}

function handleADCInput(input) {
  const query = input.value.toLowerCase().trim();
  
  const adcIds = ADC_LIST.getAllADCs();
  const matches = adcIds
    .map(id => state.champions[id])
    .filter(c => c && (!query || c.name.toLowerCase().includes(query)))
    .sort((a, b) => {
      if (!query) return a.name.localeCompare(b.name);
      
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(query);
      const bStarts = bName.startsWith(query);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    });
  
  showADCAutocomplete(input, matches);
}

function showADCAutocomplete(input, champions) {
  clearADCAutocomplete();
  
  if (champions.length === 0) return;
  
  const container = document.getElementById('adcAutocomplete');
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete';
  
  champions.forEach(champ => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    
    const img = document.createElement('img');
    img.src = CONFIG.CHAMPION_IMG
      .replace('{version}', state.patch)
      .replace('{championId}', champ.id);
    
    const name = document.createElement('span');
    name.textContent = champ.name;
    
    item.appendChild(img);
    item.appendChild(name);
    
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectADC(champ);
      clearADCAutocomplete();
    });
    
    dropdown.appendChild(item);
  });
  
  container.appendChild(dropdown);
}

function clearADCAutocomplete() {
  const container = document.getElementById('adcAutocomplete');
  if (container) container.innerHTML = '';
}

function selectADC(champion) {
  state.selectedADC = champion;
  
  const input = document.getElementById('adcInput');
  input.value = champion.name;
  input.classList.add('selected');
  
  const selectedDiv = document.getElementById('selectedADC');
  selectedDiv.innerHTML = '';
  
  const img = document.createElement('img');
  img.src = CONFIG.CHAMPION_IMG
    .replace('{version}', state.patch)
    .replace('{championId}', champion.id);
  img.className = 'selected-champ-img';
  
  const name = document.createElement('span');
  name.textContent = champion.name;
  name.className = 'selected-champ-name';
  
  selectedDiv.appendChild(img);
  selectedDiv.appendChild(name);
  
  updateUIState();
  updateTable();
}

function updateUIState() {
  const warning = document.getElementById('adcWarning');
  const teamsContainer = document.getElementById('teamsContainer');
  const inputs = document.querySelectorAll('#enemyInputs input, #allyInputs input');
  
  if (!state.selectedADC) {
    warning.classList.remove('hidden');
    teamsContainer.classList.add('disabled');
    inputs.forEach(input => input.disabled = true);
  } else {
    warning.classList.add('hidden');
    teamsContainer.classList.remove('disabled');
    inputs.forEach(input => input.disabled = false);
  }
}

function createInputs() {
  const enemyContainer = document.getElementById('enemyInputs');
  const allyContainer = document.getElementById('allyInputs');
  
  for (let i = 0; i < 5; i++) {
    const input = createInput('enemy', i);
    enemyContainer.appendChild(input);
  }
  
  for (let i = 0; i < 4; i++) {
    const input = createInput('ally', i);
    allyContainer.appendChild(input);
  }
}

function createInput(team, index) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = `${team === 'enemy' ? 'Enemy' : 'Ally'} ${index + 1}`;
  input.dataset.team = team;
  input.dataset.index = index;
  input.disabled = true;
  
  input.addEventListener('input', (e) => handleInput(e.target));
  input.addEventListener('blur', () => {
    setTimeout(() => clearAutocomplete(), 300);
  });
  
  wrapper.appendChild(input);
  return wrapper;
}

function handleInput(input) {
  const query = input.value.toLowerCase().trim();
  
  if (query.length < 2) {
    clearAutocomplete();
    return;
  }
  
  const matches = Object.values(state.champions)
    .filter(c => c.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(query);
      const bStarts = bName.startsWith(query);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    })
    .slice(0, 5);
  
  showAutocomplete(input, matches);
}

function showAutocomplete(input, champions) {
  clearAutocomplete();
  
  if (champions.length === 0) return;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete';
  dropdown.id = 'autocomplete';
  
  champions.forEach(champ => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    
    const img = document.createElement('img');
    img.src = CONFIG.CHAMPION_IMG
      .replace('{version}', state.patch)
      .replace('{championId}', champ.id);
    
    const name = document.createElement('span');
    name.textContent = champ.name;
    
    item.appendChild(img);
    item.appendChild(name);
    
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = champ.name;
      selectChampion(input.dataset.team, parseInt(input.dataset.index), champ);
      clearAutocomplete();
    });
    
    dropdown.appendChild(item);
  });
  
  input.parentElement.appendChild(dropdown);
}

function clearAutocomplete() {
  const existing = document.getElementById('autocomplete');
  if (existing) existing.remove();
}

function selectChampion(team, index, champion) {
  if (team === 'enemy') {
    state.enemies[index] = champion;
  } else {
    state.allies[index] = champion;
  }
  updateTable();
}

function setupListeners() {
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', clearAll);
}

function clearAll() {
  // Clear ADC
  state.selectedADC = null;
  const adcInput = document.getElementById('adcInput');
  adcInput.value = '';
  adcInput.classList.remove('selected');
  document.getElementById('selectedADC').innerHTML = '';
  
  // Clear all champion inputs
  state.enemies = [];
  state.allies = [];
  
  const inputs = document.querySelectorAll('#enemyInputs input, #allyInputs input');
  inputs.forEach(input => {
    input.value = '';
    input.disabled = true;
  });
  
  // Update UI
  updateUIState();
  updateTable();
}

async function updateTable() {
  const tbody = document.getElementById('threatBody');
  
  const allChamps = [
    ...state.enemies.filter(c => c),
    ...state.allies.filter(c => c)
  ];
  
  if (!state.selectedADC || allChamps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Select your ADC and add champions to see Challenger-level analysis</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  const enemyCount = state.enemies.filter(c => c).length;
  
  for (let i = 0; i < allChamps.length; i++) {
    const champ = allChamps[i];
    const isEnemy = i < enemyCount;
    const row = await createRow(champ, isEnemy);
    tbody.appendChild(row);
  }
}

async function createRow(champion, isEnemy) {
  const row = document.createElement('tr');
  
  // Team
  const teamCell = document.createElement('td');
  const teamBadge = document.createElement('span');
  teamBadge.className = `team-badge team-${isEnemy ? 'enemy' : 'ally'}`;
  teamBadge.textContent = isEnemy ? 'Enemy' : 'Ally';
  teamCell.appendChild(teamBadge);
  row.appendChild(teamCell);
  
  // Champion
  const champCell = document.createElement('td');
  const champDiv = document.createElement('div');
  champDiv.className = 'champ-name';
  const img = document.createElement('img');
  img.src = CONFIG.CHAMPION_IMG
    .replace('{version}', state.patch)
    .replace('{championId}', champion.id);
  img.className = 'champ-img';
  champDiv.appendChild(img);
  champDiv.appendChild(document.createTextNode(champion.name));
  champCell.appendChild(champDiv);
  row.appendChild(champCell);
  
  // Abilities (loading)
  const abilityCell = document.createElement('td');
  abilityCell.textContent = 'Loading...';
  row.appendChild(abilityCell);
  
  // Threats (loading)
  const threatCell = document.createElement('td');
  threatCell.textContent = 'Loading...';
  row.appendChild(threatCell);
  
  // Tips (loading)
  const tipCell = document.createElement('td');
  tipCell.textContent = 'Loading...';
  row.appendChild(tipCell);
  
  // Load detailed data asynchronously
  fetchChampionDetail(champion.id).then(detail => {
    populateAbilities(abilityCell, detail);
    populateThreats(threatCell, detail);
    populateChallengerTips(tipCell, champion, detail, isEnemy);
  });
  
  return row;
}

function classifyCC(spell) {
  const desc = spell.description?.toLowerCase() || '';
  
  // Check for hard CC (non-cleansable)
  if (desc.includes('suppress') || desc.includes('suppression')) {
    return { type: 'hard', ccType: 'suppression', cleansable: false };
  }
  if (desc.includes('knock') || desc.includes('airborne') || desc.includes('suspend')) {
    return { type: 'hard', ccType: 'airborne', cleansable: false };
  }
  
  // Check for soft CC (cleansable)
  if (desc.includes('stun')) {
    return { type: 'soft', ccType: 'stun', cleansable: true };
  }
  if (desc.includes('root') || desc.includes('immobilize')) {
    return { type: 'soft', ccType: 'root', cleansable: true };
  }
  if (desc.includes('slow')) {
    return { type: 'soft', ccType: 'slow', cleansable: true };
  }
  if (desc.includes('charm')) {
    return { type: 'soft', ccType: 'charm', cleansable: true };
  }
  if (desc.includes('fear')) {
    return { type: 'soft', ccType: 'fear', cleansable: true };
  }
  if (desc.includes('taunt')) {
    return { type: 'soft', ccType: 'taunt', cleansable: true };
  }
  if (desc.includes('silence')) {
    return { type: 'soft', ccType: 'silence', cleansable: true };
  }
  
  // Check for high threats
  if (desc.includes('dash') || desc.includes('blink') || desc.includes('leap')) {
    return { type: 'high', ccType: 'dash', cleansable: false };
  }
  if (desc.includes('burst') || (desc.includes('damage') && desc.includes('bonus'))) {
    return { type: 'high', ccType: 'burst', cleansable: false };
  }
  if (desc.includes('stealth') || desc.includes('invisible')) {
    return { type: 'high', ccType: 'stealth', cleansable: false };
  }
  
  // Check for medium threats
  if (desc.includes('shield')) {
    return { type: 'medium', ccType: 'shield', cleansable: false };
  }
  if (desc.includes('poke')) {
    return { type: 'medium', ccType: 'poke', cleansable: false };
  }
  
  // Check for low threats
  if (desc.includes('heal') || desc.includes('regenerat')) {
    return { type: 'low', ccType: 'sustain', cleansable: false };
  }
  
  return null;
}

function populateAbilities(cell, detail) {
  cell.innerHTML = '';
  
  if (!detail.spells) return;
  
  const keys = ['Q', 'W', 'E', 'R'];
  detail.spells.forEach((spell, i) => {
    const div = document.createElement('div');
    div.className = 'ability';
    
    const key = document.createElement('span');
    key.className = 'ability-key';
    key.textContent = keys[i];
    div.appendChild(key);
    
    const name = document.createElement('span');
    
    // Classify the spell's CC type and threat
    const classification = classifyCC(spell);
    const cooldowns = spell.cooldown || [];
    
    if (cooldowns.length > 0) {
      const cdText = cooldowns.join('/');
      let cdClass = 'cd-medium';
      
      if (classification) {
        cdClass = `cd-${classification.type}`;
      }
      
      let badgeText = `${cdText}s`;
      if (classification && classification.cleansable) {
        badgeText += ' ✓';
      }
      
      name.innerHTML = `${spell.name} <span class="cd-badge ${cdClass}">${badgeText}</span>`;
    } else {
      name.textContent = spell.name;
    }
    
    div.appendChild(name);
    
    cell.appendChild(div);
  });
}

function populateThreats(cell, detail) {
  cell.innerHTML = '';
  
  const tags = analyzeThreatTags(detail);
  tags.forEach(tag => {
    const span = document.createElement('span');
    const tagLower = tag.tag.toLowerCase();
    span.className = `threat-tag tag-${tagLower}`;
    span.textContent = tag.tag;
    
    if (tag.cleansable) {
      const note = document.createElement('span');
      note.className = 'cleanse-note';
      note.textContent = 'Cleansable';
      span.appendChild(document.createTextNode(' '));
      span.appendChild(note);
    }
    
    cell.appendChild(span);
  });
}

function analyzeThreatTags(detail) {
  const tags = [];
  const spells = detail.spells || [];
  const seenTypes = new Set();
  
  spells.forEach(spell => {
    const classification = classifyCC(spell);
    if (classification && !seenTypes.has(classification.ccType)) {
      tags.push({
        tag: classification.ccType.charAt(0).toUpperCase() + classification.ccType.slice(1),
        cleansable: classification.cleansable
      });
      seenTypes.add(classification.ccType);
    }
  });
  
  return tags.slice(0, 5);
}

function populateChallengerTips(cell, champion, detail, isEnemy) {
  cell.innerHTML = '';
  
  if (!state.selectedADC) {
    cell.textContent = 'No ADC selected';
    return;
  }
  
  let tip = '';
  
  // For enemies, check ADC_TEMPLATES first
  if (isEnemy && ADC_TEMPLATES[state.selectedADC.name]) {
    const adcTemplate = ADC_TEMPLATES[state.selectedADC.name];
    if (adcTemplate.tips && adcTemplate.tips[champion.name]) {
      tip = adcTemplate.tips[champion.name];
    }
  }
  
  // For allies, check support-specific synergy tips first
  if (!tip && !isEnemy && SUPPORT_TEMPLATES[champion.name]) {
    const synergy = SUPPORT_TEMPLATES[champion.name].synergy;
    if (synergy[state.selectedADC.name]) {
      tip = synergy[state.selectedADC.name];
    }
  }
  
  // Fallback to generic tips
  if (!tip) {
    tip = isEnemy 
      ? `Respect ${champion.name}'s cooldowns. Trade aggressively when key abilities are down.`
      : `Sync your engage/disengage with ${champion.name}. Watch for their ability windows.`;
  }
  
  const p = document.createElement('p');
  p.className = 'tip-text';
  p.textContent = tip;
  cell.appendChild(p);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);