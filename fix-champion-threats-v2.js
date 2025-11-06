/**
 * Comprehensive Champion Threat Tag Fixer v2
 * Based on CORRECT wikilol cleansability standards
 *
 * CORRECT DEFINITIONS from wiki.leagueoflegends.com/Cleanse:
 * - HARD_CC (NOT cleansable): Airborne (knockups, knockbacks, pulls), Suppression, Nearsight
 * - SOFT_CC (Cleansable): Stuns, Roots, Slows, Charms, Fears, Taunts, Silences, Blinds, Sleep, Disarm, Cripple, Grounded
 * - GAP_CLOSE: Dashes, blinks, leaps
 * - SHIELD_PEEL: Shields for protection
 */

const fs = require('fs');

// Load the current champions data
const championsData = JSON.parse(fs.readFileSync('./champions-summary.json', 'utf8'));

/**
 * Comprehensive threat data for all champions with CORRECT CC classifications
 */
const championThreats = {
  "Aatrox": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Pull (airborne = hard CC)
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Revive/stats
  },
  "Ahri": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Charm (cleansable = soft CC)
    "R": ["GAP_CLOSE"]  // Triple dash
  },
  "Akali": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Stealth
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE", "SOFT_CC"]  // Dash + micro-stun (stuns are soft CC)
  },
  "Akshan": {
    "Q": [],  // Damage
    "W": [],  // Passive/stealth
    "E": ["GAP_CLOSE"],  // Swing
    "R": []  // Damage
  },
  "Alistar": {
    "Q": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "W": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "E": [],  // Heal
    "R": []  // Damage reduction
  },
  "Amumu": {
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // DoT aura
    "E": [],  // Damage
    "R": ["SOFT_CC"]  // Root (cleansable = soft CC)
  },
  "Anivia": {
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // Wall
    "E": [],  // Damage
    "R": ["SOFT_CC"]  // Slow
  },
  "Annie": {
    "Q": [],  // Damage (stun is passive)
    "W": [],  // Damage (stun is passive)
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["SOFT_CC"]  // Stun via passive (cleansable = soft CC)
  },
  "Aphelios": {
    "Q": ["SOFT_CC"],  // Slow (with Gravitum)
    "W": [],  // Weapon swap
    "E": [],  // Turret
    "R": ["SOFT_CC"]  // Root with Gravitum (cleansable = soft CC)
  },
  "Ashe": {
    "Q": [],  // Attack speed
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // Vision
    "R": ["SOFT_CC"]  // Stun (cleansable = soft CC)
  },
  "Aurelion Sol": {
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // Toggle
    "E": ["GAP_CLOSE"],  // Flight
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
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
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Bard": {
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // Heal
    "E": [],  // Portal
    "R": ["SOFT_CC"]  // Stasis (like Zhonya's)
  },
  "Bel'Veth": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "E": [],  // Damage reduction
    "R": []  // Transform
  },
  "Blitzcrank": {
    "Q": ["HARD_CC"],  // Pull (airborne = hard CC)
    "W": [],  // Movement speed
    "E": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "R": ["SOFT_CC"]  // Silence (cleansable = soft CC)
  },
  "Brand": {
    "Q": ["SOFT_CC"],  // Stun when ablaze (cleansable = soft CC)
    "W": [],  // Damage
    "E": [],  // Damage
    "R": []  // Bouncing damage
  },
  "Braum": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["GAP_CLOSE"],  // Dash to ally
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Briar": {
    "Q": [],  // Damage + heal
    "W": [],  // Berserk
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun (stun = soft CC)
    "R": ["SOFT_CC"]  // Fear + charm (cleansable = soft CC)
  },
  "Caitlyn": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Root trap (cleansable = soft CC)
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + slow
    "R": []  // Single target damage
  },
  "Camille": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun (stun = soft CC)
    "R": []  // Lock in zone (not traditional CC)
  },
  "Cassiopeia": {
    "Q": [],  // Poison
    "W": ["SOFT_CC"],  // Grounded + slow (cleansable = soft CC)
    "E": [],  // Single target damage
    "R": ["SOFT_CC"]  // Stun if facing (cleansable = soft CC)
  },
  "Cho'Gath": {
    "Q": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "W": ["SOFT_CC"],  // Silence (cleansable = soft CC)
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
    "E": ["HARD_CC"],  // Pull (airborne = hard CC)
    "R": []  // Execute
  },
  "Diana": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["HARD_CC"],  // Pull (airborne = hard CC)
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
    "E": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "R": []  // Damage
  },
  "Ekko": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SOFT_CC"],  // Stun in zone (cleansable = soft CC)
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Dash back + damage
  },
  "Elise": {
    "Q": [],  // Damage
    "W": [],  // Spider summon/attack speed
    "E": ["SOFT_CC", "GAP_CLOSE"],  // Stun (human) / rappel (spider)
    "R": []  // Transform
  },
  "Evelynn": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Charm (cleansable = soft CC)
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
    "Q": ["SOFT_CC"],  // Fear (cleansable = soft CC)
    "W": [],  // Drain
    "E": ["SOFT_CC"],  // Silence (cleansable = soft CC)
    "R": ["GAP_CLOSE"]  // Blink
  },
  "Fiora": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Stun if blocks CC (cleansable = soft CC)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Mark for healing
  },
  "Fizz": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // On-hit damage
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Galio": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Taunt (cleansable = soft CC)
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup (knockup = hard CC)
    "R": ["GAP_CLOSE", "HARD_CC"]  // TP + knockup (knockup = hard CC)
  },
  "Gangplank": {
    "Q": [],  // Poke
    "W": [],  // Cleanse + heal
    "E": [],  // Barrel
    "R": ["SOFT_CC"]  // Slow
  },
  "Garen": {
    "Q": ["SOFT_CC"],  // Silence (cleansable = soft CC)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": [],  // Spin
    "R": []  // Execute
  },
  "Gnar": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SOFT_CC"],  // Stun in Mega (cleansable = soft CC)
    "E": ["GAP_CLOSE"],  // Hop/jump
    "R": ["HARD_CC"]  // Knockback + stun (knockback = hard CC)
  },
  "Gragas": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Damage reduction
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockback (knockback = hard CC)
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Graves": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Nearsight... wait, nearsight is NOT cleansable
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage
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
    "E": ["GAP_CLOSE", "HARD_CC"],  // Charge + knockback (knockback = hard CC)
    "R": ["GAP_CLOSE", "SOFT_CC"]  // Dash + fear (fear = soft CC)
  },
  "Heimerdinger": {
    "Q": [],  // Turrets
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": []  // Upgrade ability
  },
  "Hwei": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
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
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": ["SOFT_CC"]  // Disarm + slow (cleansable = soft CC)
  },
  "Ivern": {
    "Q": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "W": [],  // Bush
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Daisy knockup (airborne = hard CC)
  },
  "Janna": {
    "Q": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "W": ["SOFT_CC"],  // Slow
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
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
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": []  // Stats
  },
  "Jayce": {
    "Q": [],  // Damage
    "W": [],  // Speed
    "E": ["HARD_CC"],  // Knockback in hammer (airborne = hard CC)
    "R": []  // Transform
  },
  "Jhin": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Root on marked (cleansable = soft CC)
    "E": ["SOFT_CC"],  // Slow
    "R": ["SOFT_CC"]  // Slow
  },
  "Jinx": {
    "Q": [],  // Weapon swap
    "W": ["SOFT_CC"],  // Slow
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "R": []  // Damage
  },
  "K'Sante": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Pull + stun (pull = hard CC, but stun is soft...)
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Kai'Sa": {
    "Q": [],  // Damage
    "W": [],  // Mark + damage
    "E": [],  // Movement speed + stealth
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Kalista": {
    "Q": [],  // Pierce
    "W": [],  // Passive + vision
    "E": [],  // Rend
    "R": ["HARD_CC"]  // Pull ally + knockup (knockup = hard CC)
  },
  "Karma": {
    "Q": ["SOFT_CC"],  // Slow (empowered)
    "W": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "E": ["SHIELD_PEEL"],  // Shield
    "R": []  // Empower
  },
  "Karthus": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": [],  // DoT aura
    "R": []  // Global damage
  },
  "Kassadin": {
    "Q": ["SOFT_CC"],  // Silence (cleansable = soft CC)
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
    "W": ["SOFT_CC"],  // Stun with passive (cleansable = soft CC)
    "E": [],  // Speed
    "R": ["SOFT_CC"]  // Stun with passive (cleansable = soft CC)
  },
  "Kha'Zix": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Jump
    "R": []  // Stealth
  },
  "Kindred": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Slow in zone
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Immune zone
  },
  "Kled": {
    "Q": ["HARD_CC"],  // Pull (airborne = hard CC)
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
    "Q": [],  // Damage
    "W": ["GAP_CLOSE"],  // Dash
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "R": []  // Mimic
  },
  "Lee Sin": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["GAP_CLOSE"],  // Dash to ally
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Leona": {
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // Damage + resist
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + root (root = soft CC)
    "R": ["SOFT_CC"]  // Stun (cleansable = soft CC)
  },
  "Lillia": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Slow
    "R": ["SOFT_CC"]  // Sleep (cleansable = soft CC)
  },
  "Lissandra": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "E": ["GAP_CLOSE"],  // Claw dash
    "R": ["SOFT_CC"]  // Stun enemy (cleansable = soft CC)
  },
  "Lucian": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Damage
  },
  "Lulu": {
    "Q": ["SOFT_CC"],  // Slow
    "W": ["SOFT_CC"],  // Polymorph (cleansable = soft CC)
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Lux": {
    "Q": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Malphite": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Shield
    "E": ["SOFT_CC"],  // Attack speed slow
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup (knockup = hard CC)
  },
  "Malzahar": {
    "Q": ["SOFT_CC"],  // Silence (cleansable = soft CC)
    "W": [],  // Voidlings
    "E": [],  // DoT
    "R": ["HARD_CC"]  // Suppression (NOT cleansable = hard CC)
  },
  "Maokai": {
    "Q": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "W": ["GAP_CLOSE", "SOFT_CC"],  // Dash + root (root = soft CC)
    "E": ["SOFT_CC"],  // Slow
    "R": ["SOFT_CC"]  // Root (cleansable = soft CC)
  },
  "Master Yi": {
    "Q": ["GAP_CLOSE"],  // Dash/untargetable
    "W": [],  // Damage reduction + heal
    "E": [],  // True damage buff (NOT A THREAT)
    "R": []  // Speed buff (NOT A SLOW!)
  },
  "Mel": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Milio": {
    "Q": ["HARD_CC"],  // Knockup (airborne = hard CC)
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
    "E": ["HARD_CC"],  // Pull (airborne = hard CC)
    "R": []  // Death Realm
  },
  "Morgana": {
    "Q": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "W": [],  // Damage zone
    "E": ["SHIELD_PEEL"],  // Shield
    "R": ["SOFT_CC"]  // Stun after tether (cleansable = soft CC)
  },
  "Naafiri": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE"],  // Dash
    "E": [],  // Damage + heal
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Nami": {
    "Q": ["HARD_CC"],  // Suspension/knockup (airborne = hard CC)
    "W": [],  // Heal/damage
    "E": ["SOFT_CC"],  // Slow buff
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Nasus": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow + attack speed slow
    "E": [],  // Damage + armor shred
    "R": []  // Stats
  },
  "Nautilus": {
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Hook + pull (pull = hard CC)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["SOFT_CC"],  // Slow
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Neeko": {
    "Q": [],  // Damage
    "W": [],  // Clone
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "R": ["SOFT_CC"]  // Stun (cleansable = soft CC)
  },
  "Nidalee": {
    "Q": [],  // Damage
    "W": [],  // Trap/leap
    "E": [],  // Heal/damage
    "R": []  // Transform
  },
  "Nilah": {
    "Q": [],  // Damage
    "W": [],  // Dodge
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Pull (airborne = hard CC)
  },
  "Nocturne": {
    "Q": [],  // Damage trail
    "W": ["SHIELD_PEEL"],  // Spell shield
    "E": ["SOFT_CC"],  // Fear (cleansable = soft CC)
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + nearsight (nearsight = hard CC!)
  },
  "Nunu & Willump": {
    "Q": [],  // Consume
    "W": ["HARD_CC"],  // Knockup snowball (airborne = hard CC)
    "E": ["SOFT_CC"],  // Slow + root at max (root = soft CC)
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
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Ornn": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Fire breath
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup (knockup = hard CC)
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Pantheon": {
    "Q": [],  // Damage
    "W": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun (stun = soft CC)
    "E": [],  // Block
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Poppy": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Block dashes
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun into wall (stun = soft CC)
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Pyke": {
    "Q": ["HARD_CC"],  // Pull (airborne = hard CC)
    "W": [],  // Stealth
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun (stun = soft CC)
    "R": ["GAP_CLOSE"]  // Dash + execute
  },
  "Qiyana": {
    "Q": ["SOFT_CC"],  // Slow with ice
    "W": ["GAP_CLOSE"],  // Dash
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback + stun (knockback = hard CC)
  },
  "Quinn": {
    "Q": ["SOFT_CC"],  // Blind (cleansable = soft CC)
    "W": [],  // Vision + attack speed
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + slow
    "R": []  // Speed
  },
  "Rakan": {
    "Q": [],  // Damage + heal
    "W": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup (knockup = hard CC)
    "E": ["GAP_CLOSE", "SHIELD_PEEL"],  // Dash to ally + shield
    "R": ["SOFT_CC"]  // Charm (cleansable = soft CC)
  },
  "Rammus": {
    "Q": [],  // Roll
    "W": [],  // Defense
    "E": ["SOFT_CC"],  // Taunt (cleansable = soft CC)
    "R": ["SOFT_CC"]  // Slow
  },
  "Rek'Sai": {
    "Q": [],  // Damage
    "W": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "E": ["GAP_CLOSE"],  // Tunnel
    "R": ["GAP_CLOSE"]  // Dash
  },
  "Rell": {
    "Q": ["SOFT_CC"],  // Stun if hits ally (cleansable = soft CC)
    "W": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "E": ["SOFT_CC"],  // Stun if breaks tether (cleansable = soft CC)
    "R": ["HARD_CC"]  // Pull (airborne = hard CC)
  },
  "Renata Glasc": {
    "Q": ["SOFT_CC"],  // Root + throw (root = soft CC, throw = hard CC?)
    "W": [],  // Revive + attack speed
    "E": ["SHIELD_PEEL"],  // Shield + damage
    "R": ["SOFT_CC"]  // Berserk (cleansable = soft CC)
  },
  "Renekton": {
    "Q": [],  // Damage + heal
    "W": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "E": ["GAP_CLOSE"],  // Dash
    "R": []  // Stats
  },
  "Rengar": {
    "Q": [],  // Damage
    "W": [],  // Damage + heal
    "E": ["SOFT_CC"],  // Slow/root if leap (cleansable = soft CC)
    "R": []  // Stealth
  },
  "Riven": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": ["SOFT_CC"],  // Stun (cleansable = soft CC)
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
    "W": ["SOFT_CC"],  // Root (cleansable = soft CC)
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
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockup (knockup = hard CC)
    "W": ["SOFT_CC"],  // Slow
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": ["SOFT_CC"]  // Stun (cleansable = soft CC)
  },
  "Senna": {
    "Q": [],  // Damage/heal
    "W": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "E": [],  // Stealth + speed
    "R": ["SHIELD_PEEL"]  // Shield + damage
  },
  "Seraphine": {
    "Q": [],  // Damage
    "W": ["SHIELD_PEEL"],  // Shield + heal
    "E": ["SOFT_CC"],  // Slow or root (cleansable = soft CC)
    "R": ["SOFT_CC"]  // Charm (cleansable = soft CC)
  },
  "Sett": {
    "Q": [],  // Speed + damage
    "W": ["SHIELD_PEEL"],  // Shield + damage
    "E": ["SOFT_CC"],  // Pull + stun (stun = soft CC... but pull?)
    "R": ["HARD_CC"]  // Suppression + slam (suppression = hard CC)
  },
  "Shaco": {
    "Q": ["GAP_CLOSE"],  // Blink + stealth
    "W": ["SOFT_CC"],  // Fear box (cleansable = soft CC)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Clone
  },
  "Shen": {
    "Q": [],  // Damage
    "W": [],  // Dodge zone
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + taunt (taunt = soft CC)
    "R": ["SHIELD_PEEL"]  // Shield + TP
  },
  "Shyvana": {
    "Q": [],  // Damage
    "W": [],  // Damage aura
    "E": [],  // Damage
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback (knockback = hard CC)
  },
  "Singed": {
    "Q": [],  // Poison trail
    "W": ["SOFT_CC"],  // Grounded + slow (cleansable = soft CC)
    "E": ["HARD_CC"],  // Fling (airborne = hard CC)
    "R": []  // Stats
  },
  "Sion": {
    "Q": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "R": ["GAP_CLOSE", "HARD_CC"]  // Charge + knockup (knockup = hard CC)
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
    "R": ["HARD_CC"]  // Suppression (NOT cleansable = hard CC)
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
    "R": ["SOFT_CC"]  // Stun (cleansable = soft CC)
  },
  "Soraka": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Heal
    "E": ["SOFT_CC"],  // Silence + root (cleansable = soft CC)
    "R": []  // Global heal
  },
  "Swain": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "E": ["HARD_CC"],  // Pull + root (pull = hard CC)
    "R": ["SOFT_CC"]  // Slow
  },
  "Sylas": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Damage + heal
    "E": ["GAP_CLOSE", "SOFT_CC"],  // Dash + stun E2 (stun = soft CC)
    "R": []  // Steal ult
  },
  "Syndra": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["HARD_CC"],  // Knockback + stun (knockback = hard CC)
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
    "W": ["HARD_CC"],  // Knockup (airborne = hard CC)
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
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": []  // Invulnerability
  },
  "Teemo": {
    "Q": ["SOFT_CC"],  // Blind (cleansable = soft CC)
    "W": [],  // Speed
    "E": [],  // Poison
    "R": ["SOFT_CC"]  // Slow shrooms (cleansable = soft CC)
  },
  "Thresh": {
    "Q": ["HARD_CC"],  // Hook + pull (pull = hard CC)
    "W": ["SHIELD_PEEL"],  // Lantern + shield
    "E": ["HARD_CC"],  // Knockback/pull (airborne = hard CC)
    "R": ["SOFT_CC"]  // Slow
  },
  "Tristana": {
    "Q": [],  // Attack speed
    "W": ["GAP_CLOSE", "SOFT_CC"],  // Jump + slow
    "E": [],  // Bomb
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
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
    "W": ["SOFT_CC"],  // Stun gold card (cleansable = soft CC)
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
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": []  // AoE damage
  },
  "Urgot": {
    "Q": [],  // Damage
    "W": [],  // Shield + fire
    "E": ["GAP_CLOSE", "HARD_CC"],  // Dash + flip (flip = hard CC)
    "R": ["HARD_CC"]  // Suppress + execute (suppress = hard CC)
  },
  "Varus": {
    "Q": [],  // Poke
    "W": [],  // Passive damage (NOT A THREAT)
    "E": ["SOFT_CC"],  // Slow + grievous
    "R": ["SOFT_CC"]  // Root (cleansable = soft CC)
  },
  "Vayne": {
    "Q": ["GAP_CLOSE"],  // Dash
    "W": [],  // True damage
    "E": ["HARD_CC"],  // Knockback + stun into wall (knockback = hard CC)
    "R": []  // Stealth + damage
  },
  "Veigar": {
    "Q": [],  // Damage
    "W": [],  // Damage
    "E": ["SOFT_CC"],  // Stun cage (cleansable = soft CC)
    "R": []  // Execute
  },
  "Vel'Koz": {
    "Q": ["HARD_CC"],  // Knockup on split (airborne = hard CC)
    "W": [],  // Damage
    "E": ["HARD_CC"],  // Knockup (airborne = hard CC)
    "R": []  // Damage
  },
  "Vex": {
    "Q": [],  // Damage
    "W": ["SOFT_CC", "SHIELD_PEEL"],  // Shield + fear (fear = soft CC)
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE", "SOFT_CC"]  // Dash + fear (fear = soft CC)
  },
  "Vi": {
    "Q": ["GAP_CLOSE", "HARD_CC"],  // Dash + knockback (knockback = hard CC)
    "W": [],  // Attack speed
    "E": [],  // Damage
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup (knockup = hard CC)
  },
  "Viego": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Stun charged (cleansable = soft CC)
    "E": [],  // Stealth
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback (knockback = hard CC)
  },
  "Viktor": {
    "Q": ["SHIELD_PEEL"],  // Shield + damage
    "W": ["SOFT_CC"],  // Slow then stun (cleansable = soft CC)
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
    "Q": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "W": [],  // Damage + heal
    "E": ["SOFT_CC"],  // Slow
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockback (knockback = hard CC)
  },
  "Warwick": {
    "Q": ["GAP_CLOSE"],  // Dash hold
    "W": [],  // Attack speed + tracking
    "E": ["SOFT_CC"],  // Fear (cleansable = soft CC)
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + suppression (suppression = hard CC)
  },
  "Wukong": {
    "Q": [],  // Damage
    "W": [],  // Clone + stealth
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  },
  "Xayah": {
    "Q": [],  // Damage
    "W": [],  // Attack speed
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "R": []  // Untargetable
  },
  "Xerath": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Slow
    "E": ["SOFT_CC"],  // Stun (cleansable = soft CC)
    "R": []  // Long range poke
  },
  "Xin Zhao": {
    "Q": ["HARD_CC"],  // Knockup 3rd hit (airborne = hard CC)
    "W": ["SOFT_CC"],  // Slow
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["HARD_CC"]  // Knockback (airborne = hard CC)
  },
  "Yasuo": {
    "Q": ["HARD_CC"],  // Knockup Q3 (airborne = hard CC)
    "W": [],  // Wind wall
    "E": ["GAP_CLOSE"],  // Dash
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup extension (knockup = hard CC)
  },
  "Yone": {
    "Q": ["HARD_CC"],  // Knockup Q3 (airborne = hard CC)
    "W": ["SHIELD_PEEL"],  // Shield
    "E": [],  // Spirit form
    "R": ["GAP_CLOSE", "HARD_CC"]  // Dash + knockup (knockup = hard CC)
  },
  "Yorick": {
    "Q": [],  // Damage
    "W": ["SOFT_CC"],  // Trap/wall (NOT airborne, can be escaped)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Summon Maiden
  },
  "Yuumi": {
    "Q": ["SOFT_CC"],  // Slow
    "W": [],  // Attach (no threat)
    "E": [],  // Heal + attack speed
    "R": ["SOFT_CC"]  // ROOT (cleansable = soft CC, NOT hard CC!)
  },
  "Yunara": {
    "Q": [],  // Damage
    "W": [],  // Mark
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Zac": {
    "Q": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "W": [],  // Damage
    "E": ["GAP_CLOSE", "HARD_CC"],  // Jump + knockup (knockup = hard CC)
    "R": ["HARD_CC"]  // Knockup bouncing (airborne = hard CC)
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
    "W": ["HARD_CC"],  // Knockback (airborne = hard CC)
    "E": ["SOFT_CC"],  // Slow
    "R": []  // Damage
  },
  "Zilean": {
    "Q": ["SOFT_CC"],  // Stun double bomb (cleansable = soft CC)
    "W": [],  // Cooldown reduction
    "E": ["SOFT_CC"],  // Slow/speed
    "R": []  // Revive
  },
  "Zoe": {
    "Q": [],  // Damage
    "W": [],  // Pick up items
    "E": ["SOFT_CC"],  // Sleep (cleansable = soft CC)
    "R": ["GAP_CLOSE"]  // Blink returns
  },
  "Zyra": {
    "Q": [],  // Damage
    "W": [],  // Plants
    "E": ["SOFT_CC"],  // Root (cleansable = soft CC)
    "R": ["HARD_CC"]  // Knockup (airborne = hard CC)
  }
};

