#!/usr/bin/env node

/**
 * Auto-Update Champion Data Script
 * Fetches latest patch version and champion cooldowns from Riot's DDragon API
 * Updates champions-summary.json and app.js with new data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  VERSIONS_API: 'https://ddragon.leagueoflegends.com/api/versions.json',
  CHAMPION_LIST_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json',
  CHAMPION_DETAIL_API: 'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championId}.json'
};

// Utility function to fetch data from URL
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting champion data update...');

  // Step 1: Get latest patch version
  console.log('📡 Fetching latest patch version...');
  const versions = await fetchData(CONFIG.VERSIONS_API);
  const latestPatch = versions[0]; // First version is the latest
  const patchVersion = latestPatch.replace(/\./g, '-'); // Convert 14.22.1 to 14-22-1
  const shortPatchVersion = latestPatch.split('.').slice(0, 2).join('-'); // 14.22.1 -> 14-22

  console.log(`✅ Latest patch: ${latestPatch} (formatted: ${shortPatchVersion})`);

  // Step 2: Read current app.js to check if update is needed
  const appJsPath = path.join(__dirname, '..', 'app.js');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const currentPatchMatch = appJsContent.match(/const latestUpdate = "([^"]+)"/);
  const currentPatch = currentPatchMatch ? currentPatchMatch[1] : null;

  const forceUpdate = process.env.FORCE_UPDATE === 'true';

  if (currentPatch === shortPatchVersion && !forceUpdate) {
    console.log(`ℹ️  Data is already up to date (patch ${shortPatchVersion}). No changes needed.`);
    return;
  }

  console.log(`📝 Updating from patch ${currentPatch} to ${shortPatchVersion}...`);

  // Step 3: Fetch champion list
  console.log('📡 Fetching champion list...');
  const championListUrl = CONFIG.CHAMPION_LIST_API.replace('{version}', latestPatch);
  const championList = await fetchData(championListUrl);

  // Step 4: Load existing champions-summary.json
  const summaryPath = path.join(__dirname, '..', 'champions-summary.json');
  const currentSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

  // Create a map of existing champions by name for easy lookup
  const existingChampionsMap = new Map();
  currentSummary.forEach(champ => {
    existingChampionsMap.set(champ.name, champ);
  });

  console.log(`📊 Found ${Object.keys(championList.data).length} champions in API`);
  console.log(`📊 Found ${currentSummary.length} champions in local data`);

  // Step 5: Fetch detailed data for each champion and update cooldowns
  let updatedCount = 0;
  let newChampionsCount = 0;
  const updatedSummary = [];

  const championIds = Object.keys(championList.data);

  for (let i = 0; i < championIds.length; i++) {
    const champId = championIds[i];
    const champBasicData = championList.data[champId];

    // Rate limiting: wait 100ms between requests
    if (i > 0 && i % 10 === 0) {
      console.log(`⏳ Processed ${i}/${championIds.length} champions...`);
      await sleep(100);
    }

    try {
      // Fetch detailed champion data
      const detailUrl = CONFIG.CHAMPION_DETAIL_API
        .replace('{version}', latestPatch)
        .replace('{championId}', champId);

      const detailData = await fetchData(detailUrl);
      const championDetail = detailData.data[champId];

      // Check if this champion exists in our current data
      const existingChamp = existingChampionsMap.get(championDetail.name);

      if (existingChamp) {
        // Update existing champion's cooldowns
        const updated = updateChampionCooldowns(existingChamp, championDetail);
        updatedSummary.push(updated);
        if (updated._updated) {
          updatedCount++;
          delete updated._updated;
        }
      } else {
        // New champion - create entry (with basic threat tags to be manually reviewed)
        console.log(`🆕 New champion detected: ${championDetail.name}`);
        const newChamp = createChampionEntry(championDetail);
        updatedSummary.push(newChamp);
        newChampionsCount++;
      }

    } catch (error) {
      console.error(`❌ Error fetching data for ${champId}:`, error.message);
      // If we can't fetch data, keep the existing champion data
      const existingChamp = existingChampionsMap.get(champBasicData.name);
      if (existingChamp) {
        updatedSummary.push(existingChamp);
      }
    }
  }

  console.log(`✅ Processed all champions`);
  console.log(`📝 Updated ${updatedCount} champions with new cooldowns`);
  console.log(`🆕 Added ${newChampionsCount} new champions`);

  // Step 6: Sort champions alphabetically
  updatedSummary.sort((a, b) => a.name.localeCompare(b.name));

  // Step 7: Write updated champions-summary.json
  fs.writeFileSync(summaryPath, JSON.stringify(updatedSummary, null, 2), 'utf8');
  console.log(`✅ Updated champions-summary.json`);

  // Step 8: Update app.js with new patch version
  const updatedAppJs = appJsContent.replace(
    /const latestUpdate = "[^"]+"/,
    `const latestUpdate = "${shortPatchVersion}"`
  );
  fs.writeFileSync(appJsPath, updatedAppJs, 'utf8');
  console.log(`✅ Updated app.js with patch ${shortPatchVersion}`);

  console.log('🎉 Update complete!');
}

/**
 * Update an existing champion's cooldowns with new data from API
 */
