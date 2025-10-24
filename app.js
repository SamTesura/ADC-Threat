/* ADC Threat Lookup — 25.20
   (MODIFIED to integrate High-Elo Data & Security Fixes)
   - Integrates expanded adc-templates.js and support-tips.js
   - Replaces innerHTML assignments with secure DOM methods (createElement, textContent)
   - Adds rendering for #macroSection
   - Preserves original structure, CSS compatibility, and logic
*/
'use strict'; // Keep strict mode

// ============================================================================
// CONFIGURATION & CONSTANTS (Mostly unchanged)
// ============================================================================
const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "champions-summary.json";

// Fallback image in case DDragon link fails - Using Aatrox as a default example
const DUMMY_IMAGE_PATH = `http://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/Aatrox.png`;

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
let ADC_OVERRIDES = null; // Still keeping your override logic structure

// Your override functions remain the same
async function loadOverridesFor(_adcName){
  ADC_OVERRIDES = null; // no fetch = no 404 noise
}
function getOverrideEntryForChampion(_slugOrName){
  return null; // no per-champ override by default
}

// Your normalization function
function normalizeADCKey(name=""){
  // Fixed potential issue with null/undefined input
  return String(name || "").replace(/['’\s.-]/g,"").toLowerCase(); 
}

// ============================================================================
// HELPERS (Mostly unchanged, adapted for security)
// ============================================================================
const qs = (s,el=document)=>el.querySelector(s);
const qsa = (s,el=document)=>el.querySelectorAll(s); // Added querySelectorAll helper

function ddragonPortraitURL(slug){ // Renamed slightly for clarity
    // Handle specific champion name inconsistencies for DDragon URLs if needed
    if (slug === "Kaisa") slug = "KaiSa"; // DDragon uses KaiSa with capital S
    if (slug === "Wukong") slug = "MonkeyKing"; // DDragon uses MonkeyKing
    // Add other known inconsistencies here...
    return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`;
}

const safeSlug = s => String(s||"").replace(/[^A-Za-z0-9]/g,"");

function primaryThreat(threats=[]){ 
  if (!threats) return null; // Added null check
  for(const t of PRIORITY){ if(threats.includes(t)) return t; } return null; 
}
function primaryThreatClass(threats=[]){ const t = primaryThreat(threats); return t ? THREAT_CLASS[t] : ""; }
function tagToClass(t){ return THREAT_CLASS[t] || ""; }

/**
 * SECURELY Creates an <img> element for portraits with fallback.
 * @param {string} slugOrName - Champion slug or name (e.g., "MissFortune", "KaiSa").
 * @param {string} alt - Alt text for the image.
 * @param {string} [cssClass='portrait-sm'] - CSS class for the image.
 * @returns {HTMLImageElement} The created image element.
 */
function createPortraitImg(slugOrName, alt = "", cssClass = 'portrait-sm') {
    const slug = String(slugOrName || "").replace(/\s+/g, "");
    const lower = slug.toLowerCase();
    const ddUrl = ddragonPortraitURL(slug); // Use the helper to handle name inconsistencies
    const cdnFallback = `https://cdn.communitydragon.org/latest/champion/${lower}/square`;

    const img = document.createElement('img');
    img.className = cssClass;
    img.src = ddUrl;
    img.alt = alt || slug;
    img.loading = 'lazy';

    // Set up the fallback directly on the element
    img.onerror = function() {
        // Prevent infinite loops if the fallback also fails
        if (this.src !== cdnFallback) {
            console.warn(`DDragon image failed for ${slug}, falling back to Cdragon: ${cdnFallback}`);
            this.src = cdnFallback;
        } else {
             console.error(`Both DDragon and Cdragon images failed for ${slug}.`);
             // Optionally set a final, generic placeholder image here
             // this.src = 'path/to/generic-placeholder.png';
        }
        // Remove the onerror handler after the first attempt to prevent loops
        this.onerror = null;
    };

    return img;
}

// Your image fallback observer remains unchanged
(function initImageFallbackObserver(){
  // This logic is complex and seems specific to handling potential 404s
  // in your existing setup. We'll keep it as is, assuming it works correctly
  // with how images are added to the DOM.
  const setFallback = img => {
    if (img.dataset._fallbackBound) return;
    img.dataset._fallbackBound = "1";
    img.addEventListener("error", function onErr(){
      img.removeEventListener("error", onErr);
      const current = img.getAttribute("src") || "";
      const m = current.match(/\/img\/champion\/([^./]+)\.png/); // Matches DDragon URL pattern
      const raw = m ? m[1] : "";
      const sanitized = safeSlug(raw); // Basic sanitization

      // Try CommunityDragon as the next fallback
      const cdnFallback = `https://cdn.communitydragon.org/latest/champion/${sanitized.toLowerCase()}/square`;

      if (sanitized && img.src !== cdnFallback) {
          console.warn(`DDragon image failed for ${raw}, trying Cdragon fallback: ${cdnFallback}`);
          img.src = cdnFallback; // Use Cdragon square image
          // Remove this specific error handler, but keep a general one?
          // Or maybe only trigger fallback once.
           img.onerror = function() { // Final fallback if Cdragon also fails
                console.error(`Cdragon fallback also failed for ${sanitized}. Using dummy image.`);
                img.src = DUMMY_IMAGE_PATH; // Use a known good dummy image
                img.onerror = null; // Prevent further errors
           }
      } else if (!sanitized) {
           console.error(`Could not extract champion name from failed image src: ${current}`);
           img.src = DUMMY_IMAGE_PATH; // Use dummy image if name extraction fails
           img.onerror = null;
      } else {
           // If src is already the fallback, just use the dummy path
           console.error(`Cdragon fallback failed for ${sanitized}. Using dummy image.`);
           img.src = DUMMY_IMAGE_PATH;
           img.onerror = null;
      }
    });
  };

  // Observe dynamically added images
  const root = document.body;
  // Apply to initially present images (if any)
   root.querySelectorAll("#adcGrid img, #resultsBody img").forEach(setFallback);

  new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(node=>{
        if (node.nodeType===1){ // Check if it's an element node
          if (node.matches && node.matches("img")) setFallback(node); // Check the node itself
          // Check children if the added node is a container
          if (node.querySelectorAll) {
             node.querySelectorAll("img").forEach(setFallback);
          }
        }
      });
    });
  }).observe(root, {subtree:true, childList:true});
})();


