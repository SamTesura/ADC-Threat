/* ADC Threat Lookup — 25.15
   - Enforces ADC selection first (image grid)
   - Guarantees threat labels/colors for every ability (fallback classifier)
   - Priority: HARD_CC > SOFT_CC > SHIELD_PEEL > GAP_CLOSE > BURST > POKE_ZONE
   - Pills show Q/W/E/R + CDs + small threat label; Soft CC shows "Cleanse" badge
   - Threats column chips are colored
   - New "Passive (ADC)" column
   - ADC-specific tips for ALL ADCs via templates (+ optional per-ADC override JSONs)
*/

const DDRAGON_VERSION = "14.14.1";
const DATA_URL = "champions_adc_verified_2515.json";

const THREAT = {
  HARD_CC:"HARD_CC",
  SOFT_CC:"SOFT_CC",
  SHIELD_PEEL:"SHIELD_PEEL",
  GAP_CLOSE:"GAP_CLOSE",
  BURST:"BURST",
  POKE_ZONE:"POKE_ZONE"
};

// *** Priority you requested ***
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
let ADC_OVERRIDES = null; // optional per-ADC custom pack

// All ADCs for the portrait grid
const ADC_IDS = ["Ashe","Caitlyn","Corki","Draven","Ezreal","Jhin","Jinx","KaiSa","Kalista","KogMaw","Lucian","MissFortune","Nilah","Quinn","Samira","Senna","Sivir","Tristana","Twitch","Varus","Vayne","Xayah","Zeri","Aphelios"];

