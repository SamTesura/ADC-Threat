let state = {};

// --- CONSTANTS ---
const CHAMPION_ICON_URL_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/';
const SUPPORT_TIPS = {
	Ashe: [
		'Ashe has high poke with Volley (W). Try to stand behind minions to avoid it.',
		'Her ultimate (Enchanted Crystal Arrow) is a global stun. Be aware of it when she hits level 6.',
		"Ashe's Hawkshot (E) grants vision. Assume she has vision of key areas like Dragon or Baron.",
	],
	Caitlyn: [
		'Caitlyn has the longest base auto-attack range. Respect her poke.',
		'Her Yordle Snap Trap (W) can root you. Watch your step in bushes and chokepoints.',
		'Her ultimate (Ace in the Hole) can be blocked by allies. Stand behind your tankiest teammate if you are low.',
	],
	Draven: [
		'Draven needs to catch his Spinning Axes (Q) to maintain his damage. Try to poke him when he moves to catch an axe.',
		'His damage is extremely high, especially early. Avoid all-in fights if he has two axes spinning.',
		'His Stand Aside (E) can interrupt dashes and channels. Be careful when engaging.',
	],
	Ezreal: [
		'Ezreal is a heavy skillshot-based champion. Stand behind minions to avoid his Mystic Shot (Q).',
		'His Arcane Shift (E) is a blink, making him very safe. Wait for him to use it before trying to engage.',
		'His ultimate (Trueshot Barrage) is global. Be mindful when recalling with low health.',
	],
	Jhin: [
		"Jhin has to reload after his 4th shot. His 4th shot deals bonus execute damage. Respect it.",
		'He is very immobile. He is vulnerable to ganks and all-ins, especially when he is reloading.',
		'His Deadly Flourish (W) can root you if you have been damaged by Jhin or his allies. Be careful after taking poke.',
	],
	Jinx: [
		'Jinx gets a massive speed boost (Get Excited!) after a kill or assist. Be careful of her "reset" potential in teamfights.',
		"She switches between her Minigun (Pow-Pow) for single-target attack speed and her Rocket Launcher (Fishbones) for AoE poke. Respect her range with rockets.",
		'Her Flame Chompers (E) are a row of traps. Do not chase her directly into them.',
	],
	KaiSa: [
		"Kai'Sa is a short-range ADC. She is vulnerable to poke.",
		"Her Icathian Rain (Q) is her main damage tool. Try to stand away from isolated minions to reduce its damage.",
		'Her ultimate (Killer Instinct) allows her to dash to a target marked by her plasma. Be careful when she has allies engaging on you.',
	],
	KogMaw: [
		"Kog'Maw is extremely immobile (a 'glass cannon'). He is very vulnerable to ganks and all-ins.",
		'His Bio-Arcane Barrage (W) grants him significantly increased range and damage. Back off when it is active.',
		'His ultimate (Living Artillery) is a long-range poke tool. It costs more mana with successive uses.',
	],
	Lucian: [
		'Lucian has a very strong early game, especially with his passive (Lightslinger). Avoid extended trades.',
		'His Relentless Pursuit (E) is a dash. He can use it aggressively or defensively.',
		'His ultimate (The Culling) fires in one direction. You can dash or flash out of it.',
	],
	MissFortune: [
		'Miss Fortune has strong poke with her Double Up (Q). Avoid standing behind a low-health minion.',
		'Her Make It Rain (E) is an AoE slow. Do not stand in it.',
		'Her ultimate (Bullet Time) deals massive AoE damage in a cone. It can be interrupted by stuns, knock-ups, or silences.',
	],
	Samira: [
		'Samira wants to build up her "Style" (S-rank) to use her ultimate (Inferno Trigger). Try to poke her from a distance.',
		'Her Blade Whirl (W) blocks all projectiles. Do not waste key skillshots (like hooks or stuns) into it.',
		'She is a short-range, all-in champion. She is vulnerable to poke and hard CC.',
	],
	Senna: [
		'Senna is a scaling champion who gets stronger by collecting Mist (souls). Try to deny her souls by zoning her.',
		'Her Last Caress (Q) is a long-range heal and damage ability. She can target allies, enemies, or minions.',
		'Her ultimate (Dawning Shadow) is a global shield for allies and damage for enemies. Be aware of it in fights, even if she is not there.',
	],
	Sivir: [
		'Sivir has strong wave clear with her Boomerang Blade (Q) and Ricochet (W). She will likely push the wave.',
		'Her Spell Shield (E) can block one ability, restoring her mana. Bait it out with a less important ability.',
		'Her ultimate (On the Hunt) provides a massive movement speed boost to her and her team. Be careful when she uses it to engage or disengage.',
	],
	Tristana: [
		'Tristana has a very strong all-in with her Rocket Jump (W) and Explosive Charge (E).',
		'Her Rocket Jump (W) resets on kill or assist, or when she fully stacks her Explosive Charge (E) on a champion.',
		'Her ultimate (Buster Shot) is a knockback. She can use it to peel for herself or to knock you into her team.',
	],
	Twitch: [
		"Twitch can become invisible with his Ambush (Q). Be wary of ganks from him, even when he's supposed to be in lane.",
		'His Contaminate (E) deals a burst of damage based on how many stacks of his poison (Deadly Venom) you have.',
		'His ultimate (Spray and Pray) grants him long range and piercing auto-attacks. Do not group up when it is active.',
	],
	Varus: [
		'Varus has very strong, long-range poke with his Piercing Arrow (Q). Stand behind minions to avoid it.',
		'He can build for poke (Lethality) or for attack speed (On-hit). Adapt your build and playstyle.',
		'His ultimate (Chain of Tendrils) is a long-range root that can spread to nearby allies. Spread out if he hits a target.',
	],
	Vayne: [
		'Vayne deals bonus true damage every third auto-attack (Silver Bolts). Avoid extended trades.',
		'She is very mobile with her Tumble (Q), which also makes her invisible during her ultimate (Final Hour).',
		'Her Condemn (E) can stun you if it knocks you into a wall. Be very careful about your positioning near walls.',
	],
	Xayah: [
		'Xayah leaves feathers on the ground with her abilities. When she uses her Bladecaller (E), she recalls all feathers, rooting you if you are hit by 3 or more.',
		'Her ultimate (Featherstorm) makes her untargetable for a short period. She can use it to dodge key abilities or to set up her feathers.',
		'She is very strong when paired with Rakan.',
	],
	Zeri: [
		'Zeri is a high-mobility ADC who plays similarly to an on-hit champion.',
		'Her Spark Surge (E) allows her to dash and slide over walls. She is very slippery.',
		'Her ultimate (Lightning Crash) gives her a large buff in teamfights. Avoid grouping up to let her get a 5-man ult.',
	],
	Aphelios: [
		"Aphelios has 5 different guns, each with a unique effect. His ammo is limited (50 per gun).",
		"His most dangerous gun combination is typically Infernum (Flamethrower) for AoE damage and Crescendum (Chakram) for high close-range DPS.",
		"His ultimate (Moonlight Vigil) changes based on his main-hand gun. The Infernum ult is a large AoE burst.",
	],
	Ashe: [
		"Ashe's Volley (W) is her main poke tool. Try to stand behind minions to avoid it.",
		"Her ultimate, Enchanted Crystal Arrow (R), is a global stun. Be mindful of it post-6, especially when low or out of position.",
		"Ashe has no dash. She is vulnerable to all-ins and ganks. Try to engage on her when her Flash is down.",
	],
	Caitlyn: [
		'Caitlyn has the longest base auto-attack range in the game. Respect her poke.',
		'Watch out for her Yordle Snap Traps (W). She will often place them in bushes or under you when you are CC-ed.',
		'Her 90 Caliber Net (E) can be used to dash away. It also slows you and sets up a guaranteed headshot.',
	],
	Draven: [
		'Draven must catch his Spinning Axes (Q) to deal high damage. Try to harass him when he moves to catch an axe.',
		"His early game all-in is one of the strongest. Do not fight him if he has both axes spinning and his support is in position.",
		'His Stand Aside (E) can interrupt dashes (like Leona E or Alistar W).',
	],
	Ezreal: [
		'Ezreal is heavily reliant on skillshots, especially his Mystic Shot (Q). Stay behind minions to block it.',
		'His Arcane Shift (E) is a powerful blink. Try to bait it out before committing to an all-in.',
		'Ezreal has a strong mid-game power spike once he completes Manamune and a Sheen item (Trinity Force or Essence Reaver).',
	],
	Jhin: [
		"Jhin's 4th shot is a guaranteed critical strike that deals execute damage. Do not stay in range when he has it ready.",
		'He is very immobile. He is an easy target for ganks and all-ins, especially when he is reloading.',
		'His Deadly Flourish (W) has very long range and can root you if you were recently damaged by Jhin or his allies.',
	],
	Jinx: [
		'Jinx gets a massive movement speed boost (Get Excited!) on a kill or assist. This makes her dangerous in reset-heavy teamfights.',
		"Her Rocket Launcher (Fishbones) gives her AoE damage and long range. Don't stand clustered with your team.",
		'Her Flame Chompers (E) are a line of traps that root. Be careful when chasing her or walking into bushes.',
	],
	KaiSa: [
		"Kai'Sa is a short-range, scaling ADC. Try to abuse her weak early game.",
		'Her Icathian Rain (Q) deals bonus damage to isolated targets. Avoid fighting her 1v1 away from minions.',
		"Her ultimate (Killer Instinct) lets her dash to any enemy she has applied her Plasma passive to. Be careful of her follow-up engages.",
	],
	Kalista: [
		'Kalista continuously hops after every auto-attack. This makes her hard to hit, but her hops are predictable.',
		'Her Rend (E) is her main damage tool. It stacks spears and can be used to execute targets. Be aware of the stack count.',
		'Her ultimate (Fate\'s Call) requires her to be "Soul-Bound" to her support. She can pull her support to her, making them untargetable.',
	],
	KogMaw: [
		"Kog'Maw is a 'glass cannon' with extreme late-game damage but no mobility. He is very reliant on his team for peel.",
		'His Bio-Arcane Barrage (W) grants him massively increased range and attack speed. This is his main damage window. Back off or CC him when it\'s active.',
		'His passive makes him explode after death, dealing true damage. Move away from his body.',
	],
	Lucian: [
		'Lucian has a very strong early game and short-range burst damage, especially with his passive (Lightslinger).',
		'His Relentless Pursuit (E) dash can be reset by his passive. He is very mobile in short trades.',
		'Lucian works best with supports who can engage or trade heavily with him (e.g., Braum, Leona, Nami).',
	],
	MissFortune: [
		'Her Double Up (Q) can bounce and critically strike a target behind the first. Avoid standing directly behind a low-health minion.',
		'Her Make It Rain (E) is an AoE slow. It is good for setup or zoning.',
		'Her ultimate, Bullet Time (R), deals massive AoE damage in a cone. It can be interrupted by any hard CC (stun, silence, knock-up).',
	],
	Nilah: [
		'Nilah is a short-range, melee ADC who wants to all-in.',
		'Her Jubilant Veil (W) makes her dodge all auto-attacks and take reduced magic damage. Do not auto-attack her when it is active.',
		'She shares bonus XP from last-hitting minions. This means she and her support will hit levels 2, 3, and 6 faster. Respect their level advantages.',
	],
	Samira: [
		'Samira needs to build her "Style" combo (from E to S rank) to use her ultimate (Inferno Trigger).',
		'Her Blade Whirl (W) destroys all projectiles (e.g., hooks, Thresh flay, ADC autos) for its duration. Bait it out before using key abilities.',
		'She is a high-risk, high-reward champion. She is very vulnerable to hard CC. Save your stun/root for her when she dashes in.',
	],
	Senna: [
		'Senna is an ADC/Support hybrid who scales infinitely by collecting Mist Wraiths (souls).',
		'Her Last Caress (Q) is a long-range heal and poke tool. She can target minions, allies, or enemies.',
		'Her ultimate, Dawning Shadow (R), is a global ability that shields allies and damages enemies in the center. Be aware of it in close fights anywhere on the map.',
	],
	Sivir: [
		'Sivir is a utility ADC with extremely fast wave clear using her Boomerang Blade (Q) and Ricochet (W).',
		'Her Spell Shield (E) blocks the next enemy ability, restoring her mana. Try to bait it out with a non-essential ability.',
		"Her ultimate, On the Hunt (R), gives her entire team a large burst of movement speed. Be careful of engages or disengages when she uses it.",
	],
	Tristana: [
		'Tristana is an all-in "reset" champion. Her Rocket Jump (W) resets on kill, assist, or on a full detonation of her Explosive Charge (E).',
		'Her Explosive Charge (E) is her main burst tool. The damage increases with each auto-attack. Back off if she places it on you.',
		'Her ultimate, Buster Shot (R), is a knockback. She can use it to peel for herself or, in an "insec" maneuver, to jump behind you and knock you into her team.',
	],
	Twitch: [
		"Twitch's Ambush (Q) allows him to go invisible and gain attack speed. Be wary of his roams or surprise all-ins from stealth.",
		'His Contaminate (E) deals a burst of damage based on his Deadly Venom (passive) stacks. Try to trade when he has no stacks on you.',
		'His ultimate, Spray and Pray (R), gives him bonus AD and long-range, piercing auto-attacks. Do not stand clustered in teamfights.',
	],
	Varus: [
		'Varus can be built two ways: poke (Lethality) or on-hit (Attack Speed). Identify his build and itemize accordingly.',
		'His Piercing Arrow (Q) is a very long-range poke skillshot. Stay behind minions to avoid it.',
		'His ultimate, Chain of Tendrils (R), is a projectile that roots a target and then spreads to nearby champions. Spread out if one of your teammates gets hit.',
	],
	Vayne: [
		"Vayne's Silver Bolts (W) deals true damage every third auto-attack on the same target. She is a natural tank-shredder.",
		"She is very mobile with her Tumble (Q), which also grants invisibility during her ultimate (Final Hour).",
		'Her Condemn (E) can stun you if it knocks you into a wall. Be extremely careful of your positioning near terrain.',
	],
	Xayah: [
		'Xayah leaves feathers on the ground with her abilities. Her Bladecaller (E) pulls all feathers back, rooting you if you are hit by 3 or more.',
		"Her ultimate, Featherstorm (R), makes her untargetable and allows her to reposition and set up a large E.",
		'She is a strong teamfighter and scales very well into the late game.',
	],
	Zeri: [
		'Zeri is a very high-mobility ADC. Her Spark Surge (E) lets her dash and slide over walls.',
		'Her damage is primarily from her "charged" auto-attack (Q passive) and her Burst Fire (Q) ability.',
		'Her ultimate, Lightning Crash (R), is a large AoE burst that "overcharges" her, giving her movement speed, attack speed, and chain lightning on her attacks.',
	],
};