// Your ADC list constant remains the same
const ADC_IDS = [
  "Ashe","Caitlyn","Corki","Draven","Ezreal","Jhin","Jinx",
  "Kaisa", // Corrected slug
  "Kalista","KogMaw","Lucian","MissFortune","Nilah","Quinn",
  "Samira","Senna","Sivir",
  "Tristana","Twitch","Varus","Vayne","Xayah","Zeri","Aphelios",
  "Yunara", "Smolder", // Assuming Yunara is custom/intended
];

// Your Regex tagger and ensureThreats function remain the same
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
    if (!ch.abilities) continue; // Skip if no abilities array
    for(const ab of ch.abilities){
      const txt = `${ab.name||""} ${ab.key||""} ${ab.notes||""}`.toLowerCase();
      const tags = new Set(ab.threat || []); // Start with existing tags if any
      if (RX.air.test(txt)) tags.add(THREAT.HARD_CC);
      if (RX.stun.test(txt)||RX.root.test(txt)||RX.charm.test(txt)||RX.taunt.test(txt)||
          RX.fear.test(txt)||RX.sleep.test(txt)||RX.silence.test(txt)||RX.polymorph.test(txt)) tags.add(THREAT.HARD_CC); // Treat most of these as Hard CC for simplicity in ADC context
      if (RX.slow.test(txt)||RX.blind.test(txt)||RX.grounded.test(txt)) tags.add(THREAT.SOFT_CC);
      if (RX.shield.test(txt)) tags.add(THREAT.SHIELD_PEEL);
      if (RX.gap.test(txt))    tags.add(THREAT.GAP_CLOSE);
      if (RX.burst.test(txt))  tags.add(THREAT.BURST);
      if (RX.zone.test(txt))   tags.add(THREAT.POKE_ZONE);

      // Default tag if none found
      if (tags.size === 0 && ab.key) { // Ensure key exists
         tags.add(ab.key === "R" ? THREAT.BURST : THREAT.POKE_ZONE);
      }
      ab.threat = Array.from(tags);
    }
  }
}


// Your PASSIVE_OVERRIDES remain the same
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
  "FiddleSticks":"Fear chain & big R—ward deep; don’t fight in fog.", // Corrected name
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
  "Kaisa":"Has safety with R—punish when E/R down.", // Corrected name
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
  "KogMaw":"On-death bomb—don’t stand on corpse.", // Corrected name
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
  "MissFortune":"Channel R—interrupt or break LOS.", // Corrected name
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
  "Nunu":"Snowball CC—see it early; sidestep charge.", // Corrected name: Nunu & Willump -> Nunu
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
  "RekSai":"Unburrow knockup—pink tunnels; don’t path near burrow.", // Corrected name
  "Rell":"Hard engage + peel—beware W crash and R drag.",
  "Renata Glasc":"Saves with W and flips fights with R—spread out.", // Corrected name
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
  "TahmKench":"Devour saves/peels—bait it out before engaging.", // Corrected name
  "Taliyah":"Wall and throw—don’t dash through mines.",
  "Talon":"Flanks from walls—guard sides; don’t step on blades.",
  "Taric":"Invuln ults—stall fights through R.",
  "Teemo":"Shroom fields—control wards on paths; avoid blind all-ins.",
  "Thresh":"Hook + box threat—don’t hug walls; deny lantern.",
  "Tristana":"All-in resets—save peel for jump; don’t stack for R.",
  "Trundle":"Pillar splits fights—don’t fight in chokes.",
  "Tryndamere":"Undying—kite R; don’t burn sums too early.",
  "TwistedFate":"Global pick—track MIA; respect gold card.", // Corrected name
  "Twitch":"Stealth flanks—pink flanks; don’t group for spray.",
  "Udyr":"Point-click stun—peel him off backline.",
  "Urgot":"Execute fear—keep HP healthy; don’t get E’d.",
  "Varus":"Root chain—don’t clump; watch R angles.",
  "Vayne":"Condemn threat—avoid walls; punish Q on CD.",
  "Veigar":"Cage control—don’t cross walls; burst threat at low MR.",
  "Velkoz":"True-damage beam—interrupt R or break LOS.", // Corrected name
  "Vex":"Punishes dashes—don’t feed resets; spread out.",
  "Vi":"Point-click engage—track Q/R and Flash.",
  "Viego":"Resets snowball—focus first kill target.",
  "Viktor":"Zone control—don’t stand in W; dodge E lines.",
  "Vladimir":"Untargetable pool—don’t waste CC; watch burst timings.",
  "Volibear":"Tower disable dive—respect R; kite Q stun.",
  "Warwick":"Heals hard below 50% and senses low HP—don’t duel when low; save peel for R.",
  "MonkeyKing":"Stealth clone baits spells—track clone and double knockup threat.", // Keep DDragon name for lookup
  "Wukong":"Stealth clone baits spells—track clone and double knockup threat.", // User-facing name override
  "Xayah":"Feathers arm a root—don’t stand in feather lines; R is self-peel.",
  "Xerath":"Long range poke + single-line stun—don’t line up; juke E first.",
  "XinZhao":"3rd-hit knockup + anti-range ult—kite out R zone or disengage.", // Corrected name
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

