/* ADC Threat Lookup — 25.20
   (ADD-ONLY patch)
   - Fix portraits/passives for Ambessa, Fiddle, LeBlanc, Mel, Yunara
   - Add Sivir coverage (builder side) + appears in search
   - Wukong ability confirm + passive note
   - Kai'Sa icon fix, add Yunara to ADC picker
   - Miss Fortune / Kog'Maw ADC tips: normalize names so tips show
   - Portrait fallback to CDragon CDN for champs not on DDragon
   - Smolder ADC tips (templates) so ability pills + notes populate
   - Support Synergy features: tips, best supports, and synergy column
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

// === SUPPORT SYNERGY DATA ===
const GENERAL_SUPPORT_TIPS = {
  positioning: "Stay behind your support when they engage. Use them as a frontline shield and capitalize on their CC windows.",
  trading: "When your support lands CC or uses a major cooldown, immediately follow up with damage. Time your trades around their engage patterns.",
  waveManagement: "Coordinate wave control with your support. Let them tank minions when freezing, and push together when you want to recall or roam.",
  allInTiming: "All-in when your support has key abilities ready AND enemies have major cooldowns down. Track enemy Flash and escapes."
};

const BEST_SUPPORTS = {
  Ashe: ["Thresh", "Nautilus", "Leona", "Zyra", "Brand"],
  Caitlyn: ["Morgana", "Lux", "Zyra", "Xerath", "Vel'Koz"],
  Corki: ["Lulu", "Janna", "Nami", "Soraka", "Yuumi"],
  Draven: ["Thresh", "Nautilus", "Blitzcrank", "Leona", "Pyke"],
  Ezreal: ["Yuumi", "Lulu", "Karma", "Lux", "Zilean"],
  Jhin: ["Morgana", "Zyra", "Swain", "Xerath", "Vel'Koz"],
  Jinx: ["Lulu", "Nami", "Thresh", "Braum", "Janna"],
  Kaisa: ["Nautilus", "Thresh", "Rakan", "Alistar", "Pyke"],
  Kalista: ["Thresh", "Rakan", "Nautilus", "Alistar", "Braum"],
  KogMaw: ["Lulu", "Nami", "Janna", "Yuumi", "Braum"],
  Lucian: ["Nami", "Braum", "Thresh", "Rakan", "Alistar"],
  MissFortune: ["Leona", "Nautilus", "Amumu", "Sona", "Zyra"],
  Nilah: ["Lulu", "Nami", "Milio", "Senna", "Karma"],
  Quinn: ["Thresh", "Blitzcrank", "Pyke", "Bard", "Pantheon"],
  Samira: ["Nautilus", "Rell", "Leona", "Alistar", "Rakan"],
  Senna: ["Tahm Kench", "Braum", "Thresh", "Lux", "Maokai"],
  Sivir: ["Lulu", "Karma", "Zilean", "Janna", "Nami"],
  Tristana: ["Leona", "Nautilus", "Thresh", "Alistar", "Pyke"],
  Twitch: ["Lulu", "Yuumi", "Nami", "Thresh", "Bard"],
  Varus: ["Thresh", "Lux", "Morgana", "Braum", "Tahm Kench"],
  Vayne: ["Lulu", "Thresh", "Janna", "Braum", "Tahm Kench"],
  Xayah: ["Rakan", "Thresh", "Nautilus", "Braum", "Alistar"],
  Zeri: ["Yuumi", "Lulu", "Nami", "Thresh", "Karma"],
  Aphelios: ["Thresh", "Nautilus", "Lux", "Braum", "Tahm Kench"],
  Yunara: ["Nami", "Lulu", "Janna", "Thresh", "Karma"],
  Smolder: ["Lulu", "Nami", "Thresh", "Braum", "Yuumi"]
};

const SUPPORT_SYNERGY_TIPS = {
  Ashe: {
    Thresh: "⭐ Hook into Arrow or vice versa. Lantern saves Ashe from dives.",
    Nautilus: "⭐ Point-click lockdown chains with Ashe R. Both have strong pick potential.",
    Leona: "⭐ Chain CC with Ashe slows into Leona all-in. Great level 2-3 power.",
    Zyra: "Long-range poke + zone control. Root setups for Ashe arrow.",
    Brand: "High burst damage. Slows enable Brand combos and vice versa."
  },
  Caitlyn: {
    Morgana: "⭐ Binding into trap guarantees CC chain. Black Shield protects Cait.",
    Lux: "⭐ Root into trap for easy poke. Double trap zone control.",
    Zyra: "Root into trap combos. Strong zone control for sieging.",
    Xerath: "Poke synergy. Both excel at long-range harassment.",
    "Vel'Koz": "Strong poke and zone. Vel'Koz knock-up into Cait trap."
  },
  Corki: {
    Lulu: "⭐ Pix + Package = huge burst. Polymorph peel for Corki safety.",
    Janna: "Shield boosts Corki poke. Tornado + slow peel for escapes.",
    Nami: "Bubble sets up Package. Wave + heal for sustained poke.",
    Soraka: "Sustain enables Corki's aggressive poke. Silence peel.",
    Yuumi: "Attached heal/shield. Corki becomes mobile siege turret."
  },
  Draven: {
    Thresh: "⭐ Hook = guaranteed kill with Draven damage. Lantern for aggressive plays.",
    Nautilus: "⭐ Point-click CC chains. Naut engage + Draven burst = kills.",
    Blitzcrank: "⭐ Hook into Draven axes = instant kill. Zone control with hook threat.",
    Leona: "All-in synergy. Leona lockdown + Draven execute.",
    Pyke: "Hook + execute duo. Both snowball hard off early kills."
  },
  Ezreal: {
    Yuumi: "⭐ Free poke with Yuumi attached. Ez E + Yuumi = mobile artillery.",
    Lulu: "Polymorph peel + shields. Ez can play aggressive safely.",
    Karma: "Shield + speed for Ez poke patterns. Root follow-up.",
    Lux: "Root into Ez combo. Double poke pressure.",
    Zilean: "Speed boost for Ez mobility. Bombs + revive safety net."
  },
  Jhin: {
    Morgana: "⭐ Binding guarantees Jhin W root. Black Shield for setup safety.",
    Zyra: "Root into Jhin W/grenade. Strong zone control for Jhin R.",
    Swain: "Root chains. Both excel at long-range picks.",
    Xerath: "Poke synergy. Zone control for Jhin 4th shot.",
    "Vel'Koz": "Knock-up into Jhin W. Strong siege pressure."
  },
  Jinx: {
    Lulu: "⭐ Polymorph + Wild Growth keep Jinx alive. Shields for hypercarry.",
    Nami: "⭐ Bubble setup for Jinx E. Wave + heal for teamfights.",
    Thresh: "Lantern saves Jinx. Hook creates Get Excited resets.",
    Braum: "Wall blocks for Jinx. Passive + Jinx rockets = kills.",
    Janna: "⭐ Tornado + shield peel. Monsoon saves Jinx from dives."
  },
  Kaisa: {
    Nautilus: "⭐ Point-click CC stacks plasma fast. Kai'Sa R follows Naut engages.",
    Thresh: "⭐ Hook stacks plasma. Flay peel when Kai'Sa R's in.",
    Rakan: "W knockup + charm stack plasma. Both can dive backline.",
    Alistar: "Headbutt + combo for plasma. Ali tankiness for Kai'Sa aggro.",
    Pyke: "Hook into Kai'Sa combo. Execute duo."
  },
  Kalista: {
    Thresh: "⭐ Fates Call + Box = huge engage. Lantern for repositioning.",
    Rakan: "⭐ Fates Call + Rakan R/W = teamfight winner. High synergy.",
    Nautilus: "Fates Call engage into Naut R. Guaranteed lockdown.",
    Alistar: "Headbutt + Fates Call wombo. Ali unkillable.",
    Braum: "Fates Call + Braum R = AoE lockdown. Wall synergy."
  },
  KogMaw: {
    Lulu: "⭐ Shield + speed + ult keep Kog alive. He's a turret—Lulu protects turrets.",
    Nami: "⭐ Bubble peel + heal sustain. Wave for Kog escape.",
    Janna: "Tornado + shield peel. Monsoon for anti-dive.",
    Yuumi: "Attached sustain. Kog becomes unkillable siege weapon.",
    Braum: "Wall + passive protect Kog. Strong anti-dive."
  },
  Lucian: {
    Nami: "⭐ Bubble into Lucian combo. Wave + E synergy for mobility.",
    Braum: "⭐ Passive stun + Lucian burst. Wall blocks for safety.",
    Thresh: "Hook + Lucian dash combo. Lantern for aggressive plays.",
    Rakan: "W knockup into Lucian E. High mobility duo.",
    Alistar: "Headbutt combo + Lucian follow-up. Tank enables aggro."
  },
  MissFortune: {
    Leona: "⭐ All-in level 6. Leona R + MF R = teamfight winner.",
    Nautilus: "Point-click engage for MF R setup. Strong kill lane.",
    Amumu: "⭐ Bandage + R = perfect MF ult. AoE CC synergy.",
    Sona: "Crescendo + Bullet Time = wombo. Sustain in lane.",
    Zyra: "Root into MF R. Zone control for channeling."
  },
  Nilah: {
    Lulu: "⭐ Shield shares + Wild Growth. Polymorph for dive.",
    Nami: "⭐ Heal shares + bubble. Wave for engage/disengage.",
    Milio: "Cleanse + heal shares. Fire synergy.",
    Senna: "Heal shares. Both scale infinitely.",
    Karma: "Shield + speed shares. Strong poke and all-in."
  },
  Quinn: {
    Thresh: "Hook into Quinn combo. Lantern for roam returns.",
    Blitzcrank: "Hook = guaranteed Quinn burst. Zone control.",
    Pyke: "Roam duo. Hook + execute synergy.",
    Bard: "Portal roams. Stun into Quinn combo.",
    Pantheon: "Point-click stun setup. Roam duo."
  },
  Samira: {
    Nautilus: "⭐ Point-click lockdown for Samira setup. Strong all-in.",
    Rell: "⭐ W crash + Samira combo. AoE CC for Samira R.",
    Leona: "All-in synergy. Leona lockdown + Samira execute.",
    Alistar: "Headbutt combo + Samira follow-up. Tank frontline.",
    Rakan: "W knockup + charm for Samira combos. Mobility duo."
  },
  Senna: {
    "Tahm Kench": "⭐ Devour saves Senna. Both scale infinitely.",
    Braum: "Wall blocks for Senna. Passive + slow synergy.",
    Thresh: "Hook + Senna root chains. Lantern repositioning.",
    Lux: "Double root threat. Strong poke and zone.",
    Maokai: "Sapling zone + Senna range. Strong peel."
  },
  Sivir: {
    Lulu: "⭐ Shield + speed boost. Polymorph peel for Sivir.",
    Karma: "⭐ Shield + speed synergy. Strong poke and disengage.",
    Zilean: "Speed boost + revive safety. Bombs for zone.",
    Janna: "Shield + tornado peel. Monsoon for anti-dive.",
    Nami: "Bubble peel + heal. Wave + Sivir R = team engage."
  },
  Tristana: {
    Leona: "⭐ All-in level 2-6. E + bomb + Leona lockdown = kills.",
    Nautilus: "Point-click engage for Trist jump. Strong all-in.",
    Thresh: "Hook + Trist jump combo. Lantern for aggressive plays.",
    Alistar: "Headbutt setup for Trist bomb. Tank frontline.",
    Pyke: "Hook + execute duo. Both snowball off early kills."
  },
  Twitch: {
    Lulu: "⭐ Wild Growth + Twitch R = teamfight winner. Shields for safety.",
    Yuumi: "⭐ Attached during stealth. Twitch becomes unstoppable.",
    Nami: "Bubble peel + heal. Wave for Twitch escape.",
    Thresh: "Lantern for stealth repositioning. Hook follow-up.",
    Bard: "Portal flanks. Stun for Twitch setup."
  },
  Varus: {
    Thresh: "⭐ Hook into Varus R chain. Strong pick potential.",
    Lux: "Root into Varus combo. Double root threat.",
    Morgana: "Binding into Varus R. Black Shield for safety.",
    Braum: "Wall blocks for Varus. Passive + Varus poke.",
    "Tahm Kench": "Devour saves Varus. Tongue slow setup."
  },
  Vayne: {
    Lulu: "⭐ Polymorph + Wild Growth keep Vayne alive to scale.",
    Thresh: "⭐ Lantern saves Vayne. Hook creates space for Vayne.",
    Janna: "Tornado + shield peel. Monsoon for anti-dive.",
    Braum: "Wall + passive protect Vayne. Strong anti-dive.",
    "Tahm Kench": "⭐ Devour saves Vayne from lockdown. W peel."
  },
  Xayah: {
    Rakan: "⭐⭐ Duo synergy. Rakan W + E = Xayah feather setup. Ultimate combo.",
    Thresh: "Hook + feather root. Lantern for Xayah safety.",
    Nautilus: "Point-click engage for Xayah feathers. Strong all-in.",
    Braum: "Wall + passive. Strong peel for Xayah.",
    Alistar: "Headbutt setup for feather root. Tank frontline."
  },
  Zeri: {
    Yuumi: "⭐ Attached during Zeri R speed. Becomes unkillable.",
    Lulu: "Shield + speed boost. Polymorph peel for Zeri mobility.",
    Nami: "Bubble peel + heal. Wave for Zeri engage.",
    Thresh: "Lantern for Zeri repositioning. Hook creates space.",
    Karma: "Shield + speed synergy for Zeri. Strong poke."
  },
  Aphelios: {
    Thresh: "⭐ Lantern for gun swaps. Hook into Gravitum root.",
    Nautilus: "Point-click engage for Aphelios setup. Strong all-in.",
    Lux: "Root into Aphelios combo. Strong poke pressure.",
    Braum: "Wall + passive. Strong peel for immobile Aphelios.",
    "Tahm Kench": "Devour saves Aphelios. W peel for positioning."
  },
  Yunara: {
    Nami: "⭐ Bubble + heal for Yunara setup. Wave for mobility.",
    Lulu: "Shield + speed boost. Polymorph peel for Yunara.",
    Janna: "Shield + tornado peel. Monsoon for anti-dive.",
    Thresh: "Hook + Yunara combo. Lantern for safety.",
    Karma: "Shield + speed synergy. Strong poke and disengage."
  },
  Smolder: {
    Lulu: "⭐ Shield + speed for Smolder stacking. Polymorph peel.",
    Nami: "Bubble peel + heal. Wave for Smolder mobility.",
    Thresh: "Lantern saves Smolder. Hook creates space.",
    Braum: "Wall + passive. Strong peel while Smolder scales.",
    Yuumi: "Attached sustain. Smolder can stack safely."
  }
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
  return name.replace(/['\s.-]/g,"").toLowerCase(); // e.g., "Miss Fortune" → "missfortune"; "Kog'Maw" → "kogmaw"
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
  "Yunara", "Smolder", /* added as requested */
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