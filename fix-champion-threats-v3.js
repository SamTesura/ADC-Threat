/**
 * Comprehensive Champion Threat Tag Fixer v3
 * Using SPECIFIC CC TYPES from wikilol (patch 25.22)
 *
 * CC Type Tags (from wiki.leagueoflegends.com):
 * - KNOCKUP, KNOCKBACK, PULL (Airborne mechanics)
 * - STUN, ROOT, SNARE
 * - SLOW
 * - CHARM, FEAR, TAUNT (Mind control)
 * - SUPPRESSION (Ultimate CC)
 * - SILENCE, BLIND, DISARM, GROUNDED, CRIPPLE
 * - NEARSIGHT (Vision reduction)
 * - SLEEP
 * - GAP_CLOSE (Mobility)
 * - SHIELD_PEEL (Protection)
 */

const fs = require('fs');

// Load the current champions data
const championsData = JSON.parse(fs.readFileSync('./champions-summary.json', 'utf8'));

/**
 * Comprehensive threat data using SPECIFIC CC TYPES
 */
const championThreats = {
  "Aatrox": {
    "Q": [],  // Damage
    "W": ["PULL", "SLOW"],  // Pulls then slows
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Revive/stats
  },
  "Ahri": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["CHARM"],  // Charm
    "R": ["GAP_CLOSE"]  // Triple dash
  },
  "Akali": {
    "Q": ["SLOW"],  // Slow
    "W": [],  // Stealth
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE", "STUN"]  // Dash + micro-stun R2
  },
  "Akshan": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Alistar": {
    "Q": ["KNOCKUP"],
    "W": ["KNOCKBACK"],
    "E": [],
    "R": []
  },
  "Amumu": {
    "Q": ["STUN"],
    "W": [],
    "E": [],
    "R": ["ROOT"]
  },
  "Anivia": {
    "Q": ["STUN"],
    "W": [],
    "E": [],
    "R": ["SLOW"]
  },
  "Annie": {
    "Q": [],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": ["STUN"]  // With passive
  },
  "Aphelios": {
    "Q": ["SLOW"],  // With Gravitum
    "W": [],
    "E": [],
    "R": ["ROOT"]  // With Gravitum
  },
  "Ashe": {
    "Q": [],
    "W": ["SLOW"],
    "E": [],
    "R": ["STUN"]
  },
  "Aurelion Sol": {
    "Q": ["STUN"],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK"]
  },
  "Aurora": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Azir": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK"]
  },
  "Bard": {
    "Q": ["STUN"],
    "W": [],
    "E": [],
    "R": ["STUN"]  // Stasis
  },
  "Bel'Veth": {
    "Q": ["GAP_CLOSE"],
    "W": ["KNOCKUP"],
    "E": [],
    "R": []
  },
  "Blitzcrank": {
    "Q": ["PULL"],
    "W": [],
    "E": ["KNOCKUP"],
    "R": ["SILENCE"]
  },
  "Brand": {
    "Q": ["STUN"],  // When ablaze
    "W": [],
    "E": [],
    "R": []
  },
  "Braum": {
    "Q": ["SLOW"],
    "W": ["GAP_CLOSE"],
    "E": ["SHIELD_PEEL"],
    "R": ["KNOCKUP"]
  },
  "Briar": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE", "STUN"],
    "R": ["FEAR", "CHARM"]
  },
  "Caitlyn": {
    "Q": [],
    "W": ["ROOT"],  // Trap
    "E": ["GAP_CLOSE", "SLOW"],
    "R": []
  },
  "Camille": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["GAP_CLOSE", "STUN"],
    "R": []  // Lock in zone
  },
  "Cassiopeia": {
    "Q": [],
    "W": ["GROUNDED", "SLOW"],
    "E": [],
    "R": ["STUN"]  // If facing
  },
  "Cho'Gath": {
    "Q": ["KNOCKUP"],
    "W": ["SILENCE"],
    "E": [],
    "R": []
  },
  "Corki": {
    "Q": [],
    "W": ["GAP_CLOSE"],
    "E": [],
    "R": []
  },
  "Darius": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["PULL"],
    "R": []
  },
  "Diana": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["PULL"],
    "R": ["GAP_CLOSE"]
  },
  "Dr. Mundo": {
    "Q": ["SLOW"],
    "W": [],
    "E": [],
    "R": []
  },
  "Draven": {
    "Q": [],
    "W": [],
    "E": ["KNOCKBACK"],
    "R": []
  },
  "Ekko": {
    "Q": ["SLOW"],
    "W": ["STUN"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Elise": {
    "Q": [],
    "W": [],
    "E": ["STUN", "GAP_CLOSE"],  // Human stun, spider rappel
    "R": []
  },
  "Evelynn": {
    "Q": [],
    "W": ["CHARM"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Ezreal": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Fiddlesticks": {
    "Q": ["FEAR"],
    "W": [],
    "E": ["SILENCE"],
    "R": ["GAP_CLOSE"]
  },
  "Fiora": {
    "Q": ["GAP_CLOSE"],
    "W": ["STUN"],  // If blocks CC
    "E": ["SLOW"],
    "R": []
  },
  "Fizz": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKUP"]
  },
  "Galio": {
    "Q": [],
    "W": ["TAUNT"],
    "E": ["GAP_CLOSE", "KNOCKUP"],
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Gangplank": {
    "Q": [],
    "W": [],
    "E": [],
    "R": ["SLOW"]
  },
  "Garen": {
    "Q": ["SILENCE"],
    "W": ["SHIELD_PEEL"],
    "E": [],
    "R": []
  },
  "Gnar": {
    "Q": ["SLOW"],
    "W": ["STUN"],  // Mega form
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK", "STUN"]  // Into wall
  },
  "Gragas": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["GAP_CLOSE", "KNOCKBACK"],
    "R": ["KNOCKBACK"]
  },
  "Graves": {
    "Q": [],
    "W": ["NEARSIGHT"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Gwen": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["SLOW"]
  },
  "Hecarim": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE", "KNOCKBACK"],
    "R": ["GAP_CLOSE", "FEAR"]
  },
  "Heimerdinger": {
    "Q": [],
    "W": [],
    "E": ["STUN"],
    "R": []
  },
  "Hwei": {
    "Q": ["SLOW"],
    "W": ["SHIELD_PEEL"],
    "E": ["ROOT"],
    "R": []
  },
  "Illaoi": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "Irelia": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": ["STUN"],
    "R": ["DISARM", "SLOW"]
  },
  "Ivern": {
    "Q": ["ROOT"],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": ["KNOCKUP"]  // Daisy
  },
  "Janna": {
    "Q": ["KNOCKUP"],
    "W": ["SLOW"],
    "E": ["SHIELD_PEEL"],
    "R": ["KNOCKBACK"]
  },
  "Jarvan IV": {
    "Q": [],
    "W": ["SLOW", "SHIELD_PEEL"],
    "E": [],
    "R": ["GAP_CLOSE"]
  },
  "Jax": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": ["STUN"],
    "R": []
  },
  "Jayce": {
    "Q": [],
    "W": [],
    "E": ["KNOCKBACK"],  // Hammer form
    "R": []
  },
  "Jhin": {
    "Q": [],
    "W": ["ROOT"],
    "E": ["SLOW"],
    "R": ["SLOW"]
  },
  "Jinx": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["ROOT"],
    "R": []
  },
  "K'Sante": {
    "Q": [],
    "W": ["PULL", "STUN"],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK"]
  },
  "Kai'Sa": {
    "Q": [],
    "W": [],
    "E": [],
    "R": ["GAP_CLOSE"]
  },
  "Kalista": {
    "Q": [],
    "W": [],
    "E": [],
    "R": ["KNOCKUP"]
  },
  "Karma": {
    "Q": ["SLOW"],
    "W": ["ROOT"],
    "E": ["SHIELD_PEEL"],
    "R": []
  },
  "Karthus": {
    "Q": [],
    "W": ["SLOW"],
    "E": [],
    "R": []
  },
  "Kassadin": {
    "Q": ["SILENCE"],
    "W": [],
    "E": ["SLOW"],
    "R": ["GAP_CLOSE"]
  },
  "Katarina": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Kayle": {
    "Q": ["SLOW"],
    "W": [],
    "E": [],
    "R": []
  },
  "Kayn": {
    "Q": [],
    "W": ["SLOW"],
    "E": [],
    "R": []
  },
  "Kennen": {
    "Q": [],
    "W": ["STUN"],  // With passive
    "E": [],
    "R": ["STUN"]  // With passive
  },
  "Kha'Zix": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Kindred": {
    "Q": ["GAP_CLOSE"],
    "W": ["SLOW"],
    "E": ["SLOW"],
    "R": []
  },
  "Kled": {
    "Q": ["PULL"],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["GAP_CLOSE"]
  },
  "Kog'Maw": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "LeBlanc": {
    "Q": [],
    "W": ["GAP_CLOSE"],
    "E": ["ROOT"],
    "R": []
  },
  "Lee Sin": {
    "Q": ["GAP_CLOSE"],
    "W": ["GAP_CLOSE"],
    "E": ["SLOW"],
    "R": ["KNOCKBACK"]
  },
  "Leona": {
    "Q": ["STUN"],
    "W": [],
    "E": ["GAP_CLOSE", "ROOT"],
    "R": ["STUN"]
  },
  "Lillia": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": ["SLEEP"]
  },
  "Lissandra": {
    "Q": ["SLOW"],
    "W": ["ROOT"],
    "E": ["GAP_CLOSE"],
    "R": ["STUN"]
  },
  "Lucian": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Lulu": {
    "Q": ["SLOW"],
    "W": ["POLYMORPH"],  // Special type of CC
    "E": ["SHIELD_PEEL"],
    "R": ["KNOCKUP"]
  },
  "Lux": {
    "Q": ["ROOT"],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": []
  },
  "Malphite": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["SLOW"],  // Attack speed slow
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Malzahar": {
    "Q": ["SILENCE"],
    "W": [],
    "E": [],
    "R": ["SUPPRESSION"]
  },
  "Maokai": {
    "Q": ["KNOCKBACK"],
    "W": ["GAP_CLOSE", "ROOT"],
    "E": ["SLOW"],
    "R": ["ROOT"]
  },
  "Master Yi": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": [],  // NOT A THREAT - just damage buff
    "R": []   // NOT A SLOW - just movement speed!
  },
  "Mel": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": []
  },
  "Milio": {
    "Q": ["KNOCKUP"],
    "W": [],
    "E": [],
    "R": []
  },
  "Miss Fortune": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "Mordekaiser": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["PULL"],
    "R": []
  },
  "Morgana": {
    "Q": ["ROOT"],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": ["STUN"]
  },
  "Naafiri": {
    "Q": [],
    "W": ["GAP_CLOSE"],
    "E": [],
    "R": ["GAP_CLOSE"]
  },
  "Nami": {
    "Q": ["KNOCKUP"],  // Suspension
    "W": [],
    "E": ["SLOW"],
    "R": ["KNOCKUP"]
  },
  "Nasus": {
    "Q": [],
    "W": ["SLOW"],
    "E": [],
    "R": []
  },
  "Nautilus": {
    "Q": ["GAP_CLOSE", "PULL"],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": ["KNOCKUP"]
  },
  "Neeko": {
    "Q": [],
    "W": [],
    "E": ["ROOT"],
    "R": ["STUN"]
  },
  "Nidalee": {
    "Q": [],
    "W": [],
    "E": [],
    "R": []
  },
  "Nilah": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["PULL"]
  },
  "Nocturne": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["FEAR"],
    "R": ["GAP_CLOSE", "NEARSIGHT"]
  },
  "Nunu & Willump": {
    "Q": [],
    "W": ["KNOCKUP"],
    "E": ["SLOW", "ROOT"],
    "R": ["SLOW"]
  },
  "Olaf": {
    "Q": ["SLOW"],
    "W": [],
    "E": [],
    "R": []
  },
  "Orianna": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["SHIELD_PEEL"],
    "R": ["KNOCKUP"]
  },
  "Ornn": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["GAP_CLOSE", "KNOCKUP"],
    "R": ["KNOCKUP"]
  },
  "Pantheon": {
    "Q": [],
    "W": ["GAP_CLOSE", "STUN"],
    "E": [],
    "R": ["GAP_CLOSE"]
  },
  "Poppy": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["GAP_CLOSE", "STUN"],  // Into wall
    "R": ["KNOCKBACK"]
  },
  "Pyke": {
    "Q": ["PULL"],
    "W": [],
    "E": ["GAP_CLOSE", "STUN"],
    "R": ["GAP_CLOSE"]
  },
  "Qiyana": {
    "Q": ["SLOW"],  // With ice
    "W": ["GAP_CLOSE"],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK", "STUN"]
  },
  "Quinn": {
    "Q": ["BLIND"],
    "W": [],
    "E": ["GAP_CLOSE", "SLOW"],
    "R": []
  },
  "Rakan": {
    "Q": [],
    "W": ["GAP_CLOSE", "KNOCKUP"],
    "E": ["GAP_CLOSE", "SHIELD_PEEL"],
    "R": ["CHARM"]
  },
  "Rammus": {
    "Q": [],
    "W": [],
    "E": ["TAUNT"],
    "R": ["SLOW"]
  },
  "Rek'Sai": {
    "Q": [],
    "W": ["KNOCKUP"],
    "E": ["GAP_CLOSE"],
    "R": ["GAP_CLOSE"]
  },
  "Rell": {
    "Q": ["STUN"],
    "W": ["KNOCKUP"],
    "E": ["STUN"],
    "R": ["PULL"]
  },
  "Renata Glasc": {
    "Q": ["ROOT"],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": ["CHARM"]  // Berserk
  },
  "Renekton": {
    "Q": [],
    "W": ["STUN"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Rengar": {
    "Q": [],
    "W": [],
    "E": ["SLOW", "ROOT"],  // If leaps
    "R": []
  },
  "Riven": {
    "Q": ["GAP_CLOSE"],
    "W": ["STUN"],
    "E": ["GAP_CLOSE", "SHIELD_PEEL"],
    "R": []
  },
  "Rumble": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": ["SLOW"]
  },
  "Ryze": {
    "Q": [],
    "W": ["ROOT"],
    "E": [],
    "R": []
  },
  "Samira": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Sejuani": {
    "Q": ["GAP_CLOSE", "KNOCKUP"],
    "W": ["SLOW"],
    "E": ["STUN"],
    "R": ["STUN"]
  },
  "Senna": {
    "Q": [],
    "W": ["ROOT"],
    "E": [],
    "R": ["SHIELD_PEEL"]
  },
  "Seraphine": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW", "ROOT"],
    "R": ["CHARM"]
  },
  "Sett": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["PULL", "STUN"],
    "R": ["SUPPRESSION"]  // Grabs + slams
  },
  "Shaco": {
    "Q": ["GAP_CLOSE"],
    "W": ["FEAR"],
    "E": ["SLOW"],
    "R": []
  },
  "Shen": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE", "TAUNT"],
    "R": ["SHIELD_PEEL"]
  },
  "Shyvana": {
    "Q": [],
    "W": [],
    "E": [],
    "R": ["GAP_CLOSE", "KNOCKBACK"]
  },
  "Singed": {
    "Q": [],
    "W": ["GROUNDED", "SLOW"],
    "E": ["KNOCKBACK"],  // Fling
    "R": []
  },
  "Sion": {
    "Q": ["KNOCKUP"],
    "W": ["SHIELD_PEEL"],
    "E": ["KNOCKBACK"],
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Sivir": {
    "Q": [],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": []
  },
  "Skarner": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": ["SUPPRESSION"]
  },
  "Smolder": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["SLOW"]
  },
  "Sona": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": [],
    "R": ["STUN"]
  },
  "Soraka": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["SILENCE", "ROOT"],
    "R": []
  },
  "Swain": {
    "Q": [],
    "W": ["ROOT"],
    "E": ["PULL", "ROOT"],
    "R": ["SLOW"]
  },
  "Sylas": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["GAP_CLOSE", "STUN"],
    "R": []
  },
  "Syndra": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["KNOCKBACK", "STUN"],
    "R": []
  },
  "Tahm Kench": {
    "Q": ["SLOW"],
    "W": [],
    "E": ["SHIELD_PEEL"],
    "R": ["GAP_CLOSE"]
  },
  "Taliyah": {
    "Q": [],
    "W": ["KNOCKUP"],
    "E": ["SLOW"],
    "R": []
  },
  "Talon": {
    "Q": ["GAP_CLOSE"],
    "W": ["SLOW"],
    "E": [],
    "R": []
  },
  "Taric": {
    "Q": [],
    "W": [],
    "E": ["STUN"],
    "R": []
  },
  "Teemo": {
    "Q": ["BLIND"],
    "W": [],
    "E": [],
    "R": ["SLOW"]
  },
  "Thresh": {
    "Q": ["PULL"],
    "W": ["SHIELD_PEEL"],
    "E": ["KNOCKBACK"],
    "R": ["SLOW"]
  },
  "Tristana": {
    "Q": [],
    "W": ["GAP_CLOSE", "SLOW"],
    "E": [],
    "R": ["KNOCKBACK"]
  },
  "Trundle": {
    "Q": ["SLOW"],
    "W": [],
    "E": [],
    "R": []
  },
  "Tryndamere": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Twisted Fate": {
    "Q": [],
    "W": ["STUN"],  // Gold card
    "E": [],
    "R": []
  },
  "Twitch": {
    "Q": [],
    "W": ["SLOW"],
    "E": [],
    "R": []
  },
  "Udyr": {
    "Q": [],
    "W": ["SHIELD_PEEL"],
    "E": ["STUN"],
    "R": []
  },
  "Urgot": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE", "KNOCKBACK"],
    "R": ["SUPPRESSION"]
  },
  "Varus": {
    "Q": [],
    "W": [],  // NOT A THREAT - passive damage
    "E": ["SLOW"],
    "R": ["ROOT"]
  },
  "Vayne": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": ["KNOCKBACK", "STUN"],  // Into wall
    "R": []
  },
  "Veigar": {
    "Q": [],
    "W": [],
    "E": ["STUN"],  // Cage
    "R": []
  },
  "Vel'Koz": {
    "Q": ["KNOCKUP"],
    "W": [],
    "E": ["KNOCKUP"],
    "R": []
  },
  "Vex": {
    "Q": [],
    "W": ["FEAR", "SHIELD_PEEL"],
    "E": ["SLOW"],
    "R": ["GAP_CLOSE", "FEAR"]
  },
  "Vi": {
    "Q": ["GAP_CLOSE", "KNOCKBACK"],
    "W": [],
    "E": [],
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Viego": {
    "Q": [],
    "W": ["STUN"],
    "E": [],
    "R": ["GAP_CLOSE", "KNOCKBACK"]
  },
  "Viktor": {
    "Q": ["SHIELD_PEEL"],
    "W": ["SLOW", "STUN"],
    "E": [],
    "R": ["SLOW"]
  },
  "Vladimir": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "Volibear": {
    "Q": ["STUN"],
    "W": [],
    "E": ["SLOW"],
    "R": ["GAP_CLOSE", "KNOCKBACK"]
  },
  "Warwick": {
    "Q": ["GAP_CLOSE"],
    "W": [],
    "E": ["FEAR"],
    "R": ["GAP_CLOSE", "SUPPRESSION"]
  },
  "Wukong": {
    "Q": [],
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKUP"]
  },
  "Xayah": {
    "Q": [],
    "W": [],
    "E": ["ROOT"],
    "R": []
  },
  "Xerath": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["STUN"],
    "R": []
  },
  "Xin Zhao": {
    "Q": ["KNOCKUP"],
    "W": ["SLOW"],
    "E": ["GAP_CLOSE"],
    "R": ["KNOCKBACK"]
  },
  "Yasuo": {
    "Q": ["KNOCKUP"],  // Q3
    "W": [],
    "E": ["GAP_CLOSE"],
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Yone": {
    "Q": ["KNOCKUP"],  // Q3
    "W": ["SHIELD_PEEL"],
    "E": [],
    "R": ["GAP_CLOSE", "KNOCKUP"]
  },
  "Yorick": {
    "Q": [],
    "W": ["ROOT"],  // Trapped in wall
    "E": ["SLOW"],
    "R": []
  },
  "Yuumi": {
    "Q": ["SLOW"],
    "W": [],  // NO THREAT - attach
    "E": [],
    "R": ["ROOT"]  // Waves of CC
  },
  "Yunara": {
    "Q": [],
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "Zac": {
    "Q": ["KNOCKBACK"],
    "W": [],
    "E": ["GAP_CLOSE", "KNOCKUP"],
    "R": ["KNOCKUP"]
  },
  "Zed": {
    "Q": [],
    "W": ["GAP_CLOSE"],
    "E": ["SLOW"],
    "R": ["GAP_CLOSE"]
  },
  "Zeri": {
    "Q": [],
    "W": ["SLOW"],
    "E": ["GAP_CLOSE"],
    "R": []
  },
  "Ziggs": {
    "Q": [],
    "W": ["KNOCKBACK"],
    "E": ["SLOW"],
    "R": []
  },
  "Zilean": {
    "Q": ["STUN"],  // Double bomb
    "W": [],
    "E": ["SLOW"],
    "R": []
  },
  "Zoe": {
    "Q": [],
    "W": [],
    "E": ["SLEEP"],
    "R": ["GAP_CLOSE"]
  },
  "Zyra": {
    "Q": [],
    "W": [],
    "E": ["ROOT"],
    "R": ["KNOCKUP"]
  }
};