function updateChampionCooldowns(existingChamp, apiChampion) {
  const updated = { ...existingChamp };
  let hasChanges = false;

  // Get the abilities from API (Q, W, E, R)
  const apiSpells = apiChampion.spells; // Array of 4 spells

  // Map API spells to our ability structure
  const abilityKeys = ['Q', 'W', 'E', 'R'];

  abilityKeys.forEach((key, index) => {
    if (index < apiSpells.length) {
      const apiSpell = apiSpells[index];
      const existingAbility = updated.abilities.find(a => a.key === key);

      if (existingAbility) {
        // Get cooldown array from API
        const apiCooldowns = apiSpell.cooldown || [];

        // Extend to 6 values (for ultimate evolutions) - repeat last value
        const newCooldowns = [...apiCooldowns];
        while (newCooldowns.length < 6) {
          newCooldowns.push(newCooldowns[newCooldowns.length - 1]);
        }

        // Check if cooldowns changed
        const cooldownsChanged = JSON.stringify(existingAbility.cd) !== JSON.stringify(newCooldowns);

        if (cooldownsChanged) {
          existingAbility.cd = newCooldowns;
          hasChanges = true;
        }

        // Update ability name if it changed
        if (existingAbility.name !== apiSpell.name) {
          existingAbility.name = apiSpell.name;
          hasChanges = true;
        }
      }
    }
  });

  // Update passive name if available
  if (apiChampion.passive && updated.passive && apiChampion.passive.name !== updated.passive.name) {
    updated.passive.name = apiChampion.passive.name;
    hasChanges = true;
  }

  if (hasChanges) {
    updated._updated = true;
  }

  return updated;
}

/**
 * Create a new champion entry from API data
 * Note: Threat tags will need to be manually reviewed and added
 */
function createChampionEntry(apiChampion) {
  const entry = {
    name: apiChampion.name,
    slug: apiChampion.id,
    tags: apiChampion.tags || [],
    portrait: apiChampion.id,
    passive: {
      name: apiChampion.passive?.name || "Passive",
      desc: ""
    },
    abilities: []
  };

  // Add abilities Q, W, E, R
  const abilityKeys = ['Q', 'W', 'E', 'R'];
  apiChampion.spells.forEach((spell, index) => {
    const cooldowns = spell.cooldown || [];

    // Extend to 6 values for ultimate evolutions
    while (cooldowns.length < 6) {
      cooldowns.push(cooldowns[cooldowns.length - 1]);
    }

    entry.abilities.push({
      key: abilityKeys[index],
      name: spell.name,
      cd: cooldowns,
      threat: [], // To be manually reviewed and added
      notes: "⚠️ New champion - threat tags need manual review"
    });
  });

  return entry;
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
