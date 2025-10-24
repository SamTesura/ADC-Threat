let state = {};

// --- CONSTANTS ---
const CHAMPION_ICON_URL_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/';

// --- TEMPLATE ---
function getChampionHTML(champion) {
	// NOTE: Your new 'champions-summary.json' doesn't have a 'key' property.
	// We will use the 'slug' (which is the champion name like 'Aatrox') for the image.
	// We also need to get the proper icon filename.
	// This assumes your champion data has an 'id' or 'key' property.
	// Let's assume the champion object 'key' property IS available, as the old file had it.
	// If icons are broken, we need to check the data structure.
	
	// Fallback logic: if 'key' exists, use it. If not, try 'id'.
	const championKey = champion.key || champion.id;
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${championKey}.png`;
	
	return `
        <li class="champion-item" data-champion-id="${champion.id}">
            <img src="${iconUrl}" alt="${champion.name}" class="champion-icon">
            <span class="champion-name">${champion.name}</span>
        </li>
    `;
}

function getSelectedChampionHTML(champion, tips) {
	const championKey = champion.key || champion.id;
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${championKey}.png`;
	const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');

	return `
        <div class="selected-champion-header">
            <img src="${iconUrl}" alt="${champion.name}" class="selected-champion-icon">
            <div class="selected-champion-info">
                <h2>${champion.name}</h2>
                <p>${champion.title}</p>
            </div>
        </div>
        <div class="selected-champion-body">
            <h3>Support Tips vs. ${champion.name}:</h3>
            <ul class="tips-list">
                ${tipsHTML}
            </ul>
            <p class="champion-blurb">${champion.blurb}</p>
        </div>
    `;
}

// --- RENDER ---
function render() {
	console.log('Rendering with state:', state); // Debug log
	const championList = document.getElementById('champion-list');
	const selectedChampion = document.getElementById('selected-champion');
	
	if (!championList || !selectedChampion) {
		console.error("Render failed: 'champion-list' or 'selected-champion' element not found.");
		return;
	}

	championList.innerHTML = '';
	selectedChampion.innerHTML = '';

	// Ensure state.champions is an array
	const champions = Array.isArray(state.champions) ? state.champions : [];

	// Filter champions based on the search query
	const filteredChampions = filterChampions(champions, state.filter);

	// Render champion list
	if (filteredChampions.length > 0) {
		filteredChampions.forEach(champion => {
			championList.innerHTML += getChampionHTML(champion);
		});
	} else {
		championList.innerHTML = '<li class="no-results">No champions found.</li>';
	}

	// Render selected champion
	if (state.selectedChampion) {
		const champion = champions.find(
			c => c.id === state.selectedChampion
		);
		
		if (champion) {
			// **FIX:** Use SUPPORT_TEMPLATES from support-tips.js
			// This assumes SUPPORT_TEMPLATES is structured like the old SUPPORT_TIPS
			// If not, this line will need to be adjusted.
			let tips = ['No tips available for this champion.'];
			if (typeof SUPPORT_TEMPLATES !== 'undefined' && SUPPORT_TEMPLATES[champion.id]) {
				tips = SUPPORT_TEMPLATES[champion.id];
			} else if (typeof SUPPORT_TIPS !== 'undefined' && SUPPORT_TIPS[champion.id]) {
				// Fallback for the other variable name
				tips = SUPPORT_TIPS[champion.id];
			}

			selectedChampion.innerHTML = getSelectedChampionHTML(champion, tips);
			selectedChampion.classList.add('active');
		} else {
			state.selectedChampion = null; // Clear if champ not found
			selectedChampion.classList.remove('active');
		}
	} else {
		selectedChampion.classList.remove('active');
	}

	// Re-attach event listeners to new champion list items
	attachChampionListListeners();
}

function filterChampions(champions, filter) {
	if (!filter) {
		return champions;
	}
	const lowerCaseFilter = filter.toLowerCase();
	return champions.filter(champion =>
		champion.name.toLowerCase().includes(lowerCaseFilter)
	);
}

function attachChampionListListeners() {
	const championItems = document.querySelectorAll('.champion-item');
	championItems.forEach(item => {
		item.addEventListener('click', () => {
			const championId = item.dataset.championId;
			handleChampionClick(championId);
		});
	});
}

// --- ACTIONS / HANDLERS ---
function handleChampionClick(championId) {
	console.log('Champion clicked:', championId);
	setState({
		selectedChampion: championId,
	});
}

function handleSearchInput(event) {
	const filter = event.target.value;
	setState({
		filter: filter,
	});
}

// --- INITIALIZATION ---
async function initializeApp() {
	try {
		// Set default state *before* first render
		setState({
			champions: [],
			selectedChampion: null,
			filter: '',
		});
		
		await loadChampionData(); // Load data
		setupEventListeners();
		render(); // Render again with data
		
	} catch (error) {
		console.error('Initialization failed:', error);
	}
}

// --- State Management ---
function setState(newState) {
	// Merge new state with old state
	Object.assign(state, newState);
	// Re-render the UI
	render();
}

// --- Event Listeners ---
function setupEventListeners() {
	const searchBox = document.getElementById('search-box');
	if (searchBox) {
		searchBox.addEventListener('input', handleSearchInput);
	}

	// Add listener to the clear button
	const clearButton = document.querySelector('.clear-search');
	if (clearButton) {
		clearButton.addEventListener('click', () => {
			if(searchBox) {
				searchBox.value = '';
			}
			setState({
				filter: '',
			});
		});
	}
}

// --- DATA FETCHING ---
async function loadChampionData() {
	// **FIX:** This function now fetches the JSON file.
	const CHAMPION_DATA_URL = './champions-summary.json';
	try {
		const response = await fetch(CHAMPION_DATA_URL);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		// **FIX:** The champions-summary.json is an ARRAY.
		// We use it directly. We do NOT look for a '.data' property.
		const champions = await response.json(); 

		// Your new JSON file seems to be an Array, but the old app expected
		// an object of objects. We need to check.
		// Let's assume the JSON is an array of champion objects.
		if (!Array.isArray(champions)) {
			// If it's an object (like the old format), convert it
			const championsArray = Object.values(champions.data);
			championsArray.sort((a, b) => a.name.localeCompare(b.name));
			console.log('Champion data loaded (from object):', championsArray);
			setState({
				champions: championsArray,
			});
		} else {
			// It's an array, just sort it and set it
			champions.sort((a, b) => a.name.localeCompare(b.name));
			console.log('Champion data loaded (from array):', champions);
			setState({
				champions: champions,
			});
		}

	} catch (error) {
		console.error(
			`Could not load champion data (${CHAMPION_DATA_URL}).\n` +
			`ERROR: ${error.message}\n` +
			`This is likely a local server issue. Please see Solution 2.`
		);
	}
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializeApp);