// Update the champions data
console.log('Updating champion threat tags with SPECIFIC CC TYPES...\n');
console.log('Using wikilol CC types: STUN, ROOT, KNOCKUP, KNOCKBACK, PULL, SLOW, CHARM, FEAR, etc.\n');

let updatedCount = 0;
let championCount = 0;

championsData.forEach(champion => {
  const threatData = championThreats[champion.name];

  if (!threatData) {
    console.log(`⚠️  Warning: No threat data defined for ${champion.name}`);
    return;
  }

  championCount++;
  const abilityKeys = ['Q', 'W', 'E', 'R'];

  champion.abilities.forEach((ability, index) => {
    const key = abilityKeys[index];
    const correctThreats = threatData[key] || [];

    const currentThreats = ability.threat || [];
    const threatsChanged = JSON.stringify(currentThreats.sort()) !== JSON.stringify(correctThreats.sort());

    if (threatsChanged) {
      ability.threat = correctThreats;
      updatedCount++;
      if (currentThreats.length > 0 || correctThreats.length > 0) {
        console.log(`  ${champion.name} ${key}: [${currentThreats.join(', ')}] → [${correctThreats.join(', ')}]`);
      }
    }
  });
});

// Special fixes
const yuumiIndex = championsData.findIndex(c => c.name === "Yuumi");
if (yuumiIndex >= 0) {
  const yuumi = championsData[yuumiIndex];
  yuumi.abilities[1].cd = [5, 5, 5, 5, 5, 5];
  console.log('\n✓ Fixed Yuumi W cooldown (5s lockout when CCd)');
}

