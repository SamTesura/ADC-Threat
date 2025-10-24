let state = {};

// --- CONSTANTS ---
const CHAMPION_ICON_URL_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/';

// --- TEMPLATE ---
function getChampionHTML(champion) {
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${champion.key}.png`;
	return `
        <li class="champion-item" data-champion-id="${champion.id}">
            <img src="${iconUrl}" alt="${champion.name}" class="champion-icon">
            <span class="champion-name">${champion.name}</span>
        </li>
    `;
}

function getSelectedChampionHTML(champion, tips) {
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${champion.key}.png`;
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
	championList.innerHTML = '';
	selectedChampion.innerHTML = '';

	// Filter champions based on the search query
	const filteredChampions = filterChampions(state.champions, state.filter);

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
		const champion = state.champions.find(
			c => c.id === state.selectedChampion
		);
		const tips = SUPPORT_TIPS[champion.id] || ['No tips available for this champion.'];
		selectedChampion.innerHTML = getSelectedChampionHTML(champion, tips);
		selectedChampion.classList.add('active');
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
		render();
		await loadChampionData();
		setupEventListeners();
		// Initial render
		setState({
			champions: [],
			selectedChampion: null,
			filter: '',
		});
	} catch (error) {
		console.error('Initialization failed:', error);
	}
}

// --- State Management ---
// let state = {}; // THIS LINE WAS MOVED TO THE TOP

function setState(newState) {
	// Merge new state with old state
	Object.assign(state, newState);
	// Re-render the UI
	render();
}

// --- Event Listeners ---
function setupEventListeners() {
	const searchBox = document.getElementById('search-box');
	searchBox.addEventListener('input', handleSearchInput);

	// Add listener to the clear button
	const clearButton = document.querySelector('.clear-search');
	clearButton.addEventListener('click', () => {
		searchBox.value = '';
		setState({
			filter: '',
		});
	});
}

// --- DATA FETCHING ---
async function loadChampionData() {
	const CHAMPION_DATA_URL = './champions-summary.json';
	try {
		// Use ADC_LIST directly instead of fetching
		const champions = Object.values(ADC_LIST.data);

		// Sort champions alphabetically by name
		champions.sort((a, b) => a.name.localeCompare(b.name));

		console.log('Champion data loaded:', champions);
		setState({
			champions: champions,
		});
	} catch (error) {
		console.error(
			`Could not load champion data (${CHAMPION_DATA_URL}).\n` +
				`Please check network connection or file path.`
		);
	}
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializeApp);
