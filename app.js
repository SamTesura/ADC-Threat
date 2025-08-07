/* Simplified selection + TABLE rendering (fits one screen) */
const DDRAGON_VERSION = "14.14.1";

const THREAT = {
  HARD_CC:"HARD_CC", SOFT_CC:"SOFT_CC", BURST:"BURST", GAP_CLOSE:"GAP_CLOSE", POKE_ZONE:"POKE_ZONE", SHIELD_PEEL:"SHIELD_PEEL"
};

/* --- Demo data (keep your existing or import champions.json) --- */
let CHAMPIONS = window.CHAMPIONS || [
  { name:"Leona", slug:"Leona", tags:["SUPPORT","TANK"], portrait:"Leona",
    abilities:[
      {key:"Q",name:"Shield of Daybreak",cd:[5,5,5,5,5],threat:[THREAT.HARD_CC],notes:"Point-and-click stun after auto reset.",lucianTips:"Buffer E as stun lands.",ccCleanse:"Cleanseable"},
      {key:"E",name:"Zenith Blade",cd:[12,11,10,9,8],threat:[THREAT.GAP_CLOSE,THREAT.HARD_CC],notes:"Root at end.",lucianTips:"Punish 8–12s window.",ccCleanse:"Cleanseable"},
      {key:"R",name:"Solar Flare",cd:[90,75,60],threat:[THREAT.HARD_CC],notes:"Center stun / edge slow.",lucianTips:"Keep dash.",ccCleanse:"Cleanseable"}
    ]
  },
  { name:"Nautilus", slug:"Nautilus", tags:["SUPPORT","TANK"], portrait:"Nautilus",
    abilities:[
      {key:"Q",name:"Dredge Line",cd:[14,13,12,11,10],threat:[THREAT.HARD_CC,THREAT.GAP_CLOSE],notes:"Hook pulls both.",lucianTips:"Punish on miss.",ccCleanse:"Cleanseable"},
      {key:"R",name:"Depth Charge",cd:[120,100,80],threat:[THREAT.HARD_CC],notes:"P2P knock up chain.",lucianTips:"Track R.",ccCleanse:"Cleanseable"}
    ]
  }
];

