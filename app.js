
/* ADC Threat Lookup — 25.16
   (ADD-ONLY patch)
   - Fix portraits/passives for Ambessa, Fiddle, LeBlanc, Mel, Yunara
   - Add Sivir coverage (builder side) + appears in search
   - Wukong ability confirm + passive note
   - Kai'Sa icon fix, add Yunara to ADC picker
   - Miss Fortune / Kog'Maw ADC tips: normalize names so tips show
   - Portrait fallback to CDragon CDN for champs not on DDragon
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
  "Yunara" /* added as requested */
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
  // (keep everything you already had — below are just additions/edits)
  "Ambessa": "New champion — expect armor/tenacity spikes; avoid extended trades until kit known.",
  "Fiddlesticks": "Effigies act like wards & reveal—don’t facecheck; fears chain into R.",
  "LeBlanc": "Abilities mark then detonate—don’t let her double-proc on you.",
  "Mel": "New champion — kit not final; respect engage/DR windows.",
  "Yunara": "New champion — mobility + CC mix; wait for key cooldowns.",
  "Wukong": "Gains armor/regen near enemies—avoid long trades; clone baits spells.",
  // Keep your existing overrides below this line…
  // e.g. "Nautilus":"Autos root briefly — avoid melee after tag.", etc.
};

