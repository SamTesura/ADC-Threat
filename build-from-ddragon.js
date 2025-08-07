/* Optional: in-browser builder (CommunityDragon) if you want to regenerate champions.json
   NOTE: This doesn't auto-run. Your app uses champions_adc_verified_2515.json at runtime.
*/
(function(){
  const BTN_ID = "buildCDragon";
  const btn = document.getElementById(BTN_ID);
  if(!btn) return;

  const CDRAGON_SUMMARY = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json";
  const CDRAGON_CHAMP   = (id)=>`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${id}.json`;

  const THREAT = { HARD_CC:"HARD_CC", SOFT_CC:"SOFT_CC", BURST:"BURST", GAP_CLOSE:"GAP_CLOSE", POKE_ZONE:"POKE_ZONE", SHIELD_PEEL:"SHIELD_PEEL" };

  async function jget(url, tries=3){
    for(let i=0;i<tries;i++){
      try{
        const r = await fetch(url, {cache:"no-store"});
        if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return await r.json();
      }catch(e){
        if(i===tries-1) throw e;
        await new Promise(res=>setTimeout(res, 400*(i+1)));
      }
    }
  }
  const KW = {
    stun:/\bstun(?:s|ned|ning)?\b|\bparaly(?:ze|sis)\b/i, root:/\b(root|snare|immobiliz(?:e|ed|es))\b/i,
    airborne:/\b(knock(?:\s|-)?(?:up|back|aside)|airborne|launch(?:ed|es)|toss|pull)\b/i,
    charm:/\bcharm(?:ed|s|ing)?\b/i, taunt:/\btaunt(?:ed|s|ing)?\b/i, fear:/\b(fear|flee|terrify)\b/i,
    sleep:/\b(sleep|drowsy)\b/i, silence:/\bsilence(?:d|s|ing)?\b/i, polymorph:/\bpolymorph(?:ed|s|ing)?\b/i,
    slow:/\b(slow|cripple|chill)\b/i, blind:/\bblind(?:ed|s|ing)?\b|nearsight/i, ground:/\bground(?:ed)?\b/i,
    gap:/\b(dash|blink|leap|lunge|surge|shift|rush|charge|hookshot|vault|hop|flip|jump|teleport to|reposition|slide|advance)\b/i,
    execute:/\b(execute|threshold|guillotine|cull)\b/i, burst:/\b(burst|detonate|nuke|massive|huge|high damage|true damage)\b/i,
    zone:/\b(zone|field|pool|storm|barrage|mine|trap|turret|wall|aoe|beam|laser|burn)\b/i,
    shield:/\b(shield|barrier|spell shield|damage reduction|tenacity|unstoppable|invulnerab|untargetable|stasis|banish)\b/i
  };
  function stripHtml(s){ return (s||"").replace(/<\/?[^>]+>/g," ").replace(/\s+/g," ").trim(); }
  function classify(name, key, text){
    const t = `${name} ${key} ${text||""}`.toLowerCase(); const tags = new Set();
    if (KW.stun.test(t)||KW.root.test(t)||KW.airborne.test(t)||KW.charm.test(t)||KW.taunt.test(t)||KW.fear.test(t)||KW.sleep.test(t)||KW.silence.test(t)||KW.polymorph.test(t)) tags.add(THREAT.HARD_CC);
    if (KW.slow.test(t)||KW.blind.test(t)||KW.ground.test(t)) tags.add(THREAT.SOFT_CC);
    if (KW.gap.test(t)) tags.add(THREAT.GAP_CLOSE);
    if (KW.execute.test(t)||KW.burst.test(t)) tags.add(THREAT.BURST);
    if (KW.zone.test(t)) tags.add(THREAT.POKE_ZONE);
    if (KW.shield.test(t)) tags.add(THREAT.SHIELD_PEEL);
    return [...tags];
  }
  function extractCooldowns(spell){
    const flatten=(x)=>Array.isArray(x)&&x.every(v=>Array.isArray(v))?x[0]:Array.isArray(x)&&x.every(v=>typeof v==="number")?x:(typeof x==="number"?[x]:null);
    let cd = flatten(spell.cooldowns)||flatten(spell.cooldown)||flatten(spell.cooldownCoefficients);
    if(!cd && typeof spell.baseCooldown==="number") cd=[spell.baseCooldown];
    return cd||[];
  }
  function adcTip(threats){
    if (threats.includes(THREAT.HARD_CC)) return "Hard-CC — save mobility/sums; trade after it’s down.";
    if (threats.includes(THREAT.GAP_CLOSE)) return "Engage window — kite back; punish post-dash.";
    if (threats.includes(THREAT.BURST)) return "Burst window — avoid long trades.";
    if (threats.includes(THREAT.POKE_ZONE)) return "Don’t sit in zones; short trades.";
    if (threats.includes(THREAT.SHIELD_PEEL)) return "Bait peel or swap targets.";
    if (threats.includes(THREAT.SOFT_CC)) return "Slows/blinds — space wider, use mobility.";
    return "";
  }
  async function build(){
    btn.disabled=true; const original=btn.textContent; btn.textContent="Building… (champion list)";
    try{
      const summary = await jget(CDRAGON_SUMMARY);
      const champs = summary.filter(c=>c?.id!=null && c.alias).sort((a,b)=>String(a.alias).localeCompare(String(b.alias)));
      const out = [];
      for(let i=0;i<champs.length;i++){
        const c = champs[i]; btn.textContent = `Building… ${i+1}/${champs.length} (${c.alias})`;
        const detail = await jget(CDRAGON_CHAMP(c.id));
        const spells = Array.isArray(detail.spells)?detail.spells:[];
        const ordered = ["Q","W","E","R"].map(L=>spells.find(s=>(s.spellKey||"").toUpperCase()===L)).filter(Boolean);
        const finalSpells = ordered.length?ordered:spells.slice(0,4);
        const abilities = finalSpells.map((sp,idx)=>{
          const key=(sp.spellKey && String(sp.spellKey).toUpperCase())||["Q","W","E","R"][idx]||"";
          const name=sp.name||sp.gameplayDescription||`Spell ${key}`;
          const tooltip=stripHtml(sp.longDescription||sp.shortDescription||sp.gameplayDescription||"");
          const cd=extractCooldowns(sp);
          const threat=classify(name,key,tooltip);
          return {key,name,cd,threat,notes:tooltip,lucianTips:adcTip(threat)};
        });
        out.push({ name: detail.name||c.name||c.alias, slug:c.alias||detail.alias||detail.name, tags:Array.isArray(detail.roles)?detail.roles.map(r=>String(r).toUpperCase()):(detail.tags||[]), portrait:c.alias||detail.alias||detail.name, abilities });
        await new Promise(res=>setTimeout(res,40));
      }
      const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="champions.json"; a.click(); URL.revokeObjectURL(url);
      btn.textContent="Done! champions.json downloaded";
    }catch(e){ console.error(e); alert("Build failed: "+e.message); btn.textContent=original; }
    finally{ btn.disabled=false; }
  }
  btn.addEventListener("click", build);
})();
