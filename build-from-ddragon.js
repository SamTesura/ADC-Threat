// build-from-cdragon.js — runs entirely in browser
// Works on GitHub Pages, no Node needed

const CDRAGON_VERSION = "latest"; // or lock to patch, e.g., "13.24"
const CDRAGON_BASE = "https://raw.communitydragon.org";

// UI hookup
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("buildCDragon");
  if (btn) btn.addEventListener("click", buildChampionDataFromCD);
});

async function buildChampionDataFromCD() {
  try {
    const patch = await detectPatch();
    console.log("Using patch:", patch);

    // Step 1: fetch champion list from CommunityDragon
    const champIndexUrl = `${CDRAGON_BASE}/${patch}/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`;
    const champList = await (await fetch(champIndexUrl)).json();

    const results = [];
    let done = 0;

    for (const champ of champList) {
      // Skip duplicate entries
      if (!champ.id || champ.id < 0) continue;

      const detailUrl = `${CDRAGON_BASE}/${patch}/plugins/rcp-be-lol-game-data/global/default/v1/champions/${champ.id}.json`;
      const detail = await (await fetch(detailUrl)).json();

      // Abilities with CC/burst info
      const abilities = extractAbilities(detail);

      // Passive
      const passive = {
        name: detail.passive?.name || "",
        desc: detail.passive?.shortDesc || "",
      };

      results.push({
        name: champ.name,
        slug: champ.alias,
        tags: detail.roles || [],
        portrait: champ.squarePortraitPath?.replace(/^\/\//, "https://") || "",
        passive,
        abilities
      });

      done++;
      console.log(`Fetched ${done}/${champList.length}: ${champ.name}`);
    }

    // Step 3: Save JSON file client-side
    downloadFile(JSON.stringify(results, null, 2), `champions_cdragon_${patch}.json`);
  } catch (err) {
    console.error(err);
    alert("Error building data. See console for details.");
  }
}

function extractAbilities(detail) {
  const slots = ["Q", "W", "E", "R"];
  const out = [];
  for (const slot of slots) {
    const ab = detail.spells.find(s => s.spellKey === slot);
    if (!ab) continue;

    const name = ab.name || slot;
    const cd = ab.cooldown?.join("/") || "";
    const notes = ab.shortDesc || "";
    out.push({ key: slot, name, cds: cd, notes });
  }
  return out;
}

async function detectPatch() {
  // fetch latest available patch from CDragon
  const res = await fetch(`${CDRAGON_BASE}/api/versions.json`);
  const versions = await res.json();
  return versions[0] || "latest";
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
