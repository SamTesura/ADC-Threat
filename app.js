/* ADC Threat Lookup — 25.20
   (MODIFIED to integrate High-Elo Data & Security Fixes v3 - Matching User HTML/CSS)
   - Integrates expanded adc-templates.js and support-tips.js securely.
   - Completes renderChampRow based on provided HTML/CSS.
   - Replaces all critical innerHTML assignments with secure DOM methods.
   - Adds rendering logic for macro/synergy tips (if #macroSection exists).
   - Preserves original structure, functions, CSS compatibility.
*/
'use strict';

// ============================================================================
// CONFIGURATION & CONSTANTS (Mostly unchanged)
// ============================================================================
const DDRAGON_VERSION = "14.14.1"; // Updated to match previous context
const DATA_URL = "./champions-summary.json";

// Fallback image in case DDragon link fails
const DUMMY_IMAGE_PATH = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Aatrox.png`;

const THREAT = {
  HARD_CC:"HARD_CC",
  SOFT_CC:"SOFT_CC",
  SHIELD_PEEL:"SHIELD_PEEL",
  GAP_CLOSE:"GAP_CLOSE",
  BURST:"BURST",
  POKE_ZONE:"POKE_ZONE"
};

const PRIORITY = [
  THREAT.HARD_CC,
  THREAT.SOFT_CC,
  THREAT.SHIELD_PEEL,
  THREAT.GAP_CLOSE,
  THREAT.BURST,
  THREAT.POKE_ZONE
];

// Matches your styles.css
const THREAT_CLASS = {
  [THREAT.HARD_CC]:"hard",
  [THREAT.SOFT_CC]:"soft",
  [THREAT.SHIELD_PEEL]:"peel",
  [THREAT.GAP_CLOSE]:"gap",
  [THREAT.BURST]:"burst",
  [THREAT.POKE_ZONE]:"poke"
};

const THREAT_LABEL = {
  [THREAT.HARD_CC]:"Hard CC",
  [THREAT.SOFT_CC]:"Soft CC",
  [THREAT.SHIELD_PEEL]:"Shield/Peel",
  [THREAT.GAP_CLOSE]:"Gap Close",
  [THREAT.BURST]:"Burst",
  [THREAT.POKE_ZONE]:"Poke/Zone"
};

// ============================================================================
// GLOBAL STATE & DATA (Unchanged from your structure)
// ============================================================================
let CHAMPIONS = [];
let CURRENT_ADC = null;
let ADC_OVERRIDES = null;

// Your override functions remain the same
async function loadOverridesFor(_adcName){
  ADC_OVERRIDES = null;
}
function getOverrideEntryForChampion(_slugOrName){
  return null;
}

// Your normalization function
function normalizeADCKey(name=""){
  return String(name || "").replace(/['’\s.-]/g,"").toLowerCase();
}

// ============================================================================
// HELPERS (Adapted for security & consistency)
// ============================================================================
const qs = (s,el=document)=>el.querySelector(s);
const qsa = (s,el=document)=>el.querySelectorAll(s);

// Uses correct DDragon naming conventions
function ddragonPortraitURL(slugOrName){
    let slug = String(slugOrName || "").replace(/\s+/g, "");
    // Handle specific champion name inconsistencies for DDragon URLs
    if (slug === "Kaisa") slug = "KaiSa";
    if (slug === "Wukong") slug = "MonkeyKing";
    if (slug === "Nunu&Willump" || slug === "Nunu & Willump") slug = "Nunu";
    if (slug === "RenataGlasc") slug = "Renata"; // Check DDragon name
    if (slug === "TwistedFate") slug = "TwistedFate"; // Keep as is usually
    if (slug === "MissFortune") slug = "MissFortune"; // Keep as is usually
    if (slug === "KogMaw") slug = "KogMaw"; // Keep as is usually
    if (slug === "DrMundo") slug = "DrMundo"; // Keep as is usually
    if (slug === "RekSai") slug = "RekSai"; // Keep as is usually
    if (slug === "TahmKench") slug = "TahmKench"; // Keep as is usually
    if (slug === "Velkoz") slug = "Velkoz"; // Keep as is usually
    if (slug === "XinZhao") slug = "XinZhao"; // Keep as is usually
    if (slug === "FiddleSticks") slug = "Fiddlesticks"; // Corrected capitalisation
    // Add other known inconsistencies here...
    return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`;
}

const safeSlug = s => String(s||"").replace(/[^A-Za-z0-9]/g,"");

function primaryThreat(threats=[]){
  if (!threats) return null;
  for(const t of PRIORITY){ if(threats.includes(t)) return t; } return null;
}
function primaryThreatClass(threats=[]){ const t = primaryThreat(threats); return t ? THREAT_CLASS[t] : ""; }
function tagToClass(t){ return THREAT_CLASS[t] || ""; }

/**
 * SECURELY Creates an <img> element for portraits with fallback.
 * @param {string} slugOrName - Champion slug or name (e.g., "MissFortune", "KaiSa").
 * @param {string} alt - Alt text for the image.
 * @param {string} [cssClass='portrait-sm'] - CSS class for the image, matching your CSS.
 * @returns {HTMLImageElement} The created image element.
 */
function createPortraitImg(slugOrName, alt = "", cssClass = 'portrait-sm') {
    const slug = String(slugOrName || "").replace(/\s+/g, "");
    const lower = slug.toLowerCase();
    const ddUrl = ddragonPortraitURL(slug); // Use the helper to handle name inconsistencies
    const cdnFallback = `https://cdn.communitydragon.org/latest/champion/${lower}/square`; // Cdragon as fallback

    const img = document.createElement('img');
    img.className = cssClass; // Use the provided class (e.g., 'portrait-sm' for table, or '' for ADC grid)
    img.src = ddUrl;
    img.alt = alt || slug;
    img.loading = 'lazy';

    // Set up the fallback directly on the element
    img.onerror = function() {
        if (this.src !== cdnFallback && this.src !== DUMMY_IMAGE_PATH) { // Check against both fallbacks
            console.warn(`DDragon image failed for ${slug}, falling back to Cdragon: ${cdnFallback}`);
            this.src = cdnFallback;
        } else if (this.src !== DUMMY_IMAGE_PATH) { // If Cdragon failed, use dummy
             console.error(`Cdragon fallback also failed for ${slug}. Using dummy image.`);
             this.src = DUMMY_IMAGE_PATH; // Final fallback
        }
        // Remove handler after first error or fallback attempt to prevent loops
        this.onerror = null;
    };
    return img;
}

