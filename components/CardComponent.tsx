import React from 'react';
import { Card } from '../types';

interface CardProps {
  card: Card;
  onClick?: () => void;
  playable: boolean;
  isSelected?: boolean;
  isEnemy?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, onClick, playable, isSelected, isEnemy }) => {
  if (isEnemy) {
    return (
      <div 
        className="w-20 h-28 md:w-24 md:h-32 bg-amber-800 rounded-lg border-2 border-stone-900 shadow-md flex items-center justify-center transform hover:-translate-y-2 transition-transform shrink-0"
        title="Enemy Card"
      >
        <div className="w-16 h-24 md:w-20 md:h-28 bg-amber-900/50 rounded flex items-center justify-center">
          <span className="text-3xl md:text-4xl opacity-20">🎴</span>
        </div>
      </div>
    );
  }

  const isSpell = card.cardType === 'spell';
  const badgeClass = "font-extrabold text-[8px] px-[3px] py-[1px] rounded-[4px] border";

  return (
    <div 
      onClick={playable ? onClick : undefined}
      className={`
        relative w-24 h-36 md:w-32 md:h-44 rounded-lg border-2 flex flex-col items-center p-1 shadow-lg transition-all duration-200 shrink-0
        ${playable ? 'cursor-pointer hover:-translate-y-6 hover:shadow-xl hover:z-20 z-10' : 'cursor-not-allowed opacity-80 grayscale-[0.3]'}
        ${isSelected ? 'ring-4 ring-blue-400 -translate-y-6 z-20 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : ''}
        ${isSpell ? 'bg-[#f0e6d2] border-purple-900 rounded-t-3xl' : 'bg-[#e3dac9] border-stone-700'}
      `}
    >
      {/* Spell Indicator */}
      {isSpell && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-purple-900 bg-purple-200 px-2 rounded-full border border-purple-900 z-30">
          SPELL
        </div>
      )}

      {/* Mana Cost */}
      <div className="absolute -top-2 -left-2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center font-bold text-sm md:text-lg z-20 shadow-sm">
        {card.cost}
      </div>

      {/* Art */}
      <div className={`w-full h-16 md:h-20 bg-stone-300 border border-stone-400 flex items-center justify-center text-4xl md:text-5xl mb-1 relative overflow-hidden ${isSpell ? 'rounded-full mt-2' : 'rounded'}`}>
        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
        {card.emoji}
      </div>

      {/* Name */}
      <div className="text-center font-bold text-xs md:text-sm leading-tight text-stone-900 mb-1 line-clamp-2 h-8 flex items-center justify-center w-full px-1">
        {card.name}
      </div>

      {/* Description */}
      <div className="text-[9px] md:text-[10px] text-center leading-3 text-stone-700 handwritten px-1 flex-grow flex items-center justify-center w-full">
        <div className="w-full">
          {card.description}
          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {card.taunt && <span className={`${badgeClass} bg-stone-800 text-white border-stone-500`}>TAUNT</span>}
            {card.mechanics?.includes('cleave') && <span className={`${badgeClass} bg-orange-100 text-orange-900 border-orange-300`}>CLEAVE</span>}
            {card.mechanics?.includes('auto_attack') && <span className={`${badgeClass} bg-purple-100 text-purple-900 border-purple-300`}>AUTO</span>}
            {card.mechanics?.includes('battlecry_damage') && <span className={`${badgeClass} bg-blue-100 text-blue-900 border-blue-300`}>CRY</span>}
            {card.mechanics?.includes('summon_random') && <span className={`${badgeClass} bg-green-100 text-green-900 border-green-300`}>SPAWN</span>}
            {card.mechanics?.includes('charge') && <span className={`${badgeClass} bg-yellow-100 text-yellow-900 border-yellow-300`}>FAST</span>}
            {card.mechanics?.includes('divine_shield') && <span className={`${badgeClass} bg-yellow-50 text-yellow-600 border-yellow-400`}>SHIELD</span>}
            {card.mechanics?.includes('lifesteal') && <span className={`${badgeClass} bg-pink-100 text-pink-900 border-pink-300`}>LIFE</span>}
          </div>
        </div>
      </div>

      {/* Stats (Minion Only) */}
      {!isSpell && (
        <div className="w-full flex justify-between mt-auto px-1 pb-1 relative">
           {/* Attack */}
          <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-white font-bold text-sm md:text-md shadow-sm">
            {card.attack}
          </div>
          {/* Health */}
          <div className="w-6 h-6 md:w-7 md:h-7 bg-green-600 rounded-full border-2 border-black flex items-center justify-center text-white font-bold text-sm md:text-md shadow-sm">
            {card.health}
          </div>
        </div>
      )}
      
      {/* Stains overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_30%_20%,_#8b4513_0%,_transparent_20%)]"></div>
    </div>
  );
};