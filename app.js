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
const DATA_URL = "champions-summary.json";

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

// Matches your styles.css variables
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
    if (slug === "Kaisa") slug = "KaiSa"; // DDragon uses KaiSa with capital S
    if (slug === "Wukong") slug = "MonkeyKing"; // DDragon uses MonkeyKing
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
        if (this.src !== cdnFallback) {
            console.warn(`DDragon image failed for ${slug}, falling back to Cdragon: ${cdnFallback}`);
            this.src = cdnFallback;
        } else if (this.src !== DUMMY_IMAGE_PATH) {
             console.error(`Cdragon fallback also failed for ${slug}. Using dummy image.`);
             this.src = DUMMY_IMAGE_PATH; // Final fallback
        }
        // Remove handler after first error or fallback attempt to prevent loops
        this.onerror = null;
    };
    return img;
}

// Your image fallback observer remains - place it here if needed,
// but the createPortraitImg handles fallbacks more directly now.
// Consider removing the observer if createPortraitImg covers all cases.


// Use the ADC_LIST from adc-list.js (ensure it's loaded before this script)
// Assuming ADC_LIST is globally available from the included file.
// const ADC_IDS = ADC_LIST.map(adc => adc.name); // Derive from ADC_LIST if it exists

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
      const tags = new Set(ab.threat || []);
      // Simplified: Add HARD_CC for major displacement/stuns/roots etc.
      if (RX.air.test(txt) || RX.stun.test(txt) || RX.root.test(txt) || RX.charm.test(txt) || RX.taunt.test(txt) ||
          RX.fear.test(txt) || RX.sleep.test(txt) || RX.silence.test(txt) || RX.polymorph.test(txt)) {
          tags.add(THREAT.HARD_CC);
      }
      // Add SOFT_CC for others
      if (RX.slow.test(txt) || RX.blind.test(txt) || RX.grounded.test(txt)) {
         // Only add SOFT if HARD isn't already present for this type (e.g. slow isn't HARD)
         if (!tags.has(THREAT.HARD_CC) || !(RX.air.test(txt) || RX.stun.test(txt) || RX.root.test(txt) || /* ... other HARD types */ RX.polymorph.test(txt))) {
            tags.add(THREAT.SOFT_CC);
         }
      }

      if (RX.shield.test(txt)) tags.add(THREAT.SHIELD_PEEL);
      if (RX.gap.test(txt))    tags.add(THREAT.GAP_CLOSE);
      if (RX.burst.test(txt))  tags.add(THREAT.BURST);
      if (RX.zone.test(txt))   tags.add(THREAT.POKE_ZONE);

      if (tags.size === 0 && ab.key) {
         tags.add(ab.key === "R" ? THREAT.BURST : THREAT.POKE_ZONE);
      }
      ab.threat = Array.from(tags);
    }
  }
}