// ============================================================================
// THREAT TAGGING & PASSIVES (Unchanged logic)
// ============================================================================
const RX = { /* ... your regex patterns ... */
  air:/\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch|toss|push|pull|yank|drag|shove|displace|knockdown)\b/i,
  stun:/\bstun(?:s|ned|ning)?\b/i, root:/\b(root|snare|immobiliz(?:e|ed|es))\b/i,
  charm:/\bcharm(?:ed|s|ing)?\b/i, taunt:/\btaunt(?:ed|s|ing)?\b/i,
  fear:/\b(fear|terrify|flee)\b/i, sleep:/\b(sleep|drowsy)\b/i,
  silence:/\bsilence(?:d|s|ing)?\b/i, polymorph:/\bpolymorph(?:ed|s|ing)?\b/i,
  slow:/\bslow|cripple|chill\b/i, blind:/\bblind|nearsight\b/i, grounded:/\bground(?:ed)?\b/i,
  gap:/\b(dash|blink|leap|lunge|surge|shift|rush|charge|hookshot|vault|hop|flip|jump|teleport to|reposition|slide|advance)\b/i,
  burst:/\bburst|detonate|execute|threshold|nuke|high damage|true damage\b/i,
  zone:/\b(zone|field|pool|storm|barrage|mine|trap|turret|wall|aoe|beam|laser|burn)\b/i,
  shield:/\b(shield|barrier|spell shield|damage reduction|tenacity|unstoppable|invulnerab|untargetable|stasis|banish|realm of death)\b/i
};
function ensureThreatsForAllAbilities(list){
  for(const ch of list){
    if (!ch.abilities) continue;
    for(const ab of ch.abilities){
      const txt = `${ab.name||""} ${ab.key||""} ${ab.notes||""}`.toLowerCase();
      const tags = new Set(ab.threat || []); // Start with existing tags

      // Prioritize HARD_CC for major displacement/stuns/roots etc.
      if (RX.air.test(txt) || RX.stun.test(txt) || RX.root.test(txt) || RX.charm.test(txt) || RX.taunt.test(txt) ||
          RX.fear.test(txt) || RX.sleep.test(txt) || RX.silence.test(txt) || RX.polymorph.test(txt)) {
          tags.add(THREAT.HARD_CC);
      }
      // Add SOFT_CC for others *only if* not already tagged as HARD_CC due to above rules
      // (Your description implies Hard CC overrides Soft CC categorization)
      if (!tags.has(THREAT.HARD_CC)) {
            if (RX.slow.test(txt) || RX.blind.test(txt) || RX.grounded.test(txt)) {
                tags.add(THREAT.SOFT_CC);
            }
      }
      // Add other categories
      if (RX.shield.test(txt)) tags.add(THREAT.SHIELD_PEEL);
      if (RX.gap.test(txt))    tags.add(THREAT.GAP_CLOSE);
      if (RX.burst.test(txt))  tags.add(THREAT.BURST);
      if (RX.zone.test(txt))   tags.add(THREAT.POKE_ZONE);

      // Default tag if none found
      if (tags.size === 0 && ab.key) {
         tags.add(ab.key === "R" ? THREAT.BURST : THREAT.POKE_ZONE);
      }
      ab.threat = Array.from(tags);
    }
  }
}

