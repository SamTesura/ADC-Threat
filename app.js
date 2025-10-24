/* ADC Threat Lookup — 25.20
   (ADD-ONLY patch with Support Synergy Features)
   - Fix portraits/passives for Ambessa, Fiddle, LeBlanc, Mel, Yunara
   - Add Sivir coverage (builder side) + appears in search
   - Wukong ability confirm + passive note
   - Kai'Sa icon fix, add Yunara to ADC picker
   - Miss Fortune / Kog'Maw ADC tips: normalize names so tips show
   - Portrait fallback to CDragon CDN for champs not on DDragon
   - Smolder ADC tips (templates) so ability pills + notes populate
   - Support Synergy features: tips, best supports, and synergy column
*/

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "./champions-summary.json";

const THREAT = {
  HARD_CC: "HARD_CC",
  SOFT_CC: "SOFT_CC",
  SHIELD_PEEL: "SHIELD_PEEL",
  GAP_CLOSE: "GAP_CLOSE",
  BURST: "BURST",
  POKE_ZONE: "POKE_ZONE"
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
  [THREAT.HARD_CC]: "hard",
  [THREAT.SOFT_CC]: "soft",
  [THREAT.SHIELD_PEEL]: "peel",
  [THREAT.GAP_CLOSE]: "gap",
  [THREAT.BURST]: "burst",
  [THREAT.POKE_ZONE]: "poke"
};

const THREAT_LABEL = {
  [THREAT.HARD_CC]: "Hard CC",
  [THREAT.SOFT_CC]: "Soft CC",
  [THREAT.SHIELD_PEEL]: "Shield/Peel",
  [THREAT.GAP_CLOSE]: "Gap Close",
  [THREAT.BURST]: "Burst",
  [THREAT.POKE_ZONE]: "Poke/Zone"
};

// ============================================================================
// SUPPORT SYNERGY DATA
// ============================================================================

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

// ============================================================================
// GLOBAL STATE
// ============================================================================

let CHAMPIONS = [];
let CURRENT_ADC = null;
let ADC_OVERRIDES = null;

// ============================================================================
// ADC LIST
// ============================================================================

const ADC_IDS = [
  "Ashe", "Caitlyn", "Corki", "Draven", "Ezreal", "Jhin", "Jinx",
  "Kaisa",
  "Kalista", "KogMaw", "Lucian", "MissFortune", "Nilah", "Quinn",
  "Samira", "Senna", "Sivir",
  "Tristana", "Twitch", "Varus", "Vayne", "Xayah", "Zeri", "Aphelios",
  "Yunara", "Smolder"
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const qs = (s, el = document) => el.querySelector(s);

function ddragonPortrait(slug) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`;
}

const safeSlug = s => String(s || "").replace(/[^A-Za-z0-9]/g, "");

function portraitUrl(slug) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`;
}

function primaryThreat(threats = []) {
  for (const t of PRIORITY) {
    if (threats.includes(t)) return t;
  }
  return null;
}

function primaryThreatClass(threats = []) {
  const t = primaryThreat(threats);
  return t ? THREAT_CLASS[t] : "";
}

function tagToClass(t) {
  return THREAT_CLASS[t] || "";
}

