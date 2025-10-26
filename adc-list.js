/**
 * ADC List - Meta ADCs Only (Updated for Patch 15.21.1)
 * Only includes champions actually played as ADC in current meta
 * Separated by role: Marksman and Mage
 */

const ADC_LIST = {
    // Traditional Marksman ADCs (Meta picks)
    marksman: [
        'Aphelios',
        'Ashe', 
        'Caitlyn',
        'Corki',
        'Draven',
        'Ezreal',
        'Jhin',
        'Jinx',
        'Kaisa',
        'Kalista',
        'KogMaw',
        'Lucian',
        'MissFortune',
        'Nilah',
        'Quinn',
        'Samira',
        'Senna',
        'Sivir',
        'Smolder',
        'Tristana',
        'Twitch',
        'Varus',
        'Vayne',
        'Xayah',
        'Yunara',
        'Zeri'
    ],
    
    // Mage ADCs (Viable in current meta)
    mage: [
        'AurelionSol',
        'Cassiopeia',
        'Hwei',
        'Karthus',
        'Seraphine',
        'Swain',
        'Syndra',
        'Veigar',
        'Yasuo',
        'Yone',
        'Ziggs'
    ],
    
    // Get all ADCs
    getAllADCs() {
        return [...this.marksman, ...this.mage];
    },
    
    // Check if champion is an ADC
    isADC(championId) {
        return this.getAllADCs().includes(championId);
    },
    
    // Get role of ADC
    getADCRole(championId) {
        if (this.marksman.includes(championId)) return 'marksman';
        if (this.mage.includes(championId)) return 'mage';
        return null;
    },
    
    // Get meta tier (for future implementation)
    getMetaTier(championId) {
        // S+ Tier (Patch 15.21.1)
        const sTierPlus = ['Ashe', 'Jinx', 'Caitlyn', 'KogMaw', 'Ziggs'];
        
        // S Tier
        const sTier = ['Jhin', 'MissFortune', 'Varus', 'Ezreal', 'Nilah', 'Twitch'];
        
        // A Tier
        const aTier = ['Kaisa', 'Vayne', 'Smolder', 'Tristana', 'Lucian', 'Draven', 'Swain'];
        
        if (sTierPlus.includes(championId)) return 'S+';
        if (sTier.includes(championId)) return 'S';
        if (aTier.includes(championId)) return 'A';
        return 'B';
    }
};

// Support types for synergy calculation
const SUPPORT_TYPES = {
    enchanter: [
        'Janna', 'Lulu', 'Nami', 'Sona', 'Soraka', 'Yuumi', 
        'Karma', 'Milio', 'Renata', 'Seraphine', 'Senna'
    ],
    tank: [
        'Alistar', 'Braum', 'Leona', 'Nautilus', 'Rell', 'Tahm Kench',
        'Taric', 'Thresh'
    ],
    engage: [
        'Bard', 'Blitzcrank', 'Pyke', 'Rakan', 'Thresh', 'Nautilus',
        'Leona', 'Rell'
    ],
    poke: [
        'Brand', 'Lux', 'Xerath', 'Zyra', 'Vel\'Koz', 'Swain',
        'Karma', 'Senna', 'Ashe'
    ],
    catcher: [
        'Thresh', 'Morgana', 'Lux', 'Neeko', 'Zyra', 'Bard'
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ADC_LIST, SUPPORT_TYPES };
}