// Write the updated data back
fs.writeFileSync('./champions-summary.json', JSON.stringify(championsData, null, 2), 'utf8');

console.log(`\n✅ Update complete with SPECIFIC CC TYPES!`);
console.log(`   Champions processed: ${championCount}`);
console.log(`   Abilities updated: ${updatedCount}`);
console.log(`\nUsing specific CC types from wikilol:`);
console.log(`   - Airborne: KNOCKUP, KNOCKBACK, PULL`);
console.log(`   - Disabling: STUN, ROOT, SUPPRESSION, SLEEP`);
console.log(`   - Mind Control: CHARM, FEAR, TAUNT`);
console.log(`   - Impairing: SLOW, SILENCE, BLIND, DISARM, GROUNDED, NEARSIGHT`);
console.log(`   - Other: GAP_CLOSE, SHIELD_PEEL`);
console.log(`\nKey fixes:`);
console.log(`   - Master Yi: R has no CC (just movement speed), E has no threat`);
console.log(`   - Yuumi: R is ROOT (not generic hard CC), W cooldown 5s`);
console.log(`   - Yorick: W is ROOT (trapped in wall)`);
console.log(`   - Syndra: E is KNOCKBACK + STUN`);
console.log(`   - Varus: W has no threat (passive damage)`);