const PASSIVE_OVERRIDES = { /* ... your passive overrides ... */
  "Aatrox":"Heals on abilities; spikes on R—kite out Q3/chain pull windows.",
  "Ahri":"Orbs return; charm sets up picks—don’t path through narrow choke vs E.",
  "Akali":"Obscured in W; burst mobility—don’t waste sums before R2.",
  "Akshan":"Camo & resets—don’t give free revives; break line of sight.",
  "Alistar":"Roar heal + big DR on R—never get headbutt–pulverized without Flash.",
  "Ambessa": "After abilities she dashes short + buffs next hit—expect surprise gap close.",
  "Amumu":"Bandage + AoE stun—don’t stack; track flash+R.",
  "Anivia":"Egg revive—don’t dive without CC; wall can trap you.",
  "Annie":"Passive stuns—watch stacks; Tibbers zone controls fights.",
  "Aphelios":"Guns change tools—respect Gravitum roots & Infernum AOEs.",
  "Ashe":"Autos/abilities slow—avoid chain slows before R.",
  "AurelionSol":"Zones & pulls—don’t group tight for black hole/impact.",
  "Aurora":"Abilities stack spirits; at 3 stacks she 'Severs' for bonus damage + heal pickup—don’t give free 3rd stack.",
  "Azir":"Soldier poke; R wall displaces—don’t stand behind him.",
  "Bard":"Chimes roam; portal flanks—don’t get Q pinched or R stasised.",
  "Belveth":"DR channel + dashes—kite off W knockup threat.",
  "Blitzcrank":"Hook threat defines lane—don’t hug walls; juke Q.",
  "Brand":"High burn—spread out; don’t get ablaze stunned.",
  "Braum":"Concussive Blows—avoid stacking autos; wall blocks projectiles.",
  "Briar":"Self-frenzy; long engage—peel fear channel, kite post-R.",
  "Caitlyn":"Trap setups—don’t step in nets; respect snipe angles.",
  "Camille":"Hookshot stun & isolation on R—hug minions; keep peel nearby.",
  "Cassiopeia":"Grounded zone—don’t dash in W; watch for R face/stun.",
  "Chogath":"Knockup + true execute—space Q areas; don’t coinflip feast.",
  "Corki":"Package engages—respect timer; rockets poke from afar.",
  "Darius":"Pull + execute—save dash for E; don’t gift 5 stacks.",
  "Diana":"AoE pull on R—don’t clump; track E reset angles.",
  "DrMundo":"Ignores CC—don’t waste picks; kite cleavers.",
  "Draven":"Axes snowball—deny cash-in; don’t get E’d while retreating.",
  "Ekko":"Rewind escape—burst won’t stick if he keeps R; avoid W field.",
  "Elise":"Cocoon pick + rappel—respect fog; pink wards matter.",
  "Evelynn":"Stealth charm—hug pinks; don’t stand low for execute.",
  "Ezreal":"Arcane Shift safety—punish E down; poke sustained.",
  "Fiddlesticks":"Fear chain & big R—ward deep; don’t fight in fog.",
  "Fiora":"Parry flips duel—don’t telegraph CC; kite vitals.",
  "Fizz":"Untargetable E + shark—save escape for R connect.",
  "Galio":"Global cover + taunt—don’t dive without tracking R.",
  "Gangplank":"Barrel chains—space barrels; cannons zone objectives.",
  "Garen":"Silence + execute—avoid Q trades; kite spin range.",
  "Gnar":"Rage shifts forms—don’t fight into Mega timers; kite boulder/Wallop.",
  "Gragas":"DR on W; huge R knockback—don’t clump and track flash-E.",
  "Graves":"Grit stacks tank him up—don’t brawl in smoke; punish E down.",
  "Gwen":"Mist blocks autos/spells—wait it out or disengage.",
  "Hecarim":"Long engage + fear—ward flanks and hold sums for R.",
  "Heimerdinger":"Turrets win space—clear setups; dodge grenade.",
  "Hwei":"Heavy zone control—don’t stand in fields; respect root combos.",
  "Illaoi":"Tentacles punish clumps—don’t fight in her setup.",
  "Irelia":"Resets + stuns—kite blades; don’t give E angles.",
  "Ivern":"Root into Daisy—don’t give free engage; kill Daisy fast.",
  "Janna":"Peels everything—bait Q/R then commit.",
  "JarvanIV":"Flag-drag knockup—stand away from the flag line.",
  "Jax":"Stun + dodge—don’t auto into E; kite his R windows.",
  "Jayce":"Form swaps—watch hammer knockback; don’t funnel through gate poke.",
  "Jhin":"Root from range—don’t be marked; cancel his curtain when dived.",
  "Jinx":"Trap zone—don’t chase through chompers; punish before Get Excited.",
  "KSante":"High peel and displacements—don’t fight walls; track Q3.",
  "Kaisa":"Has safety with R—punish when E/R down.",
  "Kalista":"Fates Call resets engage—don’t overchase support.",
  "Karma":"Shield+root—force shield then trade.",
  "Karthus":"Global R—watch HP; don’t stand in wall zone.",
  "Kassadin":"Magic shield—don’t waste poke; punish pre-6.",
  "Katarina":"Resets—CC on contact; don’t clump in R.",
  "Kayle":"R invuln saves target—bait it out before diving.",
  "Kayn":"Form-dependent—respect fear/knockups; track R.",
  "Kennen":"Stun storm—don’t clump; track Flash.",
  "Khazix":"Jumps on isolated—stay near allies; ward jumps.",
  "Kindred":"R denies execute—don’t stack inside; step out late.",
  "Kled":"Mounted engage—kite away from charge path.",
  "KogMaw":"On-death bomb—don’t stand on corpse.",
  "Leblanc": "Abilities mark then detonate—don’t let her double-proc on you.",
  "LeeSin":"Kick displacement—don’t line up; track Flash+R.",
  "Leona":"Point-click CC—don’t trade without sums/peel up.",
  "Lillia":"Sleep bomb—spread and cleanse on wake.",
  "Lissandra":"Point-blank lockdown—respect self-R.",
  "Lucian":"Short-dash windows—punish E down.",
  "Lulu":"Polymorph shuts you down—bait W; watch knockup on R.",
  "Lux":"Snare from fog—keep minions in between.",
  "Malphite":"Hard engage—don’t clump and track R.",
  "Malzahar":"Spell shield + suppress—poke shield first.",
  "Maokai":"Sapling zone + roots—don’t face check brush.",
  "MasterYi":"Untargetable Q—peel him when he dives.",
  "Mel":"Abilities grant bonus projectiles; attacks stack Radiance—R executes at threshold. Don’t hover low HP.",
  "Milio":"Cleanse/shields—force cooldowns before committing.",
  "MissFortune":"Channel R—interrupt or break LOS.",
  "Mordekaiser":"Realm isolates—don’t split without sums.",
  "Morgana":"Long root + spell shield—bait E before CC.",
  "Naafiri":"Pack dives—peel first target and kite dogs.",
  "Nami":"Bubble + wave—don’t clump and watch tidal line.",
  "Nasus":"Wither cripples—kite and save dash.",
  "Nautilus":"Hook + ult chain—don’t hug walls; track R.",
  "Neeko":"Root + AoE stun—watch for disguise engage.",
  "Nidalee":"Spears from fog—don’t stand still at range.",
  "Nilah":"Pull + slow in R—space well; don’t clump.",
  "Nocturne":"Paranoia dives—hold peel for R.",
  "Nunu":"Snowball CC—see it early; sidestep charge.",
  "Olaf":"CC immune on R—kite and exhaust.",
  "Orianna":"Ball control—don’t clump for Shockwave.",
  "Ornn":"Call of the Forge God—don’t line up knockups.",
  "Pantheon":"Point-click stun—respect gank setup.",
  "Poppy":"Stops dashes—don’t engage into W; beware R eject.",
  "Pyke":"Hooks + resets—don’t get isolated at low HP.",
  "Qiyana":"Terrain empowers—don’t fight near walls; respect R wall stun.",
  "Quinn":"Roams fast—track MIA; don’t chase into E knockback.",
  "Rakan":"High engage/peel—bait W/R before committing.",
  "Rammus":"Thorns/taunt—don’t overauto; kite his Q engage.",
  "RekSai":"Unburrow knockup—pink tunnels; don’t path near burrow.",
  "Rell":"Hard engage + peel—beware W crash and R drag.",
  "Renata":"Saves with W and flips fights with R—spread out.",
  "Renekton":"Point-click stun—kite fury windows.",
  "Rengar":"Stealth dives—hug control wards; peel empowered root.",
  "Riven":"Multiple dashes + stun—don’t clump; punish E down.",
  "Rumble":"Overheat zone + ult—don’t fight on Equalizer.",
  "Ryze":"Root + realm warp—don’t get ported on; space cage.",
  "Samira":"Needs melee chaos—disengage W, deny resets.",
  "Sejuani":"Chain stuns—don’t clump; track Glacial Prison.",
  "Senna":"Long-range root—watch W; she scales souls.",
  "Seraphine":"Layered CC and shields—bait cooldowns pre-fight.",
  "Sett":"Facebreak + suplex—don’t group for E/R.",
  "Shaco":"Boxes in fog—pink common paths; respect stealth.",
  "Shen":"Global shield—track level 6; don’t dive without info.",
  "Shyvana":"Dragon engage—kite transform; avoid E burn zone.",
  "Singed":"Fling + glue—don’t chase past minions.",
  "Sion":"Multiple knockups—don’t line up for R.",
  "Sivir": "Hits give brief MS—kite back on proc.",
  "Skarner": "Hits build Quake stacks; at 3 you take %HP bursts—don’t eat chained trades.",
  "Smolder":"Stacks for huge R—don’t clump; sidestep W slow.",
  "Sona":"Big team auras—watch for Flash R.",
  "Soraka":"Heals everywhere—cut healing or dive her first.",
  "Swain":"Pulls then drains—break tethers; kite his ult.",
  "Sylas":"Steals ults—assume he has your worst CC.",
  "Syndra":"Scatter stun setups—don’t line up with orbs.",
  "TahmKench":"Devour saves/peels—bait it out before engaging.",
  "Taliyah":"Wall and throw—don’t dash through mines.",
  "Talon":"Flanks from walls—guard sides; don’t step on blades.",
  "Taric":"Invuln ults—stall fights through R.",
  "Teemo":"Shroom fields—control wards on paths; avoid blind all-ins.",
  "Thresh":"Hook + box threat—don’t hug walls; deny lantern.",
  "Tristana":"All-in resets—save peel for jump; don’t stack for R.",
  "Trundle":"Pillar splits fights—don’t fight in chokes.",
  "Tryndamere":"Undying—kite R; don’t burn sums too early.",
  "TwistedFate":"Global pick—track MIA; respect gold card.",
  "Twitch":"Stealth flanks—pink flanks; don’t group for spray.",
  "Udyr":"Point-click stun—peel him off backline.",
  "Urgot":"Execute fear—keep HP healthy; don’t get E’d.",
  "Varus":"Root chain—don’t clump; watch R angles.",
  "Vayne":"Condemn threat—avoid walls; punish Q on CD.",
  "Veigar":"Cage control—don’t cross walls; burst threat at low MR.",
  "Velkoz":"True-damage beam—interrupt R or break LOS.",
  "Vex":"Punishes dashes—don’t feed resets; spread out.",
  "Vi":"Point-click engage—track Q/R and Flash.",
  "Viego":"Resets snowball—focus first kill target.",
  "Viktor":"Zone control—don’t stand in W; dodge E lines.",
  "Vladimir":"Untargetable pool—don’t waste CC; watch burst timings.",
  "Volibear":"Tower disable dive—respect R; kite Q stun.",
  "Warwick":"Heals hard below 50% and senses low HP—don’t duel when low; save peel for R.",
  "MonkeyKing":"Stealth clone baits spells—track clone and double knockup threat.",
  "Wukong":"(See MonkeyKing) Stealth clone baits spells—track clone and double knockup threat.",
  "Xayah":"Feathers arm a root—don’t stand in feather lines; R is self-peel.",
  "Xerath":"Long range poke + single-line stun—don’t line up; juke E first.",
  "XinZhao":"3rd-hit knockup + anti-range ult—kite out R zone or disengage.",
  "Yasuo":"Wind Wall denies projectiles; Q3 + R chain knockups—don’t clump.",
  "Yunara":"Crits deal bonus magic dmg; big spikes on crit buys—don’t take extended even trades at her item spikes.",
  "Yone":"Double dashes + Q3 knockup—punish E return; don’t clump for R.",
  "Yorick":"Wall traps and Maiden pressure—don’t get boxed in; kill Maiden fast.",
  "Yuumi":"Attach heals/shields and roots on R—force cooldowns, hit her host.",
  "Zac":"Long-range E into multi-knockups—ward deep; don’t clump on bounce.",
  "Zed":"All-in assassin—hold peel for R; avoid shadow triangle.",
  "Zeri":"Wall dashes and MS spikes—punish E/R downtime; don’t group in corridors.",
  "Ziggs":"Satchel displaces and deletes towers—don’t stand on minefield.",
  "Zilean":"Double-bomb stun setups; R revive—bait ult before committing.",
  "Zoe":"Sleep picks from long range—hug minions, sidestep E bubbles.",
  "Zyra":"Roots into delayed knockup—don’t stand in plants/ult field."
};


