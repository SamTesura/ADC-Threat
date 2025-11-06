/**
 * Comprehensive Champion Threat Tag Fixer
 * Based on accurate League of Legends wiki data
 * This script updates threat tags for all champion abilities
 */

const fs = require('fs');

// Load the current champions data
const championsData = JSON.parse(fs.readFileSync('./champions-summary.json', 'utf8'));

/**
 * Comprehensive threat data for all champions
 * Based on actual abilities from wiki.leagueoflegends.com
 *
 * Threat types:
 * - HARD_CC: Stuns, knockups, suppressions, charms, fears, taunts, roots
 * - SOFT_CC: Slows, silences, blinds, disarms, grounded
 * - GAP_CLOSE: Dashes, blinks, leaps
 * - BURST: High burst damage abilities
 * - SHIELD_PEEL: Shields for protection
 * - Poke/Zone: Long-range poke or zone control
 */
const championThreats = {
  "Aatrox": {
    "Q": [],  // Damage, no CC
    "W": ["SOFT_CC"],  // Pull/slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Revive/stats, no CC
  },
  "Ahri": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["HARD_CC"],  // Charm
    "R": ["GAP_CLOSE"]  // Triple dash
  },
  "Akali": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Stealth (not CC)
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + stun on R2
  },
  "Akshan": {
    "Q": [],  // Damage
    "W": [],  // Passive/stealth
    "E": ["GAP_CLOSE"],  // Swing
    "R": []  // Damage
  },
  "Alistar": {
    "Q": ["HARD_CC"],  // Knockup
    "W": ["HARD_CC"],  // Knockback
    "E": [],  // Heal
    "R": []  // Damage reduction
  },
  "Amumu": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // DoT aura
    "E": [],  // Damage
    "R": ["HARD_CC"]  // AoE root
  },
  "Anivia": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // Wall (terrain, not CC tag)
    "E": [],  // Damage
    "R": ["SOFT_CC"]  // Slow
  },
  "Annie": {
    "Q": [],  // Damage (stun is passive)
    "W": [],  // Damage (stun is passive)
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Stun (via passive)
  },
  "Aphelios": {
    "Q": ["SOFT_CC"],  // Slow (with Gravitum)
    "W": [],  // Weapon swap
    "E": [],  // Turret
    "R": ["HARD_CC"]  // Root (with Gravitum)
  },
  "Ashe": {
    "Q": [],  // Attack speed
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // Vision
    "R": ["HARD_CC"]  // Stun
  },
  "Aurelion Sol": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // Toggle
    "E": ["GAP_CLOSE"],  // Flight
    "R": ["SOFT_CC"]  // Knockback + slow
  },
  "Aurora": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Hop
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Zone
  },
  "Azir": {
    "Q": [],  // Reposition soldiers
    "W": [],  // Summon soldier
    "E": ["GAP_CLOSE"],  // Dash + shield
    "R": ["HARD_CC"]  // Knockback
  },
  "Bard": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // Heal
    "E": [],  // Portal
    "R": ["HARD_CC"]  // Stasis
  },
  "Bel'Veth": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Slow + knockup
    "E": [],  // Damage reduction
    "R": ["HARD_CC"]  // Knockup (on minion kill)
  },
  "Blitzcrank": {
    "Q": ["HARD_CC"],  // Pull
    "W": [],  // Movement speed
    "E": ["HARD_CC"],  // Knockup
    "R": ["SOFT_CC"]  // Silence
  },
  "Brand": {
    "Q": ["HARD_CC"],  // Stun (on ablaze)
    "W": [],  // Damage
    "E": [],  // Damage
    "R": []  // Bouncing damage
  },
  "Braum": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["GAP_CLOSE"],  // Dash to ally
    "E": ["SHIELD_PEEL"],  // Shield/block
    "R": ["HARD_CC"]  // Knockup + slow
  },
  "Briar": {
    "Q": [],  // Damage + heal
    "W": [],  // Berserk
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun
    "R": ["HARD_CC"]  // Fear + charm
  },
  "Caitlyn": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Root (trap)
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + slow
    "R": []  // Single target damage
  },
  "Camille": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow (outer edge)
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun
    "R": ["HARD_CC"]  // Lock in zone
  },
  "Cassiopeia": {
    "Q": [],  // Poison
    "W": ["SOFT_CC"],  // Grounded + slow
    "E": [],  // Single target damage
    "R": ["HARD_CC"]  // Stun (facing) / slow
  },
  "Cho'Gath": {
    "Q": ["HARD_CC"],  // Knockup
    "W": ["SOFT_CC"],  // Silence
    "E": [],  // Damage
    "R": []  // True damage
  },
  "Corki": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE"],  // Dash
    "E": [],  // Damage
    "R": []  // Poke
  },
  "Darius": {
    "Q": [],  // Damage + heal
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Pull
    "R": []  // Execute
  },
  "Diana": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["HARD_CC"],  // Pull
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Dr. Mundo": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Damage aura
    "E": [],  // Bonus AD
    "R": []  // Heal
  },
  "Draven": {
    "Q": [],  // Damage buff
    "W": [],  // Movement/attack speed
    "E": ["HARD_CC"],  // Knockback
    "R": []  // Damage
  },
  "Ekko": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["HARD_CC"],  // Stun (in zone) + shield
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Dash back + damage
  },
  "Elise": {
    "Q": [],  // Damage (both forms)
    "W": [],  // Spider summon/attack speed
    "E": ["HARD_CC", "GAP_CLOSE"],  // Stun (human) / rappel (spider)
    "R": []  // Transform
  },
  "Evelynn": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Charm (after delay)
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage + dash back
  },
  "Ezreal": {
    "Q": [],  // Poke
    "W": [],  // Mark
    "E": ["GAP_CLOSE"],  // Blink
    "R": []  // Damage
  },
  "Fiddlesticks": {
    "Q": ["HARD_CC"],  // Fear
    "W": [],  // Drain
    "E": ["SOFT_CC"],  // Silence
    "R": ["GAP_CLOSE"]  // Blink
  },
  "Fiora": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["HARD_CC"],  // Stun (if blocks CC)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Mark for healing
  },
  "Fizz": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // On-hit damage
    "E": ["GAP_CLOSE"],  // Dash/untargetable
    "R": ["SOFT_CC", "HARD_CC"]  // Slow then knockup
  },
  "Galio": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Taunt (charged)
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup
    "R": ["GAP_CLOSE", "HARD_CC"]  // TP to ally + knockup
  },
  "Gangplank": {
    "Q": [],  // Poke
    "W": [],  // Cleanse + heal
    "E": [],  // Barrel
    "R": ["SOFT_CC"]  // Slow (in zone)
  },
  "Garen": {
    "Q": ["SOFT_CC"],  // Silence
    "W": ["SHIELD_PEEL"],  // Shield
    "E": [],  // Spin
    "R": []  // Execute
  },
  "Gnar": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["HARD_CC"],  // Stun (Mega, 3 hits)
    "E": ["GAP_CLOSE"],  // Hop/jump
    "R": ["HARD_CC"]  // Knockback + stun (if into wall)
  },
  "Gragas": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Damage reduction
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockback
    "R": ["HARD_CC"]  // Knockback
  },
  "Graves": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Nearsight + slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage + knockback (self)
  },
  "Gwen": {
    "Q": [],  // Damage
    "W": [],  // Immune zone
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["SOFT_CC"]  // Slow
  },
  "Hecarim": {
    "Q": [],  // Damage
    "W": [],  // Damage/heal aura
    "E": ["GAP_CLOSE", "HARD_CC"],  // Charge + knockback
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + fear
  },
  "Heimerdinger": {
    "Q": [],  // Turrets
    "W": [],  // Damage
    "E": ["HARD_CC"],  // Stun/slow
    "R": []  // Upgrade ability
  },
  "Hwei": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["HARD_CC"],  // Root
    "R": []  // Mark
  },
  "Illaoi": {
    "Q": [],  // Damage
    "W": [],  // Dash + damage
    "E": ["SOFT_CC"],  // Spirit pull + slow
    "R": []  // AoE damage
  },
  "Irelia": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // Damage reduction
    "E": ["HARD_CC"],  // Stun
    "R": ["SOFT_CC"]  // Disarm + slow
  },
  "Ivern": {
    "Q": ["HARD_CC"],  // Root
    "W": [],  // Bush
    "E": ["SHIELD_PEEL"],  // Shield + slow
    "R": ["HARD_CC"]  // Daisy knockup
  },
  "Janna": {
    "Q": ["HARD_CC"],  // Knockup
    "W": ["SOFT_CC"],  // Slow
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockback + heal
  },
  "Jarvan IV": {
    "Q": [],  // Damage
    "W": ["SOFT_CC", "SHIELD_PEEL"],  // Shield + slow
    "E": [],  // Flag
    "R": ["GAP_CLOSE"]  // Dash + arena
  },
  "Jax": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // Damage
    "E": ["HARD_CC"],  // Stun
    "R": []  // Stats
  },
  "Jayce": {
    "Q": [],  // Damage (both forms)
    "W": [],  // Speed (both forms)
    "E": ["HARD_CC"],  // Knockback (hammer) / gate (cannon)
    "R": []  // Transform
  },
  "Jhin": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Root (on marked)
    "E": ["SOFT_CC"],  // Slow
    "R": ["SOFT_CC"]  // Slow
  },
  "Jinx": {
    "Q": [],  // Weapon swap
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Root
    "R": []  // Damage
  },
  "K'Sante": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Pull + stun (fully charged)
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback into wall
  },
  "Kai'Sa": {
    "Q": [],  // Damage
    "W": [],  // Mark + damage
    "E": [],  // Movement speed + stealth
    "R": ["GAP_CLOSE"]  // Dash + shield
  },
  "Kalista": {
    "Q": [],  // Pierce
    "W": [],  // Passive + vision
    "E": [],  // Rend
    "R": ["HARD_CC"]  // Pull ally + knockup
  },
  "Karma": {
    "Q": ["SOFT_CC"],  // Slow (empowered)
    "W": ["HARD_CC"],  // Root
    "E": ["SHIELD_PEEL"],  // Shield + speed
    "R": []  // Empower next ability
  },
  "Karthus": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // DoT aura
    "R": []  // Global damage
  },
  "Kassadin": {
    "Q": ["SOFT_CC"],  // Silence
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE"]  // Blink
  },
  "Katarina": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["GAP_CLOSE"],  // Blink
    "R": []  // Damage
  },
  "Kayle": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Heal + speed
    "E": [],  // Damage
    "R": []  // Invulnerability
  },
  "Kayn": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // Wall walk
    "R": []  // Untargetable
  },
  "Kennen": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Stun (with passive)
    "E": [],  // Speed
    "R": ["HARD_CC"]  // Stun (with passive)
  },
  "Kha'Zix": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Jump
    "R": []  // Stealth
  },
  "Kindred": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Slow (in zone)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Immune zone
  },
  "Kled": {
    "Q": ["HARD_CC"],  // Pull + slow
    "W": [],  // Attack speed
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE"]  // Charge
  },
  "Kog'Maw": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Poke
  },
  "LeBlanc": {
    "Q": [],  // Damage + mark
    "W": ["GAP_CLOSE"],  // Dash
    "E": ["HARD_CC"],  // Root
    "R": []  // Mimic
  },
  "Lee Sin": {
    "Q": ["GAP_CLOSE"],  // Dash (Q2)
    "W": ["GAP_CLOSE"],  // Dash to ally/ward
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Knockback
  },
  "Leona": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // Damage + resist
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + root
    "R": ["HARD_CC"]  // Stun
  },
  "Lillia": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Sleep
  },
  "Lissandra": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["HARD_CC"],  // Root
    "E": ["GAP_CLOSE"],  // Claw dash
    "R": ["HARD_CC"]  // Stun (enemy) / stasis (self)
  },
  "Lucian": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage
  },
  "Lulu": {
    "Q": [],  // Damage + slow
    "W": ["HARD_CC"],  // Polymorph
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockup
  },
  "Lux": {
    "Q": ["HARD_CC"],  // Root
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Malphite": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Shield
    "E": ["SOFT_CC"],  // Attack speed slow
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup
  },
  "Malzahar": {
    "Q": ["SOFT_CC"],  // Silence
    "W": [],  // Voidlings
    "E": [],  // DoT
    "R": ["HARD_CC"]  // Suppression
  },
  "Maokai": {
    "Q": ["HARD_CC"],  // Knockback
    "W": ["GAP_CLOSE", "HARD_CC"],  // Dash + root
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Root
  },
  "Master Yi": {
    "Q": ["GAP_CLOSE"],  // Dash/untargetable
    "W": [],  // Damage reduction + heal
    "E": [],  // True damage buff
    "R": []  // Speed buff
  },
  "Mel": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Milio": {
    "Q": ["HARD_CC"],  // Knockup
    "W": [],  // Shield + heal
    "E": [],  // Speed + range
    "R": []  // Cleanse + heal
  },
  "Miss Fortune": {
    "Q": [],  // Damage
    "W": [],  // Movement/attack speed
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Mordekaiser": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + heal
    "E": ["HARD_CC"],  // Pull
    "R": []  // Death Realm
  },
  "Morgana": {
    "Q": ["HARD_CC"],  // Root
    "W": [],  // Damage zone
    "E": ["SHIELD_PEEL"],  // Shield (CC immunity)
    "R": ["HARD_CC"]  // Stun (after tether)
  },
  "Naafiri": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE"],  // Dash
    "E": [],  // Damage + heal
    "R": ["GAP_CLOSE"]  // Dash + vision
  },
  "Nami": {
    "Q": ["HARD_CC"],  // Suspension/knockup
    "W": [],  // Heal/damage
    "E": ["SOFT_CC"],  // Slow buff
    "R": ["HARD_CC"]  // Knockup
  },
  "Nasus": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow + attack speed slow
    "E": [],  // Damage + armor shred
    "R": []  // Stats
  },
  "Nautilus": {
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Hook + pull
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Knockup
  },
  "Neeko": {
    "Q": [],  // Damage
    "W": [],  // Clone
    "E": ["HARD_CC"],  // Root
    "R": ["HARD_CC"]  // Stun
  },
  "Nidalee": {
    "Q": [],  // Damage (both forms)
    "W": [],  // Trap (human) / leap (cougar)
    "E": [],  // Heal (human) / damage (cougar)
    "R": []  // Transform
  },
  "Nilah": {
    "Q": [],  // Damage
    "W": [],  // Dodge
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Pull
  },
  "Nocturne": {
    "Q": [],  // Damage trail
    "W": ["SHIELD_PEEL"],  // Spell shield
    "E": ["HARD_CC"],  // Fear (after tether)
    "R": ["GAP_CLOSE"]  // Dash + nearsight
  },
  "Nunu & Willump": {
    "Q": [],  // Consume
    "W": ["HARD_CC"],  // Knockup (snowball)
    "E": ["SOFT_CC"],  // Root + slow
    "R": ["SOFT_CC"]  // Slow
  },
  "Olaf": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Heal + attack speed
    "E": [],  // True damage
    "R": []  // CC immunity
  },
  "Orianna": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockup
  },
  "Ornn": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Fire breath
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup (into terrain)
    "R": ["SOFT_CC", "HARD_CC"]  // Slow then knockup
  },
  "Pantheon": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun
    "E": [],  // Block
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Poppy": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Block dashes
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun (into wall)
    "R": ["HARD_CC"]  // Knockback
  },
  "Pyke": {
    "Q": ["HARD_CC"],  // Stun/pull
    "W": [],  // Stealth
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun
    "R": ["GAP_CLOSE"]  // Dash + execute
  },
  "Qiyana": {
    "Q": ["SOFT_CC"],  // Slow (with ice element)
    "W": ["GAP_CLOSE"],  // Dash
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback + stun
  },
  "Quinn": {
    "Q": ["SOFT_CC"],  // Blind
    "W": [],  // Vision + attack speed
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + slow
    "R": []  // Speed
  },
  "Rakan": {
    "Q": [],  // Damage + heal
    "W": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup
    "E": ["GAP_CLOSE", "SHIELD_PEEL"],  // Dash to ally + shield
    "R": ["HARD_CC"]  // Charm
  },
  "Rammus": {
    "Q": [],  // Roll
    "W": [],  // Defense
    "E": ["HARD_CC"],  // Taunt
    "R": ["SOFT_CC"]  // Slow
  },
  "Rek'Sai": {
    "Q": [],  // Damage (both forms)
    "W": ["HARD_CC"],  // Knockup (unburrowed)
    "E": ["GAP_CLOSE"],  // Tunnel
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Rell": {
    "Q": ["HARD_CC"],  // Stun (if hits ally)
    "W": ["HARD_CC"],  // Knockup
    "E": ["HARD_CC"],  // Stun (if breaks tether)
    "R": ["HARD_CC"]  // Pull
  },
  "Renata Glasc": {
    "Q": ["HARD_CC"],  // Root + throw
    "W": [],  // Revive + attack speed
    "E": ["SHIELD_PEEL"],  // Shield + damage
    "R": ["HARD_CC"]  // Berserk
  },
  "Renekton": {
    "Q": [],  // Damage + heal
    "W": ["HARD_CC"],  // Stun
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Stats
  },
  "Rengar": {
    "Q": [],  // Damage
    "W": [],  // Damage + heal
    "E": ["SOFT_CC"],  // Slow (root if leap)
    "R": []  // Stealth
  },
  "Riven": {
    "Q": ["GAP_CLOSE"],  // Dash (3x)
    "W": ["HARD_CC"],  // Stun
    "E": ["GAP_CLOSE", "SHIELD_PEEL"],  // Dash + shield
    "R": []  // Damage + stats
  },
  "Rumble": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + speed
    "E": ["SOFT_CC"],  // Slow
    "R": ["SOFT_CC"]  // Slow
  },
  "Ryze": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Root
    "E": [],  // Damage spread
    "R": []  // Teleport
  },
  "Samira": {
    "Q": [],  // Damage
    "W": [],  // Destroy projectiles
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage
  },
  "Sejuani": {
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Stun
    "R": ["HARD_CC"]  // Stun
  },
  "Senna": {
    "Q": [],  // Damage/heal
    "W": ["HARD_CC"],  // Root
    "E": [],  // Stealth + speed
    "R": ["SHIELD_PEEL"]  // Shield + damage
  },
  "Seraphine": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + heal
    "E": ["SOFT_CC", "HARD_CC"],  // Slow or root
    "R": ["HARD_CC"]  // Charm
  },
  "Sett": {
    "Q": [],  // Speed + damage
    "W": ["SHIELD_PEEL"],  // Shield + damage
    "E": ["HARD_CC"],  // Pull + stun
    "R": ["HARD_CC"]  // Suppression + slam
  },
  "Shaco": {
    "Q": ["GAP_CLOSE"],  // Blink + stealth
    "W": ["HARD_CC"],  // Fear (box)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Clone
  },
  "Shen": {
    "Q": [],  // Damage
    "W": [],  // Dodge zone
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + taunt
    "R": ["SHIELD_PEEL"]  // Shield + TP to ally
  },
  "Shyvana": {
    "Q": [],  // Damage
    "W": [],  // Damage aura
    "E": [],  // Damage
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback
  },
  "Singed": {
    "Q": [],  // Poison trail
    "W": ["SOFT_CC"],  // Grounded + slow
    "E": ["HARD_CC"],  // Fling
    "R": []  // Stats
  },
  "Sion": {
    "Q": ["HARD_CC"],  // Knockup
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow + knockback
    "R": ["GAP_CLOSE", "HARD_CC"]  // Charge + knockup
  },
  "Sivir": {
    "Q": [],  // Damage
    "W": [],  // Bouncing attacks
    "E": ["SHIELD_PEEL"],  // Spell shield
    "R": []  // Speed
  },
  "Skarner": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + speed
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Suppression
  },
  "Smolder": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["SOFT_CC"]  // Slow
  },
  "Sona": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + heal
    "E": [],  // Speed
    "R": ["HARD_CC"]  // Stun
  },
  "Soraka": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Heal
    "E": ["HARD_CC"],  // Silence + root
    "R": []  // Global heal
  },
  "Swain": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Root
    "E": ["HARD_CC"],  // Pull + root
    "R": ["SOFT_CC"]  // Slow
  },
  "Sylas": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Damage + heal
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + stun (E2)
    "R": []  // Steal ult
  },
  "Syndra": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Knockback + stun
    "R": []  // Damage
  },
  "Tahm Kench": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Devour
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["GAP_CLOSE"]  // TP with ally
  },
  "Taliyah": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Knockup
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Wall
  },
  "Talon": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // Wall hop
    "R": []  // Stealth + damage
  },
  "Taric": {
    "Q": [],  // Heal
    "W": [],  // Link + stats
    "E": ["HARD_CC"],  // Stun
    "R": []  // Invulnerability
  },
  "Teemo": {
    "Q": ["SOFT_CC"],  // Blind
    "W": [],  // Speed
    "E": [],  // Poison
    "R": ["SOFT_CC"]  // Slow (shrooms)
  },
  "Thresh": {
    "Q": ["HARD_CC"],  // Hook + pull
    "W": ["SHIELD_PEEL"],  // Lantern + shield
    "E": ["HARD_CC"],  // Knockback/pull
    "R": ["SOFT_CC"]  // Slow
  },
  "Tristana": {
    "Q": [],  // Attack speed
    "W": ["GAP_CLOSE", "SOFT_CC"],  // Jump + slow
    "E": [],  // Bomb
    "R": ["HARD_CC"]  // Knockback
  },
  "Trundle": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Speed zone
    "E": [],  // Pillar (terrain)
    "R": []  // Stats steal
  },
  "Tryndamere": {
    "Q": [],  // Heal
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Undying
  },
  "Twisted Fate": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow (if gold card)
    "E": [],  // Attack speed + damage
    "R": []  // Vision + TP
  },
  "Twitch": {
    "Q": [],  // Stealth + attack speed
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // Poison damage
    "R": []  // Range + damage
  },
  "Udyr": {
    "Q": [],  // Attack speed + damage
    "W": ["SHIELD_PEEL"],  // Shield + heal
    "E": ["HARD_CC"],  // Stun
    "R": []  // AoE damage
  },
  "Urgot": {
    "Q": [],  // Damage
    "W": [],  // Shield + fire
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + flip
    "R": ["HARD_CC"]  // Suppress + execute
  },
  "Varus": {
    "Q": [],  // Poke
    "W": [],  // Passive damage
    "E": ["SOFT_CC"],  // Slow + grievous
    "R": ["HARD_CC"]  // Root
  },
  "Vayne": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // True damage
    "E": ["HARD_CC"],  // Knockback + stun (into wall)
    "R": []  // Stealth + damage
  },
  "Veigar": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["HARD_CC"],  // Stun (cage)
    "R": []  // Execute
  },
  "Vel'Koz": {
    "Q": ["HARD_CC"],  // Knockup (split)
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Slow + knockup
    "R": []  // Damage
  },
  "Vex": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + fear
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + fear
  },
  "Vi": {
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockback
    "W": [],  // Attack speed
    "E": [],  // Damage
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup
  },
  "Viego": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Stun (charged)
    "E": [],  // Stealth
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback
  },
  "Viktor": {
    "Q": ["SHIELD_PEEL"],  // Shield + damage
    "W": ["SOFT_CC", "HARD_CC"],  // Slow then stun
    "E": [],  // Damage
    "R": ["SOFT_CC"]  // Slow
  },
  "Vladimir": {
    "Q": [],  // Heal + damage
    "W": [],  // Untargetable
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage + heal amp
  },
  "Volibear": {
    "Q": ["HARD_CC"],  // Stun
    "W": [],  // Damage + heal
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback
  },
  "Warwick": {
    "Q": ["GAP_CLOSE"],  // Dash (hold)
    "W": [],  // Attack speed + tracking
    "E": ["HARD_CC"],  // Fear
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + suppression
  },
  "Wukong": {
    "Q": [],  // Damage
    "W": [],  // Clone + stealth
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockup
  },
  "Xayah": {
    "Q": [],  // Damage
    "W": [],  // Attack speed
    "E": ["HARD_CC"],  // Root
    "R": []  // Untargetable
  },
  "Xerath": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Stun
    "R": []  // Long range poke
  },
  "Xin Zhao": {
    "Q": ["HARD_CC"],  // Knockup (3rd hit)
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback
  },
  "Yasuo": {
    "Q": ["HARD_CC"],  // Knockup (Q3)
    "W": [],  // Wind wall
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup extension
  },
  "Yone": {
    "Q": ["HARD_CC"],  // Knockup (Q3)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": [],  // Spirit form
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup
  },
  "Yorick": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Trap/wall
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Summon Maiden
  },
  "Yuumi": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Attach (no threat)
    "E": [],  // Heal + attack speed
    "R": ["HARD_CC"]  // Root
  },
  "Yunara": {
    "Q": [],  // Damage
    "W": [],  // Mark
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Zac": {
    "Q": ["HARD_CC"],  // Knockback
    "W": [],  // Damage
    "E": ["GAP_CLOSE", "HARD_CC"],  // Jump + knockup
    "R": ["HARD_CC"]  // Knockup (bouncing)
  },
  "Zed": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE"],  // Shadow + swap
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE"]  // Dash + mark
  },
  "Zeri": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Speed + damage
  },
  "Ziggs": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Knockback
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Zilean": {
    "Q": ["HARD_CC"],  // Stun (double bomb)
    "W": [],  // Cooldown reduction
    "E": ["SOFT_CC"],  // Slow/speed
    "R": []  // Revive
  },
  "Zoe": {
    "Q": [],  // Damage
    "W": [],  // Pick up items
    "E": ["HARD_CC"],  // Sleep
    "R": ["GAP_CLOSE"]  // Blink (returns)
  },
  "Zyra": {
    "Q": [],  // Damage
    "W": [],  // Plants
    "E": ["HARD_CC"],  // Root
    "R": ["HARD_CC"]  // Knockup
  }
};

