/**
 * ADC Threat Quick Reference - Streamlined Version
 * Single page, instant results, color-coded cooldowns, ADC-specific tips
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

// Initialize
async function init() {
  try {
    state.patch = await fetchPatch();
    state.champions = await fetchChampions(state.patch);
    populateADCSelect();
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

function populateADCSelect() {
  const select = document.getElementById('adcSelect');
  const adcs = ADC_LIST.getAllADCs()
    .map(id => state.champions[id])
    .filter(c => c)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  adcs.forEach(champ => {
    const option = document.createElement('option');
    option.value = champ.id;
    option.textContent = champ.name;
    select.appendChild(option);
  });
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
  document.getElementById('adcSelect').addEventListener('change', (e) => {
    const championId = e.target.value;
    if (championId) {
      state.selectedADC = state.champions[championId];
      updateTable();
    }
  });
}

async function updateTable() {
  const tbody = document.getElementById('threatBody');
  
  const allChamps = [
    ...state.enemies.filter(c => c),
    ...state.allies.filter(c => c)
  ];
  
  if (!state.selectedADC || allChamps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Select your ADC and add champions to see instant analysis</td></tr>';
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
    populateTips(tipCell, champion, isEnemy);
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
    const cd = spell.cooldown?.[spell.cooldown.length - 1] || 0;
    const cdClass = cd <= 8 ? 'cd-short' : cd <= 20 ? 'cd-medium' : 'cd-long';
    name.innerHTML = `${spell.name} <span class="cd-badge ${cdClass}">${cd}s</span>`;
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
    
    if (desc.includes('stun') || desc.includes('root')) tags.add('CC');
    if (desc.includes('slow')) tags.add('Slow');
    if (desc.includes('dash') || desc.includes('blink')) tags.add('Dash');
    if (desc.includes('shield')) tags.add('Shield');
    if (desc.includes('damage') && desc.includes('bonus')) tags.add('Burst');
    if (desc.includes('range')) tags.add('Poke');
  });
  
  return Array.from(tags).slice(0, 4);
}

function populateTips(cell, champion, isEnemy) {
  cell.innerHTML = '';
  
  if (!state.selectedADC) {
    cell.textContent = 'No ADC selected';
    return;
  }
  
  let tip = '';
  
  // Check if this is a support with specific synergy tips
  if (!isEnemy && SUPPORT_TEMPLATES[champion.name]) {
    const synergy = SUPPORT_TEMPLATES[champion.name].synergy;
    if (synergy[state.selectedADC.name]) {
      tip = synergy[state.selectedADC.name];
    }
  }
  
  // Generic tips for enemies or if no specific tip found
  if (!tip) {
    if (isEnemy) {
      tip = `Play safe vs ${champion.name}. Watch for their key abilities and respect their cooldowns.`;
    } else {
      tip = `Coordinate with ${champion.name} for better trades and all-ins.`;
    }
  }
  
  const p = document.createElement('p');
  p.className = 'tip-text';
  p.textContent = tip;
  cell.appendChild(p);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);