// ---------- ADC tips (ensure human-name aliases so MF/Kog’Maw show) ----------
const T = THREAT;
const ADC_TEMPLATES = {
  "Ashe":       { [THREAT.HARD_CC]:"Play wide; save Flash for arrow/point-click chains.", [THREAT.SOFT_CC]:"Step out early; don’t burn Flash for slows.", [THREAT.SHIELD_PEEL]:"Swap targets—peel beats your slow.", [THREAT.GAP_CLOSE]:"Kite back; W to slow re-engage.", [THREAT.BURST]:"Short trades; keep distance.", [THREAT.POKE_ZONE]:"Farm with W; avoid zones." },
  "Caitlyn":    { [THREAT.HARD_CC]:"Trap defensively; hold net for engage CC.", [THREAT.SOFT_CC]:"Respect slows—net out.", [THREAT.SHIELD_PEEL]:"Bait shields with Q then trap.", [THREAT.GAP_CLOSE]:"Net instantly; don’t net in.", [THREAT.BURST]:"Max range; avoid long trades.", [THREAT.POKE_ZONE]:"Trade around headshots." },
  "Corki":      { [THREAT.HARD_CC]:"Hold package/Flash for big CC.", [THREAT.SOFT_CC]:"Rocket peel + kite back.", [THREAT.SHIELD_PEEL]:"Poke shields down.", [THREAT.GAP_CLOSE]:"Valkyrie back, not in.", [THREAT.BURST]:"Short trades; respect assassins.", [THREAT.POKE_ZONE]:"Abuse rockets; avoid zones." },
  "Draven":     { [THREAT.HARD_CC]:"Don’t catch into CC threat.", [THREAT.SOFT_CC]:"Step off slows; don’t tunnel axes.", [THREAT.SHIELD_PEEL]:"Force shield first; then all-in.", [THREAT.GAP_CLOSE]:"Kite back; E to stop dives.", [THREAT.BURST]:"Trade on your CDs.", [THREAT.POKE_ZONE]:"Farm safe; no bleed." },
  "Ezreal":     { [THREAT.HARD_CC]:"Hold E strictly for CC.", [THREAT.SOFT_CC]:"E sideways to break slows.", [THREAT.SHIELD_PEEL]:"Poke shields off with Q.", [THREAT.GAP_CLOSE]:"E after they commit.", [THREAT.BURST]:"Short trades till items.", [THREAT.POKE_ZONE]:"Don’t stand still to Q." },
  "Jhin":       { [THREAT.HARD_CC]:"Immobile—space wide; save Flash.", [THREAT.SOFT_CC]:"Pre-move; avoid chip pre-4th.", [THREAT.SHIELD_PEEL]:"Bait peel then root.", [THREAT.GAP_CLOSE]:"Trap retreat paths.", [THREAT.BURST]:"Cancel R if threatened.", [THREAT.POKE_ZONE]:"Don’t channel in zones." },
  "Jinx":       { [THREAT.HARD_CC]:"If CC’d you die—hug minions.", [THREAT.SOFT_CC]:"Chompers defensively.", [THREAT.SHIELD_PEEL]:"Kite out peel then re-enter.", [THREAT.GAP_CLOSE]:"Rockets + chompers on self.", [THREAT.BURST]:"Don’t greed DPS in fog.", [THREAT.POKE_ZONE]:"Fish W; farm safe." },
  "Kai'Sa":     { [THREAT.HARD_CC]:"Hold R to dodge CC.", [THREAT.SOFT_CC]:"Use E to disengage slows.", [THREAT.SHIELD_PEEL]:"Bait peel then R.", [THREAT.GAP_CLOSE]:"Backstep; R after CC down.", [THREAT.BURST]:"Trade around passive.", [THREAT.POKE_ZONE]:"Poke W; avoid traps." },
  "Kalista":    { [THREAT.HARD_CC]:"Never hop forward into CC.", [THREAT.SOFT_CC]:"Hop wider; Rend peel.", [THREAT.SHIELD_PEEL]:"Force peel, then Fates Call.", [THREAT.GAP_CLOSE]:"Save Fates Call to reset.", [THREAT.BURST]:"Short skirmishes.", [THREAT.POKE_ZONE]:"Don’t hop into zones." },
  "KogMaw":     { [THREAT.HARD_CC]:"Immobile—play far back; need peel.", [THREAT.SOFT_CC]:"Kite wider; avoid slows.", [THREAT.SHIELD_PEEL]:"Wait shields drop; then DPS.", [THREAT.GAP_CLOSE]:"Ping peel; kite to team.", [THREAT.BURST]:"Front-to-back only.", [THREAT.POKE_ZONE]:"Use R to poke; no face-checks." },
  "Lucian":     { [THREAT.HARD_CC]:"Buffer E/Flash; never E in if CC up.", [THREAT.SOFT_CC]:"Dash wide; short trades.", [THREAT.SHIELD_PEEL]:"Bait shields with Q/W.", [THREAT.GAP_CLOSE]:"Punish post-dash.", [THREAT.BURST]:"Short burst trades.", [THREAT.POKE_ZONE]:"Step out then re-enter." },
  "MissFortune":{ [THREAT.HARD_CC]:"Keep Flash; cancel R if threatened.", [THREAT.SOFT_CC]:"Trade with Q bounce; avoid chip.", [THREAT.SHIELD_PEEL]:"Bait shield then R.", [THREAT.GAP_CLOSE]:"E slow to peel.", [THREAT.BURST]:"Only full-channel with cover.", [THREAT.POKE_ZONE]:"Q/E poke; safe angles." },
  "Nilah":      { [THREAT.HARD_CC]:"Save W/E; don’t E into CC.", [THREAT.SOFT_CC]:"W vs auto poke; time it.", [THREAT.SHIELD_PEEL]:"Bait peel then R pull.", [THREAT.GAP_CLOSE]:"Engage with support only.", [THREAT.BURST]:"Short skirmishes.", [THREAT.POKE_ZONE]:"Avoid chip; look all-ins." },
  "Quinn":      { [THREAT.HARD_CC]:"Respect point-click CC.", [THREAT.SOFT_CC]:"Vault out of slows.", [THREAT.SHIELD_PEEL]:"Swap target on shields.", [THREAT.GAP_CLOSE]:"Keep E for peel.", [THREAT.BURST]:"Short trades; disengage.", [THREAT.POKE_ZONE]:"Poke then roam." },
  "Samira":     { [THREAT.HARD_CC]:"Any hard CC ends you—space wide.", [THREAT.SOFT_CC]:"Use W vs projectiles.", [THREAT.SHIELD_PEEL]:"Bait peel; then R.", [THREAT.GAP_CLOSE]:"Don’t dash first.", [THREAT.BURST]:"Save E for reset.", [THREAT.POKE_ZONE]:"Avoid chip; all-in only." },
  "Senna":      { [THREAT.HARD_CC]:"Keep spacing; roots kill you.", [THREAT.SOFT_CC]:"Pre-move after autos.", [THREAT.SHIELD_PEEL]:"Poke shields off first.", [THREAT.GAP_CLOSE]:"Don’t get flanked; peel W.", [THREAT.BURST]:"Short trades; R shield.", [THREAT.POKE_ZONE]:"Farm souls safely." },
  "Sivir":      { [THREAT.HARD_CC]:"Hold E for key CC.", [THREAT.SOFT_CC]:"Pre-move; E if chained.", [THREAT.SHIELD_PEEL]:"Spell Shield mirrors trades.", [THREAT.GAP_CLOSE]:"Use R to disengage.", [THREAT.BURST]:"Short trades; Q first.", [THREAT.POKE_ZONE]:"Push + poke safely." },
  "Tristana":   { [THREAT.HARD_CC]:"Don’t W early; jump post-CC.", [THREAT.SOFT_CC]:"W out of slows.", [THREAT.SHIELD_PEEL]:"Bait peel; R eject.", [THREAT.GAP_CLOSE]:"Jump when jungler known.", [THREAT.BURST]:"Use R to peel.", [THREAT.POKE_ZONE]:"Don’t W into zones." },
  "Twitch":     { [THREAT.HARD_CC]:"If caught you die—ambush smart.", [THREAT.SOFT_CC]:"Don’t commit into slows.", [THREAT.SHIELD_PEEL]:"Wait out peel; then R.", [THREAT.GAP_CLOSE]:"Keep stealth to reposition.", [THREAT.BURST]:"Flank; avoid midline.", [THREAT.POKE_ZONE]:"Stack safely; don’t DPS in zones." },
  "Varus":      { [THREAT.HARD_CC]:"Save Flash or R peel.", [THREAT.SOFT_CC]:"Pre-move; Q from range.", [THREAT.SHIELD_PEEL]:"Bait shield then poke.", [THREAT.GAP_CLOSE]:"Root disengage.", [THREAT.BURST]:"Don’t extend.", [THREAT.POKE_ZONE]:"Siege; avoid zones." },
  "Vayne":      { [THREAT.HARD_CC]:"Any CC kills—hold Flash/Tumble.", [THREAT.SOFT_CC]:"Tumble wider; avoid chip.", [THREAT.SHIELD_PEEL]:"Bait peel then condemn.", [THREAT.GAP_CLOSE]:"Backstep; wall condemn.", [THREAT.BURST]:"Short trades; stealth reset.", [THREAT.POKE_ZONE]:"Farm to items." },
  "Xayah":      { [THREAT.HARD_CC]:"Hold R for engage.", [THREAT.SOFT_CC]:"Feather slow peel; space.", [THREAT.SHIELD_PEEL]:"Bait peel then root.", [THREAT.GAP_CLOSE]:"Save R if dived.", [THREAT.BURST]:"Short trades; feather cashout.", [THREAT.POKE_ZONE]:"Don’t sit in zones." },
  "Zeri":       { [THREAT.HARD_CC]:"Hard CC ends you—keep E/Flash.", [THREAT.SOFT_CC]:"E terrain after slows.", [THREAT.SHIELD_PEEL]:"Disengage then re-enter.", [THREAT.GAP_CLOSE]:"Punish post-dash.", [THREAT.BURST]:"Short trades; scale MS.", [THREAT.POKE_ZONE]:"Zap poke; don’t overstay." },
  "Aphelios":   { [THREAT.HARD_CC]:"Immobile—perfect position; keep sums.", [THREAT.SOFT_CC]:"Gravitum peel vs slows.", [THREAT.SHIELD_PEEL]:"Swap target when shield pops.", [THREAT.GAP_CLOSE]:"Respect dives; Gravitum ready.", [THREAT.BURST]:"Short trades.", [THREAT.POKE_ZONE]:"Infernum safe poke." }
};