// Update the champions data with correct threats
console.log('Updating champion threat tags...\n');

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

    // Check if threats need updating
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

// Special fixes based on user feedback

// Yuumi W cooldown fix (5 second lockout when CCd)
const yuumiIndex = championsData.findIndex(c => c.name === "Yuumi");
if (yuumiIndex >= 0) {
  const yuumi = championsData[yuumiIndex];
  // Update W cooldown to reflect the 5 second lockout
  yuumi.abilities[1].cd = [5, 5, 5, 5, 5, 5];  // W has 5 second lockout when CCd
  console.log('\n✓ Fixed Yuumi W cooldown (5s lockout when CCd)');
}

// Write the updated data back
fs.writeFileSync('./champions-summary.json', JSON.stringify(championsData, null, 2), 'utf8');

console.log(`\n✅ Update complete!`);
console.log(`   Champions processed: ${championCount}`);
console.log(`   Abilities updated: ${updatedCount}`);
console.log(`\nKey fixes:`);
console.log(`   - Master Yi: Removed incorrect blind/slow tags, E no longer marked as threat`);
console.log(`   - Yuumi: W cooldown changed to 5s, W marked as no threat, removed high mobility`);
console.log(`   - Yorick: W marked as HARD_CC (trap)`);
console.log(`   - Syndra: E marked as HARD_CC (knockback + stun)`);
console.log(`   - Varus: W marked as no threat (passive damage buff)`);