// Your template lookup functions remain the same
// ... (abilityTipFromTemplates, abilityTipForADC, adcNoteFromTemplates) ...
function abilityTipFromTemplates(adcName, threats){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined') return "";
  const k = normalizeADCKey(adcName);
  const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k);
  const template = templateKey ? ADC_TEMPLATES[templateKey] : null;

  if(!template) return "";
  const prim = primaryThreat(threats||[]);
  // Use the template structure you provided (template.tips[ChampName])
  // This function was likely meant for the GENERAL threat tips, let's adapt adcNoteFromTemplates
  return prim ? (template[prim] || "") : ""; // Fallback using the old structure just in case
}

function abilityTipForADC(champ, abilityKey){
  // This function seems less relevant now if tips are per-champion, not per-ability threat
  // We'll use adcNoteFromTemplates instead for the main tip display
  return ""; // Keep it defined but maybe unused
}

// THIS function gets the main tip based on the *enemy* champion
function getADCTipVsEnemy(adcName, enemyChampName) {
    if (!adcName || !enemyChampName || typeof ADC_TEMPLATES === 'undefined') return "...";

    const adcKey = normalizeADCKey(adcName);
    const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === adcKey);
    const adcTemplate = templateKey ? ADC_TEMPLATES[templateKey] : null;

    if (adcTemplate && adcTemplate.tips && adcTemplate.tips[enemyChampName]) {
        return adcTemplate.tips[enemyChampName];
    }
    // Fallback: Check general threats if specific tip not found
    const enemyChamp = CHAMPIONS.find(c => c.name === enemyChampName);
    if (enemyChamp) {
        const union = (enemyChamp.abilities || []).flatMap(a => a.threat || []);
        return adcNoteFromTemplates(adcName, union) || "..."; // Use general threat tip as fallback
    }

    return "..."; // Default if no tip found
}

// THIS function gets the main tip based on *general threats* if specific isn't found
function adcNoteFromTemplates(adcName, threatsUnion){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined' || !threatsUnion) return "";
  const k = normalizeADCKey(adcName);
  const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k);
  const template = templateKey ? ADC_TEMPLATES[templateKey] : null;

  if(!template) return "";
   // This assumes ADC_TEMPLATES has general tips keyed by THREAT constants
   // e.g., ADC_TEMPLATES["Ashe"][THREAT.HARD_CC] = "Tip vs Hard CC"
   // The provided adc-templates.js doesn't follow this structure, it uses tips: { EnemyName: "Tip" }
   // So, this function might not return what's expected based on adc-templates.js content.
   // Let's comment out the loop for now and rely on getADCTipVsEnemy
  /*
  for(const key of PRIORITY){
      if(threatsUnion.includes(key)) return template[key] || "";
  }
  */
  return ""; // Return empty if general tips aren't structured this way
}

// Your passive lookup function remains the same
function briefPassiveForADC(champ){
  if (!champ) return "—";
  const override = PASSIVE_OVERRIDES[champ.slug || champ.name];
  if (override) return override;

  if (champ.passive && (champ.passive.name || champ.passive.desc)){
    const desc = (champ.passive.desc || champ.passive.name || "").replace(/\s+/g," ").trim();
    return (desc.length > 150 ? desc.slice(0, 147) + "…" : desc) || "—";
  }
  return "—";
}

// ============================================================================
// ADC PICKER (SECURELY REWRITTEN - Matches CSS)
// ============================================================================
function buildAdcGrid(){
  const grid = qs("#adcGrid");
  if (!grid) { console.error("#adcGrid not found"); return; }
  grid.innerHTML = ""; // Clear existing

  // Ensure ADC_LIST is loaded from adc-list.js
  if (typeof ADC_LIST === 'undefined' || !Array.isArray(ADC_LIST)) {
       console.error("ADC_LIST is not defined or not an array. Cannot build ADC grid.");
       qs("#adcPanel p.muted").textContent = "Error: Could not load ADC list.";
       return;
  }

  ADC_LIST.forEach(adcInfo => {
      // Find the full champion data to ensure consistency (name, slug, portrait)
      // Use name from ADC_LIST for matching
      const champData = CHAMPIONS.find(c => c.name === adcInfo.name);
      // Fallback using ADC_LIST info if not found in main CHAMPIONS (e.g., custom champs)
      const champ = champData || {
          name: adcInfo.name,
          // Extract potential slug/portrait from image path if needed, default to name
          portrait: adcInfo.name.replace(/[^A-Za-z0-9]/g,""),
          slug: adcInfo.name.replace(/[^A-Za-z0-9]/g,"")
      };

      const card = document.createElement('button');
      card.className = 'adc-card'; // Match your CSS
      card.dataset.adc = champ.name; // Store the display name

      // Create image securely, use portrait/slug, let CSS handle class styling
      const img = createPortraitImg(champ.portrait || champ.slug, champ.name, ''); // Use secure function
      // CSS (.adc-card img) handles the sizing: width:100%; height:84px; object-fit:cover; display:block

      const nameSpan = document.createElement('span');
      nameSpan.className = 'label'; // Match your CSS
      nameSpan.textContent = champ.name; // Secure

      card.appendChild(img);
      card.appendChild(nameSpan);
      grid.appendChild(card);
  });

  grid.addEventListener("click", async (e)=>{
    const card = e.target.closest(".adc-card");
    if(!card) return;
    CURRENT_ADC = card.dataset.adc;
    qsa("#adcGrid .adc-card").forEach(el=>el.classList.toggle("selected", el===card)); // Use your selected class
    await loadOverridesFor(CURRENT_ADC);
    lockTeamUI(false); // Unlock search inputs
    render(); // Re-render table
    renderMacroSection(); // Render macro tips for the selected ADC
  });
}

// Your lockTeamUI function - Matches your HTML/CSS structure
function lockTeamUI(locked){
  const lockOverlayContainer = qs("#lockOverlay");
  if (!lockOverlayContainer) { console.error("#lockOverlay not found"); return; }
  // Toggle visibility using CSS classes
  lockOverlayContainer.classList.toggle("lock-active", locked);
  // Also disable/enable search inputs
  qsa(".search input").forEach(inp => inp.disabled = locked);
}