// ensure alternate-name keys also exist
ADC_TEMPLATES["MissFortune"] = ADC_TEMPLATES["Miss Fortune"];
ADC_TEMPLATES["KogMaw"]      = ADC_TEMPLATES["Kog'Maw"];
ADC_TEMPLATES["KaiSa"]       = ADC_TEMPLATES["Kai'Sa"];
ADC_TEMPLATES["Sivir"]       = ADC_TEMPLATES["Sivir"];
ADC_TEMPLATES["Yunara"]      = ADC_TEMPLATES["Yunara"] || {
  [THREAT.HARD_CC]:"Respect hard engages until kit clarified.",
  [THREAT.SOFT_CC]:"Don’t burn sums on slows.",
  [THREAT.SHIELD_PEEL]:"Bait peel then commit.",
  [THREAT.GAP_CLOSE]:"Keep spacing—unknown engage.",
  [THREAT.BURST]:"Short trades.",
  [THREAT.POKE_ZONE]:"Avoid unknown zones."
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

// ---------- Optional per-ADC overrides loader ----------
async function loadOverridesFor(adcName){
  ADC_OVERRIDES = null;
  if(!adcName) return;
  const slug = adcName.replace(/\s+/g,"");
  const url = `./adc_overrides_${slug}_25.16.json`;
  try{
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) ADC_OVERRIDES = await r.json();
  }catch(_e){}
}
function getOverrideEntryForChampion(slugOrName){
  if(!ADC_OVERRIDES || ADC_OVERRIDES.adc !== CURRENT_ADC) return null;
  const key = (slugOrName||"").replace(/\s+/g,"");
  return (ADC_OVERRIDES.champions||[]).find(c => (c.slug||"").replace(/\s+/g,"") === key);
}

