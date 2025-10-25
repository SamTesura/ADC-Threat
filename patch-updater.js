/**
 * Patch Updater System
 * Automatically fetches latest patch data from Riot's Data Dragon API
 * Handles champion updates, version detection, and data synchronization
 */

'use strict';

class PatchUpdater {
  constructor() {
    this.DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
    this.CDRAGON_BASE = 'https://raw.communitydragon.org/latest';
    this.CACHE_KEY_PREFIX = 'adc_threat_';
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.currentVersion = null;
    this.latestVersion = null;
    this.champions = [];
    this.updateCallbacks = [];
  }

  /**
   * Initialize the patch updater
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Patch Updater...');
      
      // Get latest version
      this.latestVersion = await this.fetchLatestVersion();
      console.log(`✓ Latest patch: ${this.latestVersion}`);
      
      // Check cache
      const cached = this.getFromCache('version');
      if (cached && cached === this.latestVersion) {
        console.log('✓ Using cached data (up to date)');
        this.currentVersion = cached;
        this.champions = this.getFromCache('champions') || [];
        return {
          version: this.currentVersion,
          champions: this.champions,
          isUpdate: false
        };
      }
      
      // Fetch new data
      console.log('📥 Fetching latest champion data...');
      await this.fetchChampionData();
      
      // Cache the data
      this.saveToCache('version', this.latestVersion);
      this.saveToCache('champions', this.champions);
      this.saveToCache('lastUpdate', Date.now());
      
      this.currentVersion = this.latestVersion;
      
      console.log(`✓ Updated to patch ${this.currentVersion}`);
      
      return {
        version: this.currentVersion,
        champions: this.champions,
        isUpdate: cached !== this.latestVersion
      };
      
    } catch (error) {
      console.error('❌ Patch updater initialization failed:', error);
      
      // Try to use cached data as fallback
      const cached = this.getFromCache('champions');
      if (cached && cached.length > 0) {
        console.warn('⚠️ Using stale cached data');
        this.currentVersion = this.getFromCache('version') || 'Unknown';
        this.champions = cached;
        return {
          version: this.currentVersion,
          champions: this.champions,
          isUpdate: false,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Fetch latest version from Data Dragon
   */
  async fetchLatestVersion() {
    try {
      const response = await fetch(`${this.DDRAGON_BASE}/api/versions.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const versions = await response.json();
      if (!Array.isArray(versions) || versions.length === 0) {
        throw new Error('Invalid versions data');
      }
      
      return versions[0]; // Latest version
      
    } catch (error) {
      console.error('Failed to fetch version:', error);
      throw new Error('Could not fetch latest patch version');
    }
  }

  /**
   * Fetch champion data from Data Dragon
   */
  async fetchChampionData() {
    try {
      const url = `${this.DDRAGON_BASE}/cdn/${this.latestVersion}/data/en_US/champion.json`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (!data.data) throw new Error('Invalid champion data structure');
      
      // Transform to our format
      this.champions = Object.values(data.data).map(champ => ({
        id: champ.key,
        name: champ.name,
        slug: champ.id,
        title: champ.title,
        tags: champ.tags,
        image: `${this.DDRAGON_BASE}/cdn/${this.latestVersion}/img/champion/${champ.id}.png`,
        splash: `${this.DDRAGON_BASE}/cdn/img/champion/splash/${champ.id}_0.jpg`,
        version: this.latestVersion
      }));
      
      console.log(`✓ Loaded ${this.champions.length} champions`);
      
      return this.champions;
      
    } catch (error) {
      console.error('Failed to fetch champion data:', error);
      throw new Error('Could not fetch champion data');
    }
  }

  /**
   * Check if an update is available
   */
  async checkForUpdates() {
    try {
      const latest = await this.fetchLatestVersion();
      const isUpdateAvailable = latest !== this.currentVersion;
      
      if (isUpdateAvailable) {
        console.log(`📢 Update available: ${this.currentVersion} → ${latest}`);
      }
      
      return {
        isAvailable: isUpdateAvailable,
        current: this.currentVersion,
        latest: latest
      };
      
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        isAvailable: false,
        error: error.message
      };
    }
  }

  /**
   * Manually trigger an update
   */
  async update() {
    try {
      console.log('🔄 Manual update triggered');
      
      // Clear cache
      this.clearCache();
      
      // Re-initialize
      const result = await this.initialize();
      
      // Notify callbacks
      this.notifyUpdateCallbacks(result);
      
      return result;
      
    } catch (error) {
      console.error('Manual update failed:', error);
      throw error;
    }
  }

  /**
   * Register a callback for updates
   */
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.updateCallbacks.push(callback);
    }
  }

  /**
   * Notify all registered callbacks
   */
  notifyUpdateCallbacks(data) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Update callback error:', error);
      }
    });
  }

  /**
   * Get data from localStorage cache
   */
  getFromCache(key) {
    try {
      const fullKey = this.CACHE_KEY_PREFIX + key;
      const cached = localStorage.getItem(fullKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage cache
   */
  saveToCache(key, data) {
    try {
      const fullKey = this.CACHE_KEY_PREFIX + key;
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✓ Cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    const lastUpdate = this.getFromCache('lastUpdate');
    const version = this.getFromCache('version');
    const championsCount = (this.getFromCache('champions') || []).length;
    
    return {
      version,
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      championsCount,
      isValid: !!version && championsCount > 0
    };
  }

  /**
   * Get current version
   */
  getCurrentVersion() {
    return this.currentVersion || this.getFromCache('version') || 'Unknown';
  }

  /**
   * Get champions
   */
  getChampions() {
    return this.champions.length > 0 ? this.champions : (this.getFromCache('champions') || []);
  }

  /**
   * Fetch patch notes (bonus feature)
   */
  async fetchPatchNotes() {
    try {
      // This is a simplified version - in production, you'd parse Riot's patch notes
      const version = this.getCurrentVersion();
      return {
        version,
        url: `https://www.leagueoflegends.com/en-us/news/game-updates/patch-${version.replace(/\./g, '-')}-notes/`,
        summary: 'Visit the official League of Legends website for detailed patch notes.'
      };
    } catch (error) {
      console.error('Failed to fetch patch notes:', error);
      return null;
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.PatchUpdater = PatchUpdater;
  window.patchUpdater = new PatchUpdater();
}
