/**
 * ADC Threat Lookup - Professional Edition
 * Main Application Logic - Fixed Version
 * 
 * Fixes:
 * - API timeout handling
 * - Force-hide loading screen after 10 seconds
 * - Better error recovery
 */

// ======================
// CONSTANTS & CONFIGURATION
// ======================

const CONFIG = {
    PATCH_API: 'https://ddragon.leagueoflegends.com/api/versions.json',
    CHAMPION_DATA_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json',
    CHAMPION_FULL_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championId}.json',
    CHAMPION_IMG_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png',
    ABILITY_IMG_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{spellId}.png',
    PASSIVE_IMG_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/img/passive/{passiveId}.png',
    CACHE_DURATION: 1000 * 60 * 60, // 1 hour
    AUTO_UPDATE_INTERVAL: 1000 * 60 * 30, // 30 minutes
    FETCH_TIMEOUT: 8000, // 8 seconds
    MAX_INIT_TIME: 10000 // 10 seconds max for initialization
};

const MAX_ENEMIES = 5;
const MAX_ALLIES = 1;

// ======================
// GLOBAL STATE
// ======================

let appState = {
    currentPatch: null,
    championData: null,
    selectedADC: null,
    selectedSupport: null,
    selectedEnemies: [],
    selectedAllies: [],
    synergyEngine: null,
    settings: {
        theme: 'dark',
        animations: true,
        autoUpdate: true,
        region: 'kr'
    }
};

// ======================
// UTILITY FUNCTIONS (Moved to top)
// ======================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, timeout = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Debounce function
 */
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

// ======================
// INITIALIZATION
// ======================

/**
 * Initialize application with timeout protection
 */
