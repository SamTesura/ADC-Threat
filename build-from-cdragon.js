// build-from-cdragon.js — GitHub Pages–safe CDragon builder
// - Filters to your exact champion list (whitelist)
// - Robust CDs, full passives
// - CC tags are a light draft; your app.js will enforce CC-first + Cleanse properly

(function(){
  const BTN_ID = "buildCDragon";
  const CDRAGON_PATCH = "latest"; // change to "25.15" if you want to pin
  const BASE = `https://raw.communitydragon.org/${CDRAGON_PATCH}/plugins/rcp-be-lol-game-data/global/default/v1`;

  // ==== Your whitelist (as provided) ====
  const CHAMP_WHITELIST_RAW = [
"Aatrox","Ahri","Akali","Akshan","Alistar","Ambessa","Amumu","Anivia","Annie","Aphelios","Ashe","Aurelion Sol","Aurora","Azir","Bard","Bel'Veth","Blitzcrank","Brand","Braum","Briar","Caitlyn","Camille","Cassiopeia","Cho'Gath","Corki","Darius","Diana","Dr. Mundo","Draven","Ekko","Elise","Evelynn","Ezreal","Fiddlesticks","Fiora","Fizz","Galio","Gangplank","Garen","Gnar","Gragas","Graves","Gwen","Hecarim","Heimerdinger","Hwei","Illaoi","Irelia","Ivern","Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx","K'Sante","Kai'Sa","Kalista","Karma","Karthus","Kassadin","Katarina","Kayle","Kayn","Kennen","Kha'Zix","Kindred","Kled","Kog'Maw","LeBlanc","Lee Sin","Leona","Lillia","Lissandra","Lucian","Lulu","Lux","Malphite","Malzahar","Maokai","Master Yi","Mel","Milio","Miss Fortune","Mordekaiser","Morgana","Naafiri","Nami","Nasus","Nautilus","Neeko","Nidalee","Nilah","Nocture","Nunu & Willump","Olaf","Orianna","Ornn","Pantheon","Poppy","Pyke","Qiyanna","Quinn","Rakan","Rammus","Rek'Sai","Rell","Renata Glasc","Renekton","Rengar","Riven","Rumble","Ryze","Samira","Sejuani","Senna","Seraphine","Sett","Shaco","Shen","Shyvana","Singed","Sion","Skarner","Smolder","Sona","Soraka","Swain","Sylas","Syndra","Tahm Kench","Taliyah","Talon","Taric","Teemo","Thresh","Tristana","Trundle","Tryndamere","Twisted Fate","Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi","Viego","Viktor","Vladimir","Volibear","Warwick","Wukong","Xayah","Xerath","Xin Zhao","Yasuo","Yunara","Yone","Yorick","Yuumi","Zac","Zed","Zeri","Ziggs","Zilean","Zoe","Zyra"
  ];

  // Normalize and alias mapping to match CDragon "alias" keys
  const FIX_ALIAS = {
    "Aurelion Sol":"AurelionSol","Cho'Gath":"Chogath","Kha'Zix":"Khazix","Kog'Maw":"KogMaw","Vel'Koz":"Velkoz",
    "Kai'Sa":"Kaisa","K'Sante":"KSante","Jarvan IV":"JarvanIV","Lee Sin":"LeeSin","Master Yi":"MasterYi",
    "Miss Fortune":"MissFortune","Nunu & Willump":"Nunu","Rek'Sai":"RekSai","Twisted Fate":"TwistedFate",
    "Xin Zhao":"XinZhao","Wukong":"Wukong","Dr. Mundo":"DrMundo","Bel'Veth":"Belveth","Renata Glasc":"Renata",
    "Nocture":"Nocturne","Qiyanna":"Qiyana"
    // Ambessa, Mel, Yunara might not exist in live CDragon; skipped if not found.
  };
  const NAME_FIXES = new Map(Object.entries(FIX_ALIAS));

  const WHITELIST = new Set(CHAMP_WHITELIST_RAW.map(n => NAME_FIXES.get(n) || n));

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

  // Light tags; app.js does strict CC-first later
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

  async function build(){
    const btn = $(`#${BTN_ID}`); if(!btn) return;
    btn.disabled = true; const original = btn.textContent;
    btn.textContent = "Building… (champion list)";

    try{
      const list = await jget(`${BASE}/champion-summary.json`);
      // Only keep whitelist matches by alias or display name
      const champs = list
        .filter(c => c?.id>0 && c.alias)
        .filter(c => WHITELIST.has(c.alias) || WHITELIST.has(c.name))
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

      const fname = `champions_cdragon_${CDRAGON_PATCH}_whitelist.json`;
      const blob = new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      btn.textContent = `Done! ${fname} (${out.length} champs)`;
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
