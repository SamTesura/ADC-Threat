// adc-templates-full.js
// ADC-specific quick-summary tips (based on high-elo bot-lane fundamentals)
// UPGRADED with High-Elo (KR/EUW/CN) Macro Concepts

const ADC_TEMPLATES = {
  // --- Core ADCs ---
  "Ashe": {
    tips: {
      "Thresh": "Stay at max range; avoid hooks by maintaining vision. Do not step forward without support.",
      "Nautilus": "Slow-push when he roams to deny plates. Collapse with support when he returns.",
      "Leona": "Must follow up her engage instantly. Use Hawkshot for vision to enable her engages."
    },
    macro: {
      "tempo_advantage": "Use Volley (W) to build and crash a large minion wave. This forces the enemy to catch the wave under their tower, giving you 'tempo' to recall for an item advantage or help your jungler secure scuttle.",
      "wave_management": "Ashe is excellent at 'freezing' the wave near your tower. Deny the enemy ADC farm and set up easy ganks for your jungler by only last-hitting.",
      "key_timer": "Level 6. Your Arrow (R) is a global gank tool. Ping your jungler or mid-laner as you hit 6 and look for a cross-map play."
    }
  },
  "Caitlyn": {
    tips: {
      "Blitzcrank": "Your aim is to avoid his hook. Trap brushes, keep kite distance, punish mis-hooks with headshots.",
      "Morgana": "Bait her Black Shield (E) before using your traps (W) or net (E) for an all-in."
    },
    macro: {
      "tempo_advantage": "You have the longest range. Shove the first two waves hard to get 'priority'. This lets you and your support move to ward the enemy jungle or help your jungler invade, a common KR/CN strategy.",
      "wave_management": "Use your range to 'poke' the enemy under their tower while simultaneously hitting the tower for plates. Place traps (W) to deny them space to farm.",
      "key_timer": "First tower. Once you take the bot tower, rotate mid to siege that tower and open up the map."
    }
  },
  "Jinx": {
    tips: {
      "Braum": "Braum’s shield negates your poke. Auto-attack when his shield is down and wait for your support to lock down target.",
      "Nami": "Nami’s sustain allows you to bully. Use your range and Flame Chompers (E) defensively when she engages."
    },
    macro: {
      "tempo_advantage": "Create a 'cheater recall' by hard shoving the third minion wave with rockets (Q). Recall, buy a Long Sword, and walk back to 'freeze' the wave as it pushes back to you.",
      "wave_management": "Your goal is to scale. Focus on perfect CS. Use rockets to thin a crashing wave, then switch to minigun to last-hit safely under tower.",
      "key_timer": "First Item (Kraken/IE) & Runaan's. You are a teamfight hyper-carry. Do not fight 2v2 unless it's free. Your power spike is 2-3 items. Ping your team to group."
    }
  },
  "Ezreal": {
    tips: {
      "Yuumi": "You are your own peel. Use your E aggressively to follow up her Q-slows, but hold it to dodge CC.",
      "Leona": "Excellent synergy. Your E (Arcane Shift) allows you to follow her E (Zenith Blade) engage instantly from a safe distance."
    },
    macro: {
      "tempo_advantage": "Ezreal has cheap recalls. Shove a wave with Q and auto-attacks, then recall for a Tear or Sheen. This item lead creates poke pressure ('tempo') that forces the enemy to recall at a bad time.",
      "wave_management": "Use your Q to last-hit from a distance if you are zoned or need to manage mana. You can easily set up a freeze by tanking the caster minions and using Q to thin them.",
      "key_timer": "Trinity Force / Manamune Completion. Once Muramana is stacked and you have your core item, your poke damage becomes a massive siege tool. Group with your team and poke objectives."
    }
  },
  "Kai'Sa": {
    tips: {
      "Nautilus": "Your all-in is explosive. Wait for his hook or ult, then follow up with your ult (R) for a quick kill.",
      "Alistar": "Be careful of his Headbutt (W) interrupting your ult. Wait for him to use his combo, then engage."
    },
    macro: {
      "tempo_advantage": "Your Q (Icathian Rain) is an execute on minions. Use it to quickly clear the last 3 minions of a wave to crash it, giving you tempo to ward or recall for a Pickaxe.",
      "wave_management": "You are weak early. Allow the enemy to push to you. Your Q helps you CS perfectly under tower. Look for isolated Qs on the enemy ADC if they step away from their minions.",
      "key_timer": "Q Evolve. Your first major power spike. This allows you to instantly clear waves, giving you permanent 'priority' to roam with your support or jungler."
    }
  },
  "Miss Fortune": {
    tips: {
      "Leona": "The perfect setup. Her stun guarantees your full E (Make It Rain) and R (Bullet Time).",
      "Braum": "His Unbreakable (E) will block your entire ultimate. Bait it out before committing to a teamfight."
    },
    macro: {
      "tempo_advantage": "You are a lane bully. Shove the wave constantly with your Q (Double Up) bounces and E. This pressure gives your team 'tempo' to invade the enemy's bot-side jungle.",
      "wave_management": "Push. Your goal is to get tower plates. Zone the enemy off the wave with your Q threat and E-slow.",
      "key_timer": "Level 6. This is the strongest ADC level 6 spike. Ping your support to engage the moment you hit 6. A double kill here can win the entire lane."
    }
  },
  "Xayah": {
    tips: {
      "Rakan": "Your E (Bladecaller) root is extended by his engage. All-in every time he lands a W (Grand Entrance).",
      "Thresh": "His lantern can save an enemy you've trapped with your feathers. Focus on breaking his lantern with vision."
    },
    macro: {
      "tempo_advantage": "Your Q-E combo clears waves instantly. Shove the wave and then place 'Feather' traps (E) in the jungle entrances to protect your lane from ganks.",
      "wave_management": "You can 'zone' the enemy with your feathers. Let the wave push to you, then set up a field of feathers between the enemy ADC and the minion wave.",
      "key_timer": "Navori Quickblades. This item turns you into a spell-weaving machine. Your E will be up constantly, giving you massive teamfight control and self-peel."
    }
  },
  "Aphelios": {
    tips: {
      "Thresh": "Hook equals death. Keep track of his cooldown. Your best combo here is Red (Infernum) for wave clear and White (Crescendum) for turret defense.",
      "Lulu": "Your perfect support. Her speed (W) and shield (E) allow you to survive until you get your power-spike weapons."
    },
    macro: {
      "tempo_advantage": "Your tempo is dictated by your weapon order. When you have Red (Infernum), you have wave-clear 'tempo'. Shove the wave. When you have White (Crescendum), you have objective 'tempo'. Signal your team for Dragon.",
      "wave_management": "Manage your ammo. Don't waste Red ammo on single minions. Use it to clear waves. Use Green (Calibrum) to last-hit from a safe distance if you're freezing.",
      "key_timer": "Weapon Cycle. High-elo Aphelios players (KR/CN) track their ammo to ensure they have Red-White or Green-Purple for major objectives like Dragon or Baron."
    }
  },
  "Tristana": {
    tips: {
      "Leona": "All-in synergy. Her stun allows you to stack your E (Explosive Charge) for free. Jump (W) on her target.",
      "Janna": "Anti-synergy. Her ult (R) can push enemies *out* of your E-bomb. Be careful with your all-in."
    },
    macro: {
      "tempo_advantage": "Your E-on-tower is your main 'tempo' tool. Shove the wave, place your E on the enemy turret, and auto-attack it. This forces the enemy jungler to come bot, relieving pressure from your other lanes.",
      "wave_management": "You are an all-in or push champion. You cannot 'freeze' easily due to your E-passive. Your default state should be pushing the wave to the enemy tower.",
      "key_timer": "Level 2/3. Your W-E all-in is one of the strongest in the game. If you have an engage support, look for the all-in the moment you hit level 2 or 3."
    }
  },
  "Sivir": {
    tips: {
      "Morgana": "Your Spell Shield (E) blocks her Q (Dark Binding). This is a free lane. Bait her Q, shield it, and win the trade with your W (Ricochet).",
      "Blitzcrank": "A free lane. Your E blocks his hook. Stand in front and bait it to gain mana."
    },
    macro: {
      "tempo_advantage": "You are the 'Tempo Queen'. Your Q (Boomerang Blade) and W (Ricochet) clear waves instantly. Your job is to perma-shove bot lane, then rotate mid with your support to create a 5v4 ('tempo') and take objectives.",
      "wave_management": "Push. Always push. You out-push everyone. This denies the enemy ADC farm and gives you map control.",
      "key_timer": "Level 6. Your ult (R) is a 'go' button for your entire team. Use it to engage, disengage, or rotate to objectives faster than the enemy team."
    }
  },
  "Lucian": {
    tips: {
      "Braum": "Your perfect partner. His passive (Concussive Blows) is procced instantly by your passive (Lightslinger). All-in on cooldown.",
      "Nami": "Her E (Tidecaller's Blessing) procs on both of your passive shots, giving you massive burst and movement speed."
    },
    macro: {
      "tempo_advantage": "Your E (Relentless Pursuit) dash allows you to trade and dodge abilities, winning 'tempo' in lane. Dash in, auto-Q-auto, then dash out as the enemy retaliates.",
      "wave_management": "You are a lane bully. Your goal is to get a 'priority' (pushed wave) so your jungler can invade or your support can roam mid.",
      "key_timer": "Level 2/3. With an engage support (Nami, Braum, Leona), your level 2 all-in is unmatched. Shove the first wave, hit level 2, and immediately engage."
    }
  },
  "Samira": {
    tips: {
      "Alistar": "The dream support. His W-Q combo (Headbutt-Pulverize) gives you a free E-Q and stacks your ult (R).",
      "Rell": "Another perfect support. Her engage (W) and ult (R) group enemies perfectly for your ultimate."
    },
    macro: {
      "tempo_advantage": "Your 'tempo' comes from skirmishes. You want to fight. Shove the wave and look to roam into the river with your support to find 2v2 or 3v3 fights.",
      "wave_management": "You must push to roam. Your Q (Flair) and autos clear waves quickly. You do not want to be frozen on; you want to be fighting.",
      "key_timer": "Level 6. Your ult (R) is a fight-winner. You *must* look for an all-in with your support the moment it's available. Track the enemy's Hard CC."
    }
  },
  "Vayne": {
    tips: {
      "Lulu": "Your best friend. Her shield (E), polymorph (W), and ult (R) give you the time you need to scale and shred targets.",
      "Thresh": "His lantern (W) is your 'get out of jail free' card. Tumble (Q) aggressively and trust his lantern peel."
    },
    macro: {
      "tempo_advantage": "You have no 'tempo' early. Your only goal is to survive. Give up CS if it means saving HP. Your 'tempo' comes *after* 2 items, where you become a split-pushing 'tempo' threat.",
      "wave_management": "Freeze. Your goal is to create a large, frozen wave outside your tower. This makes you safe from ganks and forces the enemy to over-extend, setting up your jungler.",
      "key_timer": "Level 6 + Blade of the Ruined King. This is your first true power spike. Your ult (R) gives you invisibility and dueling power. You can now look for 1v1 or 2v2 fights."
    }
  },
  "Draven": {
    tips: {
      "Leona": "Her stun (Q) guarantees you a double-axe hit. This lane is a free kill at level 2/3.",
      "Pyke": "His hook (Q) and stun (E) set you up. Your combined early-game damage is disrespectful. Look for kills."
    },
    macro: {
      "tempo_advantage": "You *are* the 'tempo'. From level 1, your axes create pressure. Your goal is to crash waves, dive the enemy, and cash in your Adoration stacks. This forces the enemy jungler bot, which *is* tempo for your team.",
      "wave_management": "Shove. Constantly. You want to fight, and you do that by having a minion advantage and forcing the enemy to CS under tower while you poke them.",
      "key_timer": "First Kill. Cashing in your stacks is your key timer. A 300-stack cash-in means you just bought a B.F. Sword while the enemy bought a Long Sword. The lane is over."
    }
  },
  "Varus": {
    tips: {
      "Thresh": "His hook (Q) or flay (E) sets up your ult (R) for a permanent CC chain. A kill is guaranteed.",
      "Leona": "Same as Thresh. Her full combo into your full combo is a 100-to-0 kill."
    },
    macro: {
      "tempo_advantage": "Your 'tempo' depends on your build. Lethality: Shove and poke with Q. On-Hit: Look for extended trades with your W (Blight) stacks. Your ult (R) is a 'tempo' tool for ganks.",
      "wave_management": "Lethality build wants to push and poke. On-hit build can freeze and all-in. Adapt to your build and support.",
      "key_timer": "Level 6. Your R (Chain of Corruption) is one of the best gank-setup tools in the game. Ping your jungler to come bot the moment you hit 6."
    }
  },
  "Zeri": {
    tips: {
      "Lulu": "Your 'tempo' and scaling partner. Her W (Whimsy) makes you uncatchable, and her E (Help, Pix!) gives your Q (Burst Fire) extra damage.",
      "Yuumi": "Makes you an unstoppable late-game machine. Play safe early, scale, and win."
    },
    macro: {
      "tempo_advantage": "You scale hard. Early 'tempo' is about survival. Use your E (Spark Surge) to escape ganks. Late game, your 'tempo' is flanking a teamfight with your E over a wall.",
      "wave_management": "Farm safely. Use your ranged right-click (W) to last-hit minions you can't walk up for. You are weak early; do not try to contest the wave.",
      "key_timer": "Statikk Shiv / Navori. Your first item is your wave-clear. Your 3-item spike (Navori, Runaan's, IE) is when you become a 1v5 champion."
    }
  },
  "Nilah": {
    tips: {
      "Rakan": "His knock-up (W) allows you to E-Q-R for a massive wombo-combo. He is your best support.",
      "Taric": "His stun (E) and invulnerability (R) are perfect for your all-in playstyle."
    },
    macro: {
      "tempo_advantage": "Your W (Jubilant Veil) blocks all auto-attacks. Use this to win 'tempo' in trades. Dash in (E), auto-Q, then W to block the enemy's return damage.",
      "wave_management": "You are melee. You must let the wave push to you. Farm under tower. Your Q (Formless Blade) helps you clear.",
      "key_timer": "Level 6. Your R (Apotheosis) is a teamfight-winning ultimate. Look for an all-in with your support. Your passive (Joy Unending) amplifies healing/shielding, making enchanters very strong."
    }
  },
  "Smolder": {
    tips: {
      "Milio": "His range extension (W) and peel (Q, R) are perfect for letting you scale and stack safely.",
      "Janna": "The ultimate peel support. She ensures no one ever touches you, allowing you to get 225 stacks."
    },
    macro: {
      "tempo_advantage": "You have zero 'tempo'. Your entire game is about stacking your Q (Super Scorcher). Your team must play *for* you. Your only goal is to hit 225 stacks.",
      "wave_management": "Let the wave push to you. Freeze it outside your tower. This is the safest way to stack. Use your W (Achooo!) and E (Flap, Flap, Flap) to escape ganks.",
      "key_timer": "225 Stacks. This is the only timer that matters. Once you hit 225, you become the primary win condition. Group with your team and burn everything."
    }
  },

  // --- Flex / Hybrid ADCs ---
  "Twitch": {
    tips: {
      "Lulu": "Her W (Whimsy) and R (Wild Growth) turn you into a 1v5 hyper-carry during your ult (R).",
      "Yuumi": "Makes you a stealth bomber. Emerge from stealth (Q) with Yuumi's R (Final Chapter) for a devastating engage."
    },
    macro: {
      "tempo_advantage": "Your Q (Ambush) is your 'tempo' tool. Shove the wave, then Q and roam mid for a gank. A kill mid gives your *team* tempo. This is a classic KR solo-queue strategy.",
      "wave_management": "Your W (Venom Cask) and E (Contaminate) can clear waves. Shove the wave to enable your Q roams.",
      "key_timer": "Level 6 + Runaan's. Your R (Spray and Pray) combined with Runaan's is one of the most powerful teamfight spikes in the game. Force dragon or baron fights."
    }
  },
  "Kog'Maw": {
    tips: {
      "Lulu": "The classic 'Jugger-Maw'. Her entire kit is designed to keep you alive while you melt the enemy team.",
      "Braum": "His shield (E) blocks projectiles, and his passive (Concussive Blows) procs easily with your W (Bio-Arcane Barrage)."
    },
    macro: {
      "tempo_advantage": "You are a ticking time bomb. You have no early 'tempo'. Your 'tempo' is your scaling. Survive, and you win. Your W gives you 'tempo' in trades due to its range.",
      "wave_management": "Freeze. You are immobile and weak early. Freeze the wave outside your tower and farm safely. Use your E (Void Ooze) to disengage.",
      "key_timer": "Level 6 + 3 Items. You are the definition of a late-game hyper-carry. Once you have 3 items, you are the team's win condition. Group and hit what's in front of you."
    }
  },
  "Kalista": {
    tips: {
      "Thresh": "Your R (Fate's Call) turns him into an engage tool. He can hook (Q), get ulted by you, and then Flay (E) the enemy back.",
      "Alistar": "Same as Thresh. Ult him in for a guaranteed W-Q (Pulverize) combo."
    },
    macro: {
      "tempo_advantage": "Your 'tempo' is objectives. Your E (Rend) is a better Smite. Shove the wave and constantly look to secure Dragon or Rift Herald with your jungler. This is your primary 'tempo' gain.",
      "wave_management": "You can push or freeze. Your hops (Passive) make you strong in a long lane (frozen) or safe while pushing. Adapt to your support.",
      "key_timer": "Level 1. Your E (Rend) execute on minions makes it easy to push for a fast Level 2. Look for an all-in if you hit 2 first."
    }
  },
  "Senna": {
    tips: {
      "Tahm Kench": "He can eat you (W) to save you. This allows you to play aggressively, auto-Q, and then get saved if you get engaged on.",
      "Sett": "A strong 'fasting' partner. You farm souls, he farms CS. His engage (E) sets up your W (Last Embrace) root."
    },
    macro: {
      "tempo_advantage": "Your global R (Dawning Shadow) is your 'tempo' tool. Shove bot, then look at top or mid lane. A cross-map ult can turn a 1v1 into a 1v2, giving your team 'tempo'.",
      "wave_management": "As 'Fasting' Senna, you don't CS. You poke and look for souls. As 'Farming' Senna, your Q (Piercing Darkness) helps you farm and poke at the same time.",
      "key_timer": "Soul Stacks. Your scaling is infinite. Each 20 souls gives you range and damage. Your game is about safely collecting souls until you out-range everyone."
    }
  },
  "Seraphine": {
    tips: {
      "Sona": "The ultimate poke/sustain lane. You will never be forced out of lane and can poke the enemy to death.",
      "Lux": "Your E (Beat Drop) roots targets slowed by her E (Lucent Singularity). Your ults (R) combo perfectly."
    },
    macro: {
      "tempo_advantage": "You are a wave-clear machine. Your Q (High Note) and E (Beat Drop) clear waves instantly. Your 'tempo' is to perma-shove bot, then group with your team as a secondary AP carry.",
      "wave_management": "Push. Always push. You want to clear the wave, then use your E and Q to poke the enemy under their tower. You are a siege engine.",
      "key_timer": "Level 6. Your R (Encore) is a game-changing teamfight ult. Group for every Dragon and Baron fight. You are not a 1v1 duelist; you are a 5v5 team-fighter."
    }
  },
  "Veigar": {
    tips: {
      "Caitlyn": "A classic 'stun-trap' combo. Your E (Event Horizon) guarantees her W (Yordle Snap-Trap) hit.",
      "Ezreal": "His W (Essence Flux) into your E (Event Horizon) is a strong poke/catch combo."
    },
    macro: {
      "tempo_advantage": "Your E (Event Horizon) is your 'tempo'. It zones the entire enemy team off an objective. You provide utility and scaling.",
      "wave_management": "You are a stacking champion. Use your Q (Baleful Strike) to last-hit and stack AP. Farm safely. Let the wave push to you.",
      "key_timer": "Stacks & Level 6. Your goal is to stack. Your R (Primordial Burst) is an execute. You win by scaling into an AP hyper-carry."
    }
  },
  "Ziggs": {
    tips: {
      "Xerath": "A poke-heavy lane. You can siege towers from a screen away.",
      "Janna": "Her shield (E) gives you AD, which helps your auto-attacks on towers. Her peel (Q, R) keeps you safe."
    },
    macro: {
      "tempo_advantage": "You are a 'tempo' sieging champion. Your W (Satchel Charge) can execute towers below a certain HP. Your 'tempo' is to take the bot tower as fast as possible (before 14 mins).",
      "wave_management": "Push. Your Bouncing Bomb (Q) and Passive (Short Fuse) are designed to clear waves and hit towers. Perma-shove.",
      "key_timer": "First Tower. Your entire goal is to get the first tower plating, then the tower itself. Once the tower is down, rotate mid and do the same thing."
    }
  }
};