// ============================================================================
// SEARCH INPUTS (SECURELY REWRITTEN - Matches CSS)
// ============================================================================
function makeSearchCell(team){
  const wrap = document.createElement("div");
  wrap.className = "search"; // Match your CSS

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `${team==='enemy'?'Enemy':'Ally'} champion...`;
  input.autocomplete = "off";
  // Input styling comes from .search input

  const sug = document.createElement("div");
  sug.className = "suggestions"; // Match your CSS

  wrap.appendChild(input);
  wrap.appendChild(sug);

  let currentSelectionIndex = -1;

  input.addEventListener("input",()=>{
    if(!CURRENT_ADC){ input.value = ''; return; }
    const v = input.value.trim().toLowerCase();

    if(!v){
      sug.classList.remove("show");
      sug.innerHTML="";
      currentSelectionIndex = -1;
      input.dataset.selectedSlug = ""; // Clear stored slug
      // Debounce render calls if needed, or call directly
      // setTimeout(render, 50); // Example debounce
      render();
      renderMacroSection();
      return;
    }

    const options = CHAMPIONS
      .filter(c=>c.name?.toLowerCase().includes(v)||c.slug?.toLowerCase().includes(v))
       // Exclude the currently selected ADC from the enemy/ally list
      .filter(c => c.name !== CURRENT_ADC)
      .slice(0, 7);

    sug.innerHTML = ""; // Clear previous suggestions
    options.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.type = "button";
        // Styling comes from .suggestions button
        btn.dataset.name = c.name;
        btn.dataset.slug = c.slug;
        btn.dataset.index = index;

        // Create image securely, use portrait/slug
        const img = createPortraitImg(c.portrait || c.slug, c.name, ''); // No specific class needed
        // Apply styles matching your CSS example for suggestion images
        img.style.width = '18px';
        img.style.height = 'auto';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '6px';
        img.style.borderRadius = '3px';

        const nameText = document.createTextNode(c.name); // Secure text node

        btn.appendChild(img);
        btn.appendChild(nameText); // Append text node

        btn.addEventListener('click', () => selectSuggestion(c));
        sug.appendChild(btn);
    });

    if (options.length > 0) {
      sug.classList.add("show");
      currentSelectionIndex = -1;
    } else {
      sug.classList.remove("show");
    }
  });

  // Keyboard navigation
  input.addEventListener("keydown",(e)=>{
      const items = qsa('button', sug);
      if (items.length === 0 || !sug.classList.contains('show')) return;

      if (e.key === "ArrowDown") { /* ... */ }
      else if (e.key === "ArrowUp") { /* ... */ }
      else if (e.key === "Enter") { /* ... */ }
      else if (e.key === "Escape") { /* ... */ }
       // --- [Previous Keyboard Nav Logic Kept Intact Here] ---
       if (e.key === "ArrowDown") {
          e.preventDefault();
          currentSelectionIndex = (currentSelectionIndex + 1) % items.length;
          updateSuggestionHighlight(items, currentSelectionIndex);
      } else if (e.key === "ArrowUp") {
          e.preventDefault();
          currentSelectionIndex = (currentSelectionIndex - 1 + items.length) % items.length;
          updateSuggestionHighlight(items, currentSelectionIndex);
      } else if (e.key === "Enter") {
          e.preventDefault();
          if (currentSelectionIndex >= 0 && currentSelectionIndex < items.length) {
              items[currentSelectionIndex].click();
          } else if (items.length > 0) {
               items[0].click(); // Select first if none highlighted
          }
           sug.classList.remove('show'); // Hide after selection
           input.blur();
      } else if (e.key === "Escape") {
           sug.classList.remove('show'); // Hide on escape
           currentSelectionIndex = -1;
      }
  });

   // Close suggestions on clicking outside
   document.addEventListener('click', (e) => {
       if (!wrap.contains(e.target)) {
           sug.classList.remove('show');
           currentSelectionIndex = -1;
       }
   });

  function selectSuggestion(champion) {
      input.value = champion.name;
      sug.classList.remove('show');
      sug.innerHTML = "";
      currentSelectionIndex = -1;
      input.dataset.selectedSlug = champion.slug; // Store selected slug

      render(); // Trigger re-render
      renderMacroSection();
  }

  function updateSuggestionHighlight(items, index) {
      items.forEach((item, i) => {
          // Use background style for highlight as in previous version
          item.style.backgroundColor = (i === index) ? '#101825' : 'transparent';
      });
  }

  return {wrap, input};
}

function buildSearchInputs(){
  const enemyInputsEl = qs("#enemyInputs");
  const allyInputsEl = qs("#allyInputs");
   if (!enemyInputsEl || !allyInputsEl) {
        console.error("Input containers #enemyInputs or #allyInputs not found.");
        return;
    }

   enemyInputsEl.innerHTML = ''; // Clear placeholders
   allyInputsEl.innerHTML = '';

   // Use MAX_ENEMIES and MAX_ALLIES constants
  const enemySlots = Array.from({length: 5}, ()=>makeSearchCell("enemy"));
  const allySlots = Array.from({length: 4}, ()=>makeSearchCell("ally"));

  enemySlots.forEach(s=>enemyInputsEl.appendChild(s.wrap));
  allySlots.forEach(s=>allyInputsEl.appendChild(s.wrap));
}


// ============================================================================
// RENDERING (SECURELY REWRITTEN & INTEGRATED - Matches HTML/CSS)
// ============================================================================
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");
const tableWrap = qs('#tableWrap'); // Cache table wrap for show/hide
// Cache macro section elements if they exist
const macroSection = qs("#macroSection");
const adcMacroCard = qs("#adcMacroCard");
const supportSynergyCard = qs("#supportSynergyCard");
const macroHeader = qs("#macroHeader");


/**
 * SECURELY creates the cleanse badge SPAN element. Matches .badge.cleanse
 * Shows only for SOFT_CC based on user's tagline/CSS.
 */
function createCleanseBadge(ability) {
    const t = ability.threat || [];
    // Only show if SOFT_CC is present AND HARD_CC is NOT present
    if (t.includes(THREAT.SOFT_CC) && !t.includes(THREAT.HARD_CC)) {
        const badge = document.createElement('span');
        badge.className = 'badge cleanse'; // Match your CSS
        badge.textContent = 'Cleanse'; // Secure text
        return badge;
    }
    return null;
}
/**
 * SECURELY creates the ability pills. Matches .pill structure.
 */
function createAbilityPills(abilities, champ) {
    const fragment = document.createDocumentFragment();
    if (!abilities) return fragment;

    abilities.forEach(a => {
        const pill = document.createElement('span');
        const cls = primaryThreatClass(a.threat || []);
        pill.className = `pill ${cls}`; // Match CSS (.pill .hard etc)

        // Tooltip logic remains the same (using general threat tip)
        const generalTip = abilityTipFromTemplates(CURRENT_ADC, a.threat || []);
        if (generalTip) {
             pill.title = generalTip;
        }

        const key = document.createElement('b'); // Use <b> for key
        key.textContent = a.key;
        pill.appendChild(key);

        const cds = document.createElement('span');
        cds.className = 'cds'; // Match CSS
        cds.textContent = (a.cd || []).join("/") || "—";
        pill.appendChild(cds);

        // Add tlabel span
        const prim = primaryThreat(a.threat || []);
        const labelText = prim ? THREAT_LABEL[prim] : "";
        if (labelText) {
            const tLabel = document.createElement('span');
            tLabel.className = 'tlabel'; // Match CSS
            tLabel.textContent = labelText;
            pill.appendChild(tLabel);
        }

        // Add cleanse badge securely
        const cleanseBadge = createCleanseBadge(a);
        if (cleanseBadge) {
             // Append directly or wrap if needed
             const miniBadgeWrap = document.createElement('span');
             miniBadgeWrap.className = 'mini-badge'; // If styling needed
             miniBadgeWrap.appendChild(cleanseBadge);
             pill.appendChild(miniBadgeWrap);
        }

        fragment.appendChild(pill);
    });
    return fragment;
}


/**
 * SECURELY creates the threat tags. Matches .tags-mini .tag
 */
function createThreatTags(abilities) {
    const fragment = document.createDocumentFragment();
    if (!abilities) return fragment;

    const union = Array.from(new Set(abilities.flatMap(a => a.threat || [])));
    union.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b)); // Sort by priority

    union.forEach(t => {
        const tag = document.createElement('span');
        tag.className = `tag ${tagToClass(t)}`; // Match CSS
        tag.textContent = THREAT_LABEL[t] || t; // Secure text
        fragment.appendChild(tag);
    });
    return fragment;
}