// Your ADC_TEMPLATES need to be defined (assuming they are in adc-templates.js)
// Make sure ADC_TEMPLATES uses the correct keys (e.g., "Kaisa", "MissFortune")

// Your template lookup functions remain the same
function abilityTipFromTemplates(adcName, threats){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined') return ""; // Add checks
  const k = normalizeADCKey(adcName);
  const template = ADC_TEMPLATES[Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k)];
  if(!template) return "";
  const prim = primaryThreat(threats||[]);
  return prim ? template[prim] : "";
}

function abilityTipForADC(champ, abilityKey){
  if (!CURRENT_ADC) return ""; // Add check
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  if (ov?.abilities?.[abilityKey]?.adcTip) return ov.abilities[abilityKey].adcTip;
  const ability = (champ.abilities||[]).find(a=>a.key===abilityKey) || {};
  return abilityTipFromTemplates(CURRENT_ADC, ability.threat||[]);
}

function adcNoteFromTemplates(adcName, threatsUnion){
  if (!adcName || typeof ADC_TEMPLATES === 'undefined' || !threatsUnion) return ""; // Add checks
  const k = normalizeADCKey(adcName);
  const template = ADC_TEMPLATES[Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === k)];
  if(!template) return "";
  for(const key of PRIORITY){ if(threatsUnion.includes(key)) return template[key]; }
  return "";
}

// Your passive lookup function remains the same
function briefPassiveForADC(champ){
  if (!champ) return "—"; // Add check
  // Try your specific override first
  const override = PASSIVE_OVERRIDES[champ.slug || champ.name];
  if (override) return override;

  // Fallback to the passive data from JSON
  if (champ.passive && (champ.passive.name || champ.passive.desc)){
    const desc = (champ.passive.desc || champ.passive.name || "").replace(/\s+/g," ").trim(); // Prioritize desc, fallback to name
    return (desc.length > 150 ? desc.slice(0, 147) + "…" : desc) || "—"; // Shorter trim
  }
  return "—"; // Default fallback
}

// ============================================================================
// ADC PICKER (SECURELY REWRITTEN)
// ============================================================================
function buildAdcGrid(){
  const grid = qs("#adcGrid");
  if (!grid) return; // Add check
  grid.innerHTML = ""; // Clear existing (safe here as we rebuild entirely)

  const lookup = new Map(CHAMPIONS.map(c=>[c.slug||c.name, c]));

  // Use the updated ADC_LIST which now contains DDragon URLs
  if (typeof ADC_LIST === 'undefined') {
       console.error("ADC_LIST is not defined. Cannot build ADC grid.");
       return;
   }

  ADC_LIST.forEach(adcInfo => {
      const champ = lookup.get(adcInfo.name) || { name: adcInfo.name, portrait: adcInfo.name, slug: adcInfo.name }; // Basic fallback

      const card = document.createElement('button');
      card.className = 'adc-card'; // Match your CSS
      card.dataset.adc = champ.name;

      const img = createPortraitImg(champ.portrait || champ.slug, champ.name); // Use secure function
      // Assuming your CSS handles the image sizing within .adc-card

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
    qsa("#adcGrid .adc-card").forEach(el=>el.classList.toggle("selected", el===card));
    await loadOverridesFor(CURRENT_ADC);
    lockTeamUI(false);
    render(); // Re-render table and macro section
    renderMacroSection(); // Explicitly call to update tips
  });
}

// Your lockTeamUI function remains the same
function lockTeamUI(locked){
  const main = document.querySelector("main"); // Assuming 'main' is the correct container
   if (!main) return;
  main.classList.toggle("lock-active", locked); // Use a class to indicate locked state

  // This overlay seems missing in your HTML, but keeping the logic
  const lockWrap = qs("#lockOverlay");
  if (lockWrap) {
     lockWrap.classList.toggle("lock-overlay", locked);
     lockWrap.style.display = locked ? 'flex' : 'none'; // Basic show/hide
  }

  qsa(".search input").forEach(inp=>inp.disabled = locked); // Use your .search class
}

