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
    cost: 1,
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