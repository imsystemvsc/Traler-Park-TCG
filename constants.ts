import { Card } from './types';

export const MECHANIC_DESCRIPTIONS: Record<string, string> = {
  taunt: "Enemies must attack this unit first.",
  charge: "Can attack immediately after being played.",
  cleave: "Also deals damage to minions next to the target.",
  divine_shield: "Ignores the first instance of damage.",
  lifesteal: "Damage dealt restores Health to your Hero.",
  auto_attack: "Attacks a random enemy automatically at end of turn.",
  cant_attack: "Cannot be ordered to attack manually.",
  summon_random: "Summons a random minion at end of turn.",
  battlecry_damage: "Effect triggers immediately when played from hand.",
  battlecry_scavenge: "Add a random dead minion to your hand.",
  start_turn_heal_all: "Heals your minions at start of turn.",
  end_turn_damage_all: "Deals 1 damage to everything at end of turn.",
  start_turn_draw: "Draw an extra card at start of turn.",
  start_turn_buff_risk: "Give a random ally +2 Attack but deal 1 damage to it.",
  start_turn_gain_mana: "Gain 1 extra Beer at start of turn.",
  end_turn_summon_taunt: "Summons a 1/1 Ankle Biter with Taunt at end of turn.",
  end_turn_heal_hero: "Restores 2 Health to your Hero at end of turn.",
};

// --- BANTER DICTIONARY ---
export const BANTER_LINES = {
    start: {
        player: ["I ain't payin' rent!", "My trailer, my rules.", "You want a piece of me?"],
        enemy: ["Eviction notice served.", "This place is a pigsty.", "I'm raising your rent."]
    },
    emote_hello: {
        player: ["Howdy.", "Sup.", "Nice shoes."],
        enemy: ["Rent is due.", "Unpleasant to see you.", "Tick tock."]
    },
    emote_threaten: {
        player: ["I'll sic the dog on ya!", "Get off my property!", "I know karate!"],
        enemy: ["I'm keeping your deposit.", "I have lawyers.", "This is a lease violation."]
    },
    hurt_small: {
        player: ["Tis but a scratch.", "Ow.", "Hey!"],
        enemy: ["Uncivilized brute!", "Stop that!", "My suit!"]
    },
    hurt_big: {
        player: ["OOF! My back!", "Someone hold my beer...", "I need a doctor!"],
        enemy: ["THIS IS A LAWSUIT!", "SECURITY!", "I'm calling the police!"]
    },
    play_secret: {
        player: ["Heh heh heh...", "Don't mind this.", "Just a little insurance."],
        enemy: ["Read the fine print...", "Clause 4, Section B...", "Hidden fees applied."]
    },
    trigger_secret: {
        player: ["Gotcha!", "Surprise!", "You triggered my trap card!"],
        enemy: ["Aha! A loophole!", "Lease violation detected!", "Caught you!"]
    },
    win: {
        player: ["And stay out!", "Drinks on me!", "Trailer Park King!"],
        enemy: ["I'll be baaaack...", "You'll hear from my lawyer.", "This isn't over."]
    },
    lose: {
        player: ["Pack it up, boys...", "It was rigged!", "There goes the neighborhood."],
        enemy: ["Get your stuff off the curb.", "Property value just went up.", "Finally, some peace."]
    }
};