const ADC_LIST = {
	type: 'adc',
	format: 'full',
	version: '14.4.1',
	data: {
		Aphelios: {
			id: 'Aphelios',
			key: '523',
			name: 'Aphelios',
			title: 'the Weapon of the Faithful',
			tags: ['Marksman'],
			stats: {
				hp: 510,
				hpperlevel: 102,
				mp: 348,
				mpperlevel: 42,
				movespeed: 325,
				armor: 26,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.25,
				hpregenperlevel: 0.55,
				mpregen: 6.5,
				mpregenperlevel: 0.4,
				crit: 0,
				critperlevel: 0,
				attackdamage: 55,
				attackdamageperlevel: 2.5,
				attackspeedperlevel: 2.1,
				attackspeed: 0.64,
			},
			blurb:
				'Emerging from moonlight’s shadow with weapons drawn, Aphelios kills the enemies of his faith in brooding silence—speaking only through the certainty of his aim, and the firing of each gun. Though driven by a poison that renders him mute, he is guided by...',
		},
		Ashe: {
			id: 'Ashe',
			key: '22',
			name: 'Ashe',
			title: 'the Frost Archer',
			tags: ['Marksman', 'Support'],
			stats: {
				hp: 640,
				hpperlevel: 101,
				mp: 280,
				mpperlevel: 35,
				movespeed: 325,
				armor: 26,
				armorperlevel: 4.6,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 600,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 6.972,
				mpregenperlevel: 0.4,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 2.96,
				attackspeedperlevel: 3.33,
				attackspeed: 0.658,
			},
			blurb:
				'Iceborn warmother of the Avarosan tribe, Ashe commands the most populous horde in the north. Stoic, intelligent, and idealistic, yet uncomfortable with her role as leader, she taps into the ancestral magic of her lineage to wield a bow of True Ice...',
		},
		Caitlyn: {
			id: 'Caitlyn',
			key: '51',
			name: 'Caitlyn',
			title: 'the Sheriff of Piltover',
			tags: ['Marksman'],
			stats: {
				hp: 580,
				hpperlevel: 107,
				mp: 315,
				mpperlevel: 35,
				movespeed: 325,
				armor: 27,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 650,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 7.4,
				mpregenperlevel: 0.55,
				crit: 0,
				critperlevel: 0,
				attackdamage: 60,
				attackdamageperlevel: 3,
				attackspeedperlevel: 4,
				attackspeed: 0.681,
			},
			blurb:
				'Renowned as its finest peacemaker, Caitlyn is also Piltover’s best shot at ridding the city of its elusive criminal elements. She is often paired with Vi, acting as a cool counterpoint to her more impetuous partner. Even when she hunts alone, Caitlyn...',
		},
		Draven: {
			id: 'Draven',
			key: '119',
			name: 'Draven',
			title: 'the Glorious Executioner',
			tags: ['Marksman'],
			stats: {
				hp: 675,
				hpperlevel: 100,
				mp: 360.56,
				mpperlevel: 39,
				movespeed: 330,
				armor: 29,
				armorperlevel: 4.5,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.75,
				hpregenperlevel: 0.7,
				mpregen: 8.042,
				mpregenperlevel: 0.65,
				crit: 0,
				critperlevel: 0,
				attackdamage: 62,
				attackdamageperlevel: 3.7,
				attackspeedperlevel: 2.7,
				attackspeed: 0.679,
			},
			blurb:
				'In Noxus, warriors known as Reckoners face one another in arenas where blood is spilled and strength tested. But none has ever been as celebrated as Draven. A former soldier, he found that audiences uniquely appreciated his flair for the dramatic, and his...',
		},
		Ezreal: {
			id: 'Ezreal',
			key: '81',
			name: 'Ezreal',
			title: 'the Prodigal Explorer',
			tags: ['Marksman', 'Mage'],
			stats: {
				hp: 600,
				hpperlevel: 102,
				mp: 375,
				mpperlevel: 70,
				movespeed: 325,
				armor: 24,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 4,
				hpregenperlevel: 0.65,
				mpregen: 8.5,
				mpregenperlevel: 0.65,
				crit: 0,
				critperlevel: 0,
				attackdamage: 60,
				attackdamageperlevel: 2.5,
				attackspeedperlevel: 2.5,
				attackspeed: 0.625,
			},
			blurb:
				'A dashing adventurer, unknowingly gifted in the magical arts, Ezreal raids long-lost catacombs, tangles with ancient curses, and overcomes seemingly impossible odds with easy finesse. His courage and bravado knowing no bounds, he prefers to improvise his...',
		},
		Jhin: {
			id: 'Jhin',
			key: '202',
			name: 'Jhin',
			title: 'the Virtuoso',
			tags: ['Marksman', 'Mage'],
			stats: {
				hp: 630,
				hpperlevel: 107,
				mp: 300,
				mpperlevel: 50,
				movespeed: 330,
				armor: 24,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.75,
				hpregenperlevel: 0.55,
				mpregen: 6,
				mpregenperlevel: 0.8,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 4.7,
				attackspeedperlevel: 0,
				attackspeed: 0.625,
			},
			blurb:
				'Jhin is a meticulous criminal psychopath who believes murder is art. Once an Ionian prisoner, but freed by shadowy elements within Ionia’s ruling council, the serial killer now works as their cabal's assassin. Using his gun as his paintbrush, Jhin...',
		},
		Jinx: {
			id: 'Jinx',
			key: '222',
			name: 'Jinx',
			title: 'the Loose Cannon',
			tags: ['Marksman'],
			stats: {
				hp: 630,
				hpperlevel: 100,
				mp: 245,
				mpperlevel: 45,
				movespeed: 325,
				armor: 26,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 525,
				hpregen: 3.75,
				hpregenperlevel: 0.5,
				mpregen: 6.7,
				mpregenperlevel: 1,
				crit: 0,
				critperlevel: 0,
				attackdamage: 57,
				attackdamageperlevel: 3.4,
				attackspeedperlevel: 1,
				attackspeed: 0.625,
			},
			blurb:
				'A manic and impulsive criminal from Zaun, Jinx lives to wreak havoc without care for the consequences. With an arsenal of deadly weapons, she unleashes the loudest blasts and brightest explosions to leave a trail of mayhem and panic in her wake. Jinx...',
		},
		KaiSa: {
			id: 'KaiSa',
			key: '145',
			name: "Kai'Sa",
			title: 'Daughter of the Void',
			tags: ['Marksman'],
			stats: {
				hp: 670,
				hpperlevel: 102,
				mp: 344.88,
				mpperlevel: 38,
				movespeed: 335,
				armor: 25,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 525,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 8.2,
				mpregenperlevel: 0.45,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 2.6,
				attackspeedperlevel: 1.8,
				attackspeed: 0.644,
			},
			blurb:
				'Claimed by the Void when she was only a child, Kai’Sa managed to survive through sheer tenacity and strength of will. Her experiences have made her a deadly hunter and, to some, a forerunner of a future they would rather not live to see. Having entered...',
		},
		Kalista: {
			id: 'Kalista',
			key: '429',
			name: 'Kalista',
			title: 'the Spear of Vengeance',
			tags: ['Marksman'],
			stats: {
				hp: 600,
				hpperlevel: 114,
				mp: 300,
				mpperlevel: 45,
				movespeed: 330,
				armor: 24,
				armorperlevel: 5.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 525,
				hpregen: 3.75,
				hpregenperlevel: 0.55,
				mpregen: 6.3,
				mpregenperlevel: 0.4,
				crit: 0,
				critperlevel: 0,
				attackdamage: 61,
				attackdamageperlevel: 3.25,
				attackspeedperlevel: 4.5,
				attackspeed: 0.694,
			},
			blurb:
				'A specter of wrath and retribution, Kalista is the undying spirit of vengeance, an armored nightmare summoned from the Shadow Isles to hunt deceivers and traitors. The betrayed may cry out in blood to be avenged, but Kalista only answers those willing to...',
		},
		KogMaw: {
			id: 'KogMaw',
			key: '96',
			name: "Kog'Maw",
			title: 'the Mouth of the Abyss',
			tags: ['Marksman', 'Mage'],
			stats: {
				hp: 635,
				hpperlevel: 99,
				mp: 325,
				mpperlevel: 40,
				movespeed: 330,
				armor: 24,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 500,
				hpregen: 3.75,
				hpregenperlevel: 0.55,
				mpregen: 8.75,
				mpregenperlevel: 0.7,
				crit: 0,
				critperlevel: 0,
				attackdamage: 61,
				attackdamageperlevel: 3.1,
				attackspeedperlevel: 2.65,
				attackspeed: 0.665,
			},
			blurb:
				'Belched forth from a rotting void fissure deep in the wastelands of Icathia, Kog’Maw is an inquisitive yet putrid creature with a caustic, gaping mouth. This particular Void-spawn needs to gnaw and drool on anything and everything to truly understand it...',
		},
		Lucian: {
			id: 'Lucian',
			key: '236',
			name: 'Lucian',
			title: 'the Purifier',
			tags: ['Marksman'],
			stats: {
				hp: 641,
				hpperlevel: 100,
				mp: 348.88,
				mpperlevel: 38,
				movespeed: 335,
				armor: 28,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 500,
				hpregen: 3.75,
				hpregenperlevel: 0.65,
				mpregen: 8.176,
				mpregenperlevel: 0.7,
				crit: 0,
				critperlevel: 0,
				attackdamage: 60,
				attackdamageperlevel: 2.9,
				attackspeedperlevel: 3.3,
				attackspeed: 0.638,
			},
			blurb:
				'Lucian, a Sentinel of Light, is a grim hunter of undying spirits, pursuing them relentlessly and annihilating them with his twin relic pistols. After the wraith Thresh killed his wife, Lucian embarked on the path of vengeance—but even with her return to...',
		},
		MissFortune: {
			id: 'MissFortune',
			key: '21',
			name: 'Miss Fortune',
			title: 'the Bounty Hunter',
			tags: ['Marksman'],
			stats: {
				hp: 640,
				hpperlevel: 103,
				mp: 300,
				mpperlevel: 40,
				movespeed: 325,
				armor: 28,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.75,
				hpregenperlevel: 0.65,
				mpregen: 8,
				mpregenperlevel: 0.75,
				crit: 0,
				critperlevel: 0,
				attackdamage: 52,
				attackdamageperlevel: 2.7,
				attackspeedperlevel: 3,
				attackspeed: 0.656,
			},
			blurb:
				'A Bilgewater captain famed for her looks but feared for her ruthlessness, Sarah Fortune strides a harsh world as a figure of authority. In her youth, she witnessed the reaver king Gangplank murder her family—an act she brutally avenged years later...',
		},
		Nilah: {
			id: 'Nilah',
			key: '895',
			name: 'Nilah',
			title: 'the Joy Unbound',
			tags: ['Marksman', 'Assassin'],
			stats: {
				hp: 570,
				hpperlevel: 112,
				mp: 350,
				mpperlevel: 45,
				movespeed: 340,
				armor: 27,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 225,
				hpregen: 4,
				hpregenperlevel: 0.9,
				mpregen: 8.176,
				mpregenperlevel: 0.7,
				crit: 0,
				critperlevel: 0,
				attackdamage: 55,
				attackdamageperlevel: 2,
				attackspeedperlevel: 3,
				attackspeed: 0.6,
			},
			blurb:
				'Nilah is an ascetic warrior from a distant land, seeking the world’s most dangerous and colossal opponents so that she might challenge and destroy them. Having won her power through an encounter with the long-imprisoned demon of joy, she has no emotion...',
		},
		Samira: {
			id: 'Samira',
			key: '360',
			name: 'Samira',
			title: 'the Desert Rose',
			tags: ['Marksman'],
			stats: {
				hp: 600,
				hpperlevel: 108,
				mp: 348.88,
				mpperlevel: 38,
				movespeed: 335,
				armor: 26,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 500,
				hpregen: 3.25,
				hpregenperlevel: 0.55,
				mpregen: 8.176,
				mpregenperlevel: 0.7,
				crit: 0,
				critperlevel: 0,
				attackdamage: 55,
				attackdamageperlevel: 3.3,
				attackspeedperlevel: 3.3,
				attackspeed: 0.658,
			},
			blurb:
				'Samira stares death in the eye with unyielding confidence, seeking thrill wherever she goes. After her Shuriman home was destroyed as a child, Samira found her true calling in Noxus, where she built a reputation as a stylish daredevil taking on...',
		},
		Senna: {
			id: 'Senna',
			key: '235',
			name: 'Senna',
			title: 'the Redeemer',
			tags: ['Marksman', 'Support'],
			stats: {
				hp: 530,
				hpperlevel: 89,
				mp: 350,
				mpperlevel: 45,
				movespeed: 330,
				armor: 28,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 600,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 11.5,
				mpregenperlevel: 0.4,
				crit: 0,
				critperlevel: 0,
		
				attackdamage: 50,
				attackdamageperlevel: 0,
				attackspeedperlevel: 4,
				attackspeed: 0.625,
			},
			blurb:
				'Cursed from childhood to be haunted by the supernatural Black Mist, Senna joined a sacred order known as the Sentinels of Light, and fiercely fought back—only to be killed, her soul imprisoned in a lantern by the cruel wraith Thresh. But refusing to...',
		},
		Sivir: {
			id: 'Sivir',
			key: '15',
			name: 'Sivir',
			title: 'the Battle Mistress',
			tags: ['Marksman'],
			stats: {
				hp: 600,
				hpperlevel: 104,
				mp: 340,
				mpperlevel: 45,
				movespeed: 335,
				armor: 26,
				armorperlevel: 4.4,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 500,
				hpregen: 3.25,
				hpregenperlevel: 0.55,
				mpregen: 8,
				mpregenperlevel: 0.7,
				crit: 0,
				critperlevel: 0,
				attackdamage: 58,
				attackdamageperlevel: 3,
				attackspeedperlevel: 2,
				attackspeed: 0.625,
			},
			blurb:
				'Sivir is a renowned mercenary captain and bounty hunter who plies her trade in the deserts of Shurima. Armed with her legendary jeweled crossblade, she has fought and won countless battles for those who can afford her services. She takes great pride in...',
		},
		Tristana: {
			id: 'Tristana',
			key: '18',
			name: 'Tristana',
			title: 'the Yordle Gunner',
			tags: ['Marksman', 'Assassin'],
			stats: {
				hp: 640,
				hpperlevel: 102,
				mp: 250,
				mpperlevel: 32,
				movespeed: 325,
				armor: 26,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 525,
				hpregen: 3.75,
				hpregenperlevel: 0.65,
				mpregen: 7.2,
				mpregenperlevel: 0.45,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 3.7,
				attackspeedperlevel: 1.5,
				attackspeed: 0.656,
			},
			blurb:
				'While many other yordles channel their energy into discovery, invention, or just plain mischief, Tristana has always been inspired by the adventures of great warriors. She had heard much about Runeterra, its factions, and its wars, and believed her kind...',
		},
		Twitch: {
			id: 'Twitch',
			key: '29',
			name: 'Twitch',
			title: 'the Plague Rat',
			tags: ['Marksman', 'Assassin'],
			stats: {
				hp: 682,
				hpperlevel: 100,
				mp: 300,
				mpperlevel: 40,
				movespeed: 330,
				armor: 27,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.75,
				hpregenperlevel: 0.6,
				mpregen: 7.25,
				mpregenperlevel: 0.45,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 3.1,
				attackspeedperlevel: 3.38,
				attackspeed: 0.679,
			},
			blurb:
				'A Zaunite plague rat by birth, but a connoisseur of filth by passion, Twitch is not afraid to get his paws dirty. Aiming a chem-powered crossbow at the gilded heart of Piltover, he has vowed to show the city dwellers just how filthy they really are...',
		},
		Varus: {
			id: 'Varus',
			key: '110',
			name: 'Varus',
			title: 'the Arrow of Retribution',
			tags: ['Marksman',A: 'Mage'],
			stats: {
				hp: 600,
				hpperlevel: 105,
				mp: 360,
				mpperlevel: 40,
				movespeed: 330,
				armor: 27,
				armorperlevel: 4.6,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 575,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 8,
				mpregenperlevel: 0.8,
				crit: 0,
				critperlevel: 0,
				attackdamage: 59,
				attackdamageperlevel: 3,
				attackspeedperlevel: 4,
				attackspeed: 0.658,
			},
			blurb:
				'One of the ancient darkin, Varus was a deadly killer who loved to torment his foes, driving them almost to madness before firing the arrow that would end their lives. He was imprisoned at the end of the Great Darkin War, but escaped centuries later in...',
		},
		Vayne: {
			id: 'Vayne',
			key: '67',
			name: 'Vayne',
			title: 'the Night Hunter',
			tags: ['Marksman', 'Assassin'],
			stats: {
				hp: 585,
				hpperlevel: 103,
				mp: 231.8,
				mpperlevel: 35,
				movespeed: 330,
				armor: 23,
				armorperlevel: 4.6,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 550,
				hpregen: 3.5,
				hpregenperlevel: 0.55,
				mpregen: 6.972,
				mpregenperlevel: 0.4,
				crit: 0,
				critperlevel: 0,
				attackdamage: 56,
				attackdamageperlevel: 2.35,
				attackspeedperlevel: 3.3,
				attackspeed: 0.658,
			},
			blurb:
				'Shauna Vayne is a deadly, remorseless Demacian monster hunter, who has dedicated her life to finding and destroying the demon that murdered her family. Armed with a wrist-mounted crossbow and a heart full of vengeance, she is only truly happy when...',
		},
		Xayah: {
			id: 'Xayah',
			key: '498',
			name: 'Xayah',
			title: 'the Rebel',
			tags: ['Marksman'],
			stats: {
				hp: 660,
				hpperlevel: 102,
				mp: 340,
				mpperlevel: 40,
				movespeed: 330,
				armor: 25,
				armorperlevel: 4.7,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 525,
				hpregen: 3.25,
				hpregenperlevel: 0.75,
				mpregen: 8.25,
				mpregenperlevel: 0.75,
				crit: 0,
				critperlevel: 0,
				attackdamage: 60,
				attackdamageperlevel: 3.5,
				attackspeedperlevel: 3.9,
				attackspeed: 0.625,
			},
			blurb:
				'Deadly and precise, Xayah is a vastayan revolutionary waging a personal war to save her people. She uses her speed, guile, and razor-sharp feather blades to cut down anyone who stands in her way. Xayah fights alongside her partner and lover, Rakan, to...',
		},
		Zeri: {
			id: 'Zeri',
			key: '221',
			name: 'Zeri',
			title: 'The Spark of Zaun',
			tags: ['Marksman'],
			stats: {
				hp: 630,
				hpperlevel: 115,
				mp: 250,
				mpperlevel: 45,
				movespeed: 330,
				armor: 20,
				armorperlevel: 4.2,
				spellblock: 30,
				spellblockperlevel: 1.3,
				attackrange: 500,
				hpregen: 3.25,
				hpregenperlevel: 0.7,
				mpregen: 6,
				mpregenperlevel: 0.8,
				crit: 0,
				critperlevel: 0,
				attackdamage: 50,
				attackdamageperlevel: 1.5,
				attackspeedperlevel: 2,
				attackspeed: 0.658,
			},
			blurb:
				'A headstrong, spirited young woman from the working-class streets of Zaun, Zeri channels her electric magic to charge herself and her custom-crafted gun. Her volatile power mirrors her emotions, its sparks reflecting her lightning-fast approach to life...',
		},
	},
};
// --- TEMPLATE ---
function getChampionHTML(champion) {
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${champion.key}.png`;
	return `
        <li class="champion-item" data-champion-id="${champion.id}">
            <img src="${iconUrl}" alt="${champion.name}" class="champion-icon">
            <span class="champion-name">${champion.name}</span>
        </li>
    `;
}

function getSelectedChampionHTML(champion, tips) {
	const iconUrl = `${CHAMPION_ICON_URL_BASE}${champion.key}.png`;
	const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');

	return `
        <div class="selected-champion-header">
            <img src="${iconUrl}" alt="${champion.name}" class="selected-champion-icon">
            <div class="selected-champion-info">
                <h2>${champion.name}</h2>
                <p>${champion.title}</p>
            </div>
        </div>
        <div class="selected-champion-body">
            <h3>Support Tips vs. ${champion.name}:</h3>
            <ul class="tips-list">
                ${tipsHTML}
            </ul>
            <p class="champion-blurb">${champion.blurb}</p>
        </div>
    `;
}

// --- RENDER ---
function render() {
	console.log('Rendering with state:', state); // Debug log
	const championList = document.getElementById('champion-list');
	const selectedChampion = document.getElementById('selected-champion');
	championList.innerHTML = '';
	selectedChampion.innerHTML = '';

	// Filter champions based on the search query
	const filteredChampions = filterChampions(state.champions, state.filter);

	// Render champion list
	if (filteredChampions.length > 0) {
		filteredChampions.forEach(champion => {
			championList.innerHTML += getChampionHTML(champion);
		});
	} else {
		championList.innerHTML = '<li class="no-results">No champions found.</li>';
	}

	// Render selected champion
	if (state.selectedChampion) {
		const champion = state.champions.find(
			c => c.id === state.selectedChampion
		);
		const tips = SUPPORT_TIPS[champion.id] || ['No tips available for this champion.'];
		selectedChampion.innerHTML = getSelectedChampionHTML(champion, tips);
		selectedChampion.classList.add('active');
	} else {
		selectedChampion.classList.remove('active');
	}

	// Re-attach event listeners to new champion list items
	attachChampionListListeners();
}

function filterChampions(champions, filter) {
	if (!filter) {
		return champions;
	}
	const lowerCaseFilter = filter.toLowerCase();
	return champions.filter(champion =>
		champion.name.toLowerCase().includes(lowerCaseFilter)
	);
}

function attachChampionListListeners() {
	const championItems = document.querySelectorAll('.champion-item');
	championItems.forEach(item => {
		item.addEventListener('click', () => {
			const championId = item.dataset.championId;
			handleChampionClick(championId);
		});
	});
}

// --- ACTIONS / HANDLERS ---
function handleChampionClick(championId) {
	console.log('Champion clicked:', championId);
	setState({
		selectedChampion: championId,
	});
}

function handleSearchInput(event) {
	const filter = event.target.value;
	setState({
		filter: filter,
	});
}

// --- INITIALIZATION ---
async function initializeApp() {
	try {
		render();
		await loadChampionData();
		setupEventListeners();
		// Initial render
		setState({
			champions: [],
			selectedChampion: null,
			filter: '',
		});
	} catch (error) {
		console.error('Initialization failed:', error);
	}
}

// --- State Management ---
// let state = {}; // THIS LINE WAS MOVED TO THE TOP

function setState(newState) {
	// Merge new state with old state
	Object.assign(state, newState);
	// Re-render the UI
	render();
}

// --- Event Listeners ---
function setupEventListeners() {
	const searchBox = document.getElementById('search-box');
	searchBox.addEventListener('input', handleSearchInput);

	// Add listener to the clear button
	const clearButton = document.querySelector('.clear-search');
	clearButton.addEventListener('click', () => {
		searchBox.value = '';
		setState({
			filter: '',
		});
	});
}

// --- DATA FETCHING ---
async function loadChampionData() {
	const CHAMPION_DATA_URL = './champions-summary.json';
	try {
		// Use ADC_LIST directly instead of fetching
		const champions = Object.values(ADC_LIST.data);

		// Sort champions alphabetically by name
		champions.sort((a, b) => a.name.localeCompare(b.name));

		console.log('Champion data loaded:', champions);
		setState({
			champions: champions,
		});
	} catch (error) {
		console.error(
			`Could not load champion data (${CHAMPION_DATA_URL}).\n` +
				`Please check network connection or file path.`
		);
	}
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializeApp);