function normalizeADCKey(name = "") {
  return name.replace(/['\s.-]/g, "").toLowerCase();
}

function portraitImgHTML(slugOrName, alt = "") {
  const slug = (slugOrName || "").replace(/\s+/g, "");
  const lower = slug.toLowerCase();
  const dd = ddragonPortrait(slug);
  const cdnFallback = `https://cdn.communitydragon.org/latest/champion/${lower}/square`;
  return `<img class="portrait-sm" src="${dd}" alt="${alt || slug}"
           onerror="this.onerror=null;this.src='${cdnFallback}'">`;
}

// ============================================================================
// IMAGE FALLBACK OBSERVER
// ============================================================================

(function initImageFallbackObserver() {
  const setFallback = img => {
    if (img.dataset._fallbackBound) return;
    img.dataset._fallbackBound = "1";
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      const current = img.getAttribute("src") || "";
      const m = current.match(/\/img\/champion\/([^./]+)\.png/);
      const raw = m ? m[1] : "";
      const sanitized = safeSlug(raw);
      const altTry = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${sanitized}.png`;
      if (sanitized && altTry !== current) {
        img.src = altTry;
      }
    });
  };
  const root = document.body;
  root.querySelectorAll("#adcGrid img, #resultsBody img").forEach(setFallback);
  new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches("img")) setFallback(node);
          node.querySelectorAll && node.querySelectorAll("img").forEach(setFallback);
        }
      });
    });
  }).observe(root, { subtree: true, childList: true });
})();

// ============================================================================
// REGEX THREAT TAGGER
// ============================================================================

const RX = {
  air: /\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch|toss|push|pull|yank|drag|shove|displace|knockdown)\b/i,
  stun: /\bstun(?:s|ned|ning)?\b/i,
  root: /\b(root|snare|immobiliz(?:e|ed|es))\b/i,
  charm: /\bcharm(?:ed|s|ing)?\b/i,
  taunt: /\btaunt(?:ed|s|ing)?\b/i,
  fear: /\b(fear|terrify|flee)\b/i,
  sleep: /\b(sleep|drowsy)\b/i,
  silence: /\bsilence(?:d|s|ing)?\b/i,
  polymorph: /\bpolymorph(?:ed|s|ing)?\b/i,
  slow: /\bslow|cripple|chill\b/i,
  blind: /\bblind|nearsight\b/i,
  grounded: /\bground(?:ed)?\b/i,
  gap: /\b(dash|blink|leap|lunge|surge|shift|rush|charge|hookshot|vault|hop|flip|jump|teleport to|reposition|slide|advance)\b/i,
  burst: /\bburst|detonate|execute|threshold|nuke|high damage|true damage\b/i,
  zone: /\b(zone|field|pool|storm|barrage|mine|trap|turret|wall|aoe|beam|laser|burn)\b/i,
  shield: /\b(shield|barrier|spell shield|damage reduction|tenacity|unstoppable|invulnerab|untargetable|stasis|banish|realm of death)\b/i
};

function ensureThreatsForAllAbilities(list) {
  for (const ch of list) {
    for (const ab of (ch.abilities || [])) {
      const txt = `${ab.name || ""} ${ab.key || ""} ${ab.notes || ""}`.toLowerCase();
      const tags = new Set();
      if (RX.air.test(txt)) tags.add(THREAT.HARD_CC);
      if (RX.stun.test(txt) || RX.root.test(txt) || RX.charm.test(txt) || RX.taunt.test(txt) ||
        RX.fear.test(txt) || RX.sleep.test(txt) || RX.silence.test(txt) || RX.polymorph.test(txt) ||
        RX.slow.test(txt) || RX.blind.test(txt) || RX.grounded.test(txt)) tags.add(THREAT.SOFT_CC);
      if (RX.shield.test(txt)) tags.add(THREAT.SHIELD_PEEL);
      if (RX.gap.test(txt)) tags.add(THREAT.GAP_CLOSE);
      if (RX.burst.test(txt)) tags.add(THREAT.BURST);
      if (RX.zone.test(txt)) tags.add(THREAT.POKE_ZONE);
      if (tags.size === 0) tags.add(ab.key === "R" ? THREAT.BURST : THREAT.POKE_ZONE);
      ab.threat = Array.from(tags);
    }
  }
}

// ============================================================================
// OVERRIDE SYSTEM
// ============================================================================

async function loadOverridesFor(_adcName) {
  ADC_OVERRIDES = null;
}

function getOverrideEntryForChampion(_slugOrName) {
  return null;
}

// ============================================================================
// ADC TEMPLATES
// ============================================================================

const ADC_TEMPLATES = {
  ashe: {
    [THREAT.HARD_CC]: "Cleanse or Flash to escape lockdown. Your self-peel is limited—position carefully.",
    [THREAT.SOFT_CC]: "Slows stack with yours, but avoid extended trades if you're CC'd. Use Volley (W) for safe poke.",
    [THREAT.SHIELD_PEEL]: "Your DPS shines through shields. Keep auto-attacking through their protection.",
    [THREAT.GAP_CLOSE]: "Kite back with Q slows. Save R for crucial self-peel or to turn a dive.",
    [THREAT.BURST]: "Lifesteal and positioning. Poke them down before they all-in.",
    [THREAT.POKE_ZONE]: "Out-range most poke with W. Play around vision to land long-range arrows."
  },
  caitlyn: {
    [THREAT.HARD_CC]: "Position behind traps. If caught, you're dead—respect their engage range.",
    [THREAT.SOFT_CC]: "Trap zone denies their engage. Net (E) to escape slows.",
    [THREAT.SHIELD_PEEL]: "Headshot damage chunks through shields. Keep stacking traps.",
    [THREAT.GAP_CLOSE]: "Net away and trap their landing zone. Abuse your 650 range.",
    [THREAT.BURST]: "Outrange burst. If they get on you, Net immediately.",
    [THREAT.POKE_ZONE]: "You outrange most poke. Zone them with traps."
  },
  corki: {
    [THREAT.HARD_CC]: "Package can escape, but once used you're vulnerable. Respect lockdown.",
    [THREAT.SOFT_CC]: "Your burst combo needs clean execution—CC ruins it.",
    [THREAT.SHIELD_PEEL]: "Mixed damage shreds shields. R spam pressure.",
    [THREAT.GAP_CLOSE]: "Package to reposition or W out. Poke them down first.",
    [THREAT.BURST]: "Out-poke and stay healthy. You're squishy.",
    [THREAT.POKE_ZONE]: "R spam matches their poke. Farm safely with package."
  },
  draven: {
    [THREAT.HARD_CC]: "You die if CC'd. Flash/QSS critical. Catch axes carefully.",
    [THREAT.SOFT_CC]: "Slows ruin axe catching. W to speed up or back off.",
    [THREAT.SHIELD_PEEL]: "You deal so much damage shields pop fast. Keep auto-attacking.",
    [THREAT.GAP_CLOSE]: "Stand aside (E) to interrupt. Play aggressive early.",
    [THREAT.BURST]: "You burst harder. Fight early and snowball.",
    [THREAT.POKE_ZONE]: "Axes out-damage poke. Play aggressive or lose Draven's strength."
  },
  ezreal: {
    [THREAT.HARD_CC]: "E to dodge. If it's point-and-click, you have to Flash or cleanse.",
    [THREAT.SOFT_CC]: "E through most CC. Your mobility is your strength.",
    [THREAT.SHIELD_PEEL]: "Poke through shields. You're not all-in reliant.",
    [THREAT.GAP_CLOSE]: "E away instantly. Kite with Q spam.",
    [THREAT.BURST]: "Poke them down first. E if they dive.",
    [THREAT.POKE_ZONE]: "You out-poke most champions with Q spam. Stay safe."
  },
  jhin: {
    [THREAT.HARD_CC]: "You're immobile. Cleanse/Flash or die. Position behind frontline.",
    [THREAT.SOFT_CC]: "Slows don't bother you much—you're already slow. Root them with W.",
    [THREAT.SHIELD_PEEL]: "4th shot and abilities chunk through shields.",
    [THREAT.GAP_CLOSE]: "Trap their path. W root into 4th shot execute.",
    [THREAT.BURST]: "Snipe low HP targets with R. Poke down first.",
    [THREAT.POKE_ZONE]: "W poke and traps for vision. Play around your reload."
  },
  jinx: {
    [THREAT.HARD_CC]: "You have zero mobility. Cleanse or Flash. Position in the back.",
    [THREAT.SOFT_CC]: "Slows hurt but you outrange. Rockets poke safely.",
    [THREAT.SHIELD_PEEL]: "DPS shreds shields. Get Excited resets in teamfights.",
    [THREAT.GAP_CLOSE]: "Chompers (E) to block. Kite with rockets.",
    [THREAT.BURST]: "Lifesteal and positioning. You're squishy until late.",
    [THREAT.POKE_ZONE]: "Rockets outrange most poke. Siege safely."
  },
  kaisa: {
    [THREAT.HARD_CC]: "Your R puts you in danger. Only dive with backup or when safe.",
    [THREAT.SOFT_CC]: "E movespeed helps. Stack plasma before trading.",
    [THREAT.SHIELD_PEEL]: "Plasma burst pops shields. Evolved Q shreds.",
    [THREAT.GAP_CLOSE]: "R to reposition or chase. E for kiting.",
    [THREAT.BURST]: "R shield helps but risky. Poke with W first.",
    [THREAT.POKE_ZONE]: "E invisibility to dodge. W poke from range."
  },
  kalista: {
    [THREAT.HARD_CC]: "Hop constantly. If rooted/stunned you're dead.",
    [THREAT.SOFT_CC]: "Slows hurt your hops. Back off or use R.",
    [THREAT.SHIELD_PEEL]: "Rend (E) executes through shields. Stack spears.",
    [THREAT.GAP_CLOSE]: "Hop away. R to save support or engage.",
    [THREAT.BURST]: "Lifesteal and hops keep you alive. Position well.",
    [THREAT.POKE_ZONE]: "Hop to dodge. Trade with spears."
  },
  kogmaw: {
    [THREAT.HARD_CC]: "You're immobile. Cleanse/Flash or die. Stay max range.",
    [THREAT.SOFT_CC]: "Slows hurt. Stay behind frontline.",
    [THREAT.SHIELD_PEEL]: "You melt shields with % HP damage. Just keep autoing.",
    [THREAT.GAP_CLOSE]: "E slow for peel. Stay max range with W.",
    [THREAT.BURST]: "Lifesteal and positioning. You're a glass cannon.",
    [THREAT.POKE_ZONE]: "R artillery poke. W max range shredding."
  },
  lucian: {
    [THREAT.HARD_CC]: "Dash (E) to dodge. Don't waste it for damage.",
    [THREAT.SOFT_CC]: "Dash through. Your mobility is key.",
    [THREAT.SHIELD_PEEL]: "Burst combo pops shields. Double-tap damage.",
    [THREAT.GAP_CLOSE]: "E away or into them if you can kill. Play aggressive.",
    [THREAT.BURST]: "You burst too. E + combo them first.",
    [THREAT.POKE_ZONE]: "E forward for trades. Short range but high burst."
  },
  missfortune: {
    [THREAT.HARD_CC]: "R channel interrupted by CC. Wait for lockdown to be used.",
    [THREAT.SOFT_CC]: "Slows cancel your W. Play around it.",
    [THREAT.SHIELD_PEEL]: "R shreds shields. Multi-target damage.",
    [THREAT.GAP_CLOSE]: "E slow to kite. R from safety.",
    [THREAT.BURST]: "R is your burst. Poke with Q bounces first.",
    [THREAT.POKE_ZONE]: "Q poke and R zone control. Don't get caught."
  },
  nilah: {
    [THREAT.HARD_CC]: "Your short range is risky. W blocks some CC but not all.",
    [THREAT.SOFT_CC]: "W dodges projectiles. Play around cooldowns.",
    [THREAT.SHIELD_PEEL]: "You heal through shields. Extended trades favor you.",
    [THREAT.GAP_CLOSE]: "Q dash in. W to escape or dodge.",
    [THREAT.BURST]: "Healing keeps you alive. All-in with support.",
    [THREAT.POKE_ZONE]: "W dodges poke. Get close for healing."
  },
  quinn: {
    [THREAT.HARD_CC]: "E to escape or R to roam. Respect lockdown range.",
    [THREAT.SOFT_CC]: "W gives vision. E to disengage.",
    [THREAT.SHIELD_PEEL]: "Burst combo and roam. Not sustained DPS.",
    [THREAT.GAP_CLOSE]: "E interrupts dashes. Chase with R.",
    [THREAT.BURST]: "You burst. R roam for picks.",
    [THREAT.POKE_ZONE]: "Poke with Q. Roam when lane pushed."
  },
  samira: {
    [THREAT.HARD_CC]: "W blocks some CC. Dash into melee carefully.",
    [THREAT.SOFT_CC]: "W to block. Dash (E) for mobility.",
    [THREAT.SHIELD_PEEL]: "R shreds everything. Build style points.",
    [THREAT.GAP_CLOSE]: "Dash in with them. All-in champion.",
    [THREAT.BURST]: "R is your burst. Stack style grade first.",
    [THREAT.POKE_ZONE]: "W to block. All-in to win lane."
  },
  senna: {
    [THREAT.HARD_CC]: "You're slow. E for invisibility or Flash.",
    [THREAT.SOFT_CC]: "Your range keeps you safe. Root (W) for peel.",
    [THREAT.SHIELD_PEEL]: "Poke through shields. Infinite scaling.",
    [THREAT.GAP_CLOSE]: "Root and kite. Huge range advantage.",
    [THREAT.BURST]: "You're squishy. R shields for safety.",
    [THREAT.POKE_ZONE]: "You outrange everyone. Q heal sustain."
  },
  sivir: {
    [THREAT.HARD_CC]: "E to spellshield one ability. Time it perfectly.",
    [THREAT.SOFT_CC]: "E blocks CC. R speed to escape.",
    [THREAT.SHIELD_PEEL]: "Ricochet and waveclear. Poke through shields.",
    [THREAT.GAP_CLOSE]: "E to block engage. R to kite or chase.",
    [THREAT.BURST]: "E one burst spell. Lifesteal through the rest.",
    [THREAT.POKE_ZONE]: "Q poke. E to block. Push waves."
  },
  tristana: {
    [THREAT.HARD_CC]: "W to escape. R to self-peel. Respect their engage.",
    [THREAT.SOFT_CC]: "W resets help. Jump away from CC.",
    [THREAT.SHIELD_PEEL]: "Bomb damage chunks shields. All-in level 2-6.",
    [THREAT.GAP_CLOSE]: "Jump on them or away. R for self-peel.",
    [THREAT.BURST]: "You burst. E bomb + jump combos.",
    [THREAT.POKE_ZONE]: "Outrange late game. Jump for safety."
  },
  twitch: {
    [THREAT.HARD_CC]: "You're squishy. R from invisibility for safety.",
    [THREAT.SOFT_CC]: "Q invisibility to reposition. Kite carefully.",
    [THREAT.SHIELD_PEEL]: "R true damage range shreds. Position well.",
    [THREAT.GAP_CLOSE]: "Q invis to escape. R from safe range.",
    [THREAT.BURST]: "R is your burst window. Assassinate from stealth.",
    [THREAT.POKE_ZONE]: "Q to reposition. R from invisibility."
  },
  varus: {
    [THREAT.HARD_CC]: "You're immobile. Cleanse or Flash. R for self-peel.",
    [THREAT.SOFT_CC]: "Your range helps. R chain CC for picks.",
    [THREAT.SHIELD_PEEL]: "Blight stacks shred. Q poke through shields.",
    [THREAT.GAP_CLOSE]: "R to root. No mobility—respect their range.",
    [THREAT.BURST]: "Q execute. Poke before fighting.",
    [THREAT.POKE_ZONE]: "You out-poke. Q spam from safety."
  },
  vayne: {
    [THREAT.HARD_CC]: "Q for small repositioning. Respect CC range.",
    [THREAT.SOFT_CC]: "Slows hurt. Q + R for mobility.",
    [THREAT.SHIELD_PEEL]: "True damage ignores shields. Kite and proc silver bolts.",
    [THREAT.GAP_CLOSE]: "E condemn to interrupt. Q to reposition.",
    [THREAT.BURST]: "You duel well. R + Q invisibility.",
    [THREAT.POKE_ZONE]: "You outscale. Farm safely until strong."
  },
  xayah: {
    [THREAT.HARD_CC]: "R for invulnerability. Feathers for root self-peel.",
    [THREAT.SOFT_CC]: "R dodges. Feather root for peel.",
    [THREAT.SHIELD_PEEL]: "Feather damage shreds. E for burst.",
    [THREAT.GAP_CLOSE]: "E root. R to dodge dive.",
    [THREAT.BURST]: "E burst. R invulnerability window.",
    [THREAT.POKE_ZONE]: "Feathers for poke. Play around feather positions."
  },
  zeri: {
    [THREAT.HARD_CC]: "Your mobility helps but CC stops you. Kite constantly.",
    [THREAT.SOFT_CC]: "Speed stacking overcomes slows. Keep moving.",
    [THREAT.SHIELD_PEEL]: "You shred shields with DPS. R for speed.",
    [THREAT.GAP_CLOSE]: "E through walls. R speed to kite.",
    [THREAT.BURST]: "R speed makes you hard to catch. Keep moving.",
    [THREAT.POKE_ZONE]: "Q spam poke. E through walls."
  },
  aphelios: {
    [THREAT.HARD_CC]: "You're immobile. Cleanse/Flash critical. Position well.",
    [THREAT.SOFT_CC]: "Gun swaps for mobility. Gravitum root for peel.",
    [THREAT.SHIELD_PEEL]: "Chakrams shred shields. Infernum AoE.",
    [THREAT.GAP_CLOSE]: "Gravitum slow/root. Calibrum range.",
    [THREAT.BURST]: "R + Crescendum for burst. Poke with Calibrum.",
    [THREAT.POKE_ZONE]: "Calibrum outranges poke. Gun swap mastery."
  },
  yunara: {
    [THREAT.HARD_CC]: "Position behind frontline. Use mobility to dodge.",
    [THREAT.SOFT_CC]: "Your mobility helps. Kite carefully.",
    [THREAT.SHIELD_PEEL]: "DPS shreds shields. Extended trades.",
    [THREAT.GAP_CLOSE]: "Mobility to escape. Kite backwards.",
    [THREAT.BURST]: "Lifesteal and positioning. Don't get caught.",
    [THREAT.POKE_ZONE]: "Outrange and kite. Use mobility."
  },
  smolder: {
    [THREAT.HARD_CC]: "You scale. Survive lane with Flash/Cleanse.",
    [THREAT.SOFT_CC]: "Farm safely. You outscale.",
    [THREAT.SHIELD_PEEL]: "Scaling damage shreds. Stack safely.",
    [THREAT.GAP_CLOSE]: "E for peel. Focus on stacking.",
    [THREAT.BURST]: "You're weak early. Farm and scale.",
    [THREAT.POKE_ZONE]: "Farm from range. Stack Q passive."
  }
};

function adcNoteFromTemplates(adcName, threats = []) {
  if (!adcName) return "";
  const key = normalizeADCKey(adcName);
  const templates = ADC_TEMPLATES[key];
  if (!templates) return "";
  const t = primaryThreat(threats);
  return t ? (templates[t] || "") : "";
}

// ============================================================================
// PASSIVE SUMMARIES
// ============================================================================

const PASSIVE_SUMMARIES = {
  Aatrox: "Revive on takedown + healing",
  Ahri: "Essence theft healing",
  Akali: "Energy + proc damage",
  Akshan: "Revive on scoundrel kill",
  Alistar: "Damage reduction ultimate",
  Ambessa: "Momentum stacks for damage",
  Amumu: "Cursed Touch (DoT)",
  Anivia: "Egg revive",
  Annie: "Stun on 4th spell",
  Aphelios: "5 rotating weapons",
  Ashe: "Slow on auto + crit = damage",
  AurelionSol: "Stardust orbiting",
  Azir: "Sand soldier emperor",
  Bard: "Meeps + chimes",
  Belveth: "True form + void scaling",
  Blitzcrank: "Mana shield barrier",
  Brand: "Ablaze DoT + combos",
  Braum: "Stun on 4 autos (ally)",
  Briar: "Lifesteal + berserk",
  Caitlyn: "Headshot on bushes/traps",
  Camille: "Adaptive shield",
  Cassiopeia: "Boots disabled, speed scaling",
  Chogath: "Eat for size + HP",
  Corki: "Package + mixed damage",
  Darius: "Hemorrhage bleed stacks",
  Diana: "3-hit burst",
  DrMundo: "Max HP regen",
  Draven: "Gold stacks on axe catch",
  Ekko: "3-hit execute + shield",
  Elise: "Human/Spider form",
  Evelynn: "Stealth after 6 + charm",
  Ezreal: "Spellcast stacks AS",
  Fiddlesticks: "Fear + effigy clone",
  Fiora: "Vital proc true dmg",
  Fizz: "Ignore unit collision",
  Galio: "MR = AP",
  Gangplank: "Kegs + DoT",
  Garen: "Out-of-combat regen",
  Gnar: "Transform: Mini/Mega",
  Gragas: "HP sustain on abilities",
  Graves: "Shotgun + reload",
  Gwen: "AP converts to damage + heal",
  Hecarim: "Movespeed = AD",
  Heimerdinger: "Turrets",
  Hwei: "Combo spells",
  Illaoi: "Tentacles + Test of Spirit",
  Irelia: "4-stack damage boost",
  Ivern: "Jungle assist (no farm)",
  Janna: "Movespeed aura",
  JarvanIV: "Knockup + flag combo",
  Jax: "3rd auto magic burst",
  Jayce: "Hammer/Cannon swap",
  Jhin: "4th shot execute + reload",
  Jinx: "Get Excited on takedown",
  Kaisa: "Evolve abilities (plasma)",
  Kalista: "Hop on auto + oathsworn",
  Karma: "Mantra ability upgrades",
  Karthus: "7s after death casting",
  Kassadin: "Anti-magic shield",
  Katarina: "Reset on takedown",
  Kayle: "Range + exalted scaling",
  Kayn: "Rhaast/Shadow form",
  Kennen: "Mark stuns",
  Khazix: "Isolation damage",
  Kindred: "Mark stacks (range/HP)",
  Kled: "Skaarl remount",
  KogMaw: "Suicide on death",
  KSante: "All Out",
  Leblanc: "Clone on damage",
  LeeSin: "2-spell combo energy",
  Leona: "Ally proc stun",
  Lillia: "Dream Dust stack DoT",
  Lissandra: "Free spell periodically",
  Lucian: "Double-tap after spell",
  Lulu: "Pix partner + help",
  Lux: "Illumination mark burst",
  Malphite: "Shield on health",
  Malzahar: "Spell shield (passive)",
  Maokai: "Heal on spell hit",
  MasterYi: "Double strike every 3rd",
  Milio: "Cozy Campfire heal",
  MissFortune: "Movespeed out-of-combat",
  Mordekaiser: "3-hit damage + shield",
  Morgana: "Vamp on abilities",
  Naafiri: "Pack summons",
  Nami: "Bounce spells empower ally",
  Nasus: "Q stacking",
  Nautilus: "Root on first auto",
  Neeko: "Clone disguise",
  Nidalee: "Human/Cougar form",
  Nilah: "XP + heal share",
  Nocturne: "Shadow Trail sustain",
  Nunu: "Largest snowball",
  Olaf: "AS on low HP",
  Orianna: "Ball commands",
  Ornn: "Forge items + %upgrades",
  Pantheon: "Spear stacks = empowered",
  Poppy: "Shield pickup",
  Pyke: "Gray health + gold share",
  Qiyana: "Element enchant",
  Quinn: "Harrier mark vision + burst",
  Rakan: "Shield after dash",
  Rammus: "Reflect on thornmail",
  RekSai: "Tunnel network",
  Rell: "Mount/Dismount forms",
  Renata: "Revive zombie",
  Renekton: "Fury resource",
  Rengar: "Bush leap + ferocity",
  Riven: "Runic Blade (weave autos)",
  Rumble: "Heat system (danger zone)",
  Ryze: "Mana scaling",
  Samira: "Style grade = R unlock",
  Sejuani: "Frost armor + stun",
  Senna: "Infinite range + crit scaling",
  Seraphine: "Echo note double-cast",
  Sett: "Grit shield from damage",
  Shaco: "Backstab bonus damage",
  Shen: "Ki shield + sword",
  Shyvana: "Dragon form + fury",
  Singed: "Poison trail",
  Sion: "Zombie revive",
  Sivir: "Ricochet on crit",
  Skarner: "Crystal Spires (Q)",
  Smolder: "Dragon Practice scaling",
  Sona: "Auras rotate",
  Soraka: "Q heal buff",
  Swain: "Soul Fragment healing",
  Sylas: "Steal ultimates",
  Syndra: "Transcendent sphere stacks",
  TahmKench: "Devour (An Acquired Taste)",
  Taliyah: "Wall Ride near walls",
  Talon: "Bleed on combo",
  Taric: "Bravado double-hit",
  Teemo: "Shroom traps + blind",
  Thresh: "Souls = Armor/AP",
  Tristana: "Bomb execute resets",
  Trundle: "Heal in zone",
  Tryndamere: "Crit + unkillable R",
  TwistedFate: "Pick a Card + gold",
  Twitch: "Poison + stealth",
  Udyr: "Stance awakening",
  Urgot: "W toggle shredding",
  Varus: "Blight stack executes",
  Vayne: "Silver Bolts (3-hit true)",
  Veigar: "AP stacking",
  Velkoz: "True damage research",
  Vex: "Fear burst on dash",
  Vi: "Denting Blows",
  Viego: "Possess on kill",
  Viktor: "Hex Core upgrades",
  Vladimir: "Bloodpool + crimson",
  Volibear: "Lightning claws",
  Warwick: "Blood Hunt (low HP)",
  Wukong: "Warrior Trickster clone",
  Xayah: "Feather combos",
  Xerath: "Mana on auto",
  XinZhao: "3-hit challenge",
  Yasuo: "Shield + double crit",
  Yone: "Azakana form + shield",
  Yorick: "Ghouls + Maiden",
  Yuumi: "Attach + heal",
  Zac: "Bloblets HP pickup",
  Zed: "Shadow mimics",
  Zeri: "Spark Pack (movespeed)",
  Ziggs: "Bomb everything",
  Zilean: "XP share",
  Zoe: "Spell shards pickup",
  Zyra: "Plant spawns",
  Mel: "Shimmer Shield",
  Aurora: "Spirit realm form",
  Yunara: "Spiritual synergy"
};

function briefPassiveForADC(champ) {
  const name = champ.name || "";
  return PASSIVE_SUMMARIES[name] || (champ.passive ? champ.passive.slice(0, 50) : "");
}

// ============================================================================
// SUPPORT SYNERGY FUNCTIONS
// ============================================================================

function updateSupportTipsSection() {
  const section = document.getElementById('supportTipsSection');
  if (!CURRENT_ADC) {
    section.classList.remove('show');
    return;
  }

  section.classList.add('show');

  // Update general tips
  const tipsContainer = section.querySelector('.tip-cards');
  tipsContainer.innerHTML = `
    <div class="tip-card">
      <div class="tip-card-title">🎯 Positioning</div>
      <div class="tip-card-text">${GENERAL_SUPPORT_TIPS.positioning}</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-title">⚡ Trading Windows</div>
      <div class="tip-card-text">${GENERAL_SUPPORT_TIPS.trading}</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-title">🔄 Wave Management</div>
      <div class="tip-card-text">${GENERAL_SUPPORT_TIPS.waveManagement}</div>
    </div>
    <div class="tip-card">
      <div class="tip-card-title">🎪 All-In Timing</div>
      <div class="tip-card-text">${GENERAL_SUPPORT_TIPS.allInTiming}</div>
    </div>
  `;

  // Update best supports grid
  const bestSupports = BEST_SUPPORTS[CURRENT_ADC] || [];
  const supportSynergies = SUPPORT_SYNERGY_TIPS[CURRENT_ADC] || {};
  const supportsGrid = section.querySelector('.best-supports-grid');

  supportsGrid.innerHTML = bestSupports.map(supportName => {
    const synergy = supportSynergies[supportName] || "Strong synergy with this support.";
    return `
      <div class="support-card">
        ${portraitImgHTML(supportName, supportName)}
        <div class="support-info">
          <div class="support-name">${supportName}</div>
          <div class="support-synergy">${synergy}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getSupportSynergyForChampion(championName) {
  if (!CURRENT_ADC) return "";

  const supportSynergies = SUPPORT_SYNERGY_TIPS[CURRENT_ADC];
  if (!supportSynergies) return "";

  // Check if this champion is a support in the synergy list
  const synergy = supportSynergies[championName];
  if (synergy) {
    return synergy;
  }

  // If champion is in best supports list but no specific tip
  const bestSupports = BEST_SUPPORTS[CURRENT_ADC] || [];
  if (bestSupports.includes(championName)) {
    return "🤝 Strong synergy with " + CURRENT_ADC;
  }

  return "";
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

function threatTagsUnion(abilities = []) {
  const union = Array.from(new Set(abilities.flatMap(a => a.threat || [])));
  const sorted = PRIORITY.filter(t => union.includes(t));
  return sorted.map(t =>
    `<span class="tag ${tagToClass(t)}">${THREAT_LABEL[t]}</span>`
  ).join("");
}

function abilityPills(abilities = [], _champ) {
  return abilities.map(ab => {
    const cls = primaryThreatClass(ab.threat || []);
    const key = ab.key || "?";
    const name = ab.name || "";
    const notes = ab.notes || "";
    const title = `${name}\n${notes}`;
    return `<span class="ability-pill ${cls}" title="${title}">${key}</span>`;
  }).join("");
}

function renderGroupRow(label, cols = 8) {
  return `<tr class="row" style="background:transparent;border:0">
    <td colspan="${cols}" style="color:var(--gold);text-transform:uppercase;font-weight:700;padding:2px 6px">${label}</td>
  </tr>`;
}

function renderChampRow(group, champ) {
  const abilities = champ.abilities || [];
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  const union = (abilities || []).flatMap(a => a.threat || []);
  const adcNote = ov?.note || adcNoteFromTemplates(CURRENT_ADC, union);
  const supportSynergy = getSupportSynergyForChampion(champ.name);

  return `<tr class="row">
    <td class="group">${group}</td>
    <td class="champ">
      <div class="cell-champ">
        ${portraitImgHTML(champ.portrait || champ.slug, champ.name)}
        <div>${champ.name}</div>
      </div>
    </td>
    <td class="role">${(champ.tags || []).join(" • ") || ""}</td>
    <td class="passive">${briefPassiveForADC(champ)}</td>
    <td class="abilities"><div class="ability-pills">${abilityPills(abilities, champ)}</div></td>
    <td class="threats"><div class="tags-mini">${threatTagsUnion(abilities)}</div></td>
    <td class="notes">${adcNote || ""}</td>
    <td class="synergy">${supportSynergy || ""}</td>
  </tr>`;
}

function render() {
  const tbody = qs("#resultsBody");
  const emptyState = qs("#emptyState");
  const resultsSection = qs("#resultsSection");

  if (!CURRENT_ADC || !CHAMPIONS.length) {
    emptyState.style.display = "flex";
    resultsSection.style.display = "none";
    updateSupportTipsSection();
    return;
  }

  emptyState.style.display = "none";
  resultsSection.style.display = "block";
  updateSupportTipsSection();

  const grouped = {
    Assassin: [],
    Fighter: [],
    Mage: [],
    Marksman: [],
    Support: [],
    Tank: []
  };

  for (const ch of CHAMPIONS) {
    const tags = ch.tags || [];
    let placed = false;
    for (const g of ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"]) {
      if (tags.includes(g)) {
        grouped[g].push(ch);
        placed = true;
        break;
      }
    }
    if (!placed) grouped.Fighter.push(ch);
  }

  const order = ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"];
  let html = "";
  for (const g of order) {
    if (grouped[g].length) {
      html += renderGroupRow(g);
      for (const ch of grouped[g]) {
        html += renderChampRow(g, ch);
      }
    }
  }
  tbody.innerHTML = html;
}

// ============================================================================
// INITIALIZATION & EVENTS
// ============================================================================

async function init() {
  try {
    const resp = await fetch(DATA_URL);
    if (!resp.ok) throw new Error("Failed to load champions data");
    const raw = await resp.json();
    ensureThreatsForAllAbilities(raw);
    CHAMPIONS = raw;
    buildADCGrid();
  } catch (err) {
    console.error("Error loading data:", err);
    qs("#emptyState").innerHTML = `<div style="color:#c9aa71;font-size:18px">⚠ Failed to load champion data. Please refresh.</div>`;
  }
}

function buildADCGrid() {
  const grid = qs("#adcGrid");
  const html = ADC_IDS.map(id => {
    const slug = id.replace(/\s+/g, "");
    const portraitHTML = portraitImgHTML(slug, id);
    return `
      <div class="adc-card" data-adc="${id}">
        ${portraitHTML}
        <div class="adc-name">${id}</div>
      </div>
    `;
  }).join("");
  grid.innerHTML = html;

  grid.querySelectorAll(".adc-card").forEach(card => {
    card.addEventListener("click", () => {
      const adc = card.dataset.adc;
      selectADC(adc);
    });
  });
}

function selectADC(adcName) {
  CURRENT_ADC = adcName;
  qs("#adcGrid").querySelectorAll(".adc-card").forEach(c => {
    c.classList.toggle("selected", c.dataset.adc === adcName);
  });
  loadOverridesFor(adcName);
  render();
}

// ============================================================================
// START
// ============================================================================

document.addEventListener("DOMContentLoaded", init);
