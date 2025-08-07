/* Build a full champions.json from Data Dragon (Patch 25.15)
   - Grabs the latest 25.15.x ddragon version
   - Pulls every champion details JSON
   - Extracts cooldown arrays for Q/W/E/R
   - Heuristically labels THREATs + ccCleanse
   - Triggers a download (champions.json) ready for your app
*/

(async function(){
  const BTN_ID = "build2515";
  const btn = document.getElementById(BTN_ID);
  if(!btn) return;

  const THREAT = {
    HARD_CC: "HARD_CC",
    SOFT_CC: "SOFT_CC",
    BURST: "BURST",
    GAP_CLOSE: "GAP_CLOSE",
    POKE_ZONE: "POKE_ZONE",
    SHIELD_PEEL: "SHIELD_PEEL"
  };

  // --- Utility: fetch JSON with retries
  async function jget(url, tries=3){
    for(let i=0;i<tries;i++){
      try{
        const r = await fetch(url, {cache:"no-store"});
        if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return await r.json();
      }catch(e){
        if(i===tries-1) throw e;
        await new Promise(res=>setTimeout(res, 500*(i+1)));
      }
    }
  }

  // --- Pick latest 25.15.x
  async function resolve2515(){
    const versions = await jget("https://ddragon.leagueoflegends.com/api/versions.json");
    const v = versions.find(v => v.startsWith("25.15"));
    if(!v) throw new Error("Could not find 25.15 in Data Dragon versions.json (it may still be propagating).");
    return v;
  }

  // --- Basic keyword helpers
  const re = {
    // CC keywords (lowercased search)
    airborne: /(airborne|knock[\s-]?(up|back|aside)|pulled|launched|knock.*(up|back|aside))/i,
    suppress: /suppress/i,
    nearsight: /nearsight/i,
    stun: /stun/i,
    root: /(root|immobilize)/i,
    silence: /silence/i,
    sleep: /(sleep|drowsy)/i,
    charm: /charm/i,
    fear: /(fear|flee)/i,
    taunt: /taunt/i,
    berserk: /berserk/i,
    slow: /slow/i,
    blind: /blind/i,
    disarm: /disarm/i,
    polymorph: /polymorph/i,
    ground: /ground/i, // grounded (Cass/Quinn interactions)
    // Threat-ish signals
    shield: /shield/i,
    dash: /(dash|leap|blink)/i,
    execute: /(execute|threshold)/i,
    burstWords: /(execute|critical damage|big damage|high damage|detonate|amplif(y|ies)|bonus damage|pierc(e|ing))/i,
    pokeZone: /(poke|zone|field|area|zone control|damage over time|burn|pool)/i
  };

  function inferThreats(tt, name, key){
    const text = `${name} ${key} ${tt}`.toLowerCase();
    const tags = new Set();

    // CC buckets
    if (re.stun.test(text) || re.root.test(text) || re.silence.test(text) ||
        re.sleep.test(text) || re.charm.test(text) || re.fear.test(text) ||
        re.taunt.test(text) || re.polymorph.test(text) || re.disarm.test(text) ||
        re.blind.test(text)) {
      // Stuns/sleeps/roots etc. = HARD_CC by default
      if (re.slow.test(text) && !(re.stun.test(text) || re.root.test(text))) {
        tags.add(THREAT.SOFT_CC);
      } else {
        tags.add(THREAT.HARD_CC);
      }
    }
    if (re.slow.test(text)) tags.add(THREAT.SOFT_CC);

    // Gap close
    if (re.dash.test(text)) tags.add(THREAT.GAP_CLOSE);

    // Burst & poke/zone
    if (re.execute.test(text) || re.burstWords.test(text)) tags.add(THREAT.BURST);
    if (re.pokeZone.test(text)) tags.add(THREAT.POKE_ZONE);

    // Shields/peel
    if (re.shield.test(text)) tags.add(THREAT.SHIELD_PEEL);

    return [...tags];
  }

  // Map CC => cleanse buckets
  function inferCcCleanse(tt){
    const text = tt.toLowerCase();
    // Not Cleanseable: airborne family
    if (re.airborne.test(text)) return "Not Cleanseable";
    // QSS-only: suppression & nearsight
    if (re.suppress.test(text) || re.nearsight.test(text)) return "QSS-only";
    // Otherwise: treat classic CC as Cleanseable
    if (re.stun.test(text) || re.root.test(text) || re.silence.test(text) || re.sleep.test(text) ||
        re.charm.test(text) || re.fear.test(text) || re.taunt.test(text) || re.polymorph.test(text) ||
        re.disarm.test(text) || re.blind.test(text) || re.slow.test(text) || re.ground.test(text)) {
      return "Cleanseable";
    }
    // No CC found
    return null;
  }

  function lucianNoteFromThreat(threats){
    if (threats.includes(THREAT.HARD_CC)) return "Track hard-CC—keep E/Flash to dodge or buffer.";
    if (threats.includes(THREAT.GAP_CLOSE)) return "Kite back on gap close cooldown; punish window after miss.";
    if (threats.includes(THREAT.BURST)) return "Respect burst window; don’t dash in without vision/sums.";
    if (threats.includes(THREAT.POKE_ZONE)) return "Don’t sit in zone; look for short trades around cooldowns.";
    if (threats.includes(THREAT.SHIELD_PEEL)) return "Bait shield/peel before committing ult.";
    if (threats.includes(THREAT.SOFT_CC)) return "Avoid slows and kite; dash to break sticky range.";
    return "";
  }

  async function build(){
    btn.disabled = true;
    btn.textContent = "Building… (fetching Data Dragon 25.15)";
    try{
      const ver = await resolve2515();

      // champion list
      const champIndex = await jget(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/champion.json`);
      const keys = Object.keys(champIndex.data).sort();

      const out = [];

      // Fetch champs sequentially to be gentle (can be parallel if you want speed)
      for (let i=0;i<keys.length;i++){
        const id = keys[i];
        btn.textContent = `Building… ${i+1}/${keys.length} (${id})`;

        const detail = await jget(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/champion/${id}.json`);
        const champ = detail.data[id];

        const abilities = [];

        (champ.spells||[]).forEach((sp, idx)=>{
          const key = ["Q","W","E","R"][idx] || sp.key || "";
          const cd = Array.isArray(sp.cooldown) ? sp.cooldown : [];
          const tt = `${sp.name} ${sp.description||sp.tooltip||""}`;
          const threats = inferThreats(tt, sp.name, key);
          const ccCleanse = inferCcCleanse(tt);

          abilities.push({
            key,
            name: sp.name,
            cd,
            threat: threats,
            notes: sp.tooltip ? sp.tooltip.replace(/<\/?[^>]+(>|$)/g,"").replace(/\s+/g," ").trim() : "",
            lucianTips: lucianNoteFromThreat(threats),
            ...(ccCleanse ? { ccCleanse } : {})
          });
        });

        out.push({
          name: champ.name,
          slug: champ.id,
          tags: champ.tags || [],
          portrait: champ.id,
          abilities
        });
      }

      // download
      const blob = new Blob([JSON.stringify(out, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "champions.json"; a.click();
      URL.revokeObjectURL(url);

      btn.textContent = "Done! champions.json downloaded";
    }catch(e){
      console.error(e);
      alert("Build failed: " + e.message + "\nIf 25.15 isn’t on Data Dragon yet, try again in a few hours.");
      btn.textContent = "Build FULL champions.json (25.15)";
    }finally{
      btn.disabled = false;
    }
  }

  btn.addEventListener("click", build);
})();
