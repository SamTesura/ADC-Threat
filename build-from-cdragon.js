// build-from-cdragon.js — browser-only CDragon builder (GitHub Pages safe)
// No versions.json (CORS-blocked). Locks to "latest" by default. You can change to "25.15".

(function(){
  const BTN_ID = "buildCDragon";
  const CDRAGON_PATCH = "latest"; // or "25.15"
  const BASE = `https://raw.communitydragon.org/${CDRAGON_PATCH}/plugins/rcp-be-lol-game-data/global/default/v1`;

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

  // Simple classifier (your runtime app.js enforces strict CC-first and Cleanse anyway)
  const THREAT = { HARD_CC:"HARD_CC", SOFT_CC:"SOFT_CC", SHIELD_PEEL:"SHIELD_PEEL", GAP_CLOSE:"GAP_CLOSE", BURST:"BURST", POKE_ZONE:"POKE_ZONE" };
  const RX = {
    air:/\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch|toss|push|pull|yank|drag|shove|displace|knockdown)\b/i,
    stun:/\bstun(?:s|ned|ning)?\b/i, root:/\b(root|snare|immobiliz(?:e|ed|es))\b/i,
    charm:/\bcharm/i, taunt:/\btaunt/i, fear:/\bfear|terrify|flee\b/i, sleep:/\bsleep|drowsy\b/i,
    silence:/\bsilence\b/i, polymorph:/\bpolymorph\b/i, slow:/\bslow|cripple|chill\b/i,
    blind:/\bblind|nearsight\b/i, grounded:/\bgrounded\b/i,
    gap:/\bdash|blink|leap|lunge|surge|shift|rush|charge|hookshot|vault|hop|flip|jump|teleport to|reposition|slide|advance\b/i,
    exec:/\bexecute|threshold|guillotine|cull\b/i, burst:/\bburst|detonate|nuke|high damage|true damage\b/i,
    zone:/\b(zone|field|pool|storm|barrage|mine|trap|turret|wall|aoe|beam|laser|burn)\b/i,
    shield:/\b(shield|barrier|spell shield|damage reduction|tenacity|unstoppable|invulnerab|untargetable|stasis|banish)\b/i
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
  function extractCooldowns(sp){
    const arr = sp.cooldowns || sp.cooldown || sp.cooldownCoefficients || sp.maxCooldown || [];
    if (Array.isArray(arr)) return arr;
    if (typeof arr === "number") return [arr];
    return [];
  }

  async function build(){
    const btn = $(`#${BTN_ID}`);
    if(!btn){ return; }
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Building… (champion list)";

    try{
      const list = await jget(`${BASE}/champion-summary.json`);
      const champs = list.filter(c=>c?.id>0 && c.alias).sort((a,b)=>String(a.alias).localeCompare(String(b.alias)));
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
          const cd  = extractCooldowns(sp);
          const threat = classify(`${name} ${raw}`);
          return { key, name, cd, threat, notes: raw };
        });

        const passive = {
          name: detail.passive?.name || "",
          desc: stripHtml(detail.passive?.shortDescription || detail.passive?.longDescription || "")
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

      const fname = `champions_cdragon_${CDRAGON_PATCH}.json`;
      const blob = new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
      btn.textContent = `Done! ${fname}`;
    }catch(e){
      console.error(e);
      alert("Build failed: " + e.message);
      btn.textContent = original;
    }finally{
      btn.disabled = false;
    }
  }

  const btn = document.getElementById(BTN_ID);
  if (btn) btn.addEventListener("click", build);
})();