async function initializeApp() {
    // Force hide loading screen after max time
    const forceHideTimeout = setTimeout(() => {
        console.warn('⚠️ Initialization timeout - force hiding loading screen');
        hideLoading();
    }, CONFIG.MAX_INIT_TIME);

    try {
        console.log('🚀 ADC Threat Pro initializing...');
        showLoading('Initializing application...');

        // Load settings from localStorage
        loadSettings();

        // Get latest patch version with timeout
        showLoading('Fetching patch data...');
        const patch = await getCurrentPatch();
        appState.currentPatch = patch;
        updatePatchDisplay(patch);
        console.log(`✓ Latest patch: ${patch}`);

        // Load champion data with timeout
        showLoading('Loading champion data...');
        const championData = await loadChampionData(patch);
        appState.championData = championData;
        console.log(`✓ Loaded ${Object.keys(championData.data).length} champions`);

        // Initialize synergy engine
        showLoading('Initializing synergy engine...');
        appState.synergyEngine = new SynergyEngine();
        await appState.synergyEngine.initialize(championData);

        // Build UI
        showLoading('Building interface...');
        buildADCGrid();
        setupEventListeners();
        
        // Clear timeout and hide loading screen
        clearTimeout(forceHideTimeout);
        hideLoading();
        
        console.log('✓ Application initialized successfully');

        // Setup auto-update if enabled
        if (appState.settings.autoUpdate) {
            setupAutoUpdate();
        }

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        console.error('Error details:', error.message);
        
        // Still try to hide loading and show something to the user
        clearTimeout(forceHideTimeout);
        hideLoading();
        
        // Show error in UI
        const adcGrid = document.getElementById('adc-grid');
        if (adcGrid) {
            adcGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <h2 style="color: var(--danger); margin-bottom: 20px;">⚠️ Failed to Load Data</h2>
                    <p style="margin-bottom: 20px;">Unable to fetch champion data from Riot Games API.</p>
                    <p style="margin-bottom: 20px;">Error: ${error.message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Page
                    </button>
                    <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.7;">
                        Try clearing your browser cache (Ctrl+Shift+Delete) and refreshing again.
                    </p>
                </div>
            `;
        }
    }
}

/**
 * Get current patch version from Riot API with timeout
 */
async function getCurrentPatch() {
    try {
        console.log('📡 Fetching patch version from:', CONFIG.PATCH_API);
        
        // Try cache first
        const cached = getCachedData('current_patch');
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            console.log('✓ Using cached patch:', cached.data);
            return cached.data;
        }

        // Fetch with timeout
        const response = await fetchWithTimeout(CONFIG.PATCH_API);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const versions = await response.json();
        const latestPatch = versions[0];
        
        console.log('✓ Fetched latest patch:', latestPatch);
        setCachedData('current_patch', latestPatch);
        return latestPatch;

    } catch (error) {
        console.error('❌ Failed to fetch patch version:', error.message);
        
        // Fallback to cached
        const cached = getCachedData('current_patch');
        if (cached) {
            console.log('⚠️ Using cached patch:', cached.data);
            return cached.data;
        }
        
        // Ultimate fallback
        const fallback = '14.23.1';
        console.log('⚠️ Using fallback patch:', fallback);
        return fallback;
    }
}

/**
 * Load champion data from Riot CDN with timeout
 */
async function loadChampionData(patch) {
    try {
        const cacheKey = `champion_data_${patch}`;
        console.log('📡 Loading champion data for patch:', patch);
        
        // Try cache first
        const cached = getCachedData(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            console.log('✓ Using cached champion data');
            return cached.data;
        }

        // Fetch with timeout
        const url = CONFIG.CHAMPION_DATA_API.replace('{version}', patch);
        console.log('📡 Fetching from:', url);
        
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✓ Fetched champion data successfully');
        
        setCachedData(cacheKey, data);
        return data;

    } catch (error) {
        console.error('❌ Failed to load champion data:', error.message);
        
        // Try cache even if expired
        const cacheKey = `champion_data_${patch}`;
        const cached = getCachedData(cacheKey);
        if (cached) {
            console.log('⚠️ Using expired cached data');
            return cached.data;
        }
        
        throw new Error(`Cannot load champion data: ${error.message}`);
    }
}

/**
 * Load full champion data (with abilities)
 */
async function loadFullChampionData(championId) {
    try {
        const cacheKey = `champion_full_${championId}_${appState.currentPatch}`;
        const cached = getCachedData(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }

        const url = CONFIG.CHAMPION_FULL_API
            .replace('{version}', appState.currentPatch)
            .replace('{championId}', championId);
        
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const championData = data.data[championId];
        
        setCachedData(cacheKey, championData);
        return championData;

    } catch (error) {
        console.error(`Failed to load full data for ${championId}:`, error.message);
        return null;
    }
}

// ======================
// UI BUILDING
// ======================

/**
 * Build ADC champion grid - ONLY META ADCs
 */
function buildADCGrid() {
    const grid = document.getElementById('adc-grid');
    if (!grid) {
        console.error('ADC grid element not found');
        return;
    }

    grid.innerHTML = '';

    // Get only meta ADCs from our curated list
    const metaADCs = ADC_LIST.getAllADCs();
    const championData = appState.championData.data;

    // Filter and sort ADCs
    const adcChampions = metaADCs
        .map(championId => championData[championId])
        .filter(champ => champ !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✓ Displaying ${adcChampions.length} meta ADCs`);

    // Build grid
    adcChampions.forEach(champion => {
        const card = createChampionCard(champion, 'adc');
        grid.appendChild(card);
    });
}

/**
 * Build support champion grid
 */
function buildSupportGrid() {
    const grid = document.getElementById('support-grid');
    if (!grid) {
        console.error('Support grid element not found');
        return;
    }

    grid.innerHTML = '';

    const championData = appState.championData.data;
    
    // Filter supports
    const supportChampions = Object.values(championData)
        .filter(champ => champ.tags && champ.tags.includes('Support'))
        .sort((a, b) => a.name.localeCompare(b.name));

    // Build grid
    supportChampions.forEach(champion => {
        const card = createChampionCard(champion, 'support');
        grid.appendChild(card);
    });
}

/**
 * Create champion card element
 */
function createChampionCard(champion, role) {
    const card = document.createElement('div');
    card.className = 'champion-card';
    card.dataset.championId = champion.id;
    card.dataset.role = role;

    // Get meta tier if ADC
    let tierBadge = '';
    if (role === 'adc') {
        const tier = ADC_LIST.getMetaTier(champion.id);
        tierBadge = `<span class="tier-badge tier-${tier.toLowerCase().replace('+', 'plus')}">${tier}</span>`;
    }

    const imgUrl = CONFIG.CHAMPION_IMG_API
        .replace('{version}', appState.currentPatch)
        .replace('{championId}', champion.id);

    card.innerHTML = `
        <div class="champion-card-img">
            <img src="${imgUrl}" alt="${champion.name}" loading="lazy">
            ${tierBadge}
        </div>
        <div class="champion-card-name">${champion.name}</div>
    `;

    card.addEventListener('click', () => handleChampionSelect(champion, role));

    return card;
}

// ======================
// CHAMPION SELECTION
// ======================

/**
 * Handle champion selection
 */
async function handleChampionSelect(champion, role) {
    if (role === 'adc') {
        await selectADC(champion);
    } else if (role === 'support') {
        await selectSupport(champion);
    }
}

/**
 * Select ADC champion
 */
async function selectADC(champion) {
    try {
        console.log(`ADC selected: ${champion.name}`);
        
        appState.selectedADC = champion;

        // Update UI
        updateSelectedChampion('adc', champion);
        
        // Show support selection
        const supportSection = document.getElementById('support-section');
        if (supportSection) {
            supportSection.style.display = 'block';
            buildSupportGrid();
        }

        // Load full champion data in background
        loadFullChampionData(champion.id);

    } catch (error) {
        console.error('Error selecting ADC:', error);
        showError('Failed to select ADC');
    }
}

/**
 * Select support champion
 */
async function selectSupport(champion) {
    try {
        console.log(`Support selected: ${champion.name}`);
        
        appState.selectedSupport = champion;

        // Update UI
        updateSelectedChampion('support', champion);

        // Show synergy analysis
        await showSynergyAnalysis();

    } catch (error) {
        console.error('Error selecting support:', error);
        showError('Failed to select support');
    }
}

/**
 * Update selected champion display
 */
function updateSelectedChampion(role, champion) {
    const imgElement = document.getElementById(`selected-${role}-img`);
    const nameElement = document.getElementById(`selected-${role}-name`);

    if (imgElement && nameElement) {
        const imgUrl = CONFIG.CHAMPION_IMG_API
            .replace('{version}', appState.currentPatch)
            .replace('{championId}', champion.id);

        imgElement.src = imgUrl;
        imgElement.alt = champion.name;
        nameElement.textContent = champion.name;
    }
}

// ======================
// SYNERGY ANALYSIS
// ======================

/**
 * Show synergy analysis section
 */
async function showSynergyAnalysis() {
    try {
        const section = document.getElementById('synergy-section');
        if (!section) return;

        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });

        // Calculate synergy
        await updateSynergyAnalysis();

    } catch (error) {
        console.error('Error showing synergy analysis:', error);
    }
}