// Row group function remains the same
function renderGroupRow(label, cols = 8) { /* ... unchanged ... */
    const tr = document.createElement('tr');
    tr.className = 'row group-header';
    tr.style.background = 'transparent';
    tr.style.border = '0';
    const td = document.createElement('td');
    td.colSpan = cols;
    td.style.color = 'var(--gold)';
    td.style.textTransform = 'uppercase';
    td.style.fontWeight = '700';
    td.style.padding = '10px 8px 2px 8px';
    td.textContent = label;
    tr.appendChild(td);
    return tr;
}

/**
 * SECURELY renders a single champion row. Matches HTML/CSS precisely.
 */
function renderChampRow(group, champ, index) {
    if (!champ) return document.createElement('tr');

    const tr = document.createElement('tr');
    tr.className = 'row'; // Base row class from CSS

    // 1. Group Cell
    const tdGroup = document.createElement('td');
    tdGroup.className = 'group'; // Match thead/CSS
    tdGroup.textContent = group; // 'Enemy' or 'Ally'
    tr.appendChild(tdGroup);

    // 2. Champion Cell
    const tdChamp = document.createElement('td');
    tdChamp.className = 'champ'; // Match thead/CSS
    const champCellDiv = document.createElement('div');
    champCellDiv.className = 'cell-champ'; // Match CSS
    const img = createPortraitImg(champ.portrait || champ.slug, champ.name, 'portrait-sm'); // Use secure helper + class
    const nameDiv = document.createElement('div');
    const nameSpan = document.createElement('span'); // No class needed per CSS
    nameSpan.textContent = champ.name; // Secure
    // Title is not in your .cell-champ CSS, omitting for now
    nameDiv.appendChild(nameSpan);
    champCellDiv.appendChild(img);
    champCellDiv.appendChild(nameDiv);
    tdChamp.appendChild(champCellDiv);
    tr.appendChild(tdChamp);

    // 3. Role Cell
    const tdRole = document.createElement('td');
    tdRole.className = 'role'; // Match thead/CSS
    tdRole.textContent = (champ.tags || []).join(" • ") || "N/A"; // Secure
    tr.appendChild(tdRole);

    // 4. Passive Cell (ADC Tip Logic)
    const tdPassive = document.createElement('td');
    tdPassive.className = 'passive'; // Match thead/CSS
    // Get specific tip vs this enemy if ADC selected, otherwise show passive name
    if (CURRENT_ADC && group === 'Enemy') {
        tdPassive.textContent = getADCTipVsEnemy(CURRENT_ADC, champ.name); // Use specific tip function
    } else {
        tdPassive.textContent = briefPassiveForADC(champ); // Use general passive helper
    }
    tr.appendChild(tdPassive);

    // 5. Abilities Cell
    const tdAbilities = document.createElement('td');
    tdAbilities.className = 'abilities'; // Match thead/CSS
    const abilitiesPillsDiv = document.createElement('div');
    abilitiesPillsDiv.className = 'ability-pills'; // Match CSS
    abilitiesPillsDiv.appendChild(createAbilityPills(champ.abilities || [], champ)); // Use secure helper
    tdAbilities.appendChild(abilitiesPillsDiv);
    tr.appendChild(tdAbilities);

    // 6. Threats Cell
    const tdThreats = document.createElement('td');
    tdThreats.className = 'threats'; // Match thead/CSS
    const tagsMiniDiv = document.createElement('div');
    tagsMiniDiv.className = 'tags-mini'; // Match CSS
    tagsMiniDiv.appendChild(createThreatTags(champ.abilities || [])); // Use secure helper
    tdThreats.appendChild(tagsMiniDiv);
    tr.appendChild(tdThreats);

    // 7. ADC Tip Cell (General Threat Tip as fallback or vs Allies)
    const tdNotes = document.createElement('td');
    tdNotes.className = 'notes'; // Match thead/CSS
    const ov = getOverrideEntryForChampion?.(champ.slug || champ.name); // Check overrides first
    let adcNote = ov?.note || "..."; // Default
    if (adcNote === "...") { // If no override, get general threat tip
        const union = (champ.abilities || []).flatMap(a => a.threat || []);
        // Use the general template lookup (might need adjustment based on ADC_TEMPLATES structure)
        adcNote = adcNoteFromTemplates(CURRENT_ADC, union) || "..."; // Use general tip function
    }
     // For enemies, the specific tip is already in the passive column.
     // For allies, show the general threat tip here.
    tdNotes.textContent = (group === 'Ally') ? adcNote : "..."; // Secure text
    tr.appendChild(tdNotes);

    // 8. Support Synergy Cell
    const tdSupportSynergy = document.createElement('td');
    tdSupportSynergy.className = 'support-synergy notes'; // Match thead + use notes styling
    if (CURRENT_ADC && typeof SUPPORT_TEMPLATES !== 'undefined') {
        const supportTemplate = SUPPORT_TEMPLATES[champ.name]; // Lookup support by name
        const synergyTip = supportTemplate?.synergy?.[CURRENT_ADC]; // Get tip for current ADC
        tdSupportSynergy.textContent = synergyTip || "..."; // Secure text
    } else {
        tdSupportSynergy.textContent = "...";
    }
    tr.appendChild(tdSupportSynergy);

    return tr;
}


/**
 * Main render function, calls row builders. Matches your HTML structure.
 */
function render(){
  if (!tbody || !emptyState || !tableWrap) { // Added tableWrap check
      console.error("Required table elements (#resultsBody, #emptyState, #tableWrap) not found.");
      return;
  }

  tbody.innerHTML = ""; // Clear previous results

  const enemyInputs = qsa("#enemyInputs .search input");
  const allyInputs = qsa("#allyInputs .search input");

  // Get slugs from dataset
  const selectedEnemySlugs = Array.from(enemyInputs)
      .map(input => input.dataset.selectedSlug)
      .filter(Boolean);
  const selectedAllySlugs = Array.from(allyInputs)
      .map(input => input.dataset.selectedSlug)
      .filter(Boolean);

  // Map slugs to champion objects
  const selectedEnemies = selectedEnemySlugs
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean);
  const selectedAllies = selectedAllySlugs
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean);

   // Update global state arrays (more robust than passing lists)
   state.enemyChampions.fill(null);
   selectedEnemies.forEach((c, i) => { if (i < 5) state.enemyChampions[i] = c; }); // Use constant
   state.allyChampions.fill(null);
   selectedAllies.forEach((c, i) => { if (i < 4) state.allyChampions[i] = c; }); // Use constant

  let hasContent = false;

  if (selectedEnemies.length > 0) {
      // tbody.appendChild(renderGroupRow("Enemy Team", 8)); // Optional header row
      selectedEnemies.forEach((champ, index) => {
          // Find original index for removal consistency
          const originalInputIndex = Array.from(enemyInputs).findIndex(input => input.dataset.selectedSlug === champ.slug);
          tbody.appendChild(renderChampRow("Enemy", champ, originalInputIndex !== -1 ? originalInputIndex : index));
          hasContent = true;
      });
  }

  if (selectedAllies.length > 0) {
      // tbody.appendChild(renderGroupRow("Ally Team", 8)); // Optional header row
      selectedAllies.forEach((champ, index) => {
           const originalInputIndex = Array.from(allyInputs).findIndex(input => input.dataset.selectedSlug === champ.slug);
          tbody.appendChild(renderChampRow("Ally", champ, originalInputIndex !== -1 ? originalInputIndex : index));
          hasContent = true;
      });
  }

  // Toggle visibility based on content
  tableWrap.style.display = hasContent ? 'flex' : 'none'; // Use display flex/none per CSS
  emptyState.style.display = hasContent ? 'none' : 'block';

   // Update macro section visibility (if the section exists in HTML)
   if (macroSection) {
       macroSection.classList.toggle('hidden', !CURRENT_ADC); // Use 'hidden' class per HTML
   }
}

