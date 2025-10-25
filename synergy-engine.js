/**
 * Advanced Support Synergy Engine
 * Provides Challenger-level insights for ADC + Support combinations
 * Based on high-ELO gameplay patterns from KR, CH, and EUW servers
 */

'use strict';

class SynergyEngine {
  constructor() {
    this.synergyDatabase = this.buildSynergyDatabase();
    this.laningPhaseStrategies = this.buildLaningStrategies();
    this.powerSpikeData = this.buildPowerSpikes();
  }

  /**
   * Analyze synergy between ADC and Support
   */
  analyzeSynergy(adcName, supportName) {
    if (!adcName || !supportName) return null;

    const key = `${adcName}_${supportName}`;
    const synergyData = this.synergyDatabase[key] || this.generateGenericSynergy(adcName, supportName);

    return {
      rating: synergyData.rating,
      summary: synergyData.summary,
      strengths: synergyData.strengths,
      weaknesses: synergyData.weaknesses,
      laningPhase: this.getLaningPhaseAdvice(adcName, supportName, synergyData),
      powerSpikes: this.getPowerSpikes(adcName, supportName),
      teamfightRole: synergyData.teamfightRole,
      challengerTips: synergyData.challengerTips
    };
  }

  /**
   * Get laning phase advice
   */
  getLaningPhaseAdvice(adcName, supportName, synergyData) {
    return {
      level1_3: synergyData.laningPhase?.level1_3 || 'Focus on farming safely and establishing wave control.',
      level4_6: synergyData.laningPhase?.level4_6 || 'Look for opportunities to trade when abilities are up.',
      level7_9: synergyData.laningPhase?.level7_9 || 'Control vision and prepare for mid-game rotations.',
      waveManagement: synergyData.laningPhase?.waveManagement || 'Maintain wave in favorable position.',
      trading: synergyData.laningPhase?.trading || 'Trade when enemy cooldowns are down.',
      allIn: synergyData.laningPhase?.allIn || 'Look for all-in opportunities when you have level/item advantage.'
    };
  }

  /**
   * Get power spike information
   */
  getPowerSpikes(adcName, supportName) {
    const adcSpikes = this.powerSpikeData[adcName] || this.getGenericADCPowerSpikes();
    const supportSpikes = this.powerSpikeData[supportName] || this.getGenericSupportPowerSpikes();

    return {
      early: {
        levels: adcSpikes.early.levels,
        items: adcSpikes.early.items,
        notes: `${adcName} spike: ${adcSpikes.early.notes}`
      },
      mid: {
        levels: adcSpikes.mid.levels,
        items: adcSpikes.mid.items,
        notes: `${adcName} spike: ${adcSpikes.mid.notes}`
      },
      late: {
        levels: adcSpikes.late.levels,
        items: adcSpikes.late.items,
        notes: `${adcName} spike: ${adcSpikes.late.notes}`
      },
      combined: `Peak synergy at levels ${adcSpikes.bestLevel} + ${supportSpikes.bestLevel}`
    };
  }

  /**
   * Generate generic synergy for unmatched pairs
   */
  generateGenericSynergy(adcName, supportName) {
    return {
      rating: 70,
      summary: `${adcName} and ${supportName} have decent synergy with standard bot lane patterns.`,
      strengths: [
        'Can farm safely in most matchups',
        'Flexible trading patterns',
        'Scales into teamfights'
      ],
      weaknesses: [
        'May lack specific synergy windows',
        'Requires good communication',
        'Power spikes may not align perfectly'
      ],
      laningPhase: {
        level1_3: 'Play safe, focus on CS and level 2 priority.',
        level4_6: 'Look for favorable trades when abilities are available.',
        level7_9: 'Establish vision control and prepare for objectives.',
        waveManagement: 'Maintain wave near your tower for safety.',
        trading: 'Trade when enemy key abilities are on cooldown.',
        allIn: 'Commit to all-ins only with clear advantage (HP, summs, level).'
      },
      teamfightRole: 'Standard ADC positioning with support peel.',
      challengerTips: [
        'Track enemy cooldowns for optimal trading',
        'Coordinate vision control around objectives',
        'Communicate power spike timings'
      ]
    };
  }