const qs = (s,el=document)=>el.querySelector(s);
function portraitUrl(slug){ return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${slug}.png`; }

function threatTags(tags){
  return (tags||[]).map(t=>{
    const cls = (t===THREAT.HARD_CC?"hard":t===THREAT.SOFT_CC?"soft":t===THREAT.BURST?"burst":t===THREAT.GAP_CLOSE?"gap":t===THREAT.POKE_ZONE?"poke":"peel");
    const label = t.replace("_"," ");
    return `<span class="tag ${cls}">${label}</span>`;
  }).join("");
}
function cleanseBadge(cc){
  if(!cc) return "";
  if(cc==="QSS-only") return `<span class="cc qss">QSS-only</span>`;
  if(cc==="Not Cleanseable") return `<span class="cc ncleanse">Not Cleanseable</span>`;
  return `<span class="cc cleanse">Cleanseable</span>`;
}
function abilityPills(abilities){
  return abilities.map(a=>{
    const cds = (a.cd||[]).join("/");
    return `<span class="pill"><b>${a.key}</b> <span class="cds">${cds||"—"}</span>${cleanseBadge(a.ccCleanse)}</span>`;
  }).join("");
}
function compactNote(ch){
  // pick the first ability with a lucian tip as a compact row note
  const tip = (ch.abilities||[]).find(a=>a.lucianTips)?.lucianTips || "";
  return tip.length>120 ? tip.slice(0,117)+"…" : tip;
}

/* ---- Build search inputs (5 enemy + 4 ally) ---- */
function makeSearchCell(team){
  const wrap = document.createElement("div");
  wrap.className = "search";
  wrap.innerHTML = `<input type="text" placeholder="${team==='enemy'?'Enemy':'Ally'} champion..." autocomplete="off"/><div class="suggestions"></div>`;
  const input = wrap.querySelector("input");
  const sug = wrap.querySelector(".suggestions");

  input.addEventListener("input",()=>{
    const v = input.value.trim().toLowerCase();
    if(!v){sug.classList.remove("show");sug.innerHTML="";return;}
    const options = CHAMPIONS.filter(c=>c.name.toLowerCase().includes(v)||c.slug.toLowerCase().includes(v)).slice(0,12);
    sug.innerHTML = options.map(c=>`<button type="button" data-name="${c.name}"><img src="${portraitUrl(c.portrait||c.slug)}" style="width:18px;vertical-align:middle;margin-right:6px"/>${c.name}</button>`).join("");
    sug.classList.add("show");
  });
  sug.addEventListener("click",e=>{
    const btn = e.target.closest("button"); if(!btn) return;
    input.value = btn.dataset.name; sug.classList.remove("show"); input.dispatchEvent(new Event("change"));
  });
  input.addEventListener("blur",()=>setTimeout(()=>sug.classList.remove("show"),120));
  return {wrap,input};
}

const enemyInputsEl = qs("#enemyInputs");
const allyInputsEl  = qs("#allyInputs");
const enemySlots = Array.from({length:5},()=>makeSearchCell("enemy"));
const allySlots  = Array.from({length:4},()=>makeSearchCell("ally"));
enemySlots.forEach(s=>enemyInputsEl.appendChild(s.wrap));
allySlots.forEach(s=>allyInputsEl.appendChild(s.wrap));

/* ---- TABLE rendering (enemy group first, allied second) ---- */
const tbody = qs("#resultsBody");
const emptyState = qs("#emptyState");

function renderGroupRow(label, cols=7){
  return `<tr class="row" style="background:transparent;border:0">
    <td colspan="${cols}" style="color:var(--gold);text-transform:uppercase;font-weight:700;padding:2px 6px">${label}</td>
  </tr>`;
}
function renderChampRow(group, champ){
  const threatsUnion = Array.from(new Set(champ.abilities.flatMap(a=>a.threat||[])));
  const cleanseUnion = (()=>{
    const vals = Array.from(new Set(champ.abilities.map(a=>a.ccCleanse).filter(Boolean)));
    if(vals.includes("Not Cleanseable")) return "Not Cleanseable";
    if(vals.includes("QSS-only")) return "QSS-only";
    if(vals.length) return "Cleanseable";
    return "";
  })();
  const abilities = abilityPills(champ.abilities);
  return `<tr class="row">
    <td class="group">${group}</td>
    <td class="champ">
      <div class="cell-champ">
        <img class="portrait-sm" src="${portraitUrl(champ.portrait||champ.slug)}" alt="">
        <div>${champ.name}</div>
      </div>
    </td>
    <td class="role">${(champ.tags||[]).join(" • ")||""}</td>
    <td class="abilities">${abilities}</td>
    <td class="threats"><div class="tags-mini">${threatTags(threatsUnion)}</div></td>
    <td class="notes">${compactNote(champ)||""}</td>
  </tr>`;
}

function applySelection(){
  const enemySet = new Set(), allySet = new Set();
  enemySlots.forEach(({input})=>{ const v=input.value.trim(); if(v) enemySet.add(v.toLowerCase()); });
  allySlots.forEach(({input})=>{ const v=input.value.trim(); if(v) allySet.add(v.toLowerCase()); });

  const enemies = CHAMPIONS.filter(c=>enemySet.has(c.name.toLowerCase()));
  const allies  = CHAMPIONS.filter(c=>allySet.has(c.name.toLowerCase()));

  tbody.innerHTML = "";
  if(enemies.length+allies.length===0){ emptyState.style.display="block"; return; }
  emptyState.style.display="none";

  if(enemies.length){ tbody.insertAdjacentHTML("beforeend", renderGroupRow("Enemy Team")); enemies.forEach(c=>tbody.insertAdjacentHTML("beforeend", renderChampRow("ENEMY", c))); }
  if(allies.length){ tbody.insertAdjacentHTML("beforeend", renderGroupRow("Allied Team")); allies.forEach(c=>tbody.insertAdjacentHTML("beforeend", renderChampRow("ALLY", c))); }
}

[...enemySlots, ...allySlots].forEach(({input})=>{
  input.addEventListener("change", applySelection);
  input.addEventListener("keydown",(e)=>{ if(e.key==="Enter"){ e.preventDefault(); applySelection(); } });
});

/* ---- Editor / Import / Export (unchanged) ---- */
const editorModal = qs("#editorModal");
const editorArea = qs("#editorArea");
qs("#openEditor").addEventListener("click", ()=>{ editorArea.value = JSON.stringify(CHAMPIONS,null,2); editorModal.showModal(); });
qs("#saveEditor").addEventListener("click", ()=>{ try{ const parsed=JSON.parse(editorArea.value); if(!Array.isArray(parsed)) throw new Error("Top-level must be an array"); CHAMPIONS=parsed; editorModal.close(); applySelection(); }catch(err){ alert("Invalid JSON: "+err.message); }});
qs("#exportData").addEventListener("click", ()=>{ const blob=new Blob([JSON.stringify(CHAMPIONS,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="lucian-threat-data.json"; a.click(); URL.revokeObjectURL(url); });
const importFile = qs("#importFile");
qs("#importData").addEventListener("click", ()=> importFile.click());
importFile.addEventListener("change",(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(!Array.isArray(data)) throw new Error("Top-level must be an array"); CHAMPIONS=data; applySelection(); alert("Imported champion data."); }catch(err){ alert("Import failed: "+err.message);} }; r.readAsText(f); });

/* ---- Compact Mode Toggle (with persistence) ---- */
const compactToggle = document.getElementById("toggleCompact");
if (compactToggle) {
  // load saved preference
  const saved = localStorage.getItem("lucian_compact_mode") === "1";
  document.body.classList.toggle("compact-mode", saved);
  compactToggle.checked = saved;

  compactToggle.addEventListener("change", (e)=>{
    const on = e.target.checked;
    document.body.classList.toggle("compact-mode", on);
    localStorage.setItem("lucian_compact_mode", on ? "1" : "0");
  });
}

/* ---- Initial render ---- */
applySelection();