// removeChampion function adapted for input clearing
function removeChampion(type, index) {
    const inputs = (type === 'enemy') ? qsa("#enemyInputs .search input") : qsa("#allyInputs .search input");
    if (inputs[index]) {
        inputs[index].value = '';
        inputs[index].dataset.selectedSlug = ''; // Clear the slug marker
        // No icon to clear in this HTML version
        render(); // Re-render the table
        renderMacroSection(); // Re-render macro section
    } else {
        console.warn(`Attempted to remove champion at invalid index ${index} for type ${type}`);
    }
}

// ============================================================================
// MACRO/SYNERGY SECTION RENDERING (SECURE - For your HTML if present)
// ============================================================================
/**
 * SECURELY renders the High-Elo macro tips and Support Synergies.
 * Checks if the relevant HTML elements exist.
 */
function renderMacroSection() {
    const macroSectionEl = qs("#macroSection"); // Check if the optional section exists
    const adcMacroCardEl = qs("#adcMacroCard");
    const supportSynergyCardEl = qs("#supportSynergyCard");
    const macroHeaderEl = qs("#macroHeader"); // Assuming a header inside #macroSection

    // Only proceed if the main container exists
    if (!macroSectionEl || !adcMacroCardEl || !supportSynergyCardEl /* || !macroHeaderEl */ ) {
        return; // Exit silently if the section isn't in the HTML
    }

    // Clear previous content
    adcMacroCardEl.innerHTML = '';
    supportSynergyCardEl.innerHTML = '';
    // if (macroHeaderEl) macroHeaderEl.textContent = 'High-Elo Macro & Synergy'; // Reset header

    if (!CURRENT_ADC) {
        macroSectionEl.classList.add('hidden'); // Ensure it's hidden if no ADC
        return;
    }

    // if (macroHeaderEl) macroHeaderEl.textContent = `${CURRENT_ADC} - Macro & Synergy`;
    macroSectionEl.classList.remove('hidden'); // Show if ADC selected

    // --- Render ADC Macro Card ---
    if (typeof ADC_TEMPLATES !== 'undefined') {
        const normalizedKey = normalizeADCKey(CURRENT_ADC);
        const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === normalizedKey);
        const template = templateKey ? ADC_TEMPLATES[templateKey] : null;

        if (template && template.macro) {
            adcMacroCardEl.appendChild(createMacroCard(
                "High-Elo Macro (KR/EUW)", // Use appropriate title
                template.macro,
                false // Not a list
            ));
        } else {
             const p = document.createElement('p'); p.textContent = 'No macro tips available.';
             adcMacroCardEl.appendChild(p); // Fallback message
        }
    } else {
        console.warn("ADC_TEMPLATES is not defined.");
         const p = document.createElement('p'); p.textContent = 'Error: ADC Templates missing.';
         adcMacroCardEl.appendChild(p);
    }

    // --- Render Support Synergy Card ---
    if (typeof SUPPORT_TEMPLATES !== 'undefined') {
        const synergies = getSynergiesForADC(CURRENT_ADC); // Your helper function
        if (Object.keys(synergies).length > 0) {
            supportSynergyCardEl.appendChild(createMacroCard(
                "Potential Support Synergies", // Use appropriate title
                synergies,
                true // Render as a list using .tip-card
            ));
        } else {
             const p = document.createElement('p'); p.textContent = 'No specific support synergies found.';
             supportSynergyCardEl.appendChild(p); // Fallback message
        }
    } else {
        console.warn("SUPPORT_TEMPLATES is not defined.");
        const p = document.createElement('p'); p.textContent = 'Error: Support Templates missing.';
        supportSynergyCardEl.appendChild(p);
    }
}


/**
 * Helper to securely create the content for a macro/synergy card.
 * Uses your CSS classes (.section-title, .tip-card).
 */