// ===== Helpers
const qs = (s,el=document)=>el.querySelector(s);
function portraitUrl(slug){ return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`; }
function primaryThreat(threats=[]){ for(const t of PRIORITY){ if(threats.includes(t)) return t; } return null; }
function primaryThreatClass(threats=[]){ const t = primaryThreat(threats); return t ? THREAT_CLASS[t] : ""; }
function tagToClass(t){ return THREAT_CLASS[t] || ""; }

// ===== Fallback threat classifier (strict to LoL Wiki rules)
// Airborne / ANY displacement => HARD CC (non-removable); stuns/roots/etc => SOFT CC (Cleanse/QSS-removable)
const RX = {
  // HARD CC by displacement/airborne
  air:/\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch|toss|push|pull|yank|drag|shove|displace|knockdown)\b/i,

  // SOFT CC (cleanseable)
  stun:/\bstun(?:s|ned|ning)?\b/i, root:/\b(root|snare|immobiliz(?:e|ed|es))\b/i,
  charm:/\bcharm(?:ed|s|ing)?\b/i, taunt:/\btaunt(?:ed|s|ing)?\b/i,
  fear:/\b(fear|terrify|flee)\b/i, sleep:/\b(sleep|drowsy)\b/i,
  silence:/\bsilence(?:d|s|ing)?\b/i, polymorph:/\bpolymorph(?:ed|s|ing)?\b/i,
  slow:/\bslow|cripple|chill\b/i, blind:/\bblind|nearsight\b/i, grounded:/\bground(?:ed)?\b/i,

  // Utility
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

      if (RX.air.test(txt)) tags.add(THREAT.HARD_CC); // displacement = HARD

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

  // Canonical corrections where tooltips can mislead (add more here as we verify)
  const fix = (slug, key, forced)=> {
    const c = list.find(x=>(x.slug||x.name).toLowerCase()==slug.toLowerCase());
    if(!c) return; const a = (c.abilities||[]).find(s=>s.key===key); if(!a) return; a.threat = forced;
  };

  // Thresh — Q=Soft (stun/cleanseable), W=Shield, E=Hard(+Soft slow), R=Soft (slow)
  fix("Thresh","Q",[THREAT.SOFT_CC]);
  fix("Thresh","W",[THREAT.SHIELD_PEEL]);
  fix("Thresh","E",[THREAT.HARD_CC, THREAT.SOFT_CC]);
  fix("Thresh","R",[THREAT.SOFT_CC]);

  // Alistar — Q=Hard (knockup), W=Hard (knockback)+Gap, E=Soft (stun), R=Shield/Peel (cleanse/DR)
  fix("Alistar","Q",[THREAT.HARD_CC]);
  fix("Alistar","W",[THREAT.HARD_CC, THREAT.GAP_CLOSE]);
  fix("Alistar","E",[THREAT.SOFT_CC]);
  fix("Alistar","R",[THREAT.SHIELD_PEEL]);
}

// ===== Load main dataset
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
  buildAdcGrid();
  buildSearchInputs();
  lockTeamUI(true);
  render();
}

// ===== Per-ADC override packs (optional champion-specific tips)
async function loadOverridesFor(adcName){
  ADC_OVERRIDES = null;
  if(!adcName) return;
  const slug = adcName.replace(/\s+/g,"");
  const url = `adc_overrides_${slug}_25.15.json`;
  try{
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) ADC_OVERRIDES = await r.json();
  }catch(_e){ /* optional */ }
}
function getOverrideEntryForChampion(slugOrName){
  if(!ADC_OVERRIDES || ADC_OVERRIDES.adc !== CURRENT_ADC) return null;
  const key = (slugOrName||"").replace(/\s+/g,"");
  return (ADC_OVERRIDES.champions||[]).find(c => (c.slug||"").replace(/\s+/g,"") === key);
}

// ===== ADC templates for ALL ADCs (ability-level tips per primary threat)
const T = THREAT;
const ADC_TEMPLATES = {
  "Ashe":       { [T.HARD_CC]:"Play wide; save Flash for point-and-click/arrow chains.", [T.SOFT_CC]:"Step out early; don’t burn Flash for slows.", [T.SHIELD_PEEL]:"Swap targets—peel beats your slow.", [T.GAP_CLOSE]:"Kite back; place W to slow re-engage.", [T.BURST]:"Short trades; keep distance before R.", [T.POKE_ZONE]:"Farm with W; don’t sit in zones." },
  "Caitlyn":    { [T.HARD_CC]:"Trap defensively; keep net for engage CC.", [T.SOFT_CC]:"Respect slows—net out, kite while snaring.", [T.SHIELD_PEEL]:"Bait shields with Q then trap.", [T.GAP_CLOSE]:"Net instantly; don’t net in.", [T.BURST]:"Stay max range; avoid long trades.", [T.POKE_ZONE]:"Trade around headshot windows." },
  "Corki":      { [T.HARD_CC]:"Hold package/Flash for big CC; don’t facecheck.", [T.SOFT_CC]:"Rocket peel and kite back.", [T.SHIELD_PEEL]:"Wait out shields; poke with rockets.", [T.GAP_CLOSE]:"Valkyrie back, not forward.", [T.BURST]:"Short trades pre-R; respect assassins.", [T.POKE_ZONE]:"Abuse rockets; don’t commit into zones." },
  "Draven":     { [T.HARD_CC]:"Never trade into guaranteed CC; catch axes safely.", [T.SOFT_CC]:"Step off slows; don’t tunnel on axes.", [T.SHIELD_PEEL]:"Force shield first; then all-in.", [T.GAP_CLOSE]:"Kite back; E to interrupt dives.", [T.BURST]:"Trade only on your CDs; snowball or chill.", [T.POKE_ZONE]:"Farm safe; don’t bleed HP." },
  "Ezreal":     { [T.HARD_CC]:"Hold E strictly for key CC; don’t E aggressively.", [T.SOFT_CC]:"E to break slows; angle sideways.", [T.SHIELD_PEEL]:"Poke shields off with Q.", [T.GAP_CLOSE]:"Kite back; E after they commit.", [T.BURST]:"Short trades; play safe until items.", [T.POKE_ZONE]:"Arc Qs; avoid standing still." },
  "Jhin":       { [T.HARD_CC]:"You’re immobile—space wide; save Flash.", [T.SOFT_CC]:"Don’t get chipped pre-4th shot; pre-move.", [T.SHIELD_PEEL]:"Bait peel then root.", [T.GAP_CLOSE]:"Trap retreat path; don’t get flanked.", [T.BURST]:"Respect assassins; cancel ult if threatened.", [T.POKE_ZONE]:"Use W on slowed targets; don’t channel in zones." },
  "Jinx":       { [T.HARD_CC]:"If CC’d you die—hug minions; keep Flash.", [T.SOFT_CC]:"Chompers defensively; don’t chase slows.", [T.SHIELD_PEEL]:"Peel breaks your resets—kite then re-enter.", [T.GAP_CLOSE]:"Swap to rockets and kite; chompers on self.", [T.BURST]:"Don’t greed for DPS; respect fog.", [T.POKE_ZONE]:"Farm safe; fish with W." },
  "KaiSa":      { [T.HARD_CC]:"Hold R to dodge CC; don’t dive blind.", [T.SOFT_CC]:"Use E to disengage; cleanse slows with spacing.", [T.SHIELD_PEEL]:"Bait peel then R in.", [T.GAP_CLOSE]:"Backstep; R only after CC is down.", [T.BURST]:"Trade around passive; shieldbow/GA windows.", [T.POKE_ZONE]:"Poke with W; don’t commit into traps." },
  "Kalista":    { [T.HARD_CC]:"Hop spacing; never hop forward into CC.", [T.SOFT_CC]:"Hop wider; Rend to peel.", [T.SHIELD_PEEL]:"Force peel, then Fates Call re-engage.", [T.GAP_CLOSE]:"Kite back; save Fates Call to reset.", [T.BURST]:"Short skirmishes; stack spears safely.", [T.POKE_ZONE]:"Don’t hop into zones; Rend clear." },
  "KogMaw":     { [T.HARD_CC]:"You’re immobile—play far back; demands peel.", [T.SOFT_CC]:"Kite wider; don’t stand in slows.", [T.SHIELD_PEEL]:"Wait for shields to drop; then DPS.", [T.GAP_CLOSE]:"Ping peel; kite back to team.", [T.BURST]:"Respect assassins; front-to-back only.", [T.POKE_ZONE]:"Use R to poke; no face-checks." },
  "Lucian":     { [T.HARD_CC]:"Buffer E or Flash; never E in if CC up.", [T.SOFT_CC]:"Dash wide to break slows; trade short.", [T.SHIELD_PEEL]:"Bait shields with Q/W before E in.", [T.GAP_CLOSE]:"Punish post-dash; don’t E first.", [T.BURST]:"Short burst trades on Nami proc.", [T.POKE_ZONE]:"Step out, then re-enter for quick proc." },
  "MissFortune":{ [T.HARD_CC]:"Keep Flash; cancel channel if threatened.", [T.SOFT_CC]:"Don’t get chipped—trade with Q bounce.", [T.SHIELD_PEEL]:"Bait shield then R.", [T.GAP_CLOSE]:"E slow to peel; don’t channel into dives.", [T.BURST]:"Channel only with cover; cancel early if needed.", [T.POKE_ZONE]:"Poke with Q/E; angle ult from safety." },
  "Nilah":      { [T.HARD_CC]:"Save W/E; don’t E into CC.", [T.SOFT_CC]:"W negates autos—time it vs slows.", [T.SHIELD_PEEL]:"Bait peel then R pull.", [T.GAP_CLOSE]:"Engage only with support; don’t solo dive.", [T.BURST]:"Short skirmishes; lifesteal back up.", [T.POKE_ZONE]:"Don’t bleed HP; look for all-in only." },
  "Quinn":      { [T.HARD_CC]:"Respect point-click CC; you die if caught.", [T.SOFT_CC]:"Vault out of slows; kite range.", [T.SHIELD_PEEL]:"Swap target on shields.", [T.GAP_CLOSE]:"Don’t blind-dive; keep E for peel.", [T.BURST]:"Short trades; disengage with MS.", [T.POKE_ZONE]:"Poke then roam; don’t sit in zones." },
  "Samira":     { [T.HARD_CC]:"Any hard CC ends you—space wide.", [T.SOFT_CC]:"Use W vs projectiles; don’t feed stacks.", [T.SHIELD_PEEL]:"Bait peel, then commit R.", [T.GAP_CLOSE]:"Don’t dash first; chain after engage.", [T.BURST]:"Save E for reset; don’t greed.", [T.POKE_ZONE]:"Avoid chip; look for all-ins only." },
  "Senna":      { [T.HARD_CC]:"Keep spacing; root trades kill you.", [T.SOFT_CC]:"Pre-move after autos; kite slow.", [T.SHIELD_PEEL]:"Poke shields off first.", [T.GAP_CLOSE]:"Don’t get flanked; W root to peel.", [T.BURST]:"Short trades; R shield allies.", [T.POKE_ZONE]:"Long poke—farm souls safely." },
  "Sivir":      { [T.HARD_CC]:"Hold E for key CC; don’t waste on poke.", [T.SOFT_CC]:"Pre-move; E if chained.", [T.SHIELD_PEEL]:"Spell Shield mirrors trades.", [T.GAP_CLOSE]:"Use R to disengage; kite.", [T.BURST]:"Short trades; Q poke first.", [T.POKE_ZONE]:"Push and poke—stay safe." },
  "Tristana":   { [T.HARD_CC]:"Don’t buffer W early; jump only post-CC.", [T.SOFT_CC]:"W out of slows; don’t chase blindly.", [T.SHIELD_PEEL]:"Bait peel; then all-in with R eject.", [T.GAP_CLOSE]:"Jump only when jungler known.", [T.BURST]:"Short skirmishes; use R to peel.", [T.POKE_ZONE]:"Harass with E+auto; don’t jump into zones." },
  "Twitch":     { [T.HARD_CC]:"If caught you die—ambush smart; track sweeper.", [T.SOFT_CC]:"Don’t commit into slows; kite back.", [T.SHIELD_PEEL]:"Wait out peel; then R spray.", [T.GAP_CLOSE]:"Keep stealth for reposition.", [T.BURST]:"Avoid midline; flank instead.", [T.POKE_ZONE]:"Stack safely; don’t DPS in zones." },
  "Varus":      { [T.HARD_CC]:"Respect engage—save Flash or R peel.", [T.SOFT_CC]:"Pre-move; Q poke from range.", [T.SHIELD_PEEL]:"Bait shield then lethality poke.", [T.GAP_CLOSE]:"Root to disengage.", [T.BURST]:"Don’t extend; burst from range.", [T.POKE_ZONE]:"Siege; don’t enter zones." },
  "Vayne":      { [T.HARD_CC]:"Any CC kills—hold Flash/Tumble.", [T.SOFT_CC]:"Tumble wider; don’t get chipped.", [T.SHIELD_PEEL]:"Bait peel then condemn.", [T.GAP_CLOSE]:"Kite back; condemn off walls.", [T.BURST]:"Short trades, stealth reset.", [T.POKE_ZONE]:"Farm to items; avoid poke." },
  "Xayah":      { [T.HARD_CC]:"Hold R for engage; don’t burn early.", [T.SOFT_CC]:"Feather slow peel; space wider.", [T.SHIELD_PEEL]:"Bait peel then feather root.", [T.GAP_CLOSE]:"Kite back; save R if dived.", [T.BURST]:"Short trades; cash out with feathers.", [T.POKE_ZONE]:"Don’t sit in zones; set feathers first." },
  "Zeri":       { [T.HARD_CC]:"CC ends you—keep E/Flash; avoid walls vs hooks.", [T.SOFT_CC]:"Kite longer lanes; E over terrain post-slow.", [T.SHIELD_PEEL]:"Disengage and re-enter with MS.", [T.GAP_CLOSE]:"Punish post-dash windows.", [T.BURST]:"Short trades; scale MS stack.", [T.POKE_ZONE]:"Zap poke; don’t overstay." },
  "Aphelios":   { [T.HARD_CC]:"You’re immobile—position perfectly; keep sums.", [T.SOFT_CC]:"Use Gravitum to peel slows back.", [T.SHIELD_PEEL]:"Swap targets when shields pop.", [T.GAP_CLOSE]:"Respect dives; save Gravitum.", [T.BURST]:"Short trades; don’t overchannel.", [T.POKE_ZONE]:"Infernum safe poke; avoid zones." }
};

// Champion-level summary from ADC template + union of threats
function adcNoteFromTemplates(adcName, threatsUnion){
  const t = ADC_TEMPLATES[adcName];
  if(!t) return "";
  for(const key of PRIORITY){ if(threatsUnion.includes(key)) return t[key]; }
  return "";
}
function abilityTipFromTemplates(adcName, threats){
  const t = ADC_TEMPLATES[adcName];
  if(!t) return "";
  const prim = primaryThreat(threats||[]);
  return prim ? t[prim] : "";
}

function abilityTipForADC(champ, abilityKey){
  // 1) Per-ADC override JSON (champ/ability) beats templates
  const ov = getOverrideEntryForChampion?.(champ.slug || champ.name);
  if (ov?.abilities?.[abilityKey]?.adcTip) return ov.abilities[abilityKey].adcTip;
  // 2) Otherwise, templated tip for CURRENT_ADC & primary threat
  const ability = (champ.abilities||[]).find(a=>a.key===abilityKey) || {};
  return abilityTipFromTemplates(CURRENT_ADC, ability.threat||[]);
}

// ===== Brief, ADC-focused passive notes (fallback)
const PASSIVE_OVERRIDES = {
  "Thresh": "Souls grant Armor/AP; lantern shields + ally dash — deny lantern.",
  "Alistar": "Heals self + nearest ally when stacks full — don’t trade as roar is about to proc.",
  "Nautilus": "Autos root briefly — avoid melee after he tags.",
  "Leona": "Autos apply Sunlight — avoid chain procs during all-ins.",
  "Braum": "Stacks stun on 4 — don’t eat consecutive autos/Q.",
  "KogMaw": "On death, explodes — don’t stand on body.",
  "MissFortune": "Love Tap bonus on new targets — don’t let her weave free harass."
  // Add more as you verify; dataset passives (if present) will override these
};

function briefPassiveForADC(champ){
  if (champ.passiveTip) return champ.passiveTip;
  if (champ.passive && champ.passive.name){
    const t = (champ.passive.short||champ.passive.desc||"").replace(/\s+/g," ").trim();
    return (t.length>200? t.slice(0,197)+"…" : t) || PASSIVE_OVERRIDES[champ.slug||champ.name] || "—";
  }
  return PASSIVE_OVERRIDES[champ.slug||champ.name] || "—";
}

// ===== ADC picker (grid, required)
function buildAdcGrid(){
  const grid = qs("#adcGrid");
  const lookup = new Map(CHAMPIONS.map(c=>[c.slug||c.name, c]));
  grid.innerHTML = ADC_IDS.map(id=>{
    const champ = lookup.get(id) || {name:id, portrait:id, slug:id};
    return `<button class="adc-card" data-adc="${champ.name}">
              <img src="${portraitUrl(champ.portrait||champ.slug)}" alt="${champ.name}">
              <span class="label">${champ.name}</span>
            </button>`;
  }).join("");
  grid.addEventListener("click", async (e)=>{
    const card = e.target.closest(".adc-card");
    if(!card) return;
    CURRENT_ADC = card.dataset.adc;
    [...grid.querySelectorAll(".adc-card")].forEach(el=>el.classList.toggle("selected", el===card));
    await loadOverridesFor(CURRENT_ADC); // optional per-ADC file
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

// ===== Search inputs
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
    const options = CHAMPIONS.filter(c=>c.name?.toLowerCase().includes(v)||c.slug?.toLowerCase().includes(v)).slice(0,12);
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

// ===== UI render
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");

function cleanseBadgeForAbility(ability){
  // Only Soft CC is cleanseable per your rule (hard CC never shows Cleanse badge)
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

function renderGroupRow(label, cols=7){  // updated for Passive column
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
        <img class="portrait-sm" src="${portraitUrl(champ.portrait||champ.slug)}" alt="">
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

// ===== Editor / Import / Export
const editorModal = qs("#editorModal");
const editorArea = qs("#editorArea");
qs("#openEditor").addEventListener("click", ()=>{ editorArea.value = JSON.stringify(CHAMPIONS,null,2); editorModal.showModal(); });
qs("#saveEditor").addEventListener("click", ()=>{ try{ const parsed=JSON.parse(editorArea.value); if(!Array.isArray(parsed)) throw new Error("Top-level must be an array"); CHAMPIONS=parsed; ensureThreatsForAllAbilities(CHAMPIONS); buildAdcGrid(); render(); editorModal.close(); }catch(err){ alert("Invalid JSON: "+err.message); }});
qs("#exportData").addEventListener("click", ()=>{ const blob=new Blob([JSON.stringify(CHAMPIONS,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="adc-threat-data.json"; a.click(); URL.revokeObjectURL(url); });
const importFile = qs("#importFile");
qs("#importData").addEventListener("click", ()=> importFile.click());
importFile.addEventListener("change",(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(!Array.isArray(data)) throw new Error("Top-level must be an array"); CHAMPIONS=data; ensureThreatsForAllAbilities(CHAMPIONS); buildAdcGrid(); render(); alert("Imported champion data."); }catch(err){ alert("Import failed: "+err.message);} }; r.readAsText(f); });

// ===== Compact toggle
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

// Init
loadChampions();
