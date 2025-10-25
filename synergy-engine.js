/**
 * Synergy Engine - Professional Edition
 * Handles ADC-Support synergy calculations and analysis
 * Fixed: Syntax errors, undefined properties, loading issues
 */

class SynergyEngine {
    constructor() {
        this.championData = null;
        this.synergyDatabase = null;
        this.initialized = false;
    }

    /**
     * Initialize the synergy engine with champion data
     */
    async initialize(championData) {
        try {
            this.championData = championData;
            await this.loadSynergyDatabase();
            this.initialized = true;
            console.log('✓ Synergy Engine initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Synergy Engine:', error);
            return false;
        }
    }

    /**
     * Load synergy database (can be from API or local)
     */
    async loadSynergyDatabase() {
        // For now, use built-in synergy data
        // In production, this would load from API
        this.synergyDatabase = this.getBuiltInSynergies();
    }

    /**
     * Calculate synergy between ADC and Support
     * @param {string} adcId - Champion ID of ADC
     * @param {string} supportId - Champion ID of Support  
     * @returns {Object} Synergy analysis object
     */
    calculateSynergy(adcId, supportId) {
        if (!this.initialized) {
            console.warn('Synergy Engine not initialized');
            return this.getDefaultSynergy();
        }

        // Normalize champion IDs
        adcId = this.normalizeChampionId(adcId);
        supportId = this.normalizeChampionId(supportId);

        // Get champion data safely
        const adcData = this.getChampionData(adcId);
        const supportData = this.getChampionData(supportId);

        if (!adcData || !supportData) {
            console.error(`Missing champion data: ${adcId} or ${supportId}`);
            return this.getDefaultSynergy();
        }

        // Calculate synergy components
        const rangeCompatibility = this.calculateRangeCompatibility(adcData, supportData);
        const playStyleSynergy = this.calculatePlayStyleSynergy(adcData, supportData);
        const comboPotential = this.calculateComboPotential(adcData, supportData);
        const lanePhaseStrength = this.calculateLanePhaseStrength(adcData, supportData);

        // Calculate overall synergy rating (0-100)
        const synergyRating = Math.round(
            (rangeCompatibility * 0.25) +
            (playStyleSynergy * 0.35) +
            (comboPotential * 0.25) +
            (lanePhaseStrength * 0.15)
        );

        // Get specific synergy insights
        const insights = this.getSynergyInsights(adcId, supportId, synergyRating);

        return {
            rating: synergyRating,
            grade: this.getRatingGrade(synergyRating),
            rangeCompatibility,
            playStyleSynergy,
            comboPotential,
            lanePhaseStrength,
            ...insights
        };
    }

    /**
     * Get champion data safely with fallback
     */
    getChampionData(championId) {
        if (!this.championData || !this.championData.data) {
            return null;
        }
        
        // Try direct lookup
        let champData = this.championData.data[championId];
        
        // If not found, try case-insensitive search
        if (!champData) {
            const lowerCaseId = championId.toLowerCase();
            for (const key in this.championData.data) {
                if (key.toLowerCase() === lowerCaseId) {
                    champData = this.championData.data[key];
                    break;
                }
            }
        }
        
        return champData;
    }

    /**
     * Calculate range compatibility
     */
    calculateRangeCompatibility(adc, support) {
        const adcRange = parseInt(adc.stats?.attackrange) || 550;
        const supportRange = this.getAbilityRange(support);

        // Perfect compatibility when ranges are similar
        const rangeDiff = Math.abs(adcRange - supportRange);
        
        if (rangeDiff < 100) return 90;
        if (rangeDiff < 200) return 75;
        if (rangeDiff < 300) return 60;
        return 45;
    }

    /**
     * Calculate playstyle synergy
     */
    calculatePlayStyleSynergy(adc, support) {
        const adcTags = adc.tags || [];
        const supportTags = support.tags || [];

        let synergy = 50; // Base synergy

        // Check for complementary playstyles
        if (adcTags.includes('Marksman')) {
            if (supportTags.includes('Support')) synergy += 20;
            if (supportTags.includes('Tank')) synergy += 15;
        }

        if (adcTags.includes('Mage')) {
            if (supportTags.includes('Mage')) synergy += 10;
            if (supportTags.includes('Support')) synergy += 15;
        }

        // Aggressive synergies
        if (adcTags.includes('Fighter') && supportTags.includes('Fighter')) {
            synergy += 25;
        }

        return Math.min(synergy, 100);
    }

    /**
     * Calculate combo potential
     */
    calculateComboPotential(adc, support) {
        // Check for CC synergies
        const adcHasCC = this.hasCC(adc);
        const supportHasCC = this.hasCC(support);

        let potential = 50;

        if (supportHasCC) potential += 25;
        if (adcHasCC && supportHasCC) potential += 15;
        
        // Mobility synergies
        if (this.hasMobility(adc) && this.hasMobility(support)) {
            potential += 10;
        }

        return Math.min(potential, 100);
    }

    /**
     * Calculate lane phase strength
     */
    calculateLanePhaseStrength(adc, support) {
        let strength = 50;

        // Check for strong level 2-3 power spikes
        const adcEarlyGame = this.getEarlyGamePower(adc);
        const supportEarlyGame = this.getEarlyGamePower(support);

        strength += adcEarlyGame * 0.4;
        strength += supportEarlyGame * 0.6;

        return Math.min(Math.round(strength), 100);
    }