/**
 * Update synergy analysis
 */
async function updateSynergyAnalysis() {
    try {
        if (!appState.selectedADC || !appState.selectedSupport) {
            console.warn('Both ADC and Support must be selected');
            return;
        }

        console.log('Calculating synergy...');

        // Load full champion data for both if not already loaded
        const [adcFullData, supportFullData] = await Promise.all([
            loadFullChampionData(appState.selectedADC.id),
            loadFullChampionData(appState.selectedSupport.id)
        ]);

        // Calculate synergy using the engine
        const synergy = appState.synergyEngine.calculateSynergy(
            appState.selectedADC.id,
            appState.selectedSupport.id
        );

        // Update synergy rating display
        updateSynergyRating(synergy);

        // Update strengths, weaknesses, tips
        updateSynergyInsights(synergy);

        // Update phase guides
        updatePhaseGuides(synergy);

        // Build threat matrix with full champion data
        await buildThreatMatrix(adcFullData, supportFullData);

        console.log('✓ Synergy analysis updated');

    } catch (error) {
        console.error('Error updating synergy analysis:', error);
        showError('Failed to update synergy analysis');
    }
}

/**
 * Update synergy rating display
 */
function updateSynergyRating(synergy) {
    const ratingElement = document.getElementById('synergy-rating');
    if (!ratingElement) return;

    const ratingValue = ratingElement.querySelector('.rating-value');
    if (ratingValue) {
        ratingValue.textContent = synergy.grade;
        ratingValue.className = `rating-value rating-${synergy.grade.toLowerCase().replace('+', 'plus')}`;
    }
}

/**
 * Update synergy insights (strengths, weaknesses, tips)
 */