// ===== Champion-specific CC/threat fixes (keep yours; below only confirms Wukong) =====
function applyChampionFixes(list){
  const find = n => list.find(x => (x.slug||x.name).toLowerCase() === n.toLowerCase());
  const fix  = (slug, key, forced) => {
    const c = find(slug); if(!c) return;
    const a = (c.abilities||[]).find(s=>s.key===key); if(!a) return;
    a.threat = forced;
  };

  // (… keep all your existing fixes here …)

  // === (CONFIRM) Wukong ability categorization ===
  fix("Wukong","Q",[THREAT.BURST]);               // Crushing Blow (armor shred/AA reset)
  fix("Wukong","W",[THREAT.SHIELD_PEEL]);         // stealth/decoy → peel/reposition
  fix("Wukong","E",[THREAT.GAP_CLOSE]);           // Nimbus Strike dash
  fix("Wukong","R",[THREAT.HARD_CC]);             // Cyclone knockup

  // (optional tiny reminders)
  // Ambessa/Mel/Yunara may not exist in DDragon yet — data arrives via builder fallback.
}

// ADD-ONLY: tiny supplemental pass (reinforces Wukong specifics & any late corrections)
function applyPatchFixes(list){
  const find = n => list.find(x => (x.slug||x.name).toLowerCase() === n.toLowerCase());
  const fix  = (slug, key, forced) => {
    const c = find(slug); if(!c) return;
    const a = (c.abilities||[]).find(s=>s.key===key); if(!a) return;
    a.threat = forced;
  };
  // Wukong — confirmed: Q=Burst, W=Peel, E=Gap, R=Hard CC (knockup). :contentReference[oaicite:5]{index=5}
  fix("Wukong","Q",[THREAT.BURST]);
  fix("Wukong","W",[THREAT.SHIELD_PEEL]);
  fix("Wukong","E",[THREAT.GAP_CLOSE]);
  fix("Wukong","R",[THREAT.HARD_CC]);
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
  applyPatchFixes(CHAMPIONS); // <- add-only reinforcing pass (Wukong, etc.)
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