    /**
     * Get synergy insights with strengths, weaknesses, and tips
     */
    getSynergyInsights(adcId, supportId, rating) {
        // Check if we have specific synergy data
        const specificSynergy = this.getSpecificSynergy(adcId, supportId);
        
        if (specificSynergy) {
            return specificSynergy;
        }

        // Generate generic insights based on rating
        return this.generateGenericInsights(adcId, supportId, rating);
    }

    /**
     * Get specific pre-defined synergies
     */
    getSpecificSynergy(adcId, supportId) {
        const key = `${adcId}_${supportId}`;
        return this.synergyDatabase?.[key] || null;
    }

    /**
     * Generate generic insights when specific data not available
     */
    generateGenericInsights(adcId, supportId, rating) {
        const adcData = this.getChampionData(adcId);
        const supportData = this.getChampionData(supportId);

        const strengths = [];
        const weaknesses = [];
        const tips = [];

        // Generate based on champion characteristics
        if (rating >= 80) {
            strengths.push('Excellent synergy potential');
            strengths.push('Strong laning phase together');
            tips.push('Look for aggressive plays level 2-3');
        } else if (rating >= 60) {
            strengths.push('Good compatibility');
            tips.push('Play around power spikes');
        } else {
            weaknesses.push('Moderate synergy - requires coordination');
            tips.push('Focus on farming and scaling');
        }

        // Add champion-specific insights
        const adcTags = adcData?.tags || [];
        const supportTags = supportData?.tags || [];

        if (supportTags.includes('Tank')) {
            strengths.push('Frontline protection for ADC');
            tips.push('Let support engage first in fights');
        }

        if (adcTags.includes('Marksman') && supportTags.includes('Support')) {
            strengths.push('Traditional bot lane composition');
        }

        return {
            strengths,
            weaknesses,
            tips,
            earlyGame: this.getPhaseGuide('early', adcId, supportId),
            midGame: this.getPhaseGuide('mid', adcId, supportId),
            lateGame: this.getPhaseGuide('late', adcId, supportId)
        };
    }

    /**
     * Get phase-specific gameplay guide
     */
    getPhaseGuide(phase, adcId, supportId) {
        const guides = {
            early: {
                default: 'Focus on farming and establishing lane priority. Coordinate trades when abilities are available.'
            },
            mid: {
                default: 'Group for objectives and teamfights. Maintain vision control around objectives.'
            },
            late: {
                default: 'ADC needs peel and protection. Support should zone enemies and provide utility.'
            }
        };

        return guides[phase]?.default || 'Play around your power spikes';
    }

    /**
     * Helper: Check if champion has CC
     */
    hasCC(champion) {
        const ccKeywords = ['stun', 'root', 'snare', 'knock', 'slow', 'charm', 'fear', 'taunt'];
        const spells = champion.spells || [];
        
        return spells.some(spell => {
            const description = (spell.description || '').toLowerCase();
            return ccKeywords.some(keyword => description.includes(keyword));
        });
    }

    /**
     * Helper: Check if champion has mobility
     */
    hasMobility(champion) {
        const mobilityKeywords = ['dash', 'blink', 'leap', 'movement speed'];
        const spells = champion.spells || [];
        
        return spells.some(spell => {
            const description = (spell.description || '').toLowerCase();
            return mobilityKeywords.some(keyword => description.includes(keyword));
        });
    }

    /**
     * Helper: Get ability range
     */
    getAbilityRange(champion) {
        const spells = champion.spells || [];
        if (spells.length === 0) return 500;
        
        // Get average range of abilities
        const ranges = spells
            .map(spell => spell.range?.[0] || 500)
            .filter(range => range > 0);
        
        return ranges.length > 0 
            ? ranges.reduce((a, b) => a + b) / ranges.length 
            : 500;
    }

    /**
     * Helper: Get early game power rating
     */
    getEarlyGamePower(champion) {
        // Simplified - would be more complex in production
        const tags = champion.tags || [];
        
        if (tags.includes('Fighter')) return 30;
        if (tags.includes('Tank')) return 25;
        if (tags.includes('Marksman')) return 15;
        if (tags.includes('Mage')) return 20;
        
        return 10;
    }

    /**
     * Helper: Normalize champion ID
     */
    normalizeChampionId(championId) {
        if (!championId) return '';
        
        // Remove spaces and special characters
        return championId
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/\s+/g, '');
    }

    /**
     * Helper: Get rating grade
     */
    getRatingGrade(rating) {
        if (rating >= 90) return 'S+';
        if (rating >= 80) return 'S';
        if (rating >= 70) return 'A';
        if (rating >= 60) return 'B';
        if (rating >= 50) return 'C';
        return 'D';
    }

    /**
     * Get default synergy object
     */
    getDefaultSynergy() {
        return {
            rating: 50,
            grade: 'C',
            rangeCompatibility: 50,
            playStyleSynergy: 50,
            comboPotential: 50,
            lanePhaseStrength: 50,
            strengths: ['Standard bot lane duo'],
            weaknesses: ['Requires coordination'],
            tips: ['Focus on communication and positioning'],
            earlyGame: 'Play safe and farm',
            midGame: 'Group for objectives',
            lateGame: 'Teamfight positioning is key'
        };
    }

    /**
     * Get built-in synergy database
     */
    getBuiltInSynergies() {
        // This would be a large database in production
        // For now, return empty object to use dynamic calculation
        return {};
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SynergyEngine;
}