  /**
   * Build comprehensive synergy database
   */
  buildSynergyDatabase() {
    return {
      // Jinx Synergies
      'Jinx_Lulu': {
        rating: 95,
        summary: 'Hypercarry setup with exceptional peel and scaling.',
        strengths: [
          'Lulu W + Jinx passive = unstoppable kiting',
          'Shield + E zone control = safe farming',
          'Late game Lulu ult makes Jinx unkillable'
        ],
        weaknesses: [
          'Weak early all-in (pre-6)',
          'Both scale-dependent',
          'Vulnerable to hard engage supports'
        ],
        laningPhase: {
          level1_3: 'Farm passively, use Lulu Q for poke. Avoid all-ins.',
          level4_6: 'Start trading with Lulu E shield. Jinx W + Lulu Q combo for poke.',
          level7_9: 'Push for plates. Lulu R allows aggressive plays.',
          waveManagement: 'Freeze near tower early, push for plates at 6+.',
          trading: 'Short trades with Lulu shield. Extended trades only with minion advantage.',
          allIn: 'Post-6 with Lulu R. Target squishy support first.'
        },
        teamfightRole: 'Jinx frontline with Lulu peel. Stay 550+ range until resets available.',
        challengerTips: [
          'Lulu W on Jinx during passive = guaranteed kills',
          'Save Lulu R for enemy dive, not proactive',
          'Coordinate Jinx E placement with Lulu Q slow'
        ]
      },

      'Jinx_Thresh': {
        rating: 88,
        summary: 'High playmaking potential with excellent pick and peel.',
        strengths: [
          'Thresh hook = easy Jinx W follow-up',
          'Lantern saves for aggressive Jinx positioning',
          'Strong roaming + catch potential'
        ],
        weaknesses: [
          'Skillshot dependent',
          'Lower sustain in lane',
          'Requires precise coordination'
        ],
        laningPhase: {
          level1_3: 'Thresh E for lane pressure. Jinx W on hooked targets.',
          level4_6: 'Look for hook + Jinx W + Thresh E combo for kills.',
          level7_9: 'Thresh R creates zone for Jinx E traps. Push aggressively.',
          waveManagement: 'Slow push for hook angles.',
          trading: 'Thresh E auto + Jinx trade. Back off after.',
          allIn: 'Hook → Flay → Box → Jinx E → Full commit'
        },
        teamfightRole: 'Thresh peels or engages. Jinx follows up on picks.',
        challengerTips: [
          'Thresh W timing: save for Jinx reposition after reset',
          'Combo: Hook → wait 0.5s for Jinx W → Flay',
          'Thresh R + Jinx E = guaranteed catch on immobile ADCs'
        ]
      },

      // Ezreal Synergies
      'Ezreal_Yuumi': {
        rating: 82,
        summary: 'Poke-heavy lane with high mobility and sustain.',
        strengths: [
          'Yuumi heal sustains Ezreal poke wars',
          'Yuumi attached = Ezreal unkillable',
          'Double poke (Q spam) wins range matchups'
        ],
        weaknesses: [
          'Vulnerable to engage if Yuumi caught',
          'Low kill pressure in lane',
          'Weak vs tanks'
        ],
        laningPhase: {
          level1_3: 'Ezreal Q + Yuumi Q poke. Yuumi heal for sustain.',
          level4_6: 'Spam abilities. Yuumi detach for passive, reattach.',
          level7_9: 'Scale peacefully. Vision control for safety.',
          waveManagement: 'Match opponent. Play for poke, not kills.',
          trading: 'Ezreal Q + Yuumi Q simultaneously. Back off.',
          allIn: 'Avoid all-ins. Kite back with E + Yuumi W.'
        },
        teamfightRole: 'Ezreal poke with Yuumi attached. Kite on edges.',
        challengerTips: [
          'Yuumi should detach for passive proc, reattach immediately',
          'Yuumi ult → Ezreal ult combo for teamfight initiation',
          'Ezreal E aggressively with Yuumi R for safety'
        ]
      },

      // Kalista Synergies
      'Kalista_Thresh': {
        rating: 92,
        summary: 'Ultimate synergy with Kalista R + Thresh engage.',
        strengths: [
          'Kalista R + Thresh Q = guaranteed engage',
          'Thresh lantern extends Kalista kiting range',
          'Insane pick potential'
        ],
        weaknesses: [
          'High mechanical requirement',
          'Vulnerable to hard CC',
          'Kalista W bond required'
        ],
        laningPhase: {
          level1_3: 'Trade aggressively with Kalista autos + Thresh E.',
          level4_6: 'Kalista W vision + Thresh hook for kills.',
          level7_9: 'Kalista R engage tool. Coordinate with jungler.',
          waveManagement: 'Push for level 2. Then slow push.',
          trading: 'Kalista auto → hop → Thresh auto. Repeat.',
          allIn: 'Level 6: Kalista R → Thresh knock-up → Hook → Kill'
        },
        teamfightRole: 'Kalista kites. Thresh either engages or peels.',
        challengerTips: [
          'Practice Kalista R timing: use when Thresh is in range',
          'Thresh should Flash + Kalista R for instant engage',
          'Kalista R saves Thresh from death - use reactively too'
        ]
      },

      // Vayne Synergies
      'Vayne_Lulu': {
        rating: 90,
        summary: 'Supreme dueling setup with massive outplay potential.',
        strengths: [
          'Lulu W + Vayne R stealth = unkillable',
          'Shield + speed boost covers Vayne weakness',
          'Scales into 1v5 threat'
        ],
        weaknesses: [
          'Extremely weak early (pre-6)',
          'No waveclear',
          'Vulnerable to poke
'],
        laningPhase: {
          level1_3: 'Survive. Farm under tower. Lulu shields for CS.',
          level4_6: 'Still farming. Lulu Q for minimal poke.',
          level7_9: 'Vayne 2-item spike. Look for duels with Lulu R.',
          waveManagement: 'Freeze near tower for 15 minutes.',
          trading: 'Only trade if enemy wastes CC. Lulu shield for safety.',
          allIn: 'Post-6 with Vayne R + Lulu R. Need HP advantage.'
        },
        teamfightRole: 'Vayne flanks, Lulu peels from backline.',
        challengerTips: [
          'Lulu W enemy during Vayne E for guaranteed stun',
          'Save Lulu R for Vayne stealth duration extension',
          'Coordinate Lulu speed with Vayne R for positioning'
        ]
      },

      // Add more synergies as needed...
    };
  }

  /**
   * Build laning phase strategies
   */
  buildLaningStrategies() {
    return {
      aggressive: {
        adcs: ['Draven', 'Lucian', 'Kalista', 'Samira'],
        supports: ['Thresh', 'Nautilus', 'Leona', 'Pyke'],
        strategy: 'Push for level 2, engage immediately. Snowball or lose.'
      },
      poke: {
        adcs: ['Caitlyn', 'Ezreal', 'Varus', 'Jhin'],
        supports: ['Karma', 'Zyra', 'Brand', 'Xerath'],
        strategy: 'Harass from range, control bushes, deny CS.'
      },
      scaling: {
        adcs: ['Vayne', 'Jinx', 'Kog\'Maw', 'Aphelios'],
        supports: ['Lulu', 'Yuumi', 'Janna', 'Sona'],
        strategy: 'Survive lane, farm for items, avoid fights.'
      },
      allIn: {
        adcs: ['Tristana', 'Kai\'Sa', 'Samira'],
        supports: ['Thresh', 'Rakan', 'Nautilus', 'Alistar'],
        strategy: 'Look for engage windows, commit fully, secure kills.'
      }
    };
  }

  /**
   * Build power spike database
   */
  buildPowerSpikes() {
    return {
      'Jinx': {
        early: { levels: [2], items: ['BF Sword'], notes: 'Rockets for poke' },
        mid: { levels: [6, 9], items: ['Runaan'], notes: 'AoE + Passive resets' },
        late: { levels: [13, 16], items: ['IE', 'LDR'], notes: 'Hypercarry activated' },
        bestLevel: 9
      },
      'Ezreal': {
        early: { levels: [2, 3], items: ['Sheen'], notes: 'Q spam damage' },
        mid: { levels: [6, 7], items: ['Manamune'], notes: 'Sustain poke' },
        late: { levels: [11, 16], items: ['Trinity', 'Serylda'], notes: 'Max Q damage' },
        bestLevel: 7
      },
      'Vayne': {
        early: { levels: [6], items: ['BF Sword'], notes: 'R stealth dueling' },
        mid: { levels: [9, 11], items: ['Blade'], notes: 'True damage threat' },
        late: { levels: [13, 16], items: ['Blade', 'Rageblade'], notes: '1v5 potential' },
        bestLevel: 11
      },
      'Lulu': {
        early: { levels: [2, 3], items: ['Support item'], notes: 'Poke + shield' },
        mid: { levels: [6, 9], items: ['Ardent'], notes: 'Ult + Attack speed buff' },
        late: { levels: [11, 16], items: ['Staff', 'Redemption'], notes: 'Max peel' },
        bestLevel: 11
      },
      'Thresh': {
        early: { levels: [2], items: ['Relic'], notes: 'E damage + hook' },
        mid: { levels: [6], items: ['Mobility boots'], notes: 'Roam pressure' },
        late: { levels: [11], items: ['Locket'], notes: 'Teamfight peel' },
        bestLevel: 6
      }
    };
  }

  /**
   * Get generic ADC power spikes
   */
  getGenericADCPowerSpikes() {
    return {
      early: { levels: [2, 3], items: ['BF Sword'], notes: 'Base damage increase' },
      mid: { levels: [6, 9], items: ['First item'], notes: 'Core item spike' },
      late: { levels: [13, 16], items: ['3 items'], notes: 'Full build power' },
      bestLevel: 9
    };
  }

  /**
   * Get generic support power spikes
   */
  getGenericSupportPowerSpikes() {
    return {
      early: { levels: [2], items: ['Support item'], notes: 'Basic trading' },
      mid: { levels: [6], items: ['Boots'], notes: 'Mobility + utility' },
      late: { levels: [11], items: ['2 items'], notes: 'Utility peak' },
      bestLevel: 6
    };
  }

  /**
   * Calculate synergy rating based on playstyle compatibility
   */
  calculateSynergyRating(adcStyle, supportStyle) {
    const compatibilityMatrix = {
      'aggressive_aggressive': 90,
      'aggressive_poke': 60,
      'aggressive_scaling': 40,
      'poke_poke': 85,
      'poke_scaling': 70,
      'poke_aggressive': 65,
      'scaling_scaling': 95,
      'scaling_poke': 75,
      'scaling_aggressive': 50
    };

    const key = `${adcStyle}_${supportStyle}`;
    return compatibilityMatrix[key] || 70;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.SynergyEngine = SynergyEngine;
  window.synergyEngine = new SynergyEngine();
}