function updateSynergyInsights(synergy) {
    // Strengths
    const strengthsContainer = document.getElementById('synergy-strengths');
    if (strengthsContainer && synergy.strengths) {
        strengthsContainer.innerHTML = synergy.strengths
            .map(strength => `<div class="synergy-item"><span class="icon">✓</span> ${strength}</div>`)
            .join('');
    }

    // Weaknesses
    const weaknessesContainer = document.getElementById('synergy-weaknesses');
    if (weaknessesContainer && synergy.weaknesses) {
        weaknessesContainer.innerHTML = synergy.weaknesses
            .map(weakness => `<div class="synergy-item"><span class="icon">!</span> ${weakness}</div>`)
            .join('');
    }

    // Tips
    const tipsContainer = document.getElementById('synergy-tips');
    if (tipsContainer && synergy.tips) {
        tipsContainer.innerHTML = synergy.tips
            .map(tip => `<div class="synergy-item"><span class="icon">💡</span> ${tip}</div>`)
            .join('');
    }
}

/**
 * Update phase guides
 */
function updatePhaseGuides(synergy) {
    // Early game guide
    const earlyGuide = document.getElementById('early-game-guide');
    if (earlyGuide && synergy.earlyGame) {
        earlyGuide.innerHTML = `<p>${synergy.earlyGame}</p>`;
    }

    // All-in windows
    const allInWindows = document.getElementById('all-in-windows');
    if (allInWindows) {
        allInWindows.innerHTML = `<p>Look for all-ins when both champions have key abilities available. Coordinate cooldowns and positioning.</p>`;
    }

    // Defensive guide
    const defensiveGuide = document.getElementById('defensive-guide');
    if (defensiveGuide) {
        defensiveGuide.innerHTML = `<p>When behind, focus on farming safely and avoiding risky trades. Let enemies push and farm under tower.</p>`;
    }

    // Positioning guide
    const positioningGuide = document.getElementById('positioning-guide');
    if (positioningGuide && synergy.lateGame) {
        positioningGuide.innerHTML = `<p>${synergy.lateGame}</p>`;
    }

    // Target priority
    const targetPriority = document.getElementById('target-priority');
    if (targetPriority) {
        targetPriority.innerHTML = `<p>Prioritize high-value targets while maintaining safe positioning. Focus backline when possible.</p>`;
    }

    // Combo guide
    const comboGuide = document.getElementById('combo-guide');
    if (comboGuide) {
        comboGuide.innerHTML = `<p>Coordinate abilities for maximum impact. ADC should follow up on support's engagement or peel.</p>`;
    }
}

/**
 * Build threat matrix
 */
