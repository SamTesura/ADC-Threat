// build-from-cdragon.js — GitHub Pages–safe CDragon builder + REPORT OVERLAY
// - Filters to your provided list (whitelist + alias fixes)
// - Extracts passives + robust cooldowns
// - Light CC tags (your app.js enforces CC-first & Cleanse anyway)
// - Shows a report overlay of resolved / missing champs (with suggestions)

(function(){
  const BTN_ID = "buildCDragon";
  const CDRAGON_PATCH = "latest"; // set to "25.15" to pin
  const BASE = `https://raw.communitydragon.org/${CDRAGON_PATCH}/plugins/rcp-be-lol-game-data/global/default/v1`;

  // ==== Your whitelist ====
  const CHAMP_WHITELIST_RAW = [
"Aatrox","Ahri","Akali","Akshan","Alistar","Ambessa","Amumu","Anivia","Annie","Aphelios","Ashe","Aurelion Sol","Aurora","Azir","Bard","Bel'Veth","Blitzcrank","Brand","Braum","Briar","Caitlyn","Camille","Cassiopeia","Cho'Gath","Corki","Darius","Diana","Dr. Mundo","Draven","Ekko","Elise","Evelynn","Ezreal","Fiddlesticks","Fiora","Fizz","Galio","Gangplank","Garen","Gnar","Gragas","Graves","Gwen","Hecarim","Heimerdinger","Hwei","Illaoi","Irelia","Ivern","Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx","K'Sante","Kai'Sa","Kalista","Karma","Karthus","Kassadin","Katarina","Kayle","Kayn","Kennen","Kha'Zix","Kindred","Kled","Kog'Maw","LeBlanc","Lee Sin","Leona","Lillia","Lissandra","Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","Master Yi","Mel","Milio","Miss Fortune","Mordekaiser","Morgana","Naafiri","Nami","Nasus","Nautilus","Neeko","Nidalee","Nilah","Nocture","Nunu & Willump","Olaf","Orianna","Ornn","Pantheon","Poppy","Pyke","Qiyanna","Quinn","Rakan","Rammus","Rek'Sai","Rell","Renata Glasc","Renekton","Rengar","Riven","Rumble","Ryze","Samira","Sejuani","Senna","Seraphine","Sett","Shaco","Shen","Shyvana","Singed","Sion","Skarner","Smolder","Sona","Soraka","Swain","Sylas","Syndra","Tahm Kench","Taliyah","Talon","Taric","Teemo","Thresh","Tristana","Trundle","Tryndamere","Twisted Fate","Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi","Viego","Viktor","Vladimir","Volibear","Warwick","Wukong","Xayah","Xerath","Xin Zhao","Yasuo","Yunara","Yone","Yorick","Yuumi","Zac","Zed","Zeri","Ziggs","Zilean","Zoe","Zyra"
  ];

  // Normalize → CDragon alias (the `alias` field in champion-summary.json)
  const ALIAS_FIX = {
    "Aurelion Sol":"AurelionSol",
    "Cho'Gath":"Chogath",
    "Kha'Zix":"Khazix",
    "Kog'Maw":"KogMaw",
    "Vel'Koz":"Velkoz",
    "Kai'Sa":"Kaisa",
    "K'Sante":"KSante",
    "Jarvan IV":"JarvanIV",
    "Lee Sin":"LeeSin",
    "Master Yi":"MasterYi",
    "Miss Fortune":"MissFortune",
    "Nunu & Willump":"Nunu",
    "Rek'Sai":"RekSai",
    "Twisted Fate":"TwistedFate",
    "Xin Zhao":"XinZhao",
    "Dr. Mundo":"DrMundo",
    "Bel'Veth":"Belveth",
    "Renata Glasc":"Renata",
    // typos → correct alias
    "Nocture":"Nocturne",
    "Qiyanna":"Qiyana"
    // Potential non-live: Ambessa, Mel, Yunara (will show as missing)
  };
  const WHITELIST = new Set(CHAMP_WHITELIST_RAW.map(n => ALIAS_FIX[n] || n));

  function $(s){ return document.querySelector(s); }
  async function jget(url, tries=3){
    for(let i=0;i<tries;i++){
      try{
        const r = await fetch(url, { cache:"no-store" });
        if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return await r.json();
      }catch(e){
        if(i===tries-1) throw e;
        await new Promise(res=>setTimeout(res, 400*(i+1)));
      }
    }
  }
  function stripHtml(s){ return (s||"").replace(/<\/?[^>]+>/g," ").replace(/\s+/g," ").trim(); }

  // Light tagger; app.js redoes CC-first strictly
  const THREAT = { HARD_CC:"HARD_CC", SOFT_CC:"SOFT_CC", SHIELD_PEEL:"SHIELD_PEEL", GAP_CLOSE:"GAP_CLOSE", BURST:"BURST", POKE_ZONE:"Poke/Zone" };
  const RX = {
    air:/\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch|toss|push|pull|yank|drag|shove|displace|knockdown)\b/i,
    stun:/\bstun(?:s|ned|ning)?\b/i, root:/\b(root|snare|immobiliz(?:e|ed|es))\b/i,
    charm:/\bcharm/i, taunt:/\btaunt/i, fear:/\bfear|terrify|flee\b/i, sleep:/\bsleep|drowsy\b/i,
    silence:/\bsilence\b/i, polymorph:/\bpolymorph\b/i, slow:/\bslow|cripple|chill\b/i,
    blind:/\bblind|nearsight\b/i, grounded:/\bgrounded\b/i,
    gap:/\bdash|blink|leap|lunge|surge|shift|rush|charge|hookshot|vault|hop|flip|jump|teleport to|reposition|slide|advance\b/i,
    exec:/\bexecute|threshold|guillotine|cull\b/i, burst:/\bburst|detonate|nuke|true damage\b/i,
    zone:/\b(zone|field|pool|storm|barrage|mine|trap|turret|wall|aoe|beam|laser|burn)\b/i,
    shield:/\b(shield|barrier|spell shield|damage reduction|tenacity|unstoppable|untargetable|stasis|banish)\b/i
  };
  function classify(text){
    const t = (text||"").toLowerCase();
    const tags = new Set();
    if (RX.air.test(t)) tags.add(THREAT.HARD_CC);
    if (RX.stun.test(t)||RX.root.test(t)||RX.charm.test(t)||RX.taunt.test(t)||
        RX.fear.test(t)||RX.sleep.test(t)||RX.silence.test(t)||RX.polymorph.test(t)||
        RX.slow.test(t)||RX.blind.test(t)||RX.grounded.test(t)) tags.add(THREAT.SOFT_CC);
    if (RX.shield.test(t)) tags.add(THREAT.SHIELD_PEEL);
    if (RX.gap.test(t))    tags.add(THREAT.GAP_CLOSE);
    if (RX.exec.test(t)||RX.burst.test(t)) tags.add(THREAT.BURST);
    if (RX.zone.test(t))   tags.add(THREAT.POKE_ZONE);
    return [...tags];
  }

  function normalizeCooldowns(sp){
    const candidates = [
      sp.cooldowns, sp.cooldown, sp.cooldownCoefficients, sp.maxCooldown,
      sp.manaCostCooldown, sp.abilityCooldown, sp.abilityCooldowns
    ];
    for (const c of candidates){
      if (Array.isArray(c) && c.length) return c.map(Number).filter(n=>!Number.isNaN(n));
      if (typeof c === "number") return [Number(c)];
    }
    return [];
  }

  // ----- Report UI -----
  function showReport(report){
    // Create once
    let el = $("#cdragon-report");
    if (!el){
      el = document.createElement("div");
      el.id = "cdragon-report";
      el.innerHTML = `
        <style>
          #cdragon-report{position:fixed;right:16px;bottom:16px;width:360px;background:#0b1117;border:1px solid #223041;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.45);z-index:9999}
          #cdragon-report header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #1c2733;color:#c8aa6e}
          #cdragon-report .body{padding:10px 12px;max-height:55vh;overflow:auto;color:#dbe2ea;font-size:12px}
          #cdragon-report .row{margin:6px 0}
          #cdragon-report .miss{color:#f87171}
          #cdragon-report .ok{color:#68d391}
          #cdragon-report footer{display:flex;gap:8px;justify-content:flex-end;padding:10px 12px;border-top:1px solid #1c2733}
          #cdragon-report button{padding:7px 10px;border-radius:8px;border:1px solid #2a3a4d;background:#0e1621;color:#c8d3df;cursor:pointer}
          #cdragon-report button.primary{border-color:#9c7c4a;color:#c8aa6e}
          #cdragon-report .mono{font-family:ui-monospace,Consolas,monospace}
          #cdragon-report .tiny{opacity:.8}
        </style>
        <header>
          <strong>CommunityDragon Build Report</strong>
          <button id="cdragon-report-close">✕</button>
        </header>
        <div class="body"></div>
        <footer>
          <button id="cdragon-report-copy">Copy</button>
          <button id="cdragon-report-download" class="primary">Download report</button>
        </footer>
      `;
      document.body.appendChild(el);
      $("#cdragon-report-close").addEventListener("click",()=>el.remove());
      $("#cdragon-report-copy").addEventListener("click",()=>{
        navigator.clipboard.writeText(JSON.stringify(report,null,2)).then(()=>alert("Report copied"));
      });
      $("#cdragon-report-download").addEventListener("click",()=>{
        const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
        const url=URL.createObjectURL(blob); const a=document.createElement("a");
        a.href=url; a.download="cdragon_build_report.json"; a.click(); URL.revokeObjectURL(url);
      });
    }
    const b = el.querySelector(".body");
    const {requested, resolved, missing, suggestions} = report;
    b.innerHTML = `
      <div class="row"><b>Requested:</b> ${requested.length} &nbsp; <b>Resolved:</b> <span class="ok">${resolved.length}</span> &nbsp; <b>Missing:</b> <span class="miss">${missing.length}</span></div>
      <div class="row tiny">Patch: <span class="mono">${CDRAGON_PATCH}</span></div>
      ${missing.length? `<div class="row"><b>Missing (with suggestions):</b><br>${missing.map(n=>{
        const s = suggestions[n]; return `<div>• <span class="miss">${n}</span>${s?` → try <span class="mono">${s}</span>`:""}</div>`;
      }).join("")}</div>` : `<div class="row">All champions resolved ✅</div>`}
    `;
    el.style.display = "block";
  }

  // crude suggestion map for known typos / non-live names
  const SUGGEST = {
    "Nocture": "Nocturne",
    "Qiyanna": "Qiyana",
    "Vel'Koz": "Velkoz",
    "Cho'Gath": "Chogath",
    "Kha'Zix": "Khazix",
    "Kog'Maw": "KogMaw",
    "Kai'Sa": "Kaisa",
    "K'Sante": "KSante",
    "Jarvan IV": "JarvanIV",
    "Lee Sin": "LeeSin",
    "Master Yi": "MasterYi",
    "Miss Fortune": "MissFortune",
    "Nunu & Willump": "Nunu",
    "Rek'Sai": "RekSai",
    "Twisted Fate": "TwistedFate",
    "Xin Zhao": "XinZhao",
    // Non-live? leave blank to signal "not available"
    "Ambessa": "",
    "Mel": "",
    "Yunara": ""
  };

  async function build(){
    const btn = document.getElementById(BTN_ID); if(!btn) return;
    btn.disabled = true; const original = btn.textContent;
    btn.textContent = "Building… (champion list)";

    try{
      const list = await jget(`${BASE}/champion-summary.json`);
      // All aliases available from CDragon
      const aliasSet = new Set(list.filter(c=>c?.id>0 && c.alias).map(c=>c.alias));
      const nameToAlias = new Map(list.map(c=>[c.name, c.alias]));

      // Determine resolvable entries
      const requested = CHAMP_WHITELIST_RAW.slice();
      const resolvedAliases = [];
      const missing = [];
      for (const want of requested){
        const fixed = ALIAS_FIX[want] || want;
        if (aliasSet.has(fixed)) {
          resolvedAliases.push(fixed);
        } else if (nameToAlias.has(fixed)) {
          resolvedAliases.push(nameToAlias.get(fixed));
        } else {
          missing.push(want);
        }
      }

      // Build only resolved
      const champs = list
        .filter(c => c?.id>0 && c.alias && resolvedAliases.includes(c.alias))
        .sort((a,b)=>String(a.alias).localeCompare(String(b.alias)));

      const out = [];
      for(let i=0;i<champs.length;i++){
        const c = champs[i];
        btn.textContent = `Building… ${i+1}/${champs.length} (${c.alias})`;
        const detail = await jget(`${BASE}/champions/${c.id}.json`);

        const spells = Array.isArray(detail.spells) ? detail.spells : [];
        const order = ["Q","W","E","R"];
        const picked = order.map(L => spells.find(s => String(s.spellKey).toUpperCase() === L)).filter(Boolean);
        const use = picked.length ? picked : spells.slice(0,4);

        const abilities = use.map(sp=>{
          const key = String(sp.spellKey||"").toUpperCase();
          const name = sp.name || `Spell ${key}`;
          const raw = stripHtml(sp.longDescription || sp.shortDescription || sp.gameplayDescription || "");
          const cd  = normalizeCooldowns(sp);
          const threat = classify(`${name} ${raw}`);
          return { key, name, cd, threat, notes: raw };
        });

        const passive = {
          name: detail.passive?.name || "",
          desc: stripHtml(detail.passive?.shortDescription || detail.passive?.longDescription || detail.passive?.gameplayDescription || "")
        };

        out.push({
          name: detail.name || c.name || c.alias,
          slug: c.alias || detail.alias || detail.name,
          tags: Array.isArray(detail.roles)?detail.roles.map(r=>String(r).toUpperCase()):(detail.tags||[]),
          portrait: c.alias || detail.alias || detail.name,
          passive,
          abilities
        });

        await new Promise(r=>setTimeout(r, 40));
      }

      // Download champions json
      const fname = `champions_cdragon_${CDRAGON_PATCH}_whitelist.json`;
      const blob = new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      btn.textContent = `Done! ${fname} (${out.length}/${requested.length})`;

      // Build & show report
      const suggestions = {};
      for (const m of missing){ suggestions[m] = SUGGEST[m] || ""; }
      showReport({ requested, resolved: out.map(x=>x.slug), missing, suggestions });

    }catch(e){
      console.error(e);
      alert("Build failed: " + e.message);
      btn.textContent = original;
    }finally{
      btn.disabled = false;
    }
  }

  document.getElementById(BTN_ID)?.addEventListener("click", build);
})();
