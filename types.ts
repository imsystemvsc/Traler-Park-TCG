export type CardType = 'minion' | 'spell' | 'location' | 'secret';
export type SpellEffect = 'damage' | 'heal' | 'draw' | 'buff' | 'destroy' | 'aoe_damage' | 'gain_mana' | 'counter_spell'; // Added counter_spell for internal logic

export type Mechanic = 
  | 'cleave' 
  | 'auto_attack' 
  | 'battlecry_damage' 
  | 'battlecry_scavenge'
  | 'cant_attack' 
  | 'summon_random' 
  | 'charge' 
  | 'divine_shield' 
  | 'lifesteal'
  | 'start_turn_heal_all'
  | 'start_turn_draw'
  | 'start_turn_buff_risk'
  | 'start_turn_gain_mana'
  | 'end_turn_damage_all'
  | 'end_turn_summon_taunt'
  | 'end_turn_heal_hero';

export type SecretTrigger = 
  | 'on_attack_hero' 
  | 'on_attack_minion' 
  | 'on_spell_cast' 
  | 'on_minion_played' 
  | 'on_lethal_damage' 
  | 'on_3rd_card';

export interface Card {
  id: string; // unique instance id
  templateId: string;
  name: string;
  cost: number;
  attack?: number;
  health?: number;
  emoji: string;
  description?: string;
  taunt?: boolean;
  cardType: CardType;
  spellEffect?: SpellEffect;
  spellValue?: number;
  requiresTarget?: boolean;
  mechanics?: Mechanic[];
  mechanicValue?: number;
  secretTrigger?: SecretTrigger; // New
}

export interface Minion extends Card {
  currentHealth: number;
  canAttack: boolean;
  justPlayed: boolean;
  attack: number;
  health: number;
  hasShield?: boolean;
  isDead?: boolean;
  isLocation?: boolean;
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
  graveyard: Card[];
  activeSecrets: Card[]; // New: The Blue Tarp Stash
  heroPowerUsed: boolean;
  isImmune?: boolean; // New: For Hidden Stash
}

export interface Banter {
  speaker: 'player' | 'enemy';
  text: string;
  id: number;
}

export interface GameState {
  player: Player;
  enemy: Player;
  turn: 'player' | 'enemy';
  turnNumber: number;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  logs: string[];
  banter: Banter | null; // New
  cardsPlayedThisTurn: number; // New: For Noise Complaint
}