// ============================================================================
// SEARCH INPUTS (SECURELY REWRITTEN)
// ============================================================================
function makeSearchCell(team){
  const wrap = document.createElement("div");
  wrap.className = "input-wrap"; // Use class from your CSS

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `${team==='enemy'?'Enemy':'Ally'} champion...`;
  input.autocomplete = "off";
  input.className = "champ-input"; // Use class from your CSS

  const icon = document.createElement('img');
  icon.className = 'champ-input-icon'; // Use class from your CSS
  icon.src = DUMMY_IMAGE_PATH; // Start with a placeholder
  icon.style.visibility = 'hidden'; // Hide until a champ is selected or typed

  const sug = document.createElement("div");
  sug.className = "suggestions-list"; // Use class from your CSS
  sug.style.display = 'none'; // Hide initially

  wrap.appendChild(icon); // Icon first visually based on padding
  wrap.appendChild(input);
  wrap.appendChild(sug);

  let currentSelectionIndex = -1; // For keyboard navigation

  input.addEventListener("input",()=>{
    if(!CURRENT_ADC){ input.value = ''; return; } // Prevent input if no ADC selected
    const v = input.value.trim().toLowerCase();
    icon.style.visibility = 'hidden'; // Hide icon while typing

    if(!v){
      sug.style.display = 'none';
      sug.innerHTML="";
      currentSelectionIndex = -1;
      return;
    }

    const options = CHAMPIONS
      .filter(c=>c.name?.toLowerCase().includes(v)||c.slug?.toLowerCase().includes(v))
      .slice(0, 7); // Limit suggestions

    sug.innerHTML = ""; // Clear previous suggestions
    options.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = 'suggestion-item'; // Use class from your CSS
        btn.dataset.name = c.name;
        btn.dataset.slug = c.slug; // Store slug too
        btn.dataset.index = index;

        const img = createPortraitImg(c.portrait || c.slug, c.name); // Secure image
        img.style.width = '32px'; // Match your CSS if needed
        img.style.height = '32px';
        img.style.borderRadius = '4px';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = c.name; // Secure text

        btn.appendChild(img);
        btn.appendChild(nameSpan);

        btn.addEventListener('click', () => selectSuggestion(c));
        sug.appendChild(btn);
    });

    if (options.length > 0) {
      sug.style.display = 'block';
      currentSelectionIndex = -1; // Reset keyboard nav index
    } else {
      sug.style.display = 'none';
    }
  });

  // Keyboard navigation for suggestions
  input.addEventListener("keydown",(e)=>{
      const items = qsa('.suggestion-item', sug);
      if (items.length === 0 || sug.style.display === 'none') return;

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
              items[currentSelectionIndex].click(); // Simulate click on highlighted item
          } else if (items.length > 0) {
               // If nothing highlighted, select the first one
               items[0].click();
          }
           sug.style.display = 'none'; // Hide after selection
           input.blur(); // Remove focus
      } else if (e.key === "Escape") {
           sug.style.display = 'none'; // Hide on escape
           currentSelectionIndex = -1;
      }
  });

   // Close suggestions on clicking outside
   document.addEventListener('click', (e) => {
       if (!wrap.contains(e.target)) {
           sug.style.display = 'none';
           currentSelectionIndex = -1;
       }
   });

  function selectSuggestion(champion) {
      input.value = champion.name; // Set input value
      sug.style.display = 'none'; // Hide suggestions
      sug.innerHTML = "";
      currentSelectionIndex = -1;

      // Update the icon next to the input
      icon.src = ddragonPortraitURL(champion.portrait || champion.slug);
      icon.style.visibility = 'visible';
      icon.onerror = () => { // Basic fallback for the input icon itself
          icon.src = DUMMY_IMAGE_PATH;
      };

      // Find the champion object (important for render function)
      const champObj = CHAMPIONS.find(c => c.slug === champion.slug);
      if (champObj) {
           // Store the selected champion slug or identifier somewhere accessible
           // by the render() function. This depends on how your render logic
           // collects the selected champions. Let's assume input dataset for now.
           input.dataset.selectedSlug = champObj.slug;
           render(); // Trigger re-render
           renderMacroSection(); // Also update macro section
      } else {
           console.error("Selected champion not found in master list:", champion.name);
      }
  }

  function updateSuggestionHighlight(items, index) {
      items.forEach((item, i) => {
          item.classList.toggle('selected', i === index); // Use your CSS 'selected' class
      });
  }

  return {wrap, input};
}

function buildSearchInputs(){
  const enemyInputsEl = qs("#enemyInputs");
  const allyInputsEl = qs("#allyInputs");
   if (!enemyInputsEl || !allyInputsEl) return;

   enemyInputsEl.innerHTML = ''; // Clear placeholders
   allyInputsEl.innerHTML = '';

  const enemySlots = Array.from({length: MAX_ENEMIES}, ()=>makeSearchCell("enemy"));
  const allySlots = Array.from({length: MAX_ALLIES}, ()=>makeSearchCell("ally"));

  enemySlots.forEach(s=>enemyInputsEl.appendChild(s.wrap));
  allySlots.forEach(s=>allyInputsEl.appendChild(s.wrap));
}