// Card Database
export const CARD_DATABASE: Omit<Card, 'id'>[] = [
  // --- EXISTING MINIONS ---
  {
    templateId: 'c1',
    name: 'Rusty Spork',
    cost: 1,
    attack: 1,
    health: 2,
    emoji: '🥄',
    description: 'Not sharp, but tetanus counts.',
    cardType: 'minion'
  },
  {
    templateId: 'c2',
    name: 'Trash Panda',
    cost: 2,
    attack: 2,
    health: 3,
    emoji: '🦝',
    description: 'He eats better than you.',
    cardType: 'minion'
  },
  {
    templateId: 'c3',
    name: 'Possessed Lawn Chair',
    cost: 3,
    attack: 4,
    health: 2,
    emoji: '🪑',
    description: 'It sits on YOU.',
    cardType: 'minion'
  },
  {
    templateId: 'c4',
    name: 'Chain Smoker',
    cost: 4,
    attack: 2,
    health: 6,
    emoji: '🚬',
    taunt: true,
    description: 'Taunt. Coughs loudly.',
    cardType: 'minion'
  },
  {
    templateId: 'c5',
    name: 'Meth Gator',
    cost: 5,
    attack: 7,
    health: 3,
    emoji: '🐊',
    description: 'Fast and unreasonably angry.',
    cardType: 'minion'
  },
  {
    templateId: 'c6',
    name: 'Shotgun Wedding',
    cost: 6,
    attack: 6,
    health: 6,
    emoji: '👰',
    description: 'Till death do us part.',
    cardType: 'minion'
  },
  {
    templateId: 'c7',
    name: 'Beer Run',
    cost: 3,
    attack: 3,
    health: 3,
    emoji: '🏃',
    description: 'Quick restock.',
    cardType: 'minion'
  },
  {
    templateId: 'c9',
    name: 'Plastic Flamingo',
    cost: 1,
    attack: 0,
    health: 4,
    emoji: '🦩',
    taunt: true,
    description: 'Classy lawn decor. Taunt.',
    cardType: 'minion'
  },
  {
    templateId: 'c10',
    name: 'Stray Pitbull',
    cost: 4,
    attack: 5,
    health: 2,
    emoji: '🐕',
    description: 'He finds his own food.',
    cardType: 'minion'
  },
  {
    templateId: 'c11',
    name: 'Broken TV',
    cost: 2,
    attack: 0,
    health: 6,
    emoji: '📺',
    taunt: true,
    description: 'Heavy. Good for blocking. Taunt.',
    cardType: 'minion'
  },

  // --- SPECIAL MECHANIC MINIONS ---
  {
    templateId: 'c30',
    name: 'Lawnmower Man',
    cost: 5,
    attack: 3,
    health: 5,
    emoji: '🚜',
    description: 'Cleave. Hits neighbors when attacking.',
    cardType: 'minion',
    mechanics: ['cleave']
  },
  {
    templateId: 'c31',
    name: 'Rabid Raccoon',
    cost: 3,
    attack: 2,
    health: 4,
    emoji: '🧟🦝',
    description: "Can't Attack. End Turn: Deal 2 dmg to random enemy.",
    cardType: 'minion',
    mechanics: ['auto_attack', 'cant_attack'],
    mechanicValue: 2
  },
  {
    templateId: 'c32',
    name: 'Brick Thrower',
    cost: 3,
    attack: 3,
    health: 2,
    emoji: '🧱',
    description: 'Battlecry: Deal 2 damage to random enemy.',
    cardType: 'minion',
    mechanics: ['battlecry_damage'],
    mechanicValue: 2
  },
  {
    templateId: 'c33',
    name: 'The Queen Roach',
    cost: 6,
    attack: 0,
    health: 7,
    emoji: '🪳👑',
    description: "Can't Attack. End Turn: Summon a random trash minion.",
    cardType: 'minion',
    mechanics: ['cant_attack', 'summon_random']
  },
  {
    templateId: 'c34',
    name: 'Caffeinated Squirrel',
    cost: 2,
    attack: 3,
    health: 1,
    emoji: '🐿️⚡',
    description: "Charge. Attacks immediately.",
    cardType: 'minion',
    mechanics: ['charge']
  },
  {
    templateId: 'c35',
    name: 'Tin Foil Hat',
    cost: 3,
    attack: 3,
    health: 2,
    emoji: '🛸',
    description: "Divine Shield. Ignore first damage taken.",
    cardType: 'minion',
    mechanics: ['divine_shield']
  },
  {
    templateId: 'c36',
    name: 'Mosquito Swarm',
    cost: 4,
    attack: 3,
    health: 3,
    emoji: '🦟',
    description: "Lifesteal. Heals hero on attack.",
    cardType: 'minion',
    mechanics: ['lifesteal']
  },
  {
    templateId: 'c37',
    name: 'Dumpster Diver',
    cost: 2,
    attack: 2,
    health: 1,
    emoji: '🗑️🤿',
    description: "Battlecry: Scavenge a dead minion.",
    cardType: 'minion',
    mechanics: ['battlecry_scavenge']
  },

  // --- LOCATIONS ---
  {
    templateId: 'l1',
    name: 'Above-Ground Pool',
    cost: 3,
    attack: 0,
    health: 4,
    emoji: '🏊‍♂️',
    description: 'Start of Turn: Heal all your minions for 1.',
    cardType: 'location',
    mechanics: ['start_turn_heal_all', 'cant_attack']
  },
  {
    templateId: 'l2',
    name: 'Burning Barrel',
    cost: 2,
    attack: 0,
    health: 3,
    emoji: '🛢️🔥',
    description: 'End of Turn: Deal 1 damage to EVERYTHING.',
    cardType: 'location',
    mechanics: ['end_turn_damage_all', 'cant_attack']
  },
  {
    templateId: 'l3',
    name: 'Stolen Satellite',
    cost: 3,
    attack: 0,
    health: 4,
    emoji: '📡',
    description: 'Start of Turn: Draw an extra card.',
    cardType: 'location',
    mechanics: ['start_turn_draw', 'cant_attack']
  },
  {
    templateId: 'l4',
    name: 'Meth Lab',
    cost: 2,
    attack: 0,
    health: 3,
    emoji: '🚐⚗️',
    description: 'Start Turn: Give a random ally +2 ATK, deal 1 dmg to it.',
    cardType: 'location',
    mechanics: ['start_turn_buff_risk', 'cant_attack']
  },
  {
    templateId: 'l5',
    name: 'Junkyard Doghouse',
    cost: 4,
    attack: 0,
    health: 5,
    emoji: '🛖🐕',
    description: 'End Turn: Summon a 1/1 Ankle Biter with Taunt.',
    cardType: 'location',
    mechanics: ['end_turn_summon_taunt', 'cant_attack']
  },
  {
    templateId: 'l6',
    name: 'Community Fridge',
    cost: 2,
    attack: 0,
    health: 4,
    emoji: '🧊🍔',
    description: 'End Turn: Restore 2 Health to your Hero.',
    cardType: 'location',
    mechanics: ['end_turn_heal_hero', 'cant_attack']
  },
  {
    templateId: 'l7',
    name: 'Illegal Distillery',
    cost: 3,
    attack: 0,
    health: 3,
    emoji: '🥃🌽',
    description: 'Start Turn: Gain 1 extra Beer.',
    cardType: 'location',
    mechanics: ['start_turn_gain_mana', 'cant_attack']
  },

  // --- SECRETS (Blue Tarp Specials) ---
  {
    templateId: 'sec1',
    name: 'Trespassing!',
    cost: 2,
    emoji: '⛔',
    description: 'Secret: When enemy attacks your Hero, destroy it.',
    cardType: 'secret',
    secretTrigger: 'on_attack_hero'
  },
  {
    templateId: 'sec2',
    name: 'Booby Trap',
    cost: 2,
    emoji: '💣',
    description: 'Secret: When enemy attacks a minion, deal 2 damage to all enemies.',
    cardType: 'secret',
    secretTrigger: 'on_attack_minion'
  },
  {
    templateId: 'sec3',
    name: 'Noise Complaint',
    cost: 3,
    emoji: '🚔',
    description: "Secret: When enemy plays their 3rd card, end their turn.",
    cardType: 'secret',
    secretTrigger: 'on_3rd_card'
  },
  {
    templateId: 'sec4',
    name: 'Bad Batch',
    cost: 1,
    emoji: '🧪',
    description: 'Secret: When enemy casts a Spell, counter it.',
    cardType: 'secret',
    secretTrigger: 'on_spell_cast'
  },
  {
    templateId: 'sec5',
    name: 'Hidden Stash',
    cost: 2,
    emoji: '💊',
    description: 'Secret: When you take lethal damage, stay at 1 HP and become Immune.',
    cardType: 'secret',
    secretTrigger: 'on_lethal_damage'
  },
  {
    templateId: 'sec6',
    name: 'Angry Opossum',
    cost: 2,
    emoji: '🐀',
    description: 'Secret: When enemy plays a minion, summon a 4/2 Opossum with Charge.',
    cardType: 'secret',
    secretTrigger: 'on_minion_played'
  },

  // --- SPELLS ---
  {
    templateId: 's1',
    name: 'Canned Heat',
    cost: 2,
    emoji: '🔥',
    description: 'Deal 3 damage to any target.',
    cardType: 'spell',
    spellEffect: 'damage',
    spellValue: 3,
    requiresTarget: true
  },
  {
    templateId: 's2',
    name: 'Duct Tape',
    cost: 1,
    emoji: '🩹',
    description: 'Restore 5 health to a character.',
    cardType: 'spell',
    spellEffect: 'heal',
    spellValue: 5,
    requiresTarget: true
  },
  {
    templateId: 's3',
    name: 'Dumpster Dive',
    cost: 3,
    emoji: '🗑️',
    description: 'Draw 2 cards from the stash.',
    cardType: 'spell',
    spellEffect: 'draw',
    spellValue: 2,
    requiresTarget: false
  },
  {
    templateId: 's4',
    name: 'Happy Hour',
    cost: 2,
    emoji: '🍺',
    description: 'Give a minion +2/+2.',
    cardType: 'spell',
    spellEffect: 'buff',
    spellValue: 2,
    requiresTarget: true
  },
  {
    templateId: 's5',
    name: 'Gas Leak',
    cost: 4,
    emoji: '🤢',
    description: 'Deal 2 damage to ALL minions.',
    cardType: 'spell',
    spellEffect: 'aoe_damage',
    spellValue: 2,
    requiresTarget: false
  },
  {
    templateId: 's6',
    name: 'Repo Man',
    cost: 5,
    emoji: '🕵️',
    description: 'Destroy a minion.',
    cardType: 'spell',
    spellEffect: 'destroy',
    requiresTarget: true
  },
  {
    templateId: 's7',
    name: 'Lottery Ticket',
    cost: 0,
    emoji: '🎫',
    description: 'Gain 2 Beer (Mana) this turn only.',
    cardType: 'spell',
    spellEffect: 'gain_mana',
    spellValue: 2,
    requiresTarget: false
  },
  {
    templateId: 's8',
    name: 'Deep Fryer',
    cost: 3,
    emoji: '🍟',
    description: 'Deal 5 damage to a minion.',
    cardType: 'spell',
    spellEffect: 'damage',
    spellValue: 5,
    requiresTarget: true
  }
];

export const generateDeck = (count: number): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < count; i++) {
    const template = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
    deck.push({
      ...template,
      id: `card-${Date.now()}-${i}-${Math.random()}`
    });
  }
  return deck;
};

export const INITIAL_HAND_SIZE = 4;
export const MAX_MANA_CAP = 10;
export const STARTING_HEALTH = 30;