const PASSIVE_OVERRIDES = { /* ... your passive overrides, ensure keys match slugs ... */
  // Make sure keys here match the 'slug' field from champions-summary.json
  // e.g., "MonkeyKing" for Wukong, "Kaisa" for Kai'Sa, "MissFortune", etc.
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
  "Belveth":"DR channel + dashes—kite off W knockup threat.", // Corrected name: BelVeth -> Belveth
  "Blitzcrank":"Hook threat defines lane—don’t hug walls; juke Q.",
  "Brand":"High burn—spread out; don’t get ablaze stunned.",
  "Braum":"Concussive Blows—avoid stacking autos; wall blocks projectiles.",
  "Briar":"Self-frenzy; long engage—peel fear channel, kite post-R.",
  "Caitlyn":"Trap setups—don’t step in nets; respect snipe angles.",
  "Camille":"Hookshot stun & isolation on R—hug minions; keep peel nearby.",
  "Cassiopeia":"Grounded zone—don’t dash in W; watch for R face/stun.",
  "Chogath":"Knockup + true execute—space Q areas; don’t coinflip feast.", // Corrected name: ChoGath -> Chogath
  "Corki":"Package engages—respect timer; rockets poke from afar.",
  "Darius":"Pull + execute—save dash for E; don’t gift 5 stacks.",
  "Diana":"AoE pull on R—don’t clump; track E reset angles.",
  "DrMundo":"Ignores CC—don’t waste picks; kite cleavers.", // Keep DDragon name
  "Draven":"Axes snowball—deny cash-in; don’t get E’d while retreating.",
  "Ekko":"Rewind escape—burst won’t stick if he keeps R; avoid W field.",
  "Elise":"Cocoon pick + rappel—respect fog; pink wards matter.",
  "Evelynn":"Stealth charm—hug pinks; don’t stand low for execute.",
  "Ezreal":"Arcane Shift safety—punish E down; poke sustained.",
  "Fiddlesticks":"Fear chain & big R—ward deep; don’t fight in fog.", // Use DDragon name
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
  "JarvanIV":"Flag-drag knockup—stand away from the flag line.", // Keep DDragon name
  "Jax":"Stun + dodge—don’t auto into E; kite his R windows.",
  "Jayce":"Form swaps—watch hammer knockback; don’t funnel through gate poke.",
  "Jhin":"Root from range—don’t be marked; cancel his curtain when dived.",
  "Jinx":"Trap zone—don’t chase through chompers; punish before Get Excited.",
  "KSante":"High peel and displacements—don’t fight walls; track Q3.", // Corrected name: KSante -> Ksante? Check slug
  "Kaisa":"Has safety with R—punish when E/R down.", // Use correct slug
  "Kalista":"Fates Call resets engage—don’t overchase support.",
  "Karma":"Shield+root—force shield then trade.",
  "Karthus":"Global R—watch HP; don’t stand in wall zone.",
  "Kassadin":"Magic shield—don’t waste poke; punish pre-6.",
  "Katarina":"Resets—CC on contact; don’t clump in R.",
  "Kayle":"R invuln saves target—bait it out before diving.",
  "Kayn":"Form-dependent—respect fear/knockups; track R.",
  "Kennen":"Stun storm—don’t clump; track Flash.",
  "Khazix":"Jumps on isolated—stay near allies; ward jumps.", // Corrected name: KhaZix -> Khazix? Check slug
  "Kindred":"R denies execute—don’t stack inside; step out late.",
  "Kled":"Mounted engage—kite away from charge path.",
  "KogMaw":"On-death bomb—don’t stand on corpse.", // Keep DDragon name
  "Leblanc": "Abilities mark then detonate—don’t let her double-proc on you.",
  "LeeSin":"Kick displacement—don’t line up; track Flash+R.", // Corrected name: Lee Sin -> LeeSin? Check slug
  "Leona":"Point-click CC—don’t trade without sums/peel up.",
  "Lillia":"Sleep bomb—spread and cleanse on wake.",
  "Lissandra":"Point-blank lockdown—respect self-R.",
  "Lucian":"Short-dash windows—punish E down.",
  "Lulu":"Polymorph shuts you down—bait W; watch knockup on R.",
  "Lux":"Snare from fog—keep minions in between.",
  "Malphite":"Hard engage—don’t clump and track R.",
  "Malzahar":"Spell shield + suppress—poke shield first.",
  "Maokai":"Sapling zone + roots—don’t face check brush.",
  "MasterYi":"Untargetable Q—peel him when he dives.", // Keep DDragon name
  "Mel":"Abilities grant bonus projectiles; attacks stack Radiance—R executes at threshold. Don’t hover low HP.", // Custom
  "Milio":"Cleanse/shields—force cooldowns before committing.",
  "MissFortune":"Channel R—interrupt or break LOS.", // Keep DDragon name
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
  "Nunu":"Snowball CC—see it early; sidestep charge.", // Use DDragon name
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
  "RekSai":"Unburrow knockup—pink tunnels; don’t path near burrow.", // Keep DDragon name
  "Rell":"Hard engage + peel—beware W crash and R drag.",
  "Renata":"Saves with W and flips fights with R—spread out.", // Use DDragon name
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
  "TahmKench":"Devour saves/peels—bait it out before engaging.", // Keep DDragon name
  "Taliyah":"Wall and throw—don’t dash through mines.",
  "Talon":"Flanks from walls—guard sides; don’t step on blades.",
  "Taric":"Invuln ults—stall fights through R.",
  "Teemo":"Shroom fields—control wards on paths; avoid blind all-ins.",
  "Thresh":"Hook + box threat—don’t hug walls; deny lantern.",
  "Tristana":"All-in resets—save peel for jump; don’t stack for R.",
  "Trundle":"Pillar splits fights—don’t fight in chokes.",
  "Tryndamere":"Undying—kite R; don’t burn sums too early.",
  "TwistedFate":"Global pick—track MIA; respect gold card.", // Keep DDragon name
  "Twitch":"Stealth flanks—pink flanks; don’t group for spray.",
  "Udyr":"Point-click stun—peel him off backline.",
  "Urgot":"Execute fear—keep HP healthy; don’t get E’d.",
  "Varus":"Root chain—don’t clump; watch R angles.",
  "Vayne":"Condemn threat—avoid walls; punish Q on CD.",
  "Veigar":"Cage control—don’t cross walls; burst threat at low MR.",
  "Velkoz":"True-damage beam—interrupt R or break LOS.", // Keep DDragon name
  "Vex":"Punishes dashes—don’t feed resets; spread out.",
  "Vi":"Point-click engage—track Q/R and Flash.",
  "Viego":"Resets snowball—focus first kill target.",
  "Viktor":"Zone control—don’t stand in W; dodge E lines.",
  "Vladimir":"Untargetable pool—don’t waste CC; watch burst timings.",
  "Volibear":"Tower disable dive—respect R; kite Q stun.",
  "Warwick":"Heals hard below 50% and senses low HP—don’t duel when low; save peel for R.",
  "MonkeyKing":"Stealth clone baits spells—track clone and double knockup threat.", // Keep DDragon name for lookup
  "Wukong":"(See MonkeyKing) Stealth clone baits spells—track clone and double knockup threat.", // User-facing name override if needed
  "Xayah":"Feathers arm a root—don’t stand in feather lines; R is self-peel.",
  "Xerath":"Long range poke + single-line stun—don’t line up; juke E first.",
  "XinZhao":"3rd-hit knockup + anti-range ult—kite out R zone or disengage.", // Keep DDragon name
  "Yasuo":"Wind Wall denies projectiles; Q3 + R chain knockups—don’t clump.",
  "Yunara":"Crits deal bonus magic dmg; big spikes on crit buys—don’t take extended even trades at her item spikes.", // Keep custom champ
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


// Your template lookup functions remain the same logic
function abilityTipFromTemplates(adcName, threats){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined') return "";
  const k = normalizeADCKey(adcName);
  // Find the template entry ignoring case/punctuation differences in keys
  const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k);
  const template = templateKey ? ADC_TEMPLATES[templateKey] : null;

  if(!template) return "";
  const prim = primaryThreat(threats||[]);
  return prim ? (template[prim] || "") : ""; // Return empty string if threat not found
}