async function buildThreatMatrix(adcData, supportData) {
    try {
        const grid = document.getElementById('threat-matrix-grid');
        if (!grid) return;

        grid.innerHTML = '<div class="loading-message">Loading threat data...</div>';

        // Get all champions
        const allChampions = Object.values(appState.championData.data)
            .filter(champ => {
                return champ.id !== appState.selectedADC.id && 
                       champ.id !== appState.selectedSupport.id;
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // Build threat matrix
        grid.innerHTML = '';

        for (const champion of allChampions.slice(0, 20)) {
            const threatCard = await createThreatCard(champion, adcData);
            grid.appendChild(threatCard);
        }

        console.log('✓ Threat matrix built');

    } catch (error) {
        console.error('Error building threat matrix:', error);
        const grid = document.getElementById('threat-matrix-grid');
        if (grid) {
            grid.innerHTML = '<div class="error-message">Failed to load threat data</div>';
        }
    }
}

/**
 * Create threat card
 */
async function createThreatCard(champion, adcData) {
    const card = document.createElement('div');
    card.className = 'threat-card';

    const imgUrl = CONFIG.CHAMPION_IMG_API
        .replace('{version}', appState.currentPatch)
        .replace('{championId}', champion.id);

    const threatLevel = calculateThreatLevel(champion, adcData);

    card.innerHTML = `
        <div class="threat-card-header">
            <img src="${imgUrl}" alt="${champion.name}" class="threat-champion-img">
            <div class="threat-champion-info">
                <div class="threat-champion-name">${champion.name}</div>
                <div class="threat-level threat-${threatLevel}">${threatLevel.toUpperCase()}</div>
            </div>
        </div>
        <div class="threat-card-body">
            <div class="threat-stat">
                <span class="stat-label">Role:</span>
                <span class="stat-value">${champion.tags?.join(', ') || 'Unknown'}</span>
            </div>
            <div class="threat-abilities" data-champion-id="${champion.id}">
                <div class="ability-loading">Loading abilities...</div>
            </div>
        </div>
    `;

    // Load abilities asynchronously
    loadFullChampionData(champion.id).then(fullData => {
        const abilitiesContainer = card.querySelector('.threat-abilities');
        if (abilitiesContainer && fullData) {
            updateAbilitiesDisplay(abilitiesContainer, fullData);
        }
    }).catch(error => {
        console.error(`Failed to load abilities for ${champion.id}:`, error);
        const abilitiesContainer = card.querySelector('.threat-abilities');
        if (abilitiesContainer) {
            abilitiesContainer.innerHTML = '<div class="ability-error">Failed to load abilities</div>';
        }
    });

    return card;
}

/**
 * Update abilities display
 */
function updateAbilitiesDisplay(container, championData) {
    if (!championData || !championData.spells) {
        container.innerHTML = '<div class="ability-error">No ability data available</div>';
        return;
    }

    const abilities = [];

    if (championData.passive) {
        abilities.push({
            name: championData.passive.name,
            description: cleanDescription(championData.passive.description),
            cooldown: 'Passive'
        });
    }

    championData.spells.forEach((spell, index) => {
        const key = ['Q', 'W', 'E', 'R'][index];
        const cooldowns = spell.cooldown || [];
        const cdText = cooldowns.length > 0 ? `${cooldowns[cooldowns.length - 1]}s` : 'N/A';

        abilities.push({
            name: `${key}: ${spell.name}`,
            description: cleanDescription(spell.description),
            cooldown: cdText
        });
    });

    container.innerHTML = abilities.map(ability => `
        <div class="ability-item">
            <div class="ability-header">
                <span class="ability-name">${ability.name}</span>
                <span class="ability-cd">${ability.cooldown}</span>
            </div>
            <div class="ability-desc">${ability.description}</div>
        </div>
    `).join('');
}

/**
 * Calculate threat level
 */
function calculateThreatLevel(champion, adcData) {
    const tags = champion.tags || [];
    
    if (tags.includes('Assassin')) return 'extreme';
    if (tags.includes('Fighter') || tags.includes('Tank')) return 'high';
    if (tags.includes('Mage')) return 'medium';
    
    return 'low';
}

/**
 * Clean HTML from descriptions
 */
function cleanDescription(description) {
    if (!description) return '';
    
    return description
        .replace(/<[^>]*>/g, '')
        .replace(/\{\{[^}]*\}\}/g, '')
        .substring(0, 150) + '...';
}

// ======================
// EVENT LISTENERS
// ======================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });

    // Search inputs
    const adcSearch = document.getElementById('adc-search');
    if (adcSearch) {
        adcSearch.addEventListener('input', debounce(handleADCSearch, 300));
    }

    const supportSearch = document.getElementById('support-search');
    if (supportSearch) {
        supportSearch.addEventListener('input', debounce(handleSupportSearch, 300));
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });

    // Reset button
    const resetBtn = document.getElementById('reset-selection');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSelection);
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => openModal('settings-modal'));
    }

    // Help button
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => openModal('help-modal'));
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.dataset.modal);
        });
    });

    // Patch refresh button
    const refreshBtn = document.getElementById('refresh-patch-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handlePatchRefresh);
    }

    // Settings toggles
    const settingsInputs = document.querySelectorAll('.setting-select, .toggle-switch input');
    settingsInputs.forEach(input => {
        input.addEventListener('change', handleSettingChange);
    });
}

/**
 * Handle tab click
 */
function handleTabClick(event) {
    const tabName = event.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

/**
 * Handle ADC search
 */
function handleADCSearch(event) {
    const query = event.target.value.toLowerCase();
    filterChampionGrid('adc-grid', query);
}

/**
 * Handle support search
 */
function handleSupportSearch(event) {
    const query = event.target.value.toLowerCase();
    filterChampionGrid('support-grid', query);
}

/**
 * Filter champion grid
 */
function filterChampionGrid(gridId, query) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const cards = grid.querySelectorAll('.champion-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.champion-card-name').textContent.toLowerCase();
        const matches = name.includes(query);
        card.style.display = matches ? 'block' : 'none';
    });
}

/**
 * Handle filter click
 */
function handleFilterClick(event) {
    const btn = event.target;
    const parent = btn.parentElement;
    
    parent.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    if (btn.dataset.role) {
        filterADCsByRole(btn.dataset.role);
    } else if (btn.dataset.supportType) {
        filterSupportsByType(btn.dataset.supportType);
    }
}

/**
 * Filter ADCs by role
 */
