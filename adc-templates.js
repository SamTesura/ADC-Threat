// adc-templates-full.js
// ADC-specific quick-summary tips (based on high-elo bot-lane fundamentals)

const ADC_TEMPLATES = {
  "Ashe": {
    tips: {
      "Thresh": "Stay at max range and poke; avoid hooks by maintaining vision in brushes and letting your support initiate. Don’t step forward without your support’s follow-up.",
      "Nautilus": "Nautilus engages heavily — slow-push when he's roaming to deny plates, then freeze when he returns and collapse with support.",
      "Leona": "When Leona hits engage, you must follow up immediately. Use your Volley and Hawkshot for vision to punish engage windows."
    }
  },
  "Caitlyn": {
    tips: {
      "Blitzcrank": "Your aim is to avoid his hook at all costs. Trap brushes early, keep kite distance, punish mis-hooks with headshots.",
      "Morgana": "Black Shield counters your net or trap-engage. Bait her shield, then commit when it's down.",
      "Zyra": "Zyra plants zone heavily—if you push, place traps behind to punish over-extension and use your range advantage."
    }
  },
  "Jinx": {
    tips: {
      "Braum": "Braum’s shield reduces your Q+E poke. Auto-attack when his shield is down and wait for your support to lock down target.",
      "Nami": "Nami’s sustain allows you to bully low sustain lanes—use your range and Flame Chompers defensively when she engages.",
      "Thresh": "Thresh’s box-hook combo is lethal—maintain distance and freeze when his roam timing is obvious."
    }
  },
  "Ezreal": {
    tips: {
      "Leona": "Leona tries to engage—use your Arcane Shift to dodge, trade from safe range, and don’t overextend without support peel.",
      "Thresh": "You must avoid his hook; use Q pokes and hit once the hook attempt fails. Mobility is your insurance.",
      "Senna": "Senna has range and passive stacking—use your early boots mobility to dodge autos and force favorable trades."
    }
  },
  "Kai'Sa": {
    tips: {
      "Pyke": "Pyke roam threat is high—pre-ward river, stay near your support, and delay all-ins until you have level advantage and ult ready.",
      "Leona": "Combo Leona + Kai’Sa is strong—coordinate your Ult with her Zenith Blade to maximize lockdown and DPS output.",
      "Thresh": "Thresh can zone you early—kite backwards, stack your passive, and pick fights when you have items and ult ready."
    }
  },
  "Miss Fortune": {
    tips: {
      "Alistar": "Alistar’s roam and all-in are strong—push lane early, look to roam with jungler, and auto-attack waves fast to deny plate bonus.",
      "Thresh": "Avoid his hook engage; when locked down, you are squishy—use Double Up effectively after his engage is used.",
      "Nautilus": "Nautilus hooks signal strong all-in—respect his zone, play safe until his Ult is on cooldown, then trade."
    }
  },
  "Xayah": {
    tips: {
      "Rakan": "Highlight synergy with your support—use Feather Wall + Xayah’s combo to zone and win trades early.",
      "Nautilus": "His hook + Ult is predictable—space around brushes, punish when he misses engage, and turn trade windows into kills.",
      "Thresh": "Your root combo is effective—bait his hook, then immediately toss feathers and Ult for maximum damage."
    }
  },
  "Aphelios": {
    tips: {
      "Nautilus": "Heavy hook engage means you must control your weapon cycle and stick close to your support—don’t play split-safe early.",
      "Thresh": "Avoid hook initiations—once engaged, your DPS combo must fire off immediately, so ensure support is ready.",
      "Leona": "Leona + Aphelios all-in is deadly—coordinate your infernum or crescendum mode with her Zenith Blade for kill setup."
    }
  },
  "Tristana": {
    tips: {
      "Blitzcrank": "Blitz hook will ruin your jump if mis-timed—push early, force plates, and take safe engage windows after 6.",
      "Morgana": "Black Shield counters your explosion combos—bait the shield, then jump in once it’s down and stack your rockets.",
      "Rakan": "Rakan combo jumps—play around his roam timing, push when he leaves, and punish his return with turret damage."
    }
  },
  "Sivir": {
    tips: {
      "Thresh": "Your E + ricochets are strong; avoid his hook early, use spell-shield defensively, then win extended trades.",
      "Blitzcrank": "His hook threat resets your spell-shield usage—keep it for when he grabs you, then reflect damage with ricochets.",
      "Nami": "Nami can sustain; force engages when her spells are on cooldown and you have spell-shield ready to trade."
    }
  },
  "Lucian": {
    tips: {
      "Alistar": "His all-in combo is brutal—use your range early, avoid level-2 cheese, and look to fight once you have items.",
      "Braum": "Braum’s shield blocks your damage burst—auto-attack to remove passive, then trade once his shield expires.",
      "Thresh": "Maintain spacing—his hook resets enable strong all-in; use your dash and auto-reset for burst after he commits."
    }
  },
  "Vayne": {
    tips: {
      "Draven": "Draven’s early lane pressure is high—farm safely early, avoid picks, scale into late game where you shine.",
      "Nautilus": "His hook + Ult outpaces your level-1 strength—capitalize on jungle help or wave momentum to fight him.",
      "Senna": "Senna’s range and poke are strong—phase early passive trades, scale safely, and pick fights after your first back."
    }
  },
  "Draven": {
    tips: {
      "Thresh": "Thresh hook sets you behind—use early aggression once he misses, force trades, take plates hard.",
      "Leona": "Leona sets you up for kills—punish when she uses Zenith Blade to engage and clear waves quickly to snowball.",
      "Blitzcrank": "Avoid his hook at all costs; free farm until you have items, then dominate fights before he’s ahead."
    }
  },
  "Varus": {
    tips: {
      "Leona": "His poke synergy is strong—trade with his Piercing Arrow followed by root, freeze wave after you chunk 50% HP.",
      "Nautilus": "His engage is predictable—play around his Ult route, poke him down during cooldowns, fight when he’s missing.",
      "Thresh": "Root into hook combo is deadly—maintain distance, use Rapid Fire windows, and leverage your ult in teamfights."
    }
  },
  "Zeri": {
    tips: {
      "Blitzcrank": "Hook counters your mobility—use dash proactively, stay near support, and punish when hook is down.",
      "Thresh": "His hook disrupts your keep-away play; wind-up to burst when he mis-positions, use your ult for repositioning.",
      "Leona": "Leona’s all-in threatens you; stay on the edge of trades, use ranged harass and disengage when she commits."
    }
  },
  "Nilah": {
    tips: {
      "Thresh": "Thresh’s hook range is key—avoid brushes, maintain range, exploit your early levels to force plates.",
      "Leona": "Nilah + Leona synergy is strong—commit only when your ult is ready, otherwise freeze until items come in.",
      "Blitzcrank": "Hook engages are your worst enemy—punish missed hooks by aggressively pushing first wave."
    }
  },
  "Smolder": {
    tips: {
      "Thresh": "Hook + zone combo kills early—use health leads to force plates, roam with jungler when support leaves lane.",
      "Leona": "All-in potential is huge—coordinate your ult with her Zenith Blade for maximum value before 6.",
      "Blitzcrank": "Avoid being grabbed; push fast, freeze when ahead, deny gold."

    }
  },
  "Twitch": {
    tips: {
      "Blitzcrank": "Hook forces you into stealth; play safe until 6, then look for flank with ultimate and surprise attacks.",
      "Thresh": "His lantern gives support roam—control side-wards vision and punish when he uses lantern to roam.",
      "Leona": "Her engage supports your stealth; coordinate your ult when she locks down targets, deep-flank after fights."
    }
  },
  "Kog'Maw": {
    tips: {
      "Alistar": "His front-to-back feeds your rhythm—play safe early, scale items, then hyper-carry once you hit power spike.",
      "Blitzcrank": "Hook removes you from safe positioning—stay behind and dictate fights once you have haste and range.",
      "Nami": "Nami’s heal and W speed compliment your range—freeze lane, and explode when you’ve built lethality."
    }
  },
  "Kalista": {
    tips: {
      "Thresh": "Hook + dismount is your worst lane event—use early range to zone, and trade with rend when he mis-hooks.",
      "Nautilus": "His engage is strong; use your range, keep kiting, and limit his all-in by tracking his route.",
      "Leona": "Leona dictates all-in timing; sync your Rend with her knock-up to maximise damage and kill potential."
    }
  },
  "Senna": {
    tips: {
      "Draven": "Heavy early pressure—play safe, stack souls, avoid blade crushing autos, and scale into late game utility and support synergies.",
      "Vayne": "She outscales you later—use your range, poke, and zone early instead of full fights; survive to mid-game.",
      "Thresh": "Hook + E combo disrupts your range; keep spacing, use your W to slow engages, and punish him when he mis-hooks."
    }
  },
  "Aphelios": {
    // (already included above, but we can duplicate deeper tips if needed)
    tips: {
      "Thresh": "Hook eats your low-mobility combo—use traps, keep tracking of his chain, and commit when you have weapon advantage.",
      "Nautilus": "Strong engage means you must rely on your support peel—don’t fight when he’s missing, push when safe.",
      "Leona": "When Leona roams you must push quickly or lose plates; coordinate your Phase and Ult with her for kill windows."
    }
  },
  "Yunara": {
    tips: {
      "Thresh": "Hook leads into laser follow-up—stay outside his range early, push quickly, and freeze when you have priority.",
      "Leona": "All-in synergy is explosive—commit once you hit level-6 and engage cooldowns are up; otherwise play safe early.",
      "Blitzcrank": "Hook steals your engage window—play ranged until he uses grab, then punish missing engage."
    }
  }
};

// Attach to window/global
window.adcTemplates = ADC_TEMPLATES;
