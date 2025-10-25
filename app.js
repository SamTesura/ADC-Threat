/**
 * ADC Threat - Challenger Reference
 * Challenger-level analysis with full cooldown progression
 * Data from EUW, KR, and China Challenger meta
 */

const CONFIG = {
  PATCH_API: 'https://ddragon.leagueoflegends.com/api/versions.json',
  CHAMPION_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json',
  CHAMPION_DETAIL_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championId}.json',
  CHAMPION_IMG: 'https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png'
};

let state = {
  patch: null,
  champions: {},
  selectedADC: null,
  enemies: [],
  allies: []
};

// Challenger-level tips database
const CHALLENGER_TIPS = {
  // Positioning and trading patterns from Challenger gameplay
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
    setupADCInput();
    createInputs();
    setupListeners();
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

function setupADCInput() {
  const input = document.getElementById('adcInput');
  
  input.addEventListener('input', (e) => handleADCInput(e.target));
  input.addEventListener('focus', (e) => handleADCInput(e.target));
  input.addEventListener('blur', () => {
    setTimeout(() => clearADCAutocomplete(), 200);
  });
}

function handleADCInput(input) {
  const query = input.value.toLowerCase().trim();
  
  // Get ADC champions only
  const adcIds = ADC_LIST.getAllADCs();
  const matches = adcIds
    .map(id => state.champions[id])
    .filter(c => c && (!query || c.name.toLowerCase().includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);
  
  showADCAutocomplete(input, matches);
}

function showADCAutocomplete(input, champions) {
  clearADCAutocomplete();
  
  if (champions.length === 0) return;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete';
  dropdown.id = 'adcAutocomplete';
  
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
    
    item.addEventListener('click', () => {
      selectADC(champ);
      clearADCAutocomplete();
    });
    
    dropdown.appendChild(item);
  });
  
  document.getElementById('adcAutocomplete').appendChild(dropdown);
}

function clearADCAutocomplete() {
  const container = document.getElementById('adcAutocomplete');
  if (container) container.innerHTML = '';
}

function selectADC(champion) {
  state.selectedADC = champion;
  
  // Update input
  const input = document.getElementById('adcInput');
  input.value = champion.name;
  
  // Show selected champion with image
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
  
  updateTable();
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
  
  input.addEventListener('input', (e) => handleInput(e.target));
  input.addEventListener('blur', () => {
    setTimeout(() => clearAutocomplete(), 200);
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
    
    item.addEventListener('click', () => {
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
  // Listeners are now set up in setupADCInput()
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
    
    // Show cooldown progression for all levels
    const cooldowns = spell.cooldown || [];
    if (cooldowns.length > 0) {
      const cdText = cooldowns.join('/');
      const maxCd = cooldowns[cooldowns.length - 1];
      const cdClass = maxCd <= 8 ? 'cd-short' : maxCd <= 20 ? 'cd-medium' : 'cd-long';
      name.innerHTML = `${spell.name} <span class="cd-badge ${cdClass}">${cdText}s</span>`;
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
    span.className = `threat-tag tag-${tag.toLowerCase()}`;
    span.textContent = tag;
    cell.appendChild(span);
  });
}

function analyzeThreatTags(detail) {
  const tags = new Set();
  const spells = detail.spells || [];
  
  spells.forEach(spell => {
    const desc = spell.description?.toLowerCase() || '';
    
    if (desc.includes('stun') || desc.includes('root') || desc.includes('immobilize')) tags.add('CC');
    if (desc.includes('slow')) tags.add('Slow');
    if (desc.includes('dash') || desc.includes('blink') || desc.includes('leap')) tags.add('Dash');
    if (desc.includes('shield')) tags.add('Shield');
    if (desc.includes('damage') && (desc.includes('bonus') || desc.includes('burst'))) tags.add('Burst');
    if (desc.includes('heal') || desc.includes('regenerat')) tags.add('Sustain');
    if (desc.includes('stealth') || desc.includes('invisible')) tags.add('Stealth');
  });
  
  return Array.from(tags).slice(0, 4);
}

function populateChallengerTips(cell, champion, detail, isEnemy) {
  cell.innerHTML = '';
  
  if (!state.selectedADC) {
    cell.textContent = 'No ADC selected';
    return;
  }
  
  let tip = '';
  
  // Check for support-specific synergy tips
  if (!isEnemy && SUPPORT_TEMPLATES[champion.name]) {
    const synergy = SUPPORT_TEMPLATES[champion.name].synergy;
    if (synergy[state.selectedADC.name]) {
      tip = synergy[state.selectedADC.name];
    }
  }
  
  // Generate Challenger-level tips for enemies
  if (!tip && isEnemy) {
    tip = generateChallengerEnemyTip(champion, detail);
  }
  
  // Generate Challenger-level tips for allies
  if (!tip && !isEnemy) {
    tip = generateChallengerAllyTip(champion, detail);
  }
  
  // Fallback
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

function generateChallengerEnemyTip(champion, detail) {
  const threats = analyzeThreatTags(detail);
  const hasCC = threats.includes('CC');
  const hasDash = threats.includes('Dash');
  const hasBurst = threats.includes('Burst');
  
  // Challenger positioning tips based on champion threats
  if (hasCC && hasDash) {
    return `High threat: ${champion.name} has CC + mobility. Stay max range, position behind minions. Trade only when dash is down.`;
  } else if (hasCC) {
    return `CC threat: Position behind minions vs ${champion.name}. Respect their CC cooldown (~15-20s). Trade aggressively when it's down.`;
  } else if (hasBurst) {
    return `Burst threat: ${champion.name} has high damage. Track their combo cooldowns. Play safe when abilities are up, trade when down.`;
  } else if (hasDash) {
    return `Mobility threat: ${champion.name} can gap close. Maintain spacing. Use your range advantage. Ward flanks.`;
  }
  
  return `Monitor ${champion.name}'s cooldowns. Trade during ability downtime. Maintain optimal spacing.`;
}

function generateChallengerAllyTip(champion, detail) {
  const threats = analyzeThreatTags(detail);
  const hasCC = threats.includes('CC');
  const hasDash = threats.includes('Dash');
  
  // Challenger coordination tips
  if (hasCC && hasDash) {
    return `Engage potential: ${champion.name} has CC + gap close. Position for follow-up. Be ready to all-in when they engage.`;
  } else if (hasCC) {
    return `CC setup: When ${champion.name} lands CC, follow immediately with your damage combo. Communicate engage timing.`;
  } else if (hasDash) {
    return `Mobile ally: ${champion.name} can engage/disengage. Stay in range to follow. Don't overextend alone.`;
  }
  
  return `Coordinate with ${champion.name}. Match their aggression level. Communicate ability cooldowns for optimal trades.`;
}

// Start the app
document.addEventListener('DOMContentLoaded', init);