function filterADCsByRole(role) {
    const grid = document.getElementById('adc-grid');
    if (!grid) return;

    if (role === 'all') {
        buildADCGrid();
        return;
    }

    grid.innerHTML = '';
    const championData = appState.championData.data;
    const adcs = role === 'marksman' ? ADC_LIST.marksman : ADC_LIST.mage;

    adcs.forEach(championId => {
        const champion = championData[championId];
        if (champion) {
            const card = createChampionCard(champion, 'adc');
            grid.appendChild(card);
        }
    });
}

/**
 * Filter supports by type
 */
function filterSupportsByType(type) {
    const grid = document.getElementById('support-grid');
    if (!grid) return;

    if (type === 'all') {
        buildSupportGrid();
        return;
    }
}

/**
 * Reset selection
 */
function resetSelection() {
    appState.selectedADC = null;
    appState.selectedSupport = null;
    appState.selectedEnemies = [];
    appState.selectedAllies = [];

    const supportSection = document.getElementById('support-section');
    const synergySection = document.getElementById('synergy-section');
    
    if (supportSection) supportSection.style.display = 'none';
    if (synergySection) synergySection.style.display = 'none';

    buildADCGrid();
    
    console.log('Selection reset');
}

/**
 * Handle patch refresh
 */
async function handlePatchRefresh() {
    try {
        const btn = document.getElementById('refresh-patch-btn');
        if (btn) {
            btn.classList.add('refreshing');
        }

        clearCachedData('current_patch');
        await initializeApp();

        showNotification('Patch data updated successfully');

    } catch (error) {
        console.error('Failed to refresh patch data:', error);
        showError('Failed to refresh patch data');
    } finally {
        const btn = document.getElementById('refresh-patch-btn');
        if (btn) {
            btn.classList.remove('refreshing');
        }
    }
}

/**
 * Handle setting change
 */
function handleSettingChange(event) {
    const setting = event.target.id.replace('-toggle', '').replace('-select', '');
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    appState.settings[setting] = value;
    saveSettings();

    console.log(`Setting updated: ${setting} = ${value}`);

    if (setting === 'theme') {
        document.body.className = `theme-${value}`;
    }
}

// ======================
// UI UTILITY FUNCTIONS
// ======================

/**
 * Show loading overlay
 */
function showLoading(message) {
    const overlay = document.getElementById('loadingScreen');
    const details = document.getElementById('loading-details');
    
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
    }
    if (details) details.textContent = message;
    
    console.log('🔄', message);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingScreen');
    
    if (!overlay) {
        console.warn('Loading overlay not found');
        return;
    }

    // Smooth fade out animation
    overlay.style.transition = 'opacity 0.3s ease-out';
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.visibility = 'hidden';
        console.log('✓ Loading screen hidden');
    }, 300);
}

/**
 * Show error message
 */
function showError(message) {
    console.error(message);
    alert(message);
}

/**
 * Show notification
 */
function showNotification(message) {
    console.log(message);
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Update patch display
 */
function updatePatchDisplay(patch) {
    const element = document.getElementById('current-patch');
    if (element) {
        element.textContent = patch;
    }
}

/**
 * Setup auto-update
 */
function setupAutoUpdate() {
    setInterval(async () => {
        try {
            const newPatch = await getCurrentPatch();
            if (newPatch !== appState.currentPatch) {
                console.log(`New patch detected: ${newPatch}`);
                showNotification(`New patch available: ${newPatch}`);
            }
        } catch (error) {
            console.error('Auto-update check failed:', error);
        }
    }, CONFIG.AUTO_UPDATE_INTERVAL);
}

// ======================
// LOCAL STORAGE
// ======================

/**
 * Load settings from localStorage
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('adc_threat_settings');
        if (saved) {
            appState.settings = { ...appState.settings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('adc_threat_settings', JSON.stringify(appState.settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/**
 * Get cached data
 */
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(`adc_cache_${key}`);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error(`Failed to get cached data for ${key}:`, error);
    }
    return null;
}

/**
 * Set cached data
 */
function setCachedData(key, data) {
    try {
        localStorage.setItem(`adc_cache_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error(`Failed to cache data for ${key}:`, error);
    }
}

/**
 * Clear cached data
 */
function clearCachedData(key) {
    try {
        localStorage.removeItem(`adc_cache_${key}`);
    } catch (error) {
        console.error(`Failed to clear cached data for ${key}:`, error);
    }
}

// ======================
// INITIALIZATION
// ======================

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for debugging
window.appState = appState;