// ============================================================================
// RENDERING (SECURELY REWRITTEN & INTEGRATED)
// ============================================================================
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");
const macroSection = qs("#macroSection"); // Cache macro section
const adcMacroCard = qs("#adcMacroCard");
const supportSynergyCard = qs("#supportSynergyCard");
const macroHeader = qs("#macroHeader");

/**
 * SECURELY creates the cleanse badge SPAN element.
 * @param {object} ability - The ability object.
 * @returns {HTMLSpanElement | null} The badge element or null.
 */
function createCleanseBadge(ability) {
    const t = ability.threat || [];
    if (t.includes(THREAT.SOFT_CC) || t.includes(THREAT.HARD_CC)) { // Show for Hard CC too, as per your CSS example
        const badge = document.createElement('span');
        badge.className = 'badge cleanse'; // Match your CSS
        badge.textContent = 'Cleanse'; // Secure text
        return badge;
    }
    return null;
}


/**
 * SECURELY creates the ability pills SPAN elements.
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
        pill.className = `pill ${cls}`; // Use class from your CSS

        const tip = abilityTipForADC(champ, a.key);
        if (tip) {
            pill.title = tip; // Tooltip for the specific tip
        }

        const key = document.createElement('b');
        key.textContent = a.key; // Secure text
        pill.appendChild(key);

        const cds = document.createElement('span');
        cds.className = 'cds'; // Use class from your CSS
        cds.textContent = (a.cd || []).join("/") || "—"; // Secure text
        pill.appendChild(cds);

        // Your original code had tlabel span, let's keep it if needed by CSS
        const prim = primaryThreat(a.threat || []);
        const labelText = prim ? THREAT_LABEL[prim] : "";
        if (labelText) {
            const tLabel = document.createElement('span');
            tLabel.className = 'tlabel'; // Use class from your CSS
            tLabel.textContent = labelText; // Secure text
            // Maybe hide this visually if pills are just color-coded?
            // tLabel.style.display = 'none';
             pill.appendChild(tLabel);
        }

        const cleanseBadge = createCleanseBadge(a);
        if (cleanseBadge) {
            pill.appendChild(cleanseBadge);
        }

        fragment.appendChild(pill);
    });
    return fragment;
}

/**
 * SECURELY creates the threat tag SPAN elements.
 * @param {Array} abilities - Array of ability objects.
 * @returns {DocumentFragment} A fragment containing all tag elements.
 */
function createThreatTags(abilities) {
    const fragment = document.createDocumentFragment();
    if (!abilities) return fragment;

    const union = Array.from(new Set(abilities.flatMap(a => a.threat || [])));
    union.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b)); // Sort by priority

    union.forEach(t => {
        const tag = document.createElement('span');
        tag.className = `badge ${tagToClass(t)}`; // Use .badge class from your CSS
        tag.textContent = THREAT_LABEL[t] || t; // Secure text
        fragment.appendChild(tag);
    });
    return fragment;
}


// Your row group function remains the same conceptually
function renderGroupRow(label, cols = 8) { // Adjusted cols to 8 based on your HTML thead
  const tr = document.createElement('tr');
  tr.className = 'row'; // Assuming this class is styled
  tr.style.background = 'transparent';
  tr.style.border = '0';

  const td = document.createElement('td');
  td.colSpan = cols;
  td.style.color = 'var(--gold)'; // Match inline style from original
  td.style.textTransform = 'uppercase';
  td.style.fontWeight = '700';
  td.style.padding = '2px 6px';
  td.textContent = label; // Secure text

  tr.appendChild(td);
  return tr;
}

/**
 * SECURELY renders a single champion row in the table.
 * @param {string} group - 'Enemy' or 'Ally'.
 * @param {object} champ - The champion data object.
 * @param {number} index - The index for removal purposes.
 * @returns {HTMLTableRowElement} The created table row element.
 */
