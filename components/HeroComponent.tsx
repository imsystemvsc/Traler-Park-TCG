import React, { useEffect, useState } from 'react';
import { Player } from '../types';

interface HeroProps {
  player: Player;
  isCurrentTurn: boolean;
  isValidTarget?: boolean;
  onClick?: () => void;
  avatarEmoji: string;
  recentDamage?: number | null;
  attackDirection?: 'up' | 'down' | null;
  alignment: 'left' | 'right'; // New prop to control layout direction
}

export const HeroComponent: React.FC<HeroProps> = ({ 
  player, 
  isCurrentTurn, 
  isValidTarget, 
  onClick, 
  avatarEmoji,
  recentDamage,
  attackDirection,
  alignment
}) => {
  const [showDamage, setShowDamage] = useState<number | null>(null);

  useEffect(() => {
    if (recentDamage) {
      setShowDamage(recentDamage);
      const timer = setTimeout(() => setShowDamage(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentDamage]);

  return (
    <div className={`flex items-center gap-4 ${alignment === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* 1. Hero Avatar Container */}
      <div 
        onClick={isValidTarget ? onClick : undefined}
        className={`
          relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 flex flex-col items-center justify-center
          transition-all duration-300 bg-stone-200 z-10
          ${isCurrentTurn ? 'shadow-[0_0_25px_rgba(234,179,8,0.6)] border-yellow-500 scale-105' : 'border-stone-600 grayscale-[0.3]'}
          ${isValidTarget ? 'ring-4 ring-red-600 cursor-crosshair hover:bg-red-100 animate-pulse' : ''}
          ${attackDirection === 'up' ? 'attack-up' : ''}
          ${attackDirection === 'down' ? 'attack-down' : ''}
        `}
      >
        {/* Damage Float Text */}
        {showDamage && (
          <div className="damage-text z-50">
             {showDamage > 0 ? `-${Math.abs(showDamage)}` : `+${Math.abs(showDamage)}`}
          </div>
        )}

        {/* Emoji Avatar */}
        <div className="text-6xl md:text-7xl mb-1 filter drop-shadow-md select-none">{avatarEmoji}</div>
        
        {/* Health Badge - Positioned cleanly outside overlapping areas */}
        <div className="absolute -bottom-3 -right-2 bg-red-600 text-white w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-stone-200 shadow-lg flex items-center justify-center font-black text-lg md:text-xl z-20">
          {player.health}
        </div>
      </div>

      {/* 2. Info & Resources Column */}
      <div className={`flex flex-col ${alignment === 'right' ? 'items-end' : 'items-start'} space-y-2`}>
        
        {/* Name Badge */}
        <div className="bg-stone-800 text-stone-100 px-4 py-1.5 rounded-lg border-2 border-stone-600 shadow-md transform skew-x-[-10deg]">
           <span className="block font-bold text-sm md:text-base tracking-wider uppercase transform skew-x-[10deg]">
             {player.name}
           </span>
        </div>

        {/* Mana (Beer) Cooler */}
        <div className="bg-blue-900/40 p-2 rounded-xl border-2 border-blue-900/50 backdrop-blur-sm shadow-inner">
           <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-black text-blue-900 bg-blue-200 px-1 rounded uppercase">Stash</span>
              <span className="text-xs font-bold text-white drop-shadow-md">{player.mana} / {player.maxMana}</span>
           </div>
           
           {/* Beer Can Visualization */}
           <div className="flex gap-1 h-6">
              {Array.from({ length: 10 }).map((_, i) => (
                 <div 
                   key={i}
                   className={`
                      w-2 md:w-3 h-full rounded-sm border border-black/30 transition-all duration-300
                      ${i < player.mana 
                        ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]' // Full
                        : i < player.maxMana 
                           ? 'bg-stone-600/50' // Empty but unlocked
                           : 'bg-black/20' // Locked
                      }
                   `}
                 />
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};