function createMacroCard(title, data, isList = false) {
    const fragment = document.createDocumentFragment();

    const h3 = document.createElement('h3');
    // Use section-title class if available in this context, or just style directly
     h3.style.color = 'var(--gold)';
     h3.style.fontSize = '14px'; // Match .team h2
     h3.style.textTransform = 'uppercase';
     h3.style.letterSpacing = '.4px';
     h3.style.marginBottom = '12px'; // Spacing
     h3.style.borderBottom = '1px solid var(--border)';
     h3.style.paddingBottom = '6px';
    h3.textContent = title;
    fragment.appendChild(h3);

    if (isList) {
        // Render as a list of tip cards (matching your .tip-card CSS)
        const gridDiv = document.createElement('div');
        gridDiv.className = 'support-tips-grid'; // Use your CSS class

        for (const [key, value] of Object.entries(data)) {
            const card = document.createElement('div');
            card.className = 'tip-card'; // Use your CSS class

            const supportChamp = CHAMPIONS.find(c => c.name === key);
            if (supportChamp) {
                 const img = createPortraitImg(supportChamp.portrait || supportChamp.slug, key, '');
                 // Style img according to .tip-card img CSS
                  img.style.width = '32px'; // Example size, adjust if needed
                  img.style.height = '32px';
                  img.style.borderRadius = '4px';
                  img.style.flexShrink = '0';
                 card.appendChild(img);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'tip-card-content'; // Use your CSS class

            const strong = document.createElement('strong');
            strong.textContent = key; // Support name
            contentDiv.appendChild(strong);

            const p = document.createElement('p');
            p.textContent = value; // Synergy tip (Secure)
            contentDiv.appendChild(p);

            card.appendChild(contentDiv);
            gridDiv.appendChild(card);
        }
        fragment.appendChild(gridDiv);

    } else {
        // Render macro tips as paragraphs
        for (const [key, value] of Object.entries(data)) {
            const p = document.createElement('p');
            // Style similar to .tip-card-content p
             p.style.fontSize = '0.85em';
             p.style.color = 'var(--muted)';
             p.style.lineHeight = '1.5';
             p.style.margin = '0 0 8px 0'; // Add some margin

            const strong = document.createElement('strong');
            strong.style.color = 'var(--gold)';
            strong.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ": ";
            p.appendChild(strong);
            // p.appendChild(document.createElement('br')); // Optional line break
            p.appendChild(document.createTextNode(value)); // Append tip text securely
            fragment.appendChild(p);
        }
    }
    return fragment;
}

/**
 * Helper function to get all support synergies for a given ADC.
 */
function getSynergiesForADC(adcName) {
    const synergies = {};
    if (typeof SUPPORT_TEMPLATES === 'undefined' || !adcName) {
        return synergies;
    }
    for (const [supportName, template] of Object.entries(SUPPORT_TEMPLATES)) {
        if (template.synergy && template.synergy[adcName]) {
            synergies[supportName] = template.synergy[adcName];
        }
    }
    return Object.fromEntries(
       Object.entries(synergies).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );
}


// ============================================================================
// INITIALIZATION & EVENT LISTENERS SETUP (Matches your HTML)
// ============================================================================

/**
 * Initializes the application. Loads data, builds UI, sets listeners.
 */
async function initializeApp() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP error loading ${DATA_URL}! status: ${response.status}`);
        CHAMPIONS = await response.json();
        ensureThreatsForAllAbilities(CHAMPIONS); // Tag threats

        // --- DOM Ready ---
        buildAdcGrid(); // Build ADC selector using loaded CHAMPIONS
        buildSearchInputs(); // Build enemy/ally search inputs
        setupGlobalEventListeners(); // Setup compact mode, import/export, editor modal
        lockTeamUI(true); // Lock search inputs initially
        render(); // Initial render (shows empty state)
        // Render macro section initially (it will be hidden by default if no ADC)
        renderMacroSection();

        // Check if build-from-cdragon.js is loaded and attach listener
        const buildBtn = qs('#buildCDragon');
        if (buildBtn && typeof buildFromCDragon === 'function') {
            buildBtn.addEventListener('click', () => buildFromCDragon(buildBtn));
        } else if (buildBtn) {
             console.warn("Build button found, but buildFromCDragon function is not defined. Ensure build-from-cdragon.js is loaded correctly if needed client-side.");
             // Optionally hide or disable the button if the function isn't available
             // buildBtn.style.display = 'none';
        }

    } catch (e) {
        console.error("Initialization failed:", e);
        showError(`Could not load champion data (${DATA_URL}). Please check network connection or file path.`);
        const mainContent = qs('main.viewport-fit');
        if (mainContent) {
            // Display error more gracefully within the UI
            mainContent.innerHTML = `<div class="empty" style="padding: 40px; text-align: center; color: var(--muted);"><p><strong>Error loading application data.</strong></p><p>${e.message}</p><p>Please refresh the page or check the console.</p></div>`;
        }
    }
}

// Global listeners setup (matches your HTML)
function setupGlobalEventListeners() {
    // Compact Mode Toggle
    const compactToggle = qs('#toggleCompact');
    if (compactToggle) {
        compactToggle.addEventListener('change', e => {
            document.body.classList.toggle('compact-mode', e.target.checked);
        });
    }

    // Import/Export Buttons
    qs('#exportData')?.addEventListener('click', exportData);
    qs('#importData')?.addEventListener('click', () => qs('#importFile')?.click());
    qs('#importFile')?.addEventListener('change', handleImport);

    // Editor Modal Buttons (Matches your HTML)
    const editorModal = qs('#editorModal');
    if (editorModal) {
        qs('#openEditor')?.addEventListener('click', () => { // Check if #openEditor exists
             const editorArea = qs('#editorArea');
             if(editorArea) {
                  // Pre-fill with current CHAMPIONS data
                  editorArea.value = JSON.stringify(CHAMPIONS, null, 2);
             }
             if (typeof editorModal.showModal === 'function') {
                editorModal.showModal();
             } else {
                 console.warn("dialog.showModal() not supported.")
                 // Basic fallback? editorModal.style.display = 'block';
             }
        });
        qs('#saveEditor')?.addEventListener('click', handleSaveEditor);
        // Cancel button uses form method="dialog" value="cancel"
    }
}


// Handler for Save button in editor modal
function handleSaveEditor(event) {
     event.preventDefault(); // Prevent default form submission if needed
     const editorArea = qs('#editorArea');
     const editorModal = qs('#editorModal');
     if (!editorArea || !editorModal) return;

     try {
          const newData = JSON.parse(editorArea.value);
          if (!Array.isArray(newData)) throw new Error("Data must be a JSON array.");

          // Basic validation (e.g., check if items have 'name' and 'slug')
          if (newData.length > 0 && (!newData[0].name || !newData[0].slug)) {
              throw new Error("Champion entries must have at least 'name' and 'slug' properties.");
          }

          CHAMPIONS = newData; // Update global CHAMPIONS
          ensureThreatsForAllAbilities(CHAMPIONS); // Re-tag threats
          // Re-build UI as data fundamentally changed
          buildAdcGrid();
          buildSearchInputs(); // Clears old selections
          CURRENT_ADC = null; // Reset selected ADC
          lockTeamUI(true); // Re-lock inputs
          render(); // Re-render table (will be empty)
          renderMacroSection(); // Re-render macro section (will be hidden)
          console.log("Champion data updated from editor.");
          if (typeof editorModal.close === 'function') {
             editorModal.close('saved'); // Close modal successfully
          }
     } catch (e) {
          showError(`Invalid JSON data in editor: ${e.message}`);
          console.error("JSON parsing/validation error:", e);
          // Keep modal open on error
     }
}

// Placeholder/Handler for your CDragon build button
function handleBuildCDragonClick() {
    console.log("Build CDragon button clicked.");
    // This button was likely intended to trigger the logic now inside build-from-cdragon.js
    // If that file needs to run client-side (unlikely for a build script),
    // ensure it defines a global function (e.g., `buildFromCDragon`)
    // and call it here. Otherwise, this button might be redundant client-side.
    if (typeof buildFromCDragon === 'function') {
        buildFromCDragon(qs('#buildCDragon'));
    } else {
        showError("Build function not available in this context.");
    }
}


// ============================================================================
// IMPORT / EXPORT / UTILITIES (Adapted for your state/UI)
// ============================================================================
function showError(message) {
    console.error(message);
    // TODO: Implement a less intrusive notification system (e.g., toast)
    alert(message);
}

// Export data function
async function exportData() {
    try {
        const enemySlugs = Array.from(qsa("#enemyInputs .search input"))
                               .map(input => input.dataset.selectedSlug)
                               .filter(Boolean);
        const allySlugs = Array.from(qsa("#allyInputs .search input"))
                             .map(input => input.dataset.selectedSlug)
                             .filter(Boolean);

        const data = {
            selectedADC: CURRENT_ADC,
            enemies: enemySlugs,
            allies: allySlugs
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adc-threat-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        showError('Error exporting data');
        console.error(err);
    }
}


// Import data function
async function handleImport(e) {
    try {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);

        // --- Clear current selections ---
        CURRENT_ADC = null;
        qsa("#adcGrid .adc-card.selected").forEach(el => el.classList.remove('selected'));
        const allInputs = [...qsa("#enemyInputs .search input"), ...qsa("#allyInputs .search input")];
        allInputs.forEach(input => {
             input.value = '';
             input.dataset.selectedSlug = '';
        });
        lockTeamUI(true); // Lock until ADC is potentially selected


        // --- Load imported data ---
        let adcFoundAndSelected = false;
        if (data.selectedADC) {
            const adcCard = qs(`#adcGrid .adc-card[data-adc="${data.selectedADC}"]`);
            if (adcCard) {
                // Simulate click to handle selection, UI update, and unlocking
                adcCard.click();
                adcFoundAndSelected = true;
                // Wait briefly for click handler potentially async parts (like loadOverrides)
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                 showError(`Imported ADC "${data.selectedADC}" not found.`);
                 // Keep UI locked
            }
        }
        // If no ADC was in the import, or it wasn't found, keep UI locked.
        if (!adcFoundAndSelected) {
             lockTeamUI(true);
        }


        // Populate enemies
        const enemyInputs = qsa("#enemyInputs .search input");
        if (data.enemies && Array.isArray(data.enemies)) {
            data.enemies.slice(0, 5).forEach((slug, index) => { // Use constant
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && enemyInputs[index]) {
                    enemyInputs[index].value = champ.name;
                    enemyInputs[index].dataset.selectedSlug = champ.slug;
                }
            });
        }

        // Populate allies
        const allyInputs = qsa("#allyInputs .search input");
        if (data.allies && Array.isArray(data.allies)) {
            data.allies.slice(0, 4).forEach((slug, index) => { // Use constant
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && allyInputs[index]) {
                    allyInputs[index].value = champ.name;
                    allyInputs[index].dataset.selectedSlug = champ.slug;
                }
            });
        }

        // Re-render AFTER potentially selecting ADC and populating inputs
        render();
        renderMacroSection();

    } catch (err) {
        showError('Error importing file. It may be corrupt or invalid.');
        console.error(err);
    } finally {
        if (e.target) e.target.value = null; // Reset file input
    }
}


// ============================================================================
// START THE APP (Using DOMContentLoaded)
// ============================================================================
document.addEventListener('DOMContentLoaded', initializeApp);