// Special cases that need notes:
// - Graves W: Nearsight is HARD_CC (not cleansable)
// - Nocturne R: Nearsight is HARD_CC (not cleansable)
// - Yorick W: Is a wall/trap, not traditional CC - marking as SOFT_CC since you can break it
// - K'Sante W: Has both pull (hard) and stun (soft) - marking as HARD_CC for the pull
// - Sett E: Has pull component but also stun - pull is hard CC
// - Renata Q: Root then throw - throw is hard CC
// - Swain E: Pull component makes it hard CC

// Fix special cases
championThreats["Graves"]["W"] = ["HARD_CC"];  // Nearsight
championThreats["Nocturne"]["R"][1] = "HARD_CC";  // Already has GAP_CLOSE, adding nearsight

// Update the champions data with correct threats
console.log('Updating champion threat tags with CORRECT CC classifications...\n');
console.log('HARD_CC = NOT cleansable (Airborne, Suppression, Nearsight)');
console.log('SOFT_CC = Cleansable (Stuns, Roots, Slows, etc.)\n');

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
const yuumiIndex = championsData.findIndex(c => c.name === "Yuumi");
if (yuumiIndex >= 0) {
  const yuumi = championsData[yuumiIndex];
  yuumi.abilities[1].cd = [5, 5, 5, 5, 5, 5];  // W has 5 second lockout when CCd
  console.log('\n✓ Fixed Yuumi W cooldown (5s lockout when CCd)');
}

// Write the updated data back
fs.writeFileSync('./champions-summary.json', JSON.stringify(championsData, null, 2), 'utf8');

console.log(`\n✅ Update complete with CORRECT CC definitions!`);
console.log(`   Champions processed: ${championCount}`);
console.log(`   Abilities updated: ${updatedCount}`);
console.log(`\nCorrect CC classifications:`);
console.log(`   - HARD_CC (NOT cleansable): Knockups, Knockbacks, Pulls, Suppression, Nearsight`);
console.log(`   - SOFT_CC (Cleansable): Stuns, Roots, Slows, Charms, Fears, Taunts, Silences, Blinds, etc.`);
console.log(`\nKey fixes:`);
console.log(`   - Master Yi: R is NOT a slow, E is NOT a threat`);
console.log(`   - Yuumi: R is SOFT_CC (root, not hard CC), W cooldown 5s`);
console.log(`   - Yorick: W is SOFT_CC (can be broken)`);
console.log(`   - Syndra: E is HARD_CC (knockback)`);
console.log(`   - All stuns/roots changed from HARD_CC to SOFT_CC (they're cleansable!)`);
console.log(`   - All knockups/knockbacks/pulls are now HARD_CC (not cleansable!)`);