function renderChampRow(group, champ, index) {
    if (!champ) return document.createElement('tr'); // Return empty row if no champ data

    const tr = document.createElement('tr');
    tr.className = `row team-cell ${group.toLowerCase()}`; // Match your CSS

    // 1. Setup Cell (using existing classes)
    const tdSetup = document.createElement('td');
    tdSetup.className = 'setup'; // Match your thead
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'btn btn-ghost'; // Use button classes
    removeBtn.title = `Remove ${champ.name}`;
    removeBtn.style.padding = "2px 6px";
    removeBtn.style.lineHeight = "1.2";
    // Decide which list to modify based on group
    removeBtn.addEventListener('click', () => removeChampion(group.toLowerCase(), index));
    tdSetup.appendChild(removeBtn);
    tr.appendChild(tdSetup);

    // 2. Champion Cell (using existing classes)
    const tdChamp = document.createElement('td');
    tdChamp.className = 'champ'; // Match your thead
    const champCellDiv = document.createElement('div');
    champCellDiv.className = 'champ-cell'; // Match your CSS
    const img = createPortraitImg(champ.portrait || champ.slug, champ.name); // Secure image
    img.style.width = '48px'; // Assuming size from CSS
    img.style.height = '48px';

    const nameDiv = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = champ.name; // Secure
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = champ.title || "the Champion"; // Secure
    nameDiv.appendChild(nameSpan);
    nameDiv.appendChild(titleSpan);

    champCellDiv.appendChild(img);
    champCellDiv.appendChild(nameDiv);
    tdChamp.appendChild(champCellDiv);
    tr.appendChild(tdChamp);

    // 3. Role Cell (using existing classes)
    const tdRole = document.createElement('td');
    tdRole.className = 'role role-cell'; // Match your thead and CSS
    tdRole.textContent = (champ.tags || []).join(" • ") || "N/A"; // Secure
    tr.appendChild(tdRole);

    // 4. Passive Cell (using existing classes)
    const tdPassive = document.createElement('td');
    tdPassive.className = 'passive passive-cell'; // Match your thead and CSS
    const passiveNameDiv = document.createElement('div');
    passiveNameDiv.className = 'name'; // From your CSS
    passiveNameDiv.textContent = briefPassiveForADC(champ); // Use your helper, secure inside
    // Add description if your CSS uses it
    // const passiveDescDiv = document.createElement('div');
    // passiveDescDiv.className = 'desc';
    // passiveDescDiv.textContent = (champ.passive?.desc || '').substring(0, 100) + '...'; // Example trim
    tdPassive.appendChild(passiveNameDiv);
    // tdPassive.appendChild(passiveDescDiv);
    tr.appendChild(tdPassive);


    // 5. Abilities Cell (using existing classes)
    const tdAbilities = document.createElement('td');
    tdAbilities.className = 'abilities'; // Match your thead
    const abilitiesListDiv = document.createElement('div');
    abilitiesListDiv.className = 'abilities-list'; // Match your CSS
    abilitiesListDiv.appendChild(createAbilityPills(champ.abilities || [], champ)); // Use secure helper
    tdAbilities.appendChild(abilitiesListDiv);
    tr.appendChild(tdAbilities);

    // 6. Threats Cell (using existing classes)
    const tdThreats = document.createElement('td');
    tdThreats.className = 'threats'; // Match your thead
    const badgeWrapDiv = document.createElement('div');
    badgeWrapDiv.className = 'badge-wrap'; // Match your CSS
    badgeWrapDiv.appendChild(createThreatTags(champ.abilities || [])); // Use secure helper
    tdThreats.appendChild(badgeWrapDiv);
    tr.appendChild(tdThreats);

    // 7. ADC Tip Cell (using existing classes)
    const tdNotes = document.createElement('td');
    tdNotes.className = 'notes notes-cell'; // Match your thead and CSS
    const ov = getOverrideEntryForChampion?.(champ.slug || champ.name); // Your override logic
    const union = (champ.abilities || []).flatMap(a => a.threat || []);
    const adcNote = ov?.note || adcNoteFromTemplates(CURRENT_ADC, union); // Use your helper
    tdNotes.textContent = adcNote || "..."; // Secure text
    tr.appendChild(tdNotes);

    // 8. Support Synergy Cell (NEW - using existing classes)
    const tdSupportSynergy = document.createElement('td');
    tdSupportSynergy.className = 'support-synergy notes-cell'; // Re-use notes styling? Or make specific?
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
 * Main render function, calls row builders.
 */
function render(){
  if (!tbody || !emptyState) return; // Add checks

  tbody.innerHTML = ""; // Clear previous results (safe as we rebuild)

  // Collect selected champions from input fields
  const enemyInputs = qsa("#enemyInputs .champ-input");
  const allyInputs = qsa("#allyInputs .champ-input");

  const selectedEnemies = Array.from(enemyInputs)
      .map(input => input.dataset.selectedSlug) // Assumes slug is stored on input dataset
      .filter(Boolean) // Remove empty/undefined slugs
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean); // Ensure champion object exists

  const selectedAllies = Array.from(allyInputs)
      .map(input => input.dataset.selectedSlug)
      .filter(Boolean)
      .map(slug => CHAMPIONS.find(c => c.slug === slug))
      .filter(Boolean);

   // Update global state (if your other functions rely on it) - more robust than just render() params
   state.enemyChampions = Array(MAX_ENEMIES).fill(null);
   selectedEnemies.forEach((c, i) => { if (i < MAX_ENEMIES) state.enemyChampions[i] = c; });
   state.allyChampions = Array(MAX_ALLIES).fill(null);
   selectedAllies.forEach((c, i) => { if (i < MAX_ALLIES) state.allyChampions[i] = c; });

  let hasContent = false;

  if (selectedEnemies.length > 0) {
      // tbody.appendChild(renderGroupRow("Enemy Team")); // Optional group row
      selectedEnemies.forEach((champ, index) => {
          tbody.appendChild(renderChampRow("Enemy", champ, index));
          hasContent = true;
      });
  }

  if (selectedAllies.length > 0) {
      // tbody.appendChild(renderGroupRow("Ally Team")); // Optional group row
      selectedAllies.forEach((champ, index) => {
          tbody.appendChild(renderChampRow("Ally", champ, index));
          hasContent = true;
      });
  }

  // Toggle empty state visibility
  emptyState.style.display = hasContent ? "none" : "block";
  qs('#tableContainer').classList.toggle('hidden', !hasContent); // Use your existing table container ID

   // Update macro section visibility
   macroSection.classList.toggle('hidden', !CURRENT_ADC);
}