function abilityTipForADC(champ, abilityKey){
  if (!CURRENT_ADC || !champ) return "";
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  if (ov?.abilities?.[abilityKey]?.adcTip) return ov.abilities[abilityKey].adcTip;
  const ability = (champ.abilities||[]).find(a=>a.key===abilityKey) || {};
  // Call the function correctly - it was missing in the snippet
  return abilityTipFromTemplates(CURRENT_ADC, ability.threat || []);
}

function adcNoteFromTemplates(adcName, threatsUnion){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined' || !threatsUnion) return "";
  const k = normalizeADCKey(adcName);
  const templateKey = Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k);
  const template = templateKey ? ADC_TEMPLATES[templateKey] : null;

  if(!template) return "";
  for(const key of PRIORITY){
      if(threatsUnion.includes(key)) return template[key] || ""; // Return empty if threat exists but no tip
  }
  return ""; // Return empty if no priority threats found
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
  if (!grid) return;
  grid.innerHTML = ""; // Clear existing

  const lookup = new Map(CHAMPIONS.map(c => [c.slug || c.name, c]));

  // Ensure ADC_LIST is loaded from adc-list.js
  if (typeof ADC_LIST === 'undefined' || !Array.isArray(ADC_LIST)) {
       console.error("ADC_LIST is not defined or not an array. Cannot build ADC grid.");
       qs("#adcPanel p.muted").textContent = "Error: Could not load ADC list."; // Update user hint
       return;
  }

  ADC_LIST.forEach(adcInfo => {
      // Find the full champion data using the name from ADC_LIST
      const champData = CHAMPIONS.find(c => c.name === adcInfo.name);
      // Use basic info if full data isn't found (e.g., for custom champs like Yunara)
      const champ = champData || { name: adcInfo.name, portrait: adcInfo.name.replace(/[^A-Za-z0-9]/g,""), slug: adcInfo.name.replace(/[^A-Za-z0-9]/g,"") };

      const card = document.createElement('button');
      card.className = 'adc-card'; // Match your CSS
      card.dataset.adc = champ.name; // Store the display name

      // Create image securely, NO specific class needed if size comes from .adc-card img
      const img = createPortraitImg(champ.portrait || champ.slug, champ.name, '');
      // Let CSS handle the sizing: width:100%; height:84px; object-fit:cover; display:block

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
  const lockOverlayContainer = qs("#lockOverlay"); // The main container div
  if (!lockOverlayContainer) return;

  // Toggle visibility using CSS classes (as defined in your styles.css)
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
  // input doesn't need extra classes if styling comes from .search input

  const sug = document.createElement("div");
  sug.className = "suggestions"; // Match your CSS
  // sug.style.display = 'none'; // Controlled by .show class in CSS

  wrap.appendChild(input);
  wrap.appendChild(sug);

  let currentSelectionIndex = -1; // For keyboard navigation

  input.addEventListener("input",()=>{
    if(!CURRENT_ADC){ input.value = ''; return; }
    const v = input.value.trim().toLowerCase();

    if(!v){
      sug.classList.remove("show"); // Use CSS class to hide
      sug.innerHTML="";
      currentSelectionIndex = -1;
      // Clear stored slug when input is cleared
      input.dataset.selectedSlug = "";
      // Optional: Trigger re-render if clearing should update table immediately
      // render();
      // renderMacroSection();
      return;
    }

    const options = CHAMPIONS
      .filter(c=>c.name?.toLowerCase().includes(v)||c.slug?.toLowerCase().includes(v))
      .slice(0, 7); // Limit suggestions

    sug.innerHTML = ""; // Clear previous suggestions (safe here)
    options.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.type = "button";
        // btn doesn't need extra classes if styling comes from .suggestions button
        btn.dataset.name = c.name;
        btn.dataset.slug = c.slug;
        btn.dataset.index = index;

        // Create image securely, no specific class needed if styling from .suggestions button img
        const img = createPortraitImg(c.portrait || c.slug, c.name, '');
        img.style.width = '18px'; // Match your CSS inline style example
        img.style.height = 'auto'; // Maintain aspect ratio
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '6px';

        const nameText = document.createTextNode(c.name); // Secure text node

        btn.appendChild(img);
        btn.appendChild(nameText); // Append text node

        btn.addEventListener('click', () => selectSuggestion(c));
        sug.appendChild(btn);
    });

    if (options.length > 0) {
      sug.classList.add("show"); // Use CSS class to show
      currentSelectionIndex = -1;
    } else {
      sug.classList.remove("show");
    }
  });

  // Keyboard navigation for suggestions
  input.addEventListener("keydown",(e)=>{
      const items = qsa('button', sug); // Select buttons within suggestions
      if (items.length === 0 || !sug.classList.contains('show')) return;

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

      // Store the selected slug for the render function
      input.dataset.selectedSlug = champion.slug;

      render(); // Trigger re-render of the table
      renderMacroSection(); // Update macro section as well
  }

  function updateSuggestionHighlight(items, index) {
      items.forEach((item, i) => {
          // Use a class for hover/selected state if defined in CSS, e.g., 'highlighted'
          item.style.backgroundColor = (i === index) ? '#101825' : 'transparent'; // Basic highlight
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

  const enemySlots = Array.from({length: MAX_ENEMIES}, ()=>makeSearchCell("enemy"));
  const allySlots = Array.from({length: MAX_ALLIES}, ()=>makeSearchCell("ally"));

  enemySlots.forEach(s=>enemyInputsEl.appendChild(s.wrap));
  allySlots.forEach(s=>allyInputsEl.appendChild(s.wrap));
}


// ============================================================================
// RENDERING (SECURELY REWRITTEN & INTEGRATED - Matches HTML/CSS)
// ============================================================================
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");
// Ensure macro section elements are cached if they exist in your final HTML
const macroSection = qs("#macroSection");
const adcMacroCard = qs("#adcMacroCard");
const supportSynergyCard = qs("#supportSynergyCard");
const macroHeader = qs("#macroHeader");


/**
 * SECURELY creates the cleanse badge SPAN element. Matches .badge.cleanse
 * @param {object} ability - The ability object.
 * @returns {HTMLSpanElement | null} The badge element or null.
 */
function createCleanseBadge(ability) {
    const t = ability.threat || [];
    // Show badge only for SOFT_CC as per your description/CSS example
    // Or adjust logic if HARD CC should also show it
    if (t.includes(THREAT.SOFT_CC)) { // Condition based on your CSS example logic
        const badge = document.createElement('span');
        badge.className = 'badge cleanse'; // Match your CSS
        badge.textContent = 'Cleanse'; // Secure text
        return badge;
    }
    return null;
}
/**
 * SECURELY creates the ability pills SPAN elements. Matches .pill
 * @param {Array} abilities - Array of ability objects.
 * @param {object} champ - The champion object.
 * @returns {DocumentFragment} A fragment containing all pill elements.
 */
function createAbilityPills(abilities, champ) {
    const fragment = document.createDocumentFragment();
    if (!abilities) return fragment;

    abilities.forEach(a => {
        const pill = document.createElement('span');
        const cls = primaryThreatClass(a.threat || []);
        pill.className = `pill ${cls}`; // Match your CSS (.pill .hard etc)

        const tip = abilityTipForADC(champ, a.key); // Use your existing tip function
        if (tip) {
            pill.title = tip; // Tooltip remains useful
        }

        const key = document.createElement('b'); // Use <b> for key per your CSS example
        key.textContent = a.key; // Secure text
        pill.appendChild(key);

        const cds = document.createElement('span');
        cds.className = 'cds'; // Match your CSS
        cds.textContent = (a.cd || []).join("/") || "—"; // Secure text
        pill.appendChild(cds);

        // Add tlabel span from your CSS example
        const prim = primaryThreat(a.threat || []);
        const labelText = prim ? THREAT_LABEL[prim] : "";
        if (labelText) {
            const tLabel = document.createElement('span');
            tLabel.className = 'tlabel'; // Match your CSS
            tLabel.textContent = labelText; // Secure text
            pill.appendChild(tLabel);
        }

        const cleanseBadge = createCleanseBadge(a);
        if (cleanseBadge) {
            // Append inside the pill, matching structure if possible
            const miniBadgeWrap = document.createElement('span'); // Wrapper if needed
            miniBadgeWrap.className = 'mini-badge'; // If you have styling for this wrapper
            miniBadgeWrap.appendChild(cleanseBadge); // Append the actual badge
            pill.appendChild(miniBadgeWrap);
        }

        fragment.appendChild(pill);
    });
    return fragment;
}


/**
 * SECURELY creates the threat tag SPAN elements. Matches .tags-mini .tag
 * @param {Array} abilities - Array of ability objects.
 * @returns {DocumentFragment} A fragment containing all tag elements.
 */
function createThreatTags(abilities) {
    const fragment = document.createDocumentFragment();
    if (!abilities) return fragment;

    const union = Array.from(new Set(abilities.flatMap(a => a.threat || [])));
    // Sort by priority before rendering
    union.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));

    union.forEach(t => {
        const tag = document.createElement('span');
        // Match your CSS: .tags-mini .tag .hard etc.
        tag.className = `tag ${tagToClass(t)}`;
        tag.textContent = THREAT_LABEL[t] || t; // Secure text
        fragment.appendChild(tag);
    });
    return fragment;
}


// Your row group function remains the same conceptually
function renderGroupRow(label, cols = 8) { // Updated to 8 columns based on HTML
  const tr = document.createElement('tr');
  tr.className = 'row group-header'; // Add a class for potential specific styling
  tr.style.background = 'transparent';
  tr.style.border = '0';

  const td = document.createElement('td');
  td.colSpan = cols;
  td.style.color = 'var(--gold)';
  td.style.textTransform = 'uppercase';
  td.style.fontWeight = '700';
  td.style.padding = '10px 8px 2px 8px'; // Adjust padding
  td.textContent = label;

  tr.appendChild(td);
  return tr;
}

/**
 * SECURELY renders a single champion row in the table. Matches HTML/CSS.
 * @param {string} group - 'Enemy' or 'Ally'.
 * @param {object} champ - The champion data object.
 * @param {number} index - The index for removal purposes.
 * @returns {HTMLTableRowElement} The created table row element.
 */
function renderChampRow(group, champ, index) {
    if (!champ) return document.createElement('tr');

    const tr = document.createElement('tr');
    tr.className = 'row'; // Base row class from your CSS
    // Note: Your CSS doesn't use team-cell, directly styles tbody tr

    // 1. Group Cell (using existing classes)
    const tdGroup = document.createElement('td');
    tdGroup.className = 'group'; // Match your thead
    tdGroup.textContent = group; // Secure text ('Enemy' or 'Ally')
    tr.appendChild(tdGroup);

    // 2. Champion Cell (using existing classes)
    const tdChamp = document.createElement('td');
    tdChamp.className = 'champ'; // Match your thead
    const champCellDiv = document.createElement('div');
    champCellDiv.className = 'cell-champ'; // Match your CSS
    // Create image securely, use 'portrait-sm' class from your CSS
    const img = createPortraitImg(champ.portrait || champ.slug, champ.name, 'portrait-sm');
    // CSS handles size, border-radius etc.

    const nameDiv = document.createElement('div'); // Wrapper for name/title if needed by styling
    const nameSpan = document.createElement('span');
    // nameSpan.className = 'name'; // No specific class in your .cell-champ example
    nameSpan.textContent = champ.name; // Secure
    nameSpan.style.display = 'block'; // Make name appear above title potentially

    // Add title if it exists in data
    // const titleSpan = document.createElement('span');
    // titleSpan.className = 'title'; // If you add styling for title
    // titleSpan.textContent = champ.title || ""; // Secure

    nameDiv.appendChild(nameSpan);
    // nameDiv.appendChild(titleSpan);

    champCellDiv.appendChild(img);
    champCellDiv.appendChild(nameDiv);
    tdChamp.appendChild(champCellDiv);
    tr.appendChild(tdChamp);

    // 3. Role Cell (using existing classes)
    const tdRole = document.createElement('td');
    tdRole.className = 'role'; // Match your thead
    tdRole.textContent = (champ.tags || []).join(" • ") || "N/A"; // Secure
    tr.appendChild(tdRole);

    // 4. Passive Cell (using existing classes)
    const tdPassive = document.createElement('td');
    tdPassive.className = 'passive'; // Match your thead
    tdPassive.textContent = briefPassiveForADC(champ); // Use your helper, secure inside
    tr.appendChild(tdPassive);

    // 5. Abilities Cell (using existing classes)
    const tdAbilities = document.createElement('td');
    tdAbilities.className = 'abilities'; // Match your thead
    const abilitiesPillsDiv = document.createElement('div');
    abilitiesPillsDiv.className = 'ability-pills'; // Match your CSS
    abilitiesPillsDiv.appendChild(createAbilityPills(champ.abilities || [], champ)); // Use secure helper
    tdAbilities.appendChild(abilitiesPillsDiv);
    tr.appendChild(tdAbilities);

    // 6. Threats Cell (using existing classes)
    const tdThreats = document.createElement('td');
    tdThreats.className = 'threats'; // Match your thead
    const tagsMiniDiv = document.createElement('div');
    tagsMiniDiv.className = 'tags-mini'; // Match your CSS
    tagsMiniDiv.appendChild(createThreatTags(champ.abilities || [])); // Use secure helper
    tdThreats.appendChild(tagsMiniDiv);
    tr.appendChild(tdThreats);

    // 7. ADC Tip Cell (using existing classes)
    const tdNotes = document.createElement('td');
    tdNotes.className = 'notes'; // Match your thead
    const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
    const union = (champ.abilities || []).flatMap(a => a.threat || []);
    const adcNote = ov?.note || adcNoteFromTemplates(CURRENT_ADC, union); // Use your helper
    tdNotes.textContent = adcNote || "..."; // Secure text
    tr.appendChild(tdNotes);

    // 8. Support Synergy Cell (Using the TH from your HTML)
    const tdSupportSynergy = document.createElement('td');
    tdSupportSynergy.className = 'support-synergy notes'; // Use notes class for styling consistency, or add specific class
    if (CURRENT_ADC && typeof SUPPORT_TEMPLATES !== 'undefined') {
        const supportTemplate = SUPPORT_TEMPLATES[champ.name]; // Lookup by exact name
        const synergyTip = supportTemplate?.synergy?.[CURRENT_ADC];
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
  if (!tbody || !emptyState) {
      console.error("Table body or empty state element not found.");
      return;
  }

  tbody.innerHTML = ""; // Clear previous results

  // Collect selected champion slugs from the input datasets
  const enemyInputs = qsa("#enemyInputs .search input"); // Target the input element
  const allyInputs = qsa("#allyInputs .search input");   // Target the input element

  const selectedEnemySlugs = Array.from(enemyInputs)
      .map(input => input.dataset.selectedSlug)
      .filter(Boolean);

  const selectedAllySlugs = Array.from(allyInputs)
      .map(input => input.dataset.selectedSlug)
      .filter(Boolean);

  // Convert slugs back to champion objects
  const selectedEnemies = selectedEnemySlugs
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean);

  const selectedAllies = selectedAllySlugs
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean);

   // Update global state if needed elsewhere
   state.enemyChampions.fill(null);
   selectedEnemies.forEach((c, i) => { if (i < MAX_ENEMIES) state.enemyChampions[i] = c; });
   state.allyChampions.fill(null);
   selectedAllies.forEach((c, i) => { if (i < MAX_ALLIES) state.allyChampions[i] = c; });


  let hasContent = false;

  if (selectedEnemies.length > 0) {
      // tbody.appendChild(renderGroupRow("Enemy Team", 8)); // Use correct column count
      selectedEnemies.forEach((champ, index) => {
          // Pass index based on the original input slot if needed for removal,
          // otherwise pass index within the filtered list.
          // Let's find the original index for removal:
          const originalInputIndex = Array.from(enemyInputs).findIndex(input => input.dataset.selectedSlug === champ.slug);
          tbody.appendChild(renderChampRow("Enemy", champ, originalInputIndex !== -1 ? originalInputIndex : index)); // Pass index for removal
          hasContent = true;
      });
  }

  if (selectedAllies.length > 0) {
      // tbody.appendChild(renderGroupRow("Ally Team", 8)); // Use correct column count
      selectedAllies.forEach((champ, index) => {
           const originalInputIndex = Array.from(allyInputs).findIndex(input => input.dataset.selectedSlug === champ.slug);
          tbody.appendChild(renderChampRow("Ally", champ, originalInputIndex !== -1 ? originalInputIndex : index)); // Pass index for removal
          hasContent = true;
      });
  }

  // Toggle empty state visibility based on your HTML structure
  const tableWrap = qs('#tableWrap'); // Get the container
  if (tableWrap) {
        tableWrap.style.display = hasContent ? 'flex' : 'none'; // Show/hide table container
  }
   if (emptyState) {
        emptyState.style.display = hasContent ? 'none' : 'block'; // Show/hide empty state message
   }

   // Update macro section visibility (if the section exists)
    if (macroSection) {
        macroSection.classList.toggle('hidden', !CURRENT_ADC); // Your HTML uses 'hidden' class
    }
}

