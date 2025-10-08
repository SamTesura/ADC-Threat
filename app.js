
/* ADC Threat Lookup — 25.16
   (ADD-ONLY patch)
   - Fix portraits/passives for Ambessa, Fiddle, LeBlanc, Mel, Yunara
   - Add Sivir coverage (builder side) + appears in search
   - Wukong ability confirm + passive note
   - Kai'Sa icon fix, add Yunara to ADC picker
   - Miss Fortune / Kog'Maw ADC tips: normalize names so tips show
   - Portrait fallback to CDragon CDN for champs not on DDragon
   - Smolder ADC tips (templates) so ability pills + notes populate
*/

const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "./champions-summary.json"; // unchanged

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


let CHAMPIONS = [];
let CURRENT_ADC = null;
let ADC_OVERRIDES = null;
// Optional per-ADC overrides are disabled by default to avoid 404s.
// If you later add files like adc_overrides_Ashe_25.16.json, you can re-enable fetch.
async function loadOverridesFor(_adcName){
  ADC_OVERRIDES = null; // no fetch = no 404 noise
}

function getOverrideEntryForChampion(_slugOrName){
  return null; // no per-champ override by default
}

// === (ADD) normalize ADC name → template key (removes spaces, apostrophes, punctuation) ===
function normalizeADCKey(name=""){
  return name.replace(/['’\s.-]/g,"").toLowerCase(); // e.g., "Miss Fortune" → "missfortune"; "Kog'Maw" → "kogmaw"
}

// ===== Helpers
const qs = (s,el=document)=>el.querySelector(s);
function ddragonPortrait(slug){ return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`; }
const safeSlug = s => String(s||"").replace(/[^A-Za-z0-9]/g,"");
function portraitUrl(slug){
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`;
}
function primaryThreat(threats=[]){ for(const t of PRIORITY){ if(threats.includes(t)) return t; } return null; }
function primaryThreatClass(threats=[]){ const t = primaryThreat(threats); return t ? THREAT_CLASS[t] : ""; }
function tagToClass(t){ return THREAT_CLASS[t] || ""; }

// === (ADD) build a portrait <img> HTML with fallback to CommunityDragon square if DDragon 404s ===
function portraitImgHTML(slugOrName, alt=""){
  const slug = (slugOrName||"").replace(/\s+/g,"");
  const lower = slug.toLowerCase();
  const dd = ddragonPortrait(slug);
  const cdnFallback = `https://cdn.communitydragon.org/latest/champion/${lower}/square`;
  return `<img class="portrait-sm" src="${dd}" alt="${alt||slug}"
           onerror="this.onerror=null;this.src='${cdnFallback}'">`;
}

// ---------- Auto image fallback (fixes Kai'Sa, Ambessa/Mel/Yunara, etc.) ----------
(function initImageFallbackObserver(){
  const setFallback = img => {
    if (img.dataset._fallbackBound) return;
    img.dataset._fallbackBound = "1";
    img.addEventListener("error", function onErr(){
      img.removeEventListener("error", onErr);
      const current = img.getAttribute("src") || "";
      const m = current.match(/\/img\/champion\/([^./]+)\.png/);
      const raw = m ? m[1] : "";
      const sanitized = safeSlug(raw);
      const altTry = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${sanitized}.png`;
      if (sanitized && altTry !== current){
        img.src = altTry; // e.g., "Kai'Sa.png" -> "KaiSa.png"
      }
    });
  };
  const root = document.body;
  root.querySelectorAll("#adcGrid img, #resultsBody img").forEach(setFallback);
  new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(node=>{
        if (node.nodeType===1){
          if (node.matches("img")) setFallback(node);
          node.querySelectorAll && node.querySelectorAll("img").forEach(setFallback);
        }
      });
    });
  }).observe(root, {subtree:true, childList:true});
})();

// === (CHANGE) ADC list: fix Kai'Sa → Kaisa & add Yunara ===
const ADC_IDS = [
  "Ashe","Caitlyn","Corki","Draven","Ezreal","Jhin","Jinx",
  "Kaisa", /* was "KaiSa" */
  "Kalista","KogMaw","Lucian","MissFortune","Nilah","Quinn",
  "Samira","Senna","Sivir", /* ensure present */
  "Tristana","Twitch","Varus","Vayne","Xayah","Zeri","Aphelios",
  "Yunara", "Smolder" /* added as requested */
];

// ===== Regex tagger & ensureThreatsForAllAbilities (unchanged from your working file) =====
const RX = {
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
    for(const ab of (ch.abilities||[])){
      const txt = `${ab.name||""} ${ab.key||""} ${ab.notes||""}`.toLowerCase();
      const tags = new Set();
      if (RX.air.test(txt)) tags.add(THREAT.HARD_CC);
      if (RX.stun.test(txt)||RX.root.test(txt)||RX.charm.test(txt)||RX.taunt.test(txt)||
          RX.fear.test(txt)||RX.sleep.test(txt)||RX.silence.test(txt)||RX.polymorph.test(txt)||
          RX.slow.test(txt)||RX.blind.test(txt)||RX.grounded.test(txt)) tags.add(THREAT.SOFT_CC);
      if (RX.shield.test(txt)) tags.add(THREAT.SHIELD_PEEL);
      if (RX.gap.test(txt))    tags.add(THREAT.GAP_CLOSE);
      if (RX.burst.test(txt))  tags.add(THREAT.BURST);
      if (RX.zone.test(txt))   tags.add(THREAT.POKE_ZONE);
      if (tags.size===0) tags.add(ab.key==="R" ? THREAT.BURST : THREAT.POKE_ZONE);
      ab.threat = Array.from(tags);
    }
  }
}

// ===== (ADD / EXTEND) PASSIVE_OVERRIDES — ensure brief ADC-relevant passives exist =====
const PASSIVE_OVERRIDES = {
 // You can start with a few defaults if you want.
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
  "FiddleSticks":"Fear chain & big R—ward deep; don’t fight in fog.",
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

// ---------- ADC tips (ensure human-name aliases so MF/Kog’Maw show) ----------
const T = THREAT;
const ADC_TEMPLATES = {
  "Ashe":       { [T.HARD_CC]:"Play wide; save Flash for arrow/point-click chains.", [T.SOFT_CC]:"Step out early; don’t burn Flash for slows.", [T.SHIELD_PEEL]:"Swap targets—peel beats your slow.", [T.GAP_CLOSE]:"Kite back; W to slow re-engage.", [T.BURST]:"Short trades; keep distance.", [T.POKE_ZONE]:"Farm with W; avoid zones." },
  "Caitlyn":    { [T.HARD_CC]:"Trap defensively; hold net for engage CC.", [T.SOFT_CC]:"Respect slows—net out.", [T.SHIELD_PEEL]:"Bait shields with Q then trap.", [T.GAP_CLOSE]:"Net instantly; don’t net in.", [T.BURST]:"Max range; avoid long trades.", [T.POKE_ZONE]:"Trade around headshots." },
  "Corki":      { [T.HARD_CC]:"Hold package/Flash for big CC.", [T.SOFT_CC]:"Rocket peel + kite back.", [T.SHIELD_PEEL]:"Poke shields down.", [T.GAP_CLOSE]:"Valkyrie back, not in.", [T.BURST]:"Short trades; respect assassins.", [T.POKE_ZONE]:"Abuse rockets; avoid zones." },
  "Draven":     { [T.HARD_CC]:"Don’t catch into CC T.", [T.SOFT_CC]:"Step off slows; don’t tunnel axes.", [T.SHIELD_PEEL]:"Force shield first; then all-in.", [T.GAP_CLOSE]:"Kite back; E to stop dives.", [T.BURST]:"Trade on your CDs.", [T.POKE_ZONE]:"Farm safe; no bleed." },
  "Ezreal":     { [T.HARD_CC]:"Hold E strictly for CC.", [T.SOFT_CC]:"E sideways to break slows.", [T.SHIELD_PEEL]:"Poke shields off with Q.", [T.GAP_CLOSE]:"E after they commit.", [T.BURST]:"Short trades till items.", [T.POKE_ZONE]:"Don’t stand still to Q." },
  "Jhin":       { [T.HARD_CC]:"Immobile—space wide; save Flash.", [T.SOFT_CC]:"Pre-move; avoid chip pre-4th.", [T.SHIELD_PEEL]:"Bait peel then root.", [T.GAP_CLOSE]:"Trap retreat paths.", [T.BURST]:"Cancel R if Tened.", [T.POKE_ZONE]:"Don’t channel in zones." },
  "Jinx":       { [T.HARD_CC]:"If CC’d you die—hug minions.", [T.SOFT_CC]:"Chompers defensively.", [T.SHIELD_PEEL]:"Kite out peel then re-enter.", [T.GAP_CLOSE]:"Rockets + chompers on self.", [T.BURST]:"Don’t greed DPS in fog.", [T.POKE_ZONE]:"Fish W; farm safe." },
  "Kai'Sa":     { [T.HARD_CC]:"Hold R to dodge CC.", [T.SOFT_CC]:"Use E to disengage slows.", [T.SHIELD_PEEL]:"Bait peel then R.", [T.GAP_CLOSE]:"Backstep; R after CC down.", [T.BURST]:"Trade around passive.", [T.POKE_ZONE]:"Poke W; avoid traps." },
  "Kalista":    { [T.HARD_CC]:"Never hop forward into CC.", [T.SOFT_CC]:"Hop wider; Rend peel.", [T.SHIELD_PEEL]:"Force peel, then Fates Call.", [T.GAP_CLOSE]:"Save Fates Call to reset.", [T.BURST]:"Short skirmishes.", [T.POKE_ZONE]:"Don’t hop into zones." },
  "KogMaw":     { [T.HARD_CC]:"Immobile—play far back; need peel.", [T.SOFT_CC]:"Kite wider; avoid slows.", [T.SHIELD_PEEL]:"Wait shields drop; then DPS.", [T.GAP_CLOSE]:"Ping peel; kite to team.", [T.BURST]:"Front-to-back only.", [T.POKE_ZONE]:"Use R to poke; no face-checks." },
  "Lucian":     { [T.HARD_CC]:"Buffer E/Flash; never E in if CC up.", [T.SOFT_CC]:"Dash wide; short trades.", [T.SHIELD_PEEL]:"Bait shields with Q/W.", [T.GAP_CLOSE]:"Punish post-dash.", [T.BURST]:"Short burst trades.", [T.POKE_ZONE]:"Step out then re-enter." },
  "MissFortune":{ [T.HARD_CC]:"Keep Flash; cancel R if Tened.", [T.SOFT_CC]:"Trade with Q bounce; avoid chip.", [T.SHIELD_PEEL]:"Bait shield then R.", [T.GAP_CLOSE]:"E slow to peel.", [T.BURST]:"Only full-channel with cover.", [T.POKE_ZONE]:"Q/E poke; safe angles." },
  "Nilah":      { [T.HARD_CC]:"Save W/E; don’t E into CC.", [T.SOFT_CC]:"W vs auto poke; time it.", [T.SHIELD_PEEL]:"Bait peel then R pull.", [T.GAP_CLOSE]:"Engage with support only.", [T.BURST]:"Short skirmishes.", [T.POKE_ZONE]:"Avoid chip; look all-ins." },
  "Quinn":      { [T.HARD_CC]:"Respect point-click CC.", [T.SOFT_CC]:"Vault out of slows.", [T.SHIELD_PEEL]:"Swap target on shields.", [T.GAP_CLOSE]:"Keep E for peel.", [T.BURST]:"Short trades; disengage.", [T.POKE_ZONE]:"Poke then roam." },
  "Samira":     { [T.HARD_CC]:"Any hard CC ends you—space wide.", [T.SOFT_CC]:"Use W vs projectiles.", [T.SHIELD_PEEL]:"Bait peel; then R.", [T.GAP_CLOSE]:"Don’t dash first.", [T.BURST]:"Save E for reset.", [T.POKE_ZONE]:"Avoid chip; all-in only." },
  "Senna":      { [T.HARD_CC]:"Keep spacing; roots kill you.", [T.SOFT_CC]:"Pre-move after autos.", [T.SHIELD_PEEL]:"Poke shields off first.", [T.GAP_CLOSE]:"Don’t get flanked; peel W.", [T.BURST]:"Short trades; R shield.", [T.POKE_ZONE]:"Farm souls safely." },
  "Sivir":      { [T.HARD_CC]:"Hold E for key CC.", [T.SOFT_CC]:"Pre-move; E if chained.", [T.SHIELD_PEEL]:"Spell Shield mirrors trades.", [T.GAP_CLOSE]:"Use R to disengage.", [T.BURST]:"Short trades; Q first.", [T.POKE_ZONE]:"Push + poke safely." },
  "Tristana":   { [T.HARD_CC]:"Don’t W early; jump post-CC.", [T.SOFT_CC]:"W out of slows.", [T.SHIELD_PEEL]:"Bait peel; R eject.", [T.GAP_CLOSE]:"Jump when jungler known.", [T.BURST]:"Use R to peel.", [T.POKE_ZONE]:"Don’t W into zones." },
  "Twitch":     { [T.HARD_CC]:"If caught you die—ambush smart.", [T.SOFT_CC]:"Don’t commit into slows.", [T.SHIELD_PEEL]:"Wait out peel; then R.", [T.GAP_CLOSE]:"Keep stealth to reposition.", [T.BURST]:"Flank; avoid midline.", [T.POKE_ZONE]:"Stack safely; don’t DPS in zones." },
  "Varus":      { [T.HARD_CC]:"Save Flash or R peel.", [T.SOFT_CC]:"Pre-move; Q from range.", [T.SHIELD_PEEL]:"Bait shield then poke.", [T.GAP_CLOSE]:"Root disengage.", [T.BURST]:"Don’t extend.", [T.POKE_ZONE]:"Siege; avoid zones." },
  "Vayne":      { [T.HARD_CC]:"Any CC kills—hold Flash/Tumble.", [T.SOFT_CC]:"Tumble wider; avoid chip.", [T.SHIELD_PEEL]:"Bait peel then condemn.", [T.GAP_CLOSE]:"Backstep; wall condemn.", [T.BURST]:"Short trades; stealth reset.", [T.POKE_ZONE]:"Farm to items." },
  "Xayah":      { [T.HARD_CC]:"Hold R for engage.", [T.SOFT_CC]:"Feather slow peel; space.", [T.SHIELD_PEEL]:"Bait peel then root.", [T.GAP_CLOSE]:"Save R if dived.", [T.BURST]:"Short trades; feather cashout.", [T.POKE_ZONE]:"Don’t sit in zones." },
  "Zeri":       { [T.HARD_CC]:"Hard CC ends you—keep E/Flash.", [T.SOFT_CC]:"E terrain after slows.", [T.SHIELD_PEEL]:"Disengage then re-enter.", [T.GAP_CLOSE]:"Punish post-dash.", [T.BURST]:"Short trades; scale MS.", [T.POKE_ZONE]:"Zap poke; don’t overstay." },
  "Aphelios":   { [T.HARD_CC]:"Immobile—perfect position; keep sums.", [T.SOFT_CC]:"Gravitum peel vs slows.", [T.SHIELD_PEEL]:"Swap target when shield pops.", [T.GAP_CLOSE]:"Respect dives; Gravitum ready.", [T.BURST]:"Short trades.", [T.POKE_ZONE]:"Infernum safe poke." },
  "Yunara":     { [T.HARD_CC]:"Don’t burn dash/Flash for poke.", [T.SOFT_CC]:"Pre-move; avoid slow chains before you commit to DPS.",[T.SHIELD_PEEL]:"Bait peel first—kite out then re-enter with uptime.",[T.GAP_CLOSE]:"Kite back early; keep escape held for second engage.",[T.BURST]:"Short trades only.",[T.POKE_ZONE]:"Farm safely; don’t sit in zones to stack trades."}
  "Smolder":    { [T.HARD_CC]:"Hard CC ends you—hold Flash/E for engage windows; don’t R into ready stuns.", [T.SOFT_CC]: "Pre-move on slows; trade max-range with W→Q and disengage if chainable.",[T.SHIELD_PEEL]:"Poke shields off first (W→Q) or swap target; commit only after peel is down.",[T.GAP_CLOSE]:"Kite back; save E for the second engage, not the first dash.",[T.BURST]:"Short trades around Q procs; respect assassin timers and keep sums for dive.",[T.POKE_ZONE]:"Stack Q through CS; tag with W then Q—don’t stand in zones to finish stacks."  }
};

// ---------- Ability-level tips ----------
function abilityTipFromTemplates(adcName, threats){
  const k = normalizeADCKey(adcName);
  const t = Object.entries(ADC_TEMPLATES).reduce((acc,[k2,v])=>{
    if (normalizeADCKey(k2)===k) acc = v; return acc;
  }, null);
  if(!t) return "";
  const prim = primaryThreat(threats||[]);
  return prim ? t[prim] : "";
}
function abilityTipForADC(champ, abilityKey){
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  if (ov?.abilities?.[abilityKey]?.adcTip) return ov.abilities[abilityKey].adcTip;
  const ability = (champ.abilities||[]).find(a=>a.key===abilityKey) || {};
  return abilityTipFromTemplates(CURRENT_ADC, ability.threat||[]);
}
function adcNoteFromTemplates(adcName, threatsUnion){
  const k = normalizeADCKey(adcName);
  const t = Object.entries(ADC_TEMPLATES).reduce((acc,[k2,v])=>{
    if (normalizeADCKey(k2)===k) acc = v; return acc;
  }, null);
  if(!t) return "";
  for(const key of PRIORITY){ if(threatsUnion.includes(key)) return t[key]; }
  return "";
}

// ===== Passive text (unchanged logic; with more overrides above) =====
function briefPassiveForADC(champ){
  if (champ.passiveTip) return champ.passiveTip;
  if (champ.passive && (champ.passive.name || champ.passive.desc)){
    const t = (champ.passive.desc||"").replace(/\s+/g," ").trim();
    return (t.length>200? t.slice(0,197)+"…" : t) || PASSIVE_OVERRIDES[champ.slug||champ.name] || "—";
  }
  return PASSIVE_OVERRIDES[champ.slug||champ.name] || "—";
}

// ---------- ADC picker ----------
function buildAdcGrid(){
  const grid = qs("#adcGrid");
  const lookup = new Map(CHAMPIONS.map(c=>[c.slug||c.name, c]));
  grid.innerHTML = ADC_IDS.map(id=>{
    const champ = lookup.get(id) || {name:id, portrait:id, slug:id};
    return `<button class="adc-card" data-adc="${champ.name}">
              ${portraitImgHTML(champ.portrait||champ.slug, champ.name)}
              <span class="label">${champ.name}</span>
            </button>`;
  }).join("");
  grid.addEventListener("click", async (e)=>{
    const card = e.target.closest(".adc-card");
    if(!card) return;
    CURRENT_ADC = card.dataset.adc;
    [...grid.querySelectorAll(".adc-card")].forEach(el=>el.classList.toggle("selected", el===card));
    await loadOverridesFor(CURRENT_ADC);
    lockTeamUI(false);
    render();
  });
}
function lockTeamUI(locked){
  const main = document.querySelector("main");
  main.classList.toggle("lock-active", locked);
  const lockWrap = qs("#lockOverlay");
  lockWrap.classList.toggle("lock-overlay", true);
  [...document.querySelectorAll(".search input")].forEach(inp=>inp.disabled = locked);
}

// ---------- Search inputs ----------
function makeSearchCell(team){
  const wrap = document.createElement("div");
  wrap.className = "search";
  wrap.innerHTML = `<input type="text" placeholder="${team==='enemy'?'Enemy':'Ally'} champion..." autocomplete="off"/><div class="suggestions"></div>`;
  const input = wrap.querySelector("input");
  const sug = wrap.querySelector(".suggestions");

  input.addEventListener("input",()=>{
    if(!CURRENT_ADC){return;}
    const v = input.value.trim().toLowerCase();
    if(!v){sug.classList.remove("show");sug.innerHTML="";return;}
    const options = CHAMPIONS
      .filter(c=>c.name?.toLowerCase().includes(v)||c.slug?.toLowerCase().includes(v))
      .slice(0,12);
    sug.innerHTML = options.map(c=>`<button type="button" data-name="${c.name}">
      <img src="${portraitUrl(c.portrait||c.slug)}" style="width:18px;vertical-align:middle;margin-right:6px"/>${c.name}
    </button>`).join("");
    sug.classList.add("show");
  });
  sug.addEventListener("click",e=>{
    const btn = e.target.closest("button"); if(!btn) return;
    input.value = btn.dataset.name; sug.classList.remove("show");
    render();
  });
  input.addEventListener("keydown",(e)=>{
    if(e.key==="Enter"){
      e.preventDefault();
      if(!CURRENT_ADC) return;
      sug.classList.remove("show");
      render();
    }
  });
  return {wrap,input};
}
function buildSearchInputs(){
  const enemyInputsEl = qs("#enemyInputs");
  const allyInputsEl  = qs("#allyInputs");
  const enemySlots = Array.from({length:5},()=>makeSearchCell("enemy"));
  const allySlots  = Array.from({length:4},()=>makeSearchCell("ally"));
  enemySlots.forEach(s=>enemyInputsEl.appendChild(s.wrap));
  allySlots.forEach(s=>allyInputsEl.appendChild(s.wrap));
}

// ---------- Rendering ----------
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");

function cleanseBadgeForAbility(ability){
  const t = ability.threat || [];
  return (t.includes(THREAT.SOFT_CC) && !t.includes(THREAT.HARD_CC))
    ? `<span class="mini-badge cleanse">Cleanse</span>` : "";
}

function abilityPills(abilities, champ){
  return (abilities||[]).map(a=>{
    const cds = (a.cd||[]).join("/");
    const cls = primaryThreatClass(a.threat||[]);
    const prim = primaryThreat(a.threat||[]);
    const label = prim ? THREAT_LABEL[prim] : "";
    const cleanse = cleanseBadgeForAbility(a);
    const tip = abilityTipForADC(champ, a.key);
    return `<span class="pill ${cls}" title="${tip ? tip.replace(/"/g,'&quot;') : ''}">
              <b>${a.key}</b> <span class="cds">${cds||"—"}</span>
              <span class="tlabel">${label}</span>
              ${cleanse}
            </span>`;
  }).join("");
}
function threatTagsUnion(abilities){
  const union = Array.from(new Set((abilities||[]).flatMap(a=>a.threat||[])));
  return union.map(t => `<span class="tag ${tagToClass(t)}">${THREAT_LABEL[t]||t}</span>`).join("");
}

function renderGroupRow(label, cols=7){
  return `<tr class="row" style="background:transparent;border:0">
    <td colspan="${cols}" style="color:var(--gold);text-transform:uppercase;font-weight:700;padding:2px 6px">${label}</td>
  </tr>`;
}

function renderChampRow(group, champ){
  const abilities = champ.abilities || [];
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  const union = (abilities||[]).flatMap(a=>a.threat||[]);
  const adcNote = ov?.note || adcNoteFromTemplates(CURRENT_ADC, union);

   return `<tr class="row">
    <td class="group">${group}</td>
    <td class="champ">
      <div class="cell-champ">
        ${portraitImgHTML(champ.portrait||champ.slug, champ.name)}
        <div>${champ.name}</div>
      </div>
    </td>
    <td class="role">${(champ.tags||[]).join(" • ")||""}</td>
    <td class="passive">${briefPassiveForADC(champ)}</td>
    <td class="abilities"><div class="ability-pills">${abilityPills(abilities, champ)}</div></td>
    <td class="threats"><div class="tags-mini">${threatTagsUnion(abilities)}</div></td>
    <td class="notes">${adcNote||""}</td>
  </tr>`;
}

function readTeamSelection(){
  const grab = sel => [...document.querySelectorAll(`${sel} .search input`)]
    .map(i=>i.value.trim().toLowerCase()).filter(Boolean);
  const enemyNames = grab("#enemyInputs");
  const allyNames  = grab("#allyInputs");
  const enemies = CHAMPIONS.filter(c=>enemyNames.includes(c.name.toLowerCase()));
  const allies  = CHAMPIONS.filter(c=>allyNames.includes(c.name.toLowerCase()));
  return {enemies, allies};
}

function render(){
  const locked = !CURRENT_ADC;
  lockTeamUI(locked);

  const {enemies, allies} = readTeamSelection();
  tbody.innerHTML = "";
  if (locked || (enemies.length+allies.length===0)){ emptyState.style.display="block"; return; }
  emptyState.style.display="none";

  if(enemies.length){ tbody.insertAdjacentHTML("beforeend", renderGroupRow("Enemy Team")); enemies.forEach(c=>tbody.insertAdjacentHTML("beforeend", renderChampRow("ENEMY", c))); }
  if(allies.length){ tbody.insertAdjacentHTML("beforeend", renderGroupRow("Allied Team")); allies.forEach(c=>tbody.insertAdjacentHTML("beforeend", renderChampRow("ALLY", c))); }
}

// ===== Champion-specific CC/threat fixes (keep yours; below only confirms Wukong) =====
function applyChampionFixes(list){
  const find = n => list.find(x => (x.slug||x.name).toLowerCase() === n.toLowerCase());
  const fix  = (slug, key, forced) => {
    const c = find(slug); if(!c) return;
    const a = (c.abilities||[]).find(s=>s.key===key); if(!a) return;
    a.threat = forced;
  };
   
// ====== ABILITY FIXES (171 champs) ======
// Aatrox
fix("Aatrox","Q",[THREAT.HARD_CC]);                // Q3 knockup possible
fix("Aatrox","W",[THREAT.HARD_CC,THREAT.SOFT_CC]); // pull + slow
fix("Aatrox","E",[THREAT.GAP_CLOSE]);
fix("Aatrox","R",[THREAT.BURST,THREAT.GAP_CLOSE]);

// Ahri
fix("Ahri","Q",[THREAT.POKE_ZONE]);
fix("Ahri","W",[THREAT.POKE_ZONE]);
fix("Ahri","E",[THREAT.SOFT_CC]);                  // charm
fix("Ahri","R",[THREAT.GAP_CLOSE]);

// Akali
fix("Akali","Q",[THREAT.POKE_ZONE]);
fix("Akali","W",[THREAT.SHIELD_PEEL]);             // obscured/untargetability tool
fix("Akali","E",[THREAT.GAP_CLOSE]);
fix("Akali","R",[THREAT.GAP_CLOSE,THREAT.BURST]);

// Akshan
fix("Akshan","Q",[THREAT.POKE_ZONE]);
fix("Akshan","W",[THREAT.SHIELD_PEEL]);            // stealth/camo
fix("Akshan","E",[THREAT.GAP_CLOSE]);
fix("Akshan","R",[THREAT.BURST]);

// Alistar
fix("Alistar","Q",[THREAT.HARD_CC]);               // knockup
fix("Alistar","W",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // knockback engage
fix("Alistar","E",[THREAT.SOFT_CC]);               // stun after stacks
fix("Alistar","R",[THREAT.SHIELD_PEEL]);           // heavy DR

// Ambessa (placeholder)
fix("Ambessa","Q",[THREAT.POKE_ZONE]);
fix("Ambessa","W",[THREAT.POKE_ZONE]);
fix("Ambessa","E",[THREAT.GAP_CLOSE]);
fix("Ambessa","R",[THREAT.BURST]);

// Amumu
fix("Amumu","Q",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // stun + engage
fix("Amumu","W",[THREAT.POKE_ZONE]);
fix("Amumu","E",[THREAT.BURST]);
fix("Amumu","R",[THREAT.SOFT_CC]);                  // AoE stun

// Anivia
fix("Anivia","Q",[THREAT.SOFT_CC]);                 // stun detonate
fix("Anivia","W",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // wall peel/zone
fix("Anivia","E",[THREAT.BURST]);
fix("Anivia","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);     // slow field

// Annie
fix("Annie","Q",[THREAT.SOFT_CC]);                  // with passive
fix("Annie","W",[THREAT.SOFT_CC]);                  // with passive
fix("Annie","E",[THREAT.SHIELD_PEEL]);              // shield
fix("Annie","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // Tibbers w/ passive

// Aphelios (varies by weapon; conservative)
fix("Aphelios","Q",[THREAT.POKE_ZONE]);
fix("Aphelios","W",[THREAT.SHIELD_PEEL]);           // utility
fix("Aphelios","E",[THREAT.POKE_ZONE]);
fix("Aphelios","R",[THREAT.BURST]);

// Ashe
fix("Ashe","Q",[THREAT.POKE_ZONE]);
fix("Ashe","W",[THREAT.SOFT_CC]);                   // cone slow
fix("Ashe","E",[THREAT.SHIELD_PEEL]);               // vision
fix("Ashe","R",[THREAT.SOFT_CC]);                   // long stun

// Aurelion Sol
fix("AurelionSol","Q",[THREAT.SOFT_CC]);            // lock/stun at full
fix("AurelionSol","W",[THREAT.GAP_CLOSE,THREAT.POKE_ZONE]);
fix("AurelionSol","E",[THREAT.HARD_CC,THREAT.POKE_ZONE]); // singularity pull/airborne
fix("AurelionSol","R",[THREAT.HARD_CC,THREAT.BURST]);     // impact/knock

// Aurora (placeholder)
fix("Aurora","Q",[THREAT.POKE_ZONE]);
fix("Aurora","W",[THREAT.SHIELD_PEEL]);
fix("Aurora","E",[THREAT.GAP_CLOSE]);
fix("Aurora","R",[THREAT.SOFT_CC,THREAT.BURST]);

// Azir
fix("Azir","Q",[THREAT.POKE_ZONE]);
fix("Azir","W",[THREAT.POKE_ZONE]);
fix("Azir","E",[THREAT.GAP_CLOSE]);
fix("Azir","R",[THREAT.HARD_CC]);                   // wall displacement

// Bard
fix("Bard","Q",[THREAT.SOFT_CC]);                   // stun
fix("Bard","W",[THREAT.SHIELD_PEEL]);               // heal/shield
fix("Bard","E",[THREAT.GAP_CLOSE]);                 // portal
fix("Bard","R",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // stasis/zone

// Bel'Veth
fix("Belveth","Q",[THREAT.GAP_CLOSE]);
fix("Belveth","W",[THREAT.HARD_CC]);                // knockup
fix("Belveth","E",[THREAT.SHIELD_PEEL]);            // DR channel
fix("Belveth","R",[THREAT.BURST]);

// Blitzcrank
fix("Blitzcrank","Q",[THREAT.HARD_CC]);             // hook displacement
fix("Blitzcrank","W",[THREAT.SHIELD_PEEL]);         // MS/self-peel
fix("Blitzcrank","E",[THREAT.HARD_CC]);             // knockup
fix("Blitzcrank","R",[THREAT.SOFT_CC,THREAT.BURST]); // silence burst

// Brand
fix("Brand","Q",[THREAT.SOFT_CC]);                  // stun if ablaze
fix("Brand","W",[THREAT.POKE_ZONE]);
fix("Brand","E",[THREAT.POKE_ZONE]);
fix("Brand","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Braum
fix("Braum","Q",[THREAT.SOFT_CC]);                  // slow + stacks
fix("Braum","W",[THREAT.SHIELD_PEEL]);              // jump peel
fix("Braum","E",[THREAT.SHIELD_PEEL]);              // wall
fix("Braum","R",[THREAT.HARD_CC,THREAT.SOFT_CC]);   // knockup + slow

// Briar
fix("Briar","Q",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // brief stun + engage
fix("Briar","W",[THREAT.GAP_CLOSE,THREAT.BURST]);
fix("Briar","E",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // fear + DR
fix("Briar","R",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // long engage + brief stun

// Caitlyn
fix("Caitlyn","Q",[THREAT.POKE_ZONE]);
fix("Caitlyn","W",[THREAT.SOFT_CC]);                // trap root
fix("Caitlyn","E",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // backdash + slow
fix("Caitlyn","R",[THREAT.BURST]);

// Camille
fix("Camille","Q",[THREAT.BURST]);
fix("Camille","W",[THREAT.SOFT_CC]);                // slow
fix("Camille","E",[THREAT.GAP_CLOSE,THREAT.SOFT_CC]); // stun on 2nd
fix("Camille","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // displace others + zone

// Cassiopeia
fix("Cassiopeia","Q",[THREAT.SOFT_CC]);             // brief slow
fix("Cassiopeia","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // ground + slow
fix("Cassiopeia","E",[THREAT.BURST]);
fix("Cassiopeia","R",[THREAT.SOFT_CC]);             // stun/slow

// Cho'Gath
fix("Chogath","Q",[THREAT.HARD_CC]);                // knockup
fix("Chogath","W",[THREAT.SOFT_CC]);                // silence
fix("Chogath","E",[THREAT.SOFT_CC]);                // slow spikes
fix("Chogath","R",[THREAT.BURST]);                  // execute

// Corki
fix("Corki","Q",[THREAT.POKE_ZONE]);
fix("Corki","W",[THREAT.GAP_CLOSE,THREAT.POKE_ZONE]);
fix("Corki","E",[THREAT.POKE_ZONE]);
fix("Corki","R",[THREAT.POKE_ZONE]);

// Darius
fix("Darius","Q",[THREAT.BURST]);
fix("Darius","W",[THREAT.SOFT_CC]);                 // slow
fix("Darius","E",[THREAT.HARD_CC]);                 // pull
fix("Darius","R",[THREAT.BURST]);                   // execute

// Diana
fix("Diana","Q",[THREAT.POKE_ZONE]);
fix("Diana","W",[THREAT.SHIELD_PEEL]);
fix("Diana","E",[THREAT.GAP_CLOSE]);
fix("Diana","R",[THREAT.HARD_CC,THREAT.BURST]);     // mass pull

// Dr. Mundo
fix("DrMundo","Q",[THREAT.SOFT_CC]);                // slow
fix("DrMundo","W",[THREAT.SHIELD_PEEL]);            // tenacity/cleanse-like
fix("DrMundo","E",[THREAT.BURST]);
fix("DrMundo","R",[THREAT.SHIELD_PEEL]);            // heavy regen

// Draven
fix("Draven","Q",[THREAT.BURST]);
fix("Draven","W",[THREAT.SHIELD_PEEL]);
fix("Draven","E",[THREAT.HARD_CC]);                 // knock-aside
fix("Draven","R",[THREAT.BURST]);

// Ekko
fix("Ekko","Q",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);  // slow return
fix("Ekko","W",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // stun zone + shield
fix("Ekko","E",[THREAT.GAP_CLOSE]);
fix("Ekko","R",[THREAT.SHIELD_PEEL,THREAT.BURST]);  // untargetable + burst

// Elise
fix("Elise","Q",[THREAT.BURST]);
fix("Elise","W",[THREAT.POKE_ZONE]);
fix("Elise","E",[THREAT.SOFT_CC,THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // stun / rappel
fix("Elise","R",[THREAT.SHIELD_PEEL]);              // form swap

// Evelynn
fix("Evelynn","Q",[THREAT.POKE_ZONE]);
fix("Evelynn","W",[THREAT.SOFT_CC]);                // charm
fix("Evelynn","E",[THREAT.GAP_CLOSE,THREAT.BURST]);
fix("Evelynn","R",[THREAT.BURST,THREAT.SHIELD_PEEL]); // untarget + reposition

// Ezreal
fix("Ezreal","Q",[THREAT.POKE_ZONE]);
fix("Ezreal","W",[THREAT.POKE_ZONE]);
fix("Ezreal","E",[THREAT.GAP_CLOSE]);
fix("Ezreal","R",[THREAT.POKE_ZONE]);

// Fiddlesticks (slug = FiddleSticks)
fix("FiddleSticks","Q",[THREAT.SOFT_CC]);           // fear
fix("FiddleSticks","W",[THREAT.SHIELD_PEEL]);       // sustain channel (self-peel)
fix("FiddleSticks","E",[THREAT.SOFT_CC]);           // silence/slow
fix("FiddleSticks","R",[THREAT.POKE_ZONE,THREAT.BURST]);

// Fiora
fix("Fiora","Q",[THREAT.GAP_CLOSE]);
fix("Fiora","W",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // parry → stun + self-peel
fix("Fiora","E",[THREAT.BURST]);
fix("Fiora","R",[THREAT.POKE_ZONE]);                // vitals zone

// Fizz
fix("Fizz","Q",[THREAT.GAP_CLOSE]);
fix("Fizz","W",[THREAT.BURST]);
fix("Fizz","E",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // untargetability
fix("Fizz","R",[THREAT.HARD_CC,THREAT.BURST]);      // shark displacement

// Galio
fix("Galio","Q",[THREAT.POKE_ZONE]);
fix("Galio","W",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // taunt + shield
fix("Galio","E",[THREAT.GAP_CLOSE]);
fix("Galio","R",[THREAT.HARD_CC]);                   // AoE knockup

// Gangplank
fix("Gangplank","Q",[THREAT.POKE_ZONE]);
fix("Gangplank","W",[THREAT.SHIELD_PEEL]);          // self-cleanse/heal
fix("Gangplank","E",[THREAT.POKE_ZONE]);            // barrels slow/zone
fix("Gangplank","R",[THREAT.POKE_ZONE]);            // global slow

// Garen
fix("Garen","Q",[THREAT.SOFT_CC]);                  // silence
fix("Garen","W",[THREAT.SHIELD_PEEL]);              // DR/tenacity
fix("Garen","E",[THREAT.BURST]);
fix("Garen","R",[THREAT.BURST]);                    // execute

// Gnar
fix("Gnar","Q",[THREAT.POKE_ZONE]);
fix("Gnar","W",[THREAT.SOFT_CC]);                   // stun on wall (Mega)
fix("Gnar","E",[THREAT.GAP_CLOSE]);
fix("Gnar","R",[THREAT.HARD_CC]);                   // displacement

// Gragas
fix("Gragas","Q",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow
fix("Gragas","W",[THREAT.SHIELD_PEEL]);             // DR
fix("Gragas","E",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // dash stun
fix("Gragas","R",[THREAT.HARD_CC,THREAT.POKE_ZONE]); // knockback

// Graves
fix("Graves","Q",[THREAT.BURST]);
fix("Graves","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // blind/slow
fix("Graves","E",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // dash + grit
fix("Graves","R",[THREAT.BURST]);

// Gwen
fix("Gwen","Q",[THREAT.BURST]);
fix("Gwen","W",[THREAT.SHIELD_PEEL]);               // mist
fix("Gwen","E",[THREAT.GAP_CLOSE]);
fix("Gwen","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Hecarim
fix("Hecarim","Q",[THREAT.BURST]);
fix("Hecarim","W",[THREAT.SHIELD_PEEL]);            // sustain
fix("Hecarim","E",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // knockback on hit
fix("Hecarim","R",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // fear + engage

// Heimerdinger
fix("Heimerdinger","Q",[THREAT.POKE_ZONE]);         // turrets
fix("Heimerdinger","W",[THREAT.POKE_ZONE]);
fix("Heimerdinger","E",[THREAT.SOFT_CC]);           // stun
fix("Heimerdinger","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Hwei
fix("Hwei","Q",[THREAT.POKE_ZONE]);
fix("Hwei","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);
fix("Hwei","E",[THREAT.SOFT_CC]);
fix("Hwei","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Illaoi
fix("Illaoi","Q",[THREAT.BURST]);
fix("Illaoi","W",[THREAT.BURST]);
fix("Illaoi","E",[THREAT.SOFT_CC]);                 // slow/tether
fix("Illaoi","R",[THREAT.POKE_ZONE]);               // tentacle zone

// Irelia
fix("Irelia","Q",[THREAT.GAP_CLOSE]);
fix("Irelia","W",[THREAT.SHIELD_PEEL]);             // DR
fix("Irelia","E",[THREAT.SOFT_CC]);                 // stun
fix("Irelia","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);// disarm/root area

// Ivern
fix("Ivern","Q",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // root + ally dash
fix("Ivern","W",[THREAT.SHIELD_PEEL]);              // brush
fix("Ivern","E",[THREAT.SHIELD_PEEL,THREAT.SOFT_CC]); // shield + slow
fix("Ivern","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // Daisy knockup/peel

// Janna
fix("Janna","Q",[THREAT.HARD_CC]);                  // knockup
fix("Janna","W",[THREAT.SOFT_CC]);                  // slow
fix("Janna","E",[THREAT.SHIELD_PEEL]);              // shield
fix("Janna","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // knockback + heal

// Jarvan IV
fix("JarvanIV","Q",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // flag-drag knockup (combo)
fix("JarvanIV","W",[THREAT.SHIELD_PEEL,THREAT.SOFT_CC]); // shield + slow
fix("JarvanIV","E",[THREAT.GAP_CLOSE]);              // setup
fix("JarvanIV","R",[THREAT.GAP_CLOSE,THREAT.POKE_ZONE]); // terrain trap

// Jax
fix("Jax","Q",[THREAT.GAP_CLOSE]);
fix("Jax","W",[THREAT.BURST]);
fix("Jax","E",[THREAT.SOFT_CC]);                    // stun
fix("Jax","R",[THREAT.SHIELD_PEEL]);                // defense

// Jayce
fix("Jayce","Q",[THREAT.GAP_CLOSE,THREAT.POKE_ZONE]); // hammer leap / cannon poke
fix("Jayce","W",[THREAT.BURST]);
fix("Jayce","E",[THREAT.HARD_CC,THREAT.POKE_ZONE]);   // hammer knockback / gate zone
fix("Jayce","R",[THREAT.SHIELD_PEEL]);                // form swap utility

// Jhin
fix("Jhin","Q",[THREAT.POKE_ZONE]);
fix("Jhin","W",[THREAT.SOFT_CC]);                    // root on marked
fix("Jhin","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);   // trap slow/root
fix("Jhin","R",[THREAT.POKE_ZONE]);

// Jinx
fix("Jinx","Q",[THREAT.POKE_ZONE]);
fix("Jinx","W",[THREAT.SOFT_CC]);                    // slow
fix("Jinx","E",[THREAT.SOFT_CC]);                    // root
fix("Jinx","R",[THREAT.BURST]);

// K'Sante
fix("KSante","Q",[THREAT.HARD_CC]);                  // Q3 knockup
fix("KSante","W",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // charge knockback + DR
fix("KSante","E",[THREAT.GAP_CLOSE]);
fix("KSante","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // displacement

// Kai'Sa (slug Kaisa)
fix("Kaisa","Q",[THREAT.BURST]);
fix("Kaisa","W",[THREAT.POKE_ZONE]);
fix("Kaisa","E",[THREAT.SHIELD_PEEL]);               // MS/veil
fix("Kaisa","R",[THREAT.GAP_CLOSE]);

// Kalista
fix("Kalista","Q",[THREAT.POKE_ZONE]);
fix("Kalista","W",[THREAT.SHIELD_PEEL]);             // utility
fix("Kalista","E",[THREAT.BURST]);
fix("Kalista","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // ally throw knockup

// Karma
fix("Karma","Q",[THREAT.POKE_ZONE]);
fix("Karma","W",[THREAT.SOFT_CC]);                   // root on full
fix("Karma","E",[THREAT.SHIELD_PEEL]);               // shield/MS
fix("Karma","R",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]);

// Karthus
fix("Karthus","Q",[THREAT.POKE_ZONE]);
fix("Karthus","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // wall slow
fix("Karthus","E",[THREAT.POKE_ZONE]);
fix("Karthus","R",[THREAT.BURST]);

// Kassadin
fix("Kassadin","Q",[THREAT.SHIELD_PEEL]);            // magic shield
fix("Kassadin","W",[THREAT.BURST]);
fix("Kassadin","E",[THREAT.SOFT_CC]);                // slow
fix("Kassadin","R",[THREAT.GAP_CLOSE]);

// Katarina
fix("Katarina","Q",[THREAT.POKE_ZONE]);
fix("Katarina","W",[THREAT.POKE_ZONE,THREAT.SHIELD_PEEL]);
fix("Katarina","E",[THREAT.GAP_CLOSE]);
fix("Katarina","R",[THREAT.BURST]);

// Kayle
fix("Kayle","Q",[THREAT.SOFT_CC]);                   // slow
fix("Kayle","W",[THREAT.SHIELD_PEEL]);               // heal/MS
fix("Kayle","E",[THREAT.POKE_ZONE]);
fix("Kayle","R",[THREAT.SHIELD_PEEL]);               // invuln peel

// Kayn
fix("Kayn","Q",[THREAT.GAP_CLOSE]);
fix("Kayn","W",[THREAT.SOFT_CC]);                    // slow/knockup in Rhaast
fix("Kayn","E",[THREAT.SHIELD_PEEL]);                // phase wall
fix("Kayn","R",[THREAT.GAP_CLOSE,THREAT.BURST]);     // untargetable dive

// Kennen
fix("Kennen","Q",[THREAT.POKE_ZONE]);
fix("Kennen","W",[THREAT.BURST]);
fix("Kennen","E",[THREAT.GAP_CLOSE]);
fix("Kennen","R",[THREAT.SOFT_CC]);                  // stun via marks

// Kha'Zix (slug Khazix)
fix("Khazix","Q",[THREAT.BURST]);
fix("Khazix","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow
fix("Khazix","E",[THREAT.GAP_CLOSE]);
fix("Khazix","R",[THREAT.SHIELD_PEEL]);              // stealth reposition

// Kindred
fix("Kindred","Q",[THREAT.GAP_CLOSE]);
fix("Kindred","W",[THREAT.POKE_ZONE]);
fix("Kindred","E",[THREAT.SOFT_CC]);                 // slow + execute
fix("Kindred","R",[THREAT.SHIELD_PEEL]);             // no-death zone

// Kled
fix("Kled","Q",[THREAT.SOFT_CC]);                    // tether/slow
fix("Kled","W",[THREAT.BURST]);
fix("Kled","E",[THREAT.GAP_CLOSE]);
fix("Kled","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // charge displacement

// Kog'Maw (slug KogMaw)
fix("KogMaw","Q",[THREAT.POKE_ZONE]);
fix("KogMaw","W",[THREAT.POKE_ZONE]);
fix("KogMaw","E",[THREAT.SOFT_CC]);                  // slow
fix("KogMaw","R",[THREAT.POKE_ZONE]);

// LeBlanc (slug Leblanc)
fix("Leblanc","Q",[THREAT.BURST]);
fix("Leblanc","W",[THREAT.GAP_CLOSE]);
fix("Leblanc","E",[THREAT.SOFT_CC]);                 // root
fix("Leblanc","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Lee Sin (slug LeeSin)
fix("LeeSin","Q",[THREAT.GAP_CLOSE]);
fix("LeeSin","W",[THREAT.SHIELD_PEEL]);
fix("LeeSin","E",[THREAT.SOFT_CC]);                  // slow
fix("LeeSin","R",[THREAT.HARD_CC]);                  // kick displacement

// Leona
fix("Leona","Q",[THREAT.SOFT_CC]);                   // stun
fix("Leona","W",[THREAT.SHIELD_PEEL]);
fix("Leona","E",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]);  // root tether
fix("Leona","R",[THREAT.SOFT_CC]);                   // stun/slow

// Lillia
fix("Lillia","Q",[THREAT.POKE_ZONE]);
fix("Lillia","W",[THREAT.BURST]);
fix("Lillia","E",[THREAT.POKE_ZONE]);
fix("Lillia","R",[THREAT.SOFT_CC]);                  // sleep

// Lissandra
fix("Lissandra","Q",[THREAT.POKE_ZONE]);
fix("Lissandra","W",[THREAT.SOFT_CC]);               // root
fix("Lissandra","E",[THREAT.GAP_CLOSE]);
fix("Lissandra","R",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // self-stasis

// Lucian
fix("Lucian","Q",[THREAT.POKE_ZONE]);
fix("Lucian","W",[THREAT.POKE_ZONE]);
fix("Lucian","E",[THREAT.GAP_CLOSE]);
fix("Lucian","R",[THREAT.BURST]);

// Lulu
fix("Lulu","Q",[THREAT.SOFT_CC]);                    // slow
fix("Lulu","W",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // polymorph + buffs
fix("Lulu","E",[THREAT.SHIELD_PEEL]);
fix("Lulu","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // knockup on cast

// Lux
fix("Lux","Q",[THREAT.SOFT_CC]);                     // root
fix("Lux","W",[THREAT.SHIELD_PEEL]);
fix("Lux","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);    // slow zone
fix("Lux","R",[THREAT.BURST]);

// Malphite
fix("Malphite","Q",[THREAT.SOFT_CC]);                // slow
fix("Malphite","W",[THREAT.BURST]);
fix("Malphite","E",[THREAT.SOFT_CC]);                // AS slow
fix("Malphite","R",[THREAT.HARD_CC]);                // knockup

// Malzahar
fix("Malzahar","Q",[THREAT.SOFT_CC]);                // silence
fix("Malzahar","W",[THREAT.POKE_ZONE]);
fix("Malzahar","E",[THREAT.POKE_ZONE]);
fix("Malzahar","R",[THREAT.SOFT_CC]);                // suppression (QSSable)

// Maokai
fix("Maokai","Q",[THREAT.HARD_CC]);                  // knockback
fix("Maokai","W",[THREAT.SOFT_CC]);                  // root
fix("Maokai","E",[THREAT.POKE_ZONE]);
fix("Maokai","R",[THREAT.SOFT_CC]);                  // root wave

// Master Yi (slug MasterYi)
fix("MasterYi","Q",[THREAT.GAP_CLOSE]);
fix("MasterYi","W",[THREAT.SHIELD_PEEL]);            // DR
fix("MasterYi","E",[THREAT.BURST]);
fix("MasterYi","R",[THREAT.SHIELD_PEEL]);            // CC reduction/MS

// Mel (placeholder)
fix("Mel","Q",[THREAT.POKE_ZONE]);
fix("Mel","W",[THREAT.SHIELD_PEEL]);
fix("Mel","E",[THREAT.GAP_CLOSE]);
fix("Mel","R",[THREAT.BURST]);

// Milio
fix("Milio","Q",[THREAT.HARD_CC]);                   // pop-up/knock
fix("Milio","W",[THREAT.SHIELD_PEEL]);               // heal/MS zone
fix("Milio","E",[THREAT.SHIELD_PEEL]);               // shields
fix("Milio","R",[THREAT.SHIELD_PEEL]);               // cleanse/tenacity aura

// Miss Fortune (slug MissFortune)
fix("MissFortune","Q",[THREAT.POKE_ZONE]);
fix("MissFortune","W",[THREAT.SHIELD_PEEL]);         // MS
fix("MissFortune","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow zone
fix("MissFortune","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Mordekaiser
fix("Mordekaiser","Q",[THREAT.BURST]);
fix("Mordekaiser","W",[THREAT.SHIELD_PEEL]);
fix("Mordekaiser","E",[THREAT.HARD_CC]);             // pull
fix("Mordekaiser","R",[THREAT.HARD_CC]);             // realm banish (hard control)

// Morgana
fix("Morgana","Q",[THREAT.SOFT_CC]);                 // root
fix("Morgana","W",[THREAT.POKE_ZONE]);
fix("Morgana","E",[THREAT.SHIELD_PEEL]);             // spell shield
fix("Morgana","R",[THREAT.SOFT_CC]);                 // tether stun

// Naafiri
fix("Naafiri","Q",[THREAT.BURST]);
fix("Naafiri","W",[THREAT.GAP_CLOSE]);
fix("Naafiri","E",[THREAT.GAP_CLOSE]);
fix("Naafiri","R",[THREAT.SHIELD_PEEL]);             // MS/vision/pack

// Nami
fix("Nami","Q",[THREAT.SOFT_CC]);                    // bubble stun
fix("Nami","W",[THREAT.SHIELD_PEEL]);                // heal poke
fix("Nami","E",[THREAT.SHIELD_PEEL,THREAT.SOFT_CC]); // on-hit slow
fix("Nami","R",[THREAT.HARD_CC]);                    // tidal knockup

// Nasus
fix("Nasus","Q",[THREAT.BURST]);
fix("Nasus","W",[THREAT.SOFT_CC]);                   // heavy slow
fix("Nasus","E",[THREAT.POKE_ZONE]);
fix("Nasus","R",[THREAT.SHIELD_PEEL]);               // stats/DR

// Nautilus
fix("Nautilus","Q",[THREAT.HARD_CC]);                // hook displacement
fix("Nautilus","W",[THREAT.SHIELD_PEEL]);
fix("Nautilus","E",[THREAT.SOFT_CC]);                // slow
fix("Nautilus","R",[THREAT.HARD_CC]);                // homing knockup

// Neeko
fix("Neeko","Q",[THREAT.POKE_ZONE]);
fix("Neeko","W",[THREAT.SHIELD_PEEL]);               // stealth/ms
fix("Neeko","E",[THREAT.SOFT_CC]);                   // root
fix("Neeko","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);  // stun after windup

// Nidalee
fix("Nidalee","Q",[THREAT.POKE_ZONE]);
fix("Nidalee","W",[THREAT.GAP_CLOSE,THREAT.POKE_ZONE]); // pounce / trap zone
fix("Nidalee","E",[THREAT.SHIELD_PEEL]);             // heal/as
fix("Nidalee","R",[THREAT.SHIELD_PEEL]);             // form swap

// Nilah
fix("Nilah","Q",[THREAT.POKE_ZONE]);
fix("Nilah","W",[THREAT.SHIELD_PEEL]);               // dodge zone
fix("Nilah","E",[THREAT.GAP_CLOSE]);
fix("Nilah","R",[THREAT.HARD_CC,THREAT.POKE_ZONE]);  // pull

// Nocturne
fix("Nocturne","Q",[THREAT.POKE_ZONE]);
fix("Nocturne","W",[THREAT.SHIELD_PEEL]);            // spell shield
fix("Nocturne","E",[THREAT.SOFT_CC]);                // fear
fix("Nocturne","R",[THREAT.GAP_CLOSE]);              // long engage

// Nunu & Willump (slug Nunu)
fix("Nunu","Q",[THREAT.BURST]);
fix("Nunu","W",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // big knockup on hit
fix("Nunu","E",[THREAT.SOFT_CC]);                    // slow/root
fix("Nunu","R",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // slow + shield channel

// Olaf
fix("Olaf","Q",[THREAT.SOFT_CC]);                    // slow
fix("Olaf","W",[THREAT.SHIELD_PEEL]);                // sustain
fix("Olaf","E",[THREAT.BURST]);
fix("Olaf","R",[THREAT.SHIELD_PEEL]);                // CC immune

// Orianna
fix("Orianna","Q",[THREAT.POKE_ZONE]);
fix("Orianna","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow
fix("Orianna","E",[THREAT.SHIELD_PEEL]);             // shield
fix("Orianna","R",[THREAT.HARD_CC]);                 // shockwave displacement

// Ornn
fix("Ornn","Q",[THREAT.SOFT_CC]);                    // slow + pillar
fix("Ornn","W",[THREAT.BURST]);
fix("Ornn","E",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // dash knock on pillar
fix("Ornn","R",[THREAT.HARD_CC]);                    // ram knockup

// Pantheon
fix("Pantheon","Q",[THREAT.BURST]);
fix("Pantheon","W",[THREAT.SOFT_CC]);                // stun
fix("Pantheon","E",[THREAT.SHIELD_PEEL]);            // block
fix("Pantheon","R",[THREAT.GAP_CLOSE]);

// Poppy
fix("Poppy","Q",[THREAT.POKE_ZONE]);
fix("Poppy","W",[THREAT.SHIELD_PEEL]);               // anti-dash
fix("Poppy","E",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);  // wall pin
fix("Poppy","R",[THREAT.HARD_CC]);                   // knockup/launch

// Pyke
fix("Pyke","Q",[THREAT.HARD_CC]);                    // hook
fix("Pyke","W",[THREAT.SHIELD_PEEL]);                // stealth
fix("Pyke","E",[THREAT.SOFT_CC]);                    // stun line
fix("Pyke","R",[THREAT.BURST]);                      // execute

// Qiyana
fix("Qiyana","Q",[THREAT.BURST]);
fix("Qiyana","W",[THREAT.GAP_CLOSE]);
fix("Qiyana","E",[THREAT.GAP_CLOSE]);
fix("Qiyana","R",[THREAT.HARD_CC,THREAT.BURST]);     // wall shock

// Quinn
fix("Quinn","Q",[THREAT.SOFT_CC]);                   // nearsight/slow
fix("Quinn","W",[THREAT.SHIELD_PEEL]);               // vision/MS
fix("Quinn","E",[THREAT.GAP_CLOSE,THREAT.HARD_CC]);  // knockback mini-displace
fix("Quinn","R",[THREAT.SHIELD_PEEL]);               // roam MS

// Rakan
fix("Rakan","Q",[THREAT.POKE_ZONE]);
fix("Rakan","W",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);  // knockup
fix("Rakan","E",[THREAT.SHIELD_PEEL]);               // dash shields
fix("Rakan","R",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]);  // charm

// Rammus
fix("Rammus","Q",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // collide knock
fix("Rammus","W",[THREAT.SHIELD_PEEL]);              // tank/DR
fix("Rammus","E",[THREAT.SOFT_CC]);                  // taunt
fix("Rammus","R",[THREAT.POKE_ZONE,THREAT.SOFT_CC]); // zone slow pulses

// Rek'Sai (slug RekSai)
fix("RekSai","Q",[THREAT.POKE_ZONE]);
fix("RekSai","W",[THREAT.HARD_CC,THREAT.GAP_CLOSE]); // unburrow knockup
fix("RekSai","E",[THREAT.GAP_CLOSE,THREAT.BURST]);   // tunnel/execute
fix("RekSai","R",[THREAT.GAP_CLOSE,THREAT.BURST]);   // targeted dive

// Rell
fix("Rell","Q",[THREAT.SOFT_CC]);                    // brief slow
fix("Rell","W",[THREAT.GAP_CLOSE,THREAT.HARD_CC]);   // crash knock
fix("Rell","E",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // tether stun + ally peel
fix("Rell","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);   // magnet drag

// Renata Glasc (slug Renata)
fix("Renata","Q",[THREAT.SOFT_CC]);                  // root/drag
fix("Renata","W",[THREAT.SHIELD_PEEL]);              // save/WR
fix("Renata","E",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // shield + poke
fix("Renata","R",[THREAT.SOFT_CC]);                  // berserk

// Renekton
fix("Renekton","Q",[THREAT.BURST]);
fix("Renekton","W",[THREAT.SOFT_CC]);                // stun (empowered)
fix("Renekton","E",[THREAT.GAP_CLOSE]);
fix("Renekton","R",[THREAT.SHIELD_PEEL]);            // stats

// Rengar
fix("Rengar","Q",[THREAT.BURST]);
fix("Rengar","W",[THREAT.SHIELD_PEEL]);              // cleanse/self-heal
fix("Rengar","E",[THREAT.SOFT_CC]);                  // root (emp)
fix("Rengar","R",[THREAT.GAP_CLOSE]);                // stealth jump

// Riven
fix("Riven","Q",[THREAT.GAP_CLOSE]);
fix("Riven","W",[THREAT.SOFT_CC]);                   // stun
fix("Riven","E",[THREAT.SHIELD_PEEL,THREAT.GAP_CLOSE]); // dash shield
fix("Riven","R",[THREAT.BURST]);

// Rumble
fix("Rumble","Q",[THREAT.POKE_ZONE]);
fix("Rumble","W",[THREAT.SHIELD_PEEL]);
fix("Rumble","E",[THREAT.SOFT_CC]);                  // slow
fix("Rumble","R",[THREAT.POKE_ZONE,THREAT.BURST]);   // zone

// Ryze
fix("Ryze","Q",[THREAT.POKE_ZONE]);
fix("Ryze","W",[THREAT.SOFT_CC]);                    // root
fix("Ryze","E",[THREAT.POKE_ZONE]);
fix("Ryze","R",[THREAT.SHIELD_PEEL]);                // portal/team move

// Samira
fix("Samira","Q",[THREAT.BURST]);
fix("Samira","W",[THREAT.SHIELD_PEEL]);              // projectile windwall
fix("Samira","E",[THREAT.GAP_CLOSE]);
fix("Samira","R",[THREAT.BURST]);

// Sejuani
fix("Sejuani","Q",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // dash stun
fix("Sejuani","W",[THREAT.BURST]);
fix("Sejuani","E",[THREAT.SOFT_CC]);                 // permafrost stun (soft)
fix("Sejuani","R",[THREAT.SOFT_CC]);                 // stun

// Senna
fix("Senna","Q",[THREAT.POKE_ZONE]);
fix("Senna","W",[THREAT.SOFT_CC]);                   // root
fix("Senna","E",[THREAT.SHIELD_PEEL]);               // camo/peel
fix("Senna","R",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // global shield + poke

// Seraphine
fix("Seraphine","Q",[THREAT.POKE_ZONE]);
fix("Seraphine","W",[THREAT.SHIELD_PEEL]);           // shield/heal
fix("Seraphine","E",[THREAT.SOFT_CC]);               // root/slow
fix("Seraphine","R",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // charm/slow

// Sett
fix("Sett","Q",[THREAT.GAP_CLOSE]);
fix("Sett","W",[THREAT.SHIELD_PEEL]);                // grit shield
fix("Sett","E",[THREAT.SOFT_CC]);                    // pull slow/stun vs 2
fix("Sett","R",[THREAT.HARD_CC,THREAT.BURST]);       // slam displacement

// Shaco
fix("Shaco","Q",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // stealth
fix("Shaco","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);  // fear boxes
fix("Shaco","E",[THREAT.POKE_ZONE]);
fix("Shaco","R",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // untargetable + clone

// Shen
fix("Shen","Q",[THREAT.BURST]);
fix("Shen","W",[THREAT.SHIELD_PEEL]);                // spirit refuge
fix("Shen","E",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]);   // taunt dash
fix("Shen","R",[THREAT.SHIELD_PEEL]);                // global shield

// Shyvana
fix("Shyvana","Q",[THREAT.BURST]);
fix("Shyvana","W",[THREAT.POKE_ZONE]);
fix("Shyvana","E",[THREAT.POKE_ZONE]);
fix("Shyvana","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);// transform displacement

// Singed
fix("Singed","Q",[THREAT.POKE_ZONE]);
fix("Singed","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // ground/slow
fix("Singed","E",[THREAT.HARD_CC]);                  // fling
fix("Singed","R",[THREAT.SHIELD_PEEL]);              // stats/tenacity

// Sion
fix("Sion","Q",[THREAT.HARD_CC]);                    // knockup
fix("Sion","W",[THREAT.SHIELD_PEEL]);                // shield
fix("Sion","E",[THREAT.SOFT_CC]);                    // slow
fix("Sion","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // huge knock/charge

// Sivir
fix("Sivir","Q",[THREAT.POKE_ZONE]);
fix("Sivir","W",[THREAT.BURST]);
fix("Sivir","E",[THREAT.SHIELD_PEEL]);               // spell shield
fix("Sivir","R",[THREAT.SHIELD_PEEL,THREAT.GAP_CLOSE]); // team MS

// Skarner (rework)
fix("Skarner","Q",[THREAT.BURST]);
fix("Skarner","W",[THREAT.SHIELD_PEEL]);
fix("Skarner","E",[THREAT.SOFT_CC]);                 // slow/stun
fix("Skarner","R",[THREAT.SOFT_CC]);                 // suppression (QSSable)

// Smolder
fix("Smolder","Q",[THREAT.BURST]);
fix("Smolder","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow zone
fix("Smolder","E",[THREAT.GAP_CLOSE]);               // dash
fix("Smolder","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Sona
fix("Sona","Q",[THREAT.POKE_ZONE]);
fix("Sona","W",[THREAT.SHIELD_PEEL]);                // heal/shield
fix("Sona","E",[THREAT.SHIELD_PEEL]);                // MS
fix("Sona","R",[THREAT.SOFT_CC]);                    // stun/dance

// Soraka
fix("Soraka","Q",[THREAT.POKE_ZONE]);
fix("Soraka","W",[THREAT.SHIELD_PEEL]);              // heal/peel
fix("Soraka","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // silence/root
fix("Soraka","R",[THREAT.SHIELD_PEEL]);              // global heal

// Swain
fix("Swain","Q",[THREAT.POKE_ZONE]);
fix("Swain","W",[THREAT.POKE_ZONE]);
fix("Swain","E",[THREAT.SOFT_CC]);                   // root (pull via passive)
fix("Swain","R",[THREAT.POKE_ZONE,THREAT.SHIELD_PEEL]); // drain zone

// Sylas
fix("Sylas","Q",[THREAT.POKE_ZONE]);
fix("Sylas","W",[THREAT.BURST]);
fix("Sylas","E",[THREAT.GAP_CLOSE,THREAT.SOFT_CC]);  // dash + stun
fix("Sylas","R",[THREAT.SHIELD_PEEL]);               // steal utility

// Syndra
fix("Syndra","Q",[THREAT.POKE_ZONE]);
fix("Syndra","W",[THREAT.POKE_ZONE]);
fix("Syndra","E",[THREAT.HARD_CC]);                  // scatter displacement / stun with orbs
fix("Syndra","R",[THREAT.BURST]);

// Tahm Kench (slug TahmKench)
fix("TahmKench","Q",[THREAT.SOFT_CC]);               // stun on stacks/slow
fix("TahmKench","W",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // devour/spit displacement
fix("TahmKench","E",[THREAT.SHIELD_PEEL]);           // gray shield
fix("TahmKench","R",[THREAT.GAP_CLOSE]);             // dive

// Taliyah
fix("Taliyah","Q",[THREAT.POKE_ZONE]);
fix("Taliyah","W",[THREAT.HARD_CC]);                 // throw/displace
fix("Taliyah","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow/root vs dashes
fix("Taliyah","R",[THREAT.POKE_ZONE,THREAT.SHIELD_PEEL]); // wall terrain

// Talon
fix("Talon","Q",[THREAT.GAP_CLOSE,THREAT.BURST]);
fix("Talon","W",[THREAT.POKE_ZONE]);
fix("Talon","E",[THREAT.GAP_CLOSE]);                 // parkour
fix("Talon","R",[THREAT.SHIELD_PEEL,THREAT.BURST]);  // stealth burst

// Taric
fix("Taric","Q",[THREAT.SHIELD_PEEL]);               // heal
fix("Taric","W",[THREAT.SHIELD_PEEL]);               // link
fix("Taric","E",[THREAT.SOFT_CC]);                   // stun
fix("Taric","R",[THREAT.SHIELD_PEEL]);               // invuln

// Teemo
fix("Teemo","Q",[THREAT.SOFT_CC]);                   // blind
fix("Teemo","W",[THREAT.SHIELD_PEEL]);               // MS
fix("Teemo","E",[THREAT.POKE_ZONE]);                 // poison
fix("Teemo","R",[THREAT.POKE_ZONE]);                 // shrooms

// Thresh
fix("Thresh","Q",[THREAT.SOFT_CC]);                  // hook stun (cleanseable)
fix("Thresh","W",[THREAT.SHIELD_PEEL]);              // lantern
fix("Thresh","E",[THREAT.HARD_CC,THREAT.SOFT_CC]);   // displacement + slow
fix("Thresh","R",[THREAT.SOFT_CC]);                  // slow walls

// Tristana
fix("Tristana","Q",[THREAT.BURST]);
fix("Tristana","W",[THREAT.GAP_CLOSE,THREAT.SOFT_CC]); // slow on land
fix("Tristana","E",[THREAT.BURST]);
fix("Tristana","R",[THREAT.HARD_CC]);                // knockback

// Trundle
fix("Trundle","Q",[THREAT.BURST]);
fix("Trundle","W",[THREAT.SHIELD_PEEL]);             // MS/AS
fix("Trundle","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // pillar slow
fix("Trundle","R",[THREAT.SHIELD_PEEL]);             // drain/peel stats

// Tryndamere
fix("Tryndamere","Q",[THREAT.SHIELD_PEEL]);          // heal
fix("Tryndamere","W",[THREAT.SOFT_CC]);              // slow
fix("Tryndamere","E",[THREAT.GAP_CLOSE]);
fix("Tryndamere","R",[THREAT.SHIELD_PEEL]);          // undying

// Twisted Fate (slug TwistedFate)
fix("TwistedFate","Q",[THREAT.POKE_ZONE]);
fix("TwistedFate","W",[THREAT.SOFT_CC]);             // gold card stun
fix("TwistedFate","E",[THREAT.POKE_ZONE]);
fix("TwistedFate","R",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // reveal + port

// Twitch
fix("Twitch","Q",[THREAT.SHIELD_PEEL]);              // stealth
fix("Twitch","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow puddle
fix("Twitch","E",[THREAT.BURST]);
fix("Twitch","R",[THREAT.POKE_ZONE]);                // line spray

// Udyr
fix("Udyr","Q",[THREAT.BURST]);
fix("Udyr","W",[THREAT.SHIELD_PEEL]);                // shield/heal
fix("Udyr","E",[THREAT.SOFT_CC]);                    // stun
fix("Udyr","R",[THREAT.POKE_ZONE]);                  // zone auras

// Urgot
fix("Urgot","Q",[THREAT.SOFT_CC]);                   // slow
fix("Urgot","W",[THREAT.BURST]);
fix("Urgot","E",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);  // displacement
fix("Urgot","R",[THREAT.SOFT_CC,THREAT.BURST]);      // fear on execute

// Varus
fix("Varus","Q",[THREAT.POKE_ZONE]);
fix("Varus","W",[THREAT.BURST]);
fix("Varus","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);  // slow zone
fix("Varus","R",[THREAT.SOFT_CC]);                   // root chain

// Vayne
fix("Vayne","Q",[THREAT.GAP_CLOSE]);
fix("Vayne","W",[THREAT.BURST]);
fix("Vayne","E",[THREAT.HARD_CC]);                   // condemn knockback
fix("Vayne","R",[THREAT.SHIELD_PEEL]);               // stealth/MS

// Veigar
fix("Veigar","Q",[THREAT.POKE_ZONE]);
fix("Veigar","W",[THREAT.BURST]);
fix("Veigar","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // cage stun if cross
fix("Veigar","R",[THREAT.BURST]);

// Vel'Koz (slug Velkoz)
fix("Velkoz","Q",[THREAT.SOFT_CC]);                  // slow
fix("Velkoz","W",[THREAT.POKE_ZONE]);
fix("Velkoz","E",[THREAT.HARD_CC]);                  // knockup
fix("Velkoz","R",[THREAT.POKE_ZONE,THREAT.BURST]);

// Vex
fix("Vex","Q",[THREAT.POKE_ZONE]);
fix("Vex","W",[THREAT.SHIELD_PEEL]);
fix("Vex","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);    // fear via passive
fix("Vex","R",[THREAT.GAP_CLOSE,THREAT.BURST]);      // engage + reset

// Vi
fix("Vi","Q",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);     // charge knock
fix("Vi","W",[THREAT.BURST]);
fix("Vi","E",[THREAT.BURST]);
fix("Vi","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);     // displacement/lock

// Viego
fix("Viego","Q",[THREAT.BURST]);
fix("Viego","W",[THREAT.SOFT_CC]);                   // stun
fix("Viego","E",[THREAT.SHIELD_PEEL]);               // camo/zone
fix("Viego","R",[THREAT.BURST,THREAT.GAP_CLOSE]);    // execute dash

// Viktor
fix("Viktor","Q",[THREAT.SHIELD_PEEL]);
fix("Viktor","W",[THREAT.SOFT_CC,THREAT.POKE_ZONE]); // slow→stun
fix("Viktor","E",[THREAT.POKE_ZONE]);
fix("Viktor","R",[THREAT.POKE_ZONE,THREAT.SOFT_CC]); // storm tick silence/slow

// Vladimir
fix("Vladimir","Q",[THREAT.BURST]);
fix("Vladimir","W",[THREAT.SHIELD_PEEL]);            // untargetable pool
fix("Vladimir","E",[THREAT.POKE_ZONE]);
fix("Vladimir","R",[THREAT.BURST,THREAT.POKE_ZONE]); // amp + burst

// Volibear
fix("Volibear","Q",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]); // stun on hit
fix("Volibear","W",[THREAT.BURST]);
fix("Volibear","E",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // slow + shield
fix("Volibear","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // jump stun + tower off

// Warwick
fix("Warwick","Q",[THREAT.GAP_CLOSE,THREAT.BURST]);  // follows dash
fix("Warwick","W",[THREAT.SHIELD_PEEL]);             // MS/track
fix("Warwick","E",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // fear + DR
fix("Warwick","R",[THREAT.SOFT_CC,THREAT.GAP_CLOSE]);   // suppression + engage

// Wukong (slug MonkeyKing)
fix("MonkeyKing","Q",[THREAT.BURST]);
fix("MonkeyKing","W",[THREAT.SHIELD_PEEL]);          // stealth/decoy peel
fix("MonkeyKing","E",[THREAT.GAP_CLOSE]);
fix("MonkeyKing","R",[THREAT.HARD_CC]);              // knockup spin

// Xayah
fix("Xayah","Q",[THREAT.POKE_ZONE]);
fix("Xayah","W",[THREAT.BURST]);
fix("Xayah","E",[THREAT.SOFT_CC]);                   // root via feathers
fix("Xayah","R",[THREAT.SHIELD_PEEL]);               // untargetable

// Xerath
fix("Xerath","Q",[THREAT.POKE_ZONE]);
fix("Xerath","W",[THREAT.POKE_ZONE]);
fix("Xerath","E",[THREAT.SOFT_CC]);                  // stun
fix("Xerath","R",[THREAT.POKE_ZONE,THREAT.BURST]);

// Xin Zhao (slug XinZhao)
fix("XinZhao","Q",[THREAT.HARD_CC]);                 // 3rd hit knockup
fix("XinZhao","W",[THREAT.POKE_ZONE]);
fix("XinZhao","E",[THREAT.GAP_CLOSE]);
fix("XinZhao","R",[THREAT.HARD_CC,THREAT.SHIELD_PEEL]); // knockback + anti-range zone

// Yasuo
fix("Yasuo","Q",[THREAT.HARD_CC]);                   // Q3 knockup
fix("Yasuo","W",[THREAT.SHIELD_PEEL]);               // windwall
fix("Yasuo","E",[THREAT.GAP_CLOSE]);
fix("Yasuo","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);  // airborne lock

// Yunara (live; conservative until finalized in your data)
fix("Yunara","Q",[THREAT.POKE_ZONE]);
fix("Yunara","W",[THREAT.SHIELD_PEEL]);
fix("Yunara","E",[THREAT.GAP_CLOSE]);
fix("Yunara","R",[THREAT.BURST]);

// Yone
fix("Yone","Q",[THREAT.HARD_CC]);                    // Q3 knockup
fix("Yone","W",[THREAT.SHIELD_PEEL,THREAT.POKE_ZONE]); // shield + poke
fix("Yone","E",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // dash/return
fix("Yone","R",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);   // displacement

// Yorick
fix("Yorick","Q",[THREAT.BURST]);
fix("Yorick","W",[THREAT.POKE_ZONE]);                // wall trap
fix("Yorick","E",[THREAT.SOFT_CC]);                  // slow/mark
fix("Yorick","R",[THREAT.POKE_ZONE,THREAT.SHIELD_PEEL]); // Maiden pressure

// Yuumi
fix("Yuumi","Q",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);  // slow
fix("Yuumi","W",[THREAT.SHIELD_PEEL]);               // attach
fix("Yuumi","E",[THREAT.SHIELD_PEEL]);               // heal/shield
fix("Yuumi","R",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // root after hits

// Zac
fix("Zac","Q",[THREAT.SOFT_CC]);                     // slow (pull if 2)
fix("Zac","W",[THREAT.POKE_ZONE]);
fix("Zac","E",[THREAT.HARD_CC,THREAT.GAP_CLOSE]);    // long jump knockup
fix("Zac","R",[THREAT.HARD_CC,THREAT.POKE_ZONE]);    // bounces knock

// Zed
fix("Zed","Q",[THREAT.POKE_ZONE]);
fix("Zed","W",[THREAT.GAP_CLOSE,THREAT.SHIELD_PEEL]); // shadow reposition
fix("Zed","E",[THREAT.SOFT_CC]);                      // slow
fix("Zed","R",[THREAT.GAP_CLOSE,THREAT.BURST]);       // untargetable dive

// Zeri
fix("Zeri","Q",[THREAT.POKE_ZONE]);
fix("Zeri","W",[THREAT.POKE_ZONE]);
fix("Zeri","E",[THREAT.GAP_CLOSE]);                   // wall dash
fix("Zeri","R",[THREAT.BURST,THREAT.SHIELD_PEEL]);    // chain MS spike

// Ziggs
fix("Ziggs","Q",[THREAT.POKE_ZONE]);
fix("Ziggs","W",[THREAT.HARD_CC,THREAT.POKE_ZONE]);   // satchel knockback
fix("Ziggs","E",[THREAT.SOFT_CC,THREAT.POKE_ZONE]);   // slow field
fix("Ziggs","R",[THREAT.BURST,THREAT.POKE_ZONE]);

// Zilean
fix("Zilean","Q",[THREAT.SOFT_CC]);                   // double-bomb stun
fix("Zilean","W",[THREAT.SHIELD_PEEL]);               // CDR utility
fix("Zilean","E",[THREAT.SOFT_CC,THREAT.SHIELD_PEEL]); // slow/MS
fix("Zilean","R",[THREAT.SHIELD_PEEL]);               // revive

// Zoe
fix("Zoe","Q",[THREAT.POKE_ZONE]);
fix("Zoe","W",[THREAT.POKE_ZONE,THREAT.SHIELD_PEEL]); // spell pickup
fix("Zoe","E",[THREAT.SOFT_CC]);                      // sleep
fix("Zoe","R",[THREAT.SHIELD_PEEL]);                  // blink reposition

// Zyra
fix("Zyra","Q",[THREAT.POKE_ZONE]);
fix("Zyra","W",[THREAT.POKE_ZONE]);                   // plant setup
fix("Zyra","E",[THREAT.SOFT_CC]);                     // root
fix("Zyra","R",[THREAT.HARD_CC,THREAT.POKE_ZONE]);    // knockup after delay

}

// ---------- Data load, editor, compact toggle ----------
   
async function loadChampions(){
  try{
    const r = await fetch(DATA_URL,{cache:"no-store"});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    CHAMPIONS = await r.json();
  }catch(e){
    console.warn("Could not auto-load champions file; falling back to window.CHAMPIONS", e);
    CHAMPIONS = window.CHAMPIONS || [];
  }
  ensureThreatsForAllAbilities(CHAMPIONS);
  applyChampionFixes(CHAMPIONS);
  buildAdcGrid();
  buildSearchInputs();
  lockTeamUI(true);
  render();
}

// Editor / Import / Export
const editorModal = qs("#editorModal");
const editorArea = qs("#editorArea");
qs("#openEditor")?.addEventListener("click", ()=>{ editorArea.value = JSON.stringify(CHAMPIONS,null,2); editorModal.showModal(); });
qs("#saveEditor")?.addEventListener("click", ()=>{ try{ const parsed=JSON.parse(editorArea.value); if(!Array.isArray(parsed)) throw new Error("Top-level must be an array"); CHAMPIONS=parsed; ensureThreatsForAllAbilities(CHAMPIONS); buildAdcGrid(); render(); editorModal.close(); }catch(err){ alert("Invalid JSON: "+err.message); }});
qs("#exportData")?.addEventListener("click", ()=>{ const blob=new Blob([JSON.stringify(CHAMPIONS,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="adc-threat-data.json"; a.click(); URL.revokeObjectURL(url); });
const importFile = qs("#importFile");
qs("#importData")?.addEventListener("click", ()=> importFile?.click());
importFile?.addEventListener("change",(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(!Array.isArray(data)) throw new Error("Top-level must be an array"); CHAMPIONS=data; ensureThreatsForAllAbilities(CHAMPIONS); buildAdcGrid(); render(); alert("Imported champion data."); }catch(err){ alert("Import failed: "+err.message);} }; r.readAsText(f); });

// Compact mode
const compactToggle = document.getElementById("toggleCompact");
if (compactToggle) {
  const saved = localStorage.getItem("adc_compact_mode") === "1";
  document.body.classList.toggle("compact-mode", saved);
  compactToggle.checked = saved;
  compactToggle.addEventListener("change", (e)=>{
    const on = e.target.checked;
    document.body.classList.toggle("compact-mode", on);
    localStorage.setItem("adc_compact_mode", on ? "1" : "0");
  });
}

// Go!
loadChampions();