// ============================================================================
// NEW: MACRO/SYNERGY SECTION RENDERING (SECURE)
// ============================================================================

/**
 * SECURELY renders the High-Elo macro tips and Support Synergies.
 */
function renderMacroSection() {
    if (!adcMacroCard || !supportSynergyCard || !macroHeader || !macroSection) return;

    // Clear previous content securely
    adcMacroCard.innerHTML = '';
    supportSynergyCard.innerHTML = '';

    if (!CURRENT_ADC) {
        macroHeader.textContent = 'High-Elo Macro & Synergy';
        macroSection.classList.add('hidden'); // Hide if no ADC
        return;
    }

    macroHeader.textContent = `${CURRENT_ADC} - Macro & Synergy`;
    macroSection.classList.remove('hidden'); // Show if ADC selected

    // 1. Render ADC Macro Card
    if (typeof ADC_TEMPLATES !== 'undefined') {
        const normalizedKey = normalizeADCKey(CURRENT_ADC);
        const template = ADC_TEMPLATES[Object.keys(ADC_TEMPLATES).find(key => normalizeADCKey(key) === normalizedKey)];

        if (template && template.macro) {
            adcMacroCard.appendChild(createMacroCard(
                "High-Elo Macro (KR/EUW)", // Title for the card
                template.macro
            ));
        } else {
             adcMacroCard.innerHTML = '<p>No macro tips available for this ADC.</p>'; // Fallback message
             console.warn(`Macro tips not found for ADC: ${CURRENT_ADC}`);
        }
    } else {
        console.warn("ADC_TEMPLATES is not defined.");
        adcMacroCard.innerHTML = '<p>Error: ADC Templates not loaded.</p>';
    }

    // 2. Render Support Synergy Card
    if (typeof SUPPORT_TEMPLATES !== 'undefined') {
        const synergies = getSynergiesForADC(CURRENT_ADC);
        if (Object.keys(synergies).length > 0) {
            supportSynergyCard.appendChild(createMacroCard(
                "Potential Support Synergies", // Title for the card
                synergies,
                true // Render as a list
            ));
        } else {
            supportSynergyCard.innerHTML = '<p>No specific support synergy tips found for this ADC.</p>'; // Fallback message
        }
    } else {
        console.warn("SUPPORT_TEMPLATES is not defined.");
        supportSynergyCard.innerHTML = '<p>Error: Support Templates not loaded.</p>';
    }
}


/**
 * Helper to securely create the content for a macro/synergy card.
 * Uses your existing CSS classes where possible.
 * @param {string} title - The title for the card section.
 * @param {object} data - The data object (macro tips or synergies).
 * @param {boolean} [isList=false] - If true, render as a list (for synergies).
 * @returns {DocumentFragment}
 */
function createMacroCard(title, data, isList = false) {
    const fragment = document.createDocumentFragment();

    const h3 = document.createElement('h3');
    h3.className = 'section-title'; // Use your section title class
    h3.textContent = title;
    fragment.appendChild(h3);

    if (isList) {
        // Render as a list of tip cards (matching your .tip-card CSS)
        const gridDiv = document.createElement('div');
        gridDiv.className = 'support-tips-grid'; // Use your grid class

        for (const [key, value] of Object.entries(data)) {
            const card = document.createElement('div');
            card.className = 'tip-card'; // Use your tip card class

            // Find champion data to get portrait
            const supportChamp = CHAMPIONS.find(c => c.name === key);
            if (supportChamp) {
                 const img = createPortraitImg(supportChamp.portrait || supportChamp.slug, key);
                 img.style.width = '40px'; // Match CSS if needed
                 img.style.height = '40px';
                 card.appendChild(img);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'tip-card-content'; // Use your content class

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
            const p = document.createElement('p'); // Simple paragraph for macro tips
            const strong = document.createElement('strong');
            strong.style.color = 'var(--gold)'; // Highlight the concept
            strong.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ": "; // Format key
            p.appendChild(strong);
            p.appendChild(document.createTextNode(value)); // Append tip text securely
            fragment.appendChild(p);
        }
    }
    return fragment;
}

/**
 * Helper function to get all support synergies for a given ADC.
 * @param {string} adcName - The name of the selected ADC.
 * @returns {object} - An object where keys are support names and values are synergy tips.
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
    // Sort synergies alphabetically by support name
    const sortedSynergies = Object.fromEntries(
       Object.entries(synergies).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    );
    return sortedSynergies;
}


// ============================================================================
// INITIALIZATION & EVENT LISTENERS SETUP
// ============================================================================

/**
 * Initializes the application.
 */
async function initializeApp() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        CHAMPIONS = await response.json();
        ensureThreatsForAllAbilities(CHAMPIONS); // Ensure threats are tagged

        // --- DOM Ready ---
        buildAdcGrid();
        buildSearchInputs();
        setupGlobalEventListeners(); // Setup compact mode, import/export
        lockTeamUI(true); // Lock inputs until ADC is selected
        render(); // Initial render (will show empty state)
        renderMacroSection(); // Initial render for macro section (will be hidden)

    } catch (e) {
        console.error("Initialization failed:", e);
        showError("Could not load champion data. Please check network connection or file path.");
        // Display a more prominent error message to the user in the UI
        const mainContent = qs('main.container');
        if (mainContent) {
            mainContent.innerHTML = `<div class="empty"><p><strong>Error loading application data.</strong></p><p>${e.message}</p><p>Please refresh the page or check the console.</p></div>`;
        }
    }
}