// Function to handle removing a champion - needs slight adjustment
function removeChampion(type, index) {
    const inputs = (type === 'enemy') ? qsa("#enemyInputs .search input") : qsa("#allyInputs .search input");
    if (inputs[index]) {
        inputs[index].value = ''; // Clear input text
        inputs[index].dataset.selectedSlug = ''; // Clear stored slug
        // Optionally clear the icon next to the input if you added one
        // const icon = inputs[index].previousElementSibling;
        // if (icon && icon.classList.contains('champ-input-icon')) {
        //     icon.style.visibility = 'hidden';
        //     icon.src = DUMMY_IMAGE_PATH;
        // }
        render(); // Re-render the table
        renderMacroSection(); // Update macro section
    }
}

// ============================================================================
// NEW: MACRO/SYNERGY SECTION RENDERING (SECURE - For your HTML if present)
// ============================================================================
/**
 * SECURELY renders the High-Elo macro tips and Support Synergies.
 * Checks if the relevant HTML elements exist.
 */
function renderMacroSection() {
    // Check if these elements exist in your final HTML
    const macroSectionEl = qs("#macroSection");
    const adcMacroCardEl = qs("#adcMacroCard");
    const supportSynergyCardEl = qs("#supportSynergyCard");
    const macroHeaderEl = qs("#macroHeader");

    if (!macroSectionEl || !adcMacroCardEl || !supportSynergyCardEl || !macroHeaderEl) {
        // console.warn("Macro section elements not found in HTML. Skipping macro render.");
        return; // Exit if the section isn't in the HTML
    }

    // Clear previous content securely
    adcMacroCardEl.innerHTML = '';
    supportSynergyCardEl.innerHTML = '';

    if (!CURRENT_ADC) {
        macroHeaderEl.textContent = 'High-Elo Macro & Synergy';
        macroSectionEl.classList.add('hidden'); // Hide if no ADC
        return;
    }

    macroHeaderEl.textContent = `${CURRENT_ADC} - Macro & Synergy`;
    macroSectionEl.classList.remove('hidden'); // Show if ADC selected

    // 1. Render ADC Macro Card
    if (typeof ADC_TEMPLATES !== 'undefined') {
        const normalizedKey = normalizeADCKey(CURRENT_ADC);
        const template = ADC_TEMPLATES[Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === normalizedKey)];

        if (template && template.macro) {
            adcMacroCardEl.appendChild(createMacroCard(
                "High-Elo Macro (KR/EUW)",
                template.macro,
                false // Not a list
            ));
        } else {
             const p = document.createElement('p');
             p.textContent = 'No macro tips available for this ADC.';
             adcMacroCardEl.appendChild(p);
             console.warn(`Macro tips not found for ADC: ${CURRENT_ADC}`);
        }
    } else {
        console.warn("ADC_TEMPLATES is not defined.");
        const p = document.createElement('p');
        p.textContent = 'Error: ADC Templates not loaded.';
        adcMacroCardEl.appendChild(p);
    }

    // 2. Render Support Synergy Card
    if (typeof SUPPORT_TEMPLATES !== 'undefined') {
        const synergies = getSynergiesForADC(CURRENT_ADC);
        if (Object.keys(synergies).length > 0) {
            supportSynergyCardEl.appendChild(createMacroCard(
                "Potential Support Synergies",
                synergies,
                true // Render as a list using .tip-card structure
            ));
        } else {
             const p = document.createElement('p');
             p.textContent = 'No specific support synergy tips found.';
             supportSynergyCardEl.appendChild(p);
        }
    } else {
        console.warn("SUPPORT_TEMPLATES is not defined.");
         const p = document.createElement('p');
         p.textContent = 'Error: Support Templates not loaded.';
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
    h3.className = 'section-title'; // Use your CSS class
    // Add specific class if needed for good/bad synergy titles
    // if (title.includes("Good")) h3.classList.add('good');
    // if (title.includes("Avoid")) h3.classList.add('bad');
    h3.textContent = title;
    fragment.appendChild(h3);

    if (isList) {
        // Render as a list of tip cards (matching your .tip-card CSS)
        const gridDiv = document.createElement('div');
        gridDiv.className = 'support-tips-grid'; // Use your CSS class

        for (const [key, value] of Object.entries(data)) {
            const card = document.createElement('div');
            card.className = 'tip-card'; // Use your CSS class

            // Find champion data to get portrait slug
            const supportChamp = CHAMPIONS.find(c => c.name === key);
            if (supportChamp) {
                 // Use secure function, provide empty class if styling is from .tip-card img
                 const img = createPortraitImg(supportChamp.portrait || supportChamp.slug, key, '');
                 // Let CSS handle size: width: 40px; height: 40px; border-radius: 4px;
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
        // Render macro tips as paragraphs inside the card
        for (const [key, value] of Object.entries(data)) {
            const p = document.createElement('p');
            // Re-use .tip-card-content styling for consistency?
             p.className = 'tip-card-content'; // Optional: Reuse class for styling
             p.style.alignItems = 'flex-start'; // Adjust alignment if needed

            const strong = document.createElement('strong');
            strong.style.color = 'var(--gold)'; // Highlight the concept
            strong.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ": ";
            p.appendChild(strong);
            p.appendChild(document.createElement('br')); // New line after title
            p.appendChild(document.createTextNode(value)); // Append tip text securely
            fragment.appendChild(p);
        }
    }
    return fragment;
}

/**
 * Helper function to get all support synergies for a given ADC.
 * Assumes SUPPORT_TEMPLATES is loaded.
 */
function getSynergiesForADC(adcName) {
    const synergies = {};
    if (typeof SUPPORT_TEMPLATES === 'undefined' || !adcName) {
        return synergies;
    }
    for (const [supportName, template] of Object.entries(SUPPORT_TEMPLATES)) {
        // Use the selected ADC name directly as the key in the support's synergy object
        if (template.synergy && template.synergy[adcName]) {
            synergies[supportName] = template.synergy[adcName];
        }
    }
    // Sort synergies alphabetically by support name for consistent display
    return Object.fromEntries(
       Object.entries(synergies).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );
}

// ============================================================================
// INITIALIZATION & EVENT LISTENERS SETUP (Matches your HTML)
// ============================================================================

/**
 * Initializes the application. Loads data, builds UI components, sets listeners.
 */
async function initializeApp() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP error loading ${DATA_URL}! status: ${response.status}`);
        CHAMPIONS = await response.json();
        ensureThreatsForAllAbilities(CHAMPIONS); // Tag threats

        // --- DOM Ready ---
        buildAdcGrid(); // Build ADC selector
        buildSearchInputs(); // Build enemy/ally search inputs
        setupGlobalEventListeners(); // Setup compact mode, import/export, editor modal
        lockTeamUI(true); // Lock search inputs until ADC is selected
        render(); // Initial render (shows empty state)
        // renderMacroSection(); // Render macro section (will be hidden initially)

        // Add listener for your build button if it's meant to be functional client-side
        qs('#buildCDragon')?.addEventListener('click', handleBuildCDragonClick);


    } catch (e) {
        console.error("Initialization failed:", e);
        showError(`Could not load champion data (${DATA_URL}). Please check network connection or file path.`);
        const mainContent = qs('main.viewport-fit');
        if (mainContent) {
            mainContent.innerHTML = `<div class="empty" style="padding: 40px; text-align: center; color: var(--muted);"><p><strong>Error loading application data.</strong></p><p>${e.message}</p><p>Please refresh the page or check the console.</p></div>`;
        }
    }
}

// Separate function for global listeners (matches your HTML)
function setupGlobalEventListeners() {
    // Compact Mode Toggle (using your #toggleCompact ID)
    const compactToggle = qs('#toggleCompact');
    if (compactToggle) {
        compactToggle.addEventListener('change', e => {
            // Your CSS uses body.compact-mode
            document.body.classList.toggle('compact-mode', e.target.checked);
        });
    }

    // Import/Export Buttons (using your IDs)
    qs('#exportData')?.addEventListener('click', exportData);
    qs('#importData')?.addEventListener('click', () => {
        qs('#importFile')?.click(); // Trigger hidden file input
    });
    qs('#importFile')?.addEventListener('change', handleImport);

    // Editor Modal Buttons (using your IDs)
    const editorModal = qs('#editorModal');
    if (editorModal) {
        qs('#openEditor')?.addEventListener('click', () => {
             // Load current CHAMPIONS data into textarea before showing
             const editorArea = qs('#editorArea');
             if(editorArea) {
                  editorArea.value = JSON.stringify(CHAMPIONS, null, 2); // Pretty print JSON
             }
             editorModal.showModal();
        });
        qs('#saveEditor')?.addEventListener('click', handleSaveEditor);
        // Close button is handled by form method="dialog" or you can add specific listener
         editorModal.addEventListener('close', () => {
              // Handle modal close if needed (e.g., check returnValue)
              console.log('Editor closed with value:', editorModal.returnValue);
         });
    }

}

// Handler for Save button in editor modal
function handleSaveEditor() {
     const editorArea = qs('#editorArea');
     const editorModal = qs('#editorModal');
     if (!editorArea || !editorModal) return;

     try {
          const newData = JSON.parse(editorArea.value);
          if (Array.isArray(newData)) {
               CHAMPIONS = newData; // Update the global CHAMPIONS array
               ensureThreatsForAllAbilities(CHAMPIONS); // Re-tag threats
               // Re-build ADC grid and clear inputs as data changed significantly
               buildAdcGrid();
               buildSearchInputs(); // Rebuild to clear old selections
               CURRENT_ADC = null; // Reset selected ADC
               lockTeamUI(true); // Re-lock inputs
               render(); // Re-render table (will be empty)
               renderMacroSection(); // Re-render macro section (will be hidden)
               console.log("Champion data updated from editor.");
               // editorModal.close('saved'); // Close modal, handled by form submission maybe?
          } else {
               throw new Error("Pasted data is not a valid JSON array.");
          }
     } catch (e) {
          showError(`Invalid JSON data: ${e.message}`);
          console.error("JSON parsing error:", e);
          // Prevent modal from closing on error if needed
          // editorModal.returnValue = 'error'; // Set a return value to check on close
     }
}


// Placeholder for your CDragon build button click handler
// This likely needs the code from build-from-cdragon.js integrated or called
function handleBuildCDragonClick() {
    console.log("Build CDragon button clicked.");
    // Check if the build logic is intended to run client-side
    if (typeof buildFromCDragon === 'function') {
        buildFromCDragon(qs('#buildCDragon')); // Pass the button element if needed by the function
    } else {
        showError("Build function not available. Ensure build-from-cdragon.js is loaded correctly and exposes the function.");
    }
}


// ============================================================================
// IMPORT / EXPORT / UTILITIES (Adapted for your state/UI)
// ============================================================================
function showError(message) {
    console.error(message);
    // TODO: Replace alert with a more user-friendly modal or toast notification
    alert(message);
}

// Export function remains largely the same, uses CURRENT_ADC
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
        // ... (rest of export logic: blob, url, download link) ...
         const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = 'adc-threat-export.json';
         document.body.appendChild(a); // Append link to body temporarily
         a.click();
         document.body.removeChild(a); // Clean up link
         URL.revokeObjectURL(url);

    } catch (err) {
        showError('Error exporting data');
        console.error(err);
    }
}

// Import function adapted for your UI structure
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
             // You don't seem to have input icons in this HTML version, so no need to reset them.
        });
         lockTeamUI(true); // Lock until ADC is processed


        // --- Load imported data ---
        if (data.selectedADC) {
            // Find the ADC button element
            const adcCard = qs(`#adcGrid .adc-card[data-adc="${data.selectedADC}"]`);
            if (adcCard) {
                 // Simulate a click on the card to select the ADC
                 adcCard.click(); // This will set CURRENT_ADC, unlock UI, and trigger render via the click handler
            } else {
                 showError(`Imported ADC "${data.selectedADC}" not found.`);
                 lockTeamUI(true); // Keep locked
            }
        } else {
             lockTeamUI(true); // Keep locked if no ADC
        }

         // Need a slight delay to ensure CURRENT_ADC is set before populating teams if adcCard.click() is async
         // Or, set CURRENT_ADC manually and unlock here if click handler isn't fully reliable for this flow
         // Manual setting approach:
         /*
         if (data.selectedADC) {
            const adcCard = qs(`#adcGrid .adc-card[data-adc="${data.selectedADC}"]`);
            if (adcCard) {
                CURRENT_ADC = data.selectedADC; // Set manually
                adcCard.classList.add('selected'); // Visually select
                await loadOverridesFor(CURRENT_ADC); // Load overrides
                lockTeamUI(false); // Unlock manually
            } else { ... error handling ... }
         } else { lockTeamUI(true); }
         */

        // Populate enemies - find inputs and set values/datasets
        const enemyInputs = qsa("#enemyInputs .search input");
        if (data.enemies && Array.isArray(data.enemies)) {
            data.enemies.slice(0, MAX_ENEMIES).forEach((slug, index) => {
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && enemyInputs[index]) {
                    enemyInputs[index].value = champ.name;
                    enemyInputs[index].dataset.selectedSlug = champ.slug;
                    // No input icon to update in this HTML version
                }
            });
        }

        // Populate allies - find inputs and set values/datasets
        const allyInputs = qsa("#allyInputs .search input");
        if (data.allies && Array.isArray(data.allies)) {
            data.allies.slice(0, MAX_ALLIES).forEach((slug, index) => {
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && allyInputs[index]) {
                    allyInputs[index].value = champ.name;
                    allyInputs[index].dataset.selectedSlug = champ.slug;
                    // No input icon to update in this HTML version
                }
            });
        }

        render(); // Re-render the table AFTER populating inputs
        renderMacroSection(); // Re-render the macro section AFTER potentially setting ADC

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
