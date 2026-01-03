export type CardType = 'minion' | 'spell';
export type SpellEffect = 'damage' | 'heal' | 'draw' | 'buff' | 'destroy' | 'aoe_damage' | 'gain_mana';

export type Mechanic = 
  | 'cleave' 
  | 'auto_attack' 
  | 'battlecry_damage' 
  | 'cant_attack' 
  | 'summon_random' 
  | 'charge' 
  | 'divine_shield' 
  | 'lifesteal';

export interface Card {
  id: string; // unique instance id
  templateId: string;
  name: string;
  cost: number;
  attack?: number; // Optional for spells
  health?: number; // Optional for spells
  emoji: string;
  description?: string;
  taunt?: boolean;
  cardType: CardType;
  spellEffect?: SpellEffect;
  spellValue?: number;
  requiresTarget?: boolean;
  mechanics?: Mechanic[];
  mechanicValue?: number; // e.g. amount of battlecry damage
}

export interface Minion extends Card {
  currentHealth: number;
  canAttack: boolean;
  justPlayed: boolean;
  attack: number; // Required for minions
  health: number; // Required for minions
  hasShield?: boolean; // Runtime state for Divine Shield
}

export interface Player {
  id: 'player' | 'enemy';
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  board: Minion[];
  deck: Card[];
}

export interface GameState {
  player: Player;
  enemy: Player;
  turn: 'player' | 'enemy';
  turnNumber: number;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  logs: string[];
}