// Separate function for global listeners (like compact mode, import/export)
function setupGlobalEventListeners() {
    // Compact Mode Toggle (using your existing ID)
    const compactToggle = qs('#compactMode');
    if (compactToggle) {
        compactToggle.addEventListener('change', e => {
            state.compactMode = e.target.checked;
            document.body.classList.toggle('compact-mode', state.compactMode); // Match CSS class
        });
    }

    // Import/Export Buttons (using your existing IDs)
    qs('#exportData')?.addEventListener('click', exportData);
    qs('#importData')?.addEventListener('click', () => {
        qs('#importFile')?.click();
    });
    qs('#importFile')?.addEventListener('change', handleImport);
}

// ============================================================================
// IMPORT / EXPORT / UTILITIES (Adapted for your state structure)
// ============================================================================
function showError(message) {
    console.error(message);
    // You could implement your modal logic here instead of alert
    alert(message);
}

async function exportData() {
    try {
        // Collect selected slugs from the current input fields' dataset
        const enemySlugs = Array.from(qsa("#enemyInputs .champ-input"))
                               .map(input => input.dataset.selectedSlug)
                               .filter(Boolean);
        const allySlugs = Array.from(qsa("#allyInputs .champ-input"))
                             .map(input => input.dataset.selectedSlug)
                             .filter(Boolean);

        const data = {
            selectedADC: CURRENT_ADC, // Use your global variable
            enemies: enemySlugs,
            allies: allySlugs
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adc-threat-export.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        showError('Error exporting data');
        console.error(err);
    }
}

async function handleImport(e) {
    try {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);

        // --- Clear current selections ---
        CURRENT_ADC = null;
        qsa("#adcGrid .adc-card.selected").forEach(el => el.classList.remove('selected'));
        const allInputs = [...qsa("#enemyInputs .champ-input"), ...qsa("#allyInputs .champ-input")];
        allInputs.forEach(input => {
             input.value = '';
             input.dataset.selectedSlug = '';
             const icon = input.previousElementSibling; // Assuming icon is previous sibling
             if (icon && icon.classList.contains('champ-input-icon')) {
                  icon.style.visibility = 'hidden';
                  icon.src = DUMMY_IMAGE_PATH; // Reset icon
             }
        });
         lockTeamUI(true); // Lock until ADC is processed


        // --- Load imported data ---
        if (data.selectedADC) {
            const adcCard = qs(`#adcGrid .adc-card[data-adc="${data.selectedADC}"]`);
            if (adcCard) {
                CURRENT_ADC = data.selectedADC;
                adcCard.classList.add('selected');
                await loadOverridesFor(CURRENT_ADC); // Load overrides if any
                lockTeamUI(false); // Unlock now that ADC is selected
            } else {
                 showError(`Imported ADC "${data.selectedADC}" not found in list.`);
                 // Keep UI locked
            }
        } else {
             lockTeamUI(true); // Keep locked if no ADC in import
        }

        // Populate enemies
        const enemyInputs = qsa("#enemyInputs .champ-input");
        if (data.enemies && Array.isArray(data.enemies)) {
            data.enemies.slice(0, MAX_ENEMIES).forEach((slug, index) => {
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && enemyInputs[index]) {
                    enemyInputs[index].value = champ.name;
                    enemyInputs[index].dataset.selectedSlug = champ.slug;
                    const icon = enemyInputs[index].previousElementSibling;
                     if (icon && icon.classList.contains('champ-input-icon')) {
                         icon.src = ddragonPortraitURL(champ.portrait || champ.slug);
                         icon.style.visibility = 'visible';
                         icon.onerror = () => { icon.src = DUMMY_IMAGE_PATH; };
                     }
                }
            });
        }

        // Populate allies
        const allyInputs = qsa("#allyInputs .champ-input");
        if (data.allies && Array.isArray(data.allies)) {
            data.allies.slice(0, MAX_ALLIES).forEach((slug, index) => {
                const champ = CHAMPIONS.find(c => c.slug === slug);
                if (champ && allyInputs[index]) {
                    allyInputs[index].value = champ.name;
                    allyInputs[index].dataset.selectedSlug = champ.slug;
                     const icon = allyInputs[index].previousElementSibling;
                     if (icon && icon.classList.contains('champ-input-icon')) {
                         icon.src = ddragonPortraitURL(champ.portrait || champ.slug);
                         icon.style.visibility = 'visible';
                         icon.onerror = () => { icon.src = DUMMY_IMAGE_PATH; };
                     }
                }
            });
        }

        render(); // Re-render the table with imported champs
        renderMacroSection(); // Re-render the macro section

    } catch (err) {
        showError('Error importing file. It may be corrupt or invalid.');
        console.error(err);
    } finally {
        if (e.target) e.target.value = null; // Reset file input
    }
}


// ============================================================================
// START THE APP
// ============================================================================
document.addEventListener('DOMContentLoaded', initializeApp);
