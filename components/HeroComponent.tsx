import React, { useEffect, useState } from 'react';
import { Player, Banter } from '../types';

interface HeroProps {
  player: Player;
  isCurrentTurn: boolean;
  isValidTarget?: boolean;
  onClick?: () => void;
  onHeroPowerClick?: () => void;
  onEmoteClick?: (type: 'hello' | 'threaten') => void; // New
  avatarEmoji: string;
  recentDamage?: number | null;
  attackDirection?: 'up' | 'down' | null;
  alignment: 'left' | 'right';
  activeBanter?: Banter | null;
}

export const HeroComponent: React.FC<HeroProps> = ({ 
  player, 
  isCurrentTurn, 
  isValidTarget, 
  onClick, 
  onHeroPowerClick,
  onEmoteClick,
  avatarEmoji,
  recentDamage,
  attackDirection,
  alignment,
  activeBanter
}) => {
  const [showDamage, setShowDamage] = useState<number | null>(null);

  useEffect(() => {
    if (recentDamage) {
      setShowDamage(recentDamage);
      const timer = setTimeout(() => setShowDamage(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentDamage]);

  // Hero Power Configuration
  const isPlayer = player.id === 'player';
  const powerName = isPlayer ? "Chug" : "Rent Hike";
  const powerDesc = isPlayer ? "Restore 2 Health." : "Deal 1 damage to a random enemy.";
  const powerIcon = isPlayer ? "🍺" : "💸";
  const powerCost = 2;
  const canUsePower = isCurrentTurn && !player.heroPowerUsed && player.mana >= powerCost;

  return (
    <div className={`flex items-center gap-4 relative ${alignment === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Banter Speech Bubble */}
      {activeBanter && activeBanter.speaker === player.id && (
          <div className={`
            absolute top-0 ${alignment === 'right' ? 'right-full mr-4' : 'left-full ml-4'} 
            z-50 w-48 speech-bubble ${alignment === 'right' ? 'speech-bubble-right' : ''} 
            p-3 shadow-xl flex items-center justify-center
          `}>
             <p className="font-bold text-sm leading-tight text-center handwritten">{activeBanter.text}</p>
          </div>
      )}

      {/* 1. Hero Avatar Container */}
      <div className="relative">
        <div 
          onClick={isValidTarget ? onClick : undefined}
          className={`
            relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 flex flex-col items-center justify-center
            transition-all duration-300 bg-stone-200 z-10
            ${isCurrentTurn ? 'shadow-[0_0_25px_rgba(234,179,8,0.6)] border-yellow-500 scale-105' : 'border-stone-600 grayscale-[0.3]'}
            ${isValidTarget ? 'ring-4 ring-red-600 cursor-crosshair hover:bg-red-100 animate-pulse' : ''}
            ${attackDirection === 'up' ? 'attack-up' : ''}
            ${attackDirection === 'down' ? 'attack-down' : ''}
            ${player.isImmune ? 'ring-4 ring-yellow-300 shadow-[0_0_20px_gold]' : ''}
          `}
        >
          {/* Immune Text */}
          {player.isImmune && (
             <div className="absolute -top-4 bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 rounded-full border border-black z-50">IMMUNE</div>
          )}

          {/* Damage Float Text */}
          {showDamage && (
            <div className="damage-text z-50">
               {showDamage > 0 ? `-${Math.abs(showDamage)}` : `+${Math.abs(showDamage)}`}
            </div>
          )}

          {/* Emoji Avatar */}
          <div className="text-6xl md:text-7xl mb-1 filter drop-shadow-md select-none">{avatarEmoji}</div>
          
          {/* Health Badge */}
          <div className="absolute -bottom-3 -right-2 bg-red-600 text-white w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-stone-200 shadow-lg flex items-center justify-center font-black text-lg md:text-xl z-20">
            {player.health}
          </div>
        </div>

        {/* Hero Power Button (Absolute relative to Avatar) */}
        <div className={`absolute top-0 ${alignment === 'right' ? '-left-6' : '-right-6'} z-30 group`}>
             <button
                onClick={isPlayer ? onHeroPowerClick : undefined}
                disabled={!canUsePower && isPlayer}
                className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg transition-all duration-200
                    ${canUsePower 
                        ? 'bg-green-600 border-green-300 hover:scale-110 cursor-pointer animate-pulse' 
                        : 'bg-stone-700 border-stone-500 opacity-80 cursor-not-allowed grayscale'
                    }
                    ${player.heroPowerUsed ? 'opacity-40' : ''}
                `}
             >
                {powerIcon}
             </button>
             
             {/* Cost Badge */}
             <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-black shadow-sm">
                {powerCost}
             </div>

             {/* Tooltip */}
             <div className={`
                absolute top-1/2 ${alignment === 'right' ? 'right-full mr-2' : 'left-full ml-2'} transform -translate-y-1/2 
                w-32 bg-black/90 text-white text-xs p-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50
             `}>
                <div className="font-bold text-yellow-500 mb-1">{powerName}</div>
                <div className="text-[10px] leading-tight text-stone-300">{powerDesc}</div>
                <div className="mt-1 font-mono text-blue-400">Cost: {powerCost} Beer</div>
             </div>
        </div>

        {/* Secrets (Blue Tarp Specials) */}
        {player.activeSecrets.length > 0 && (
             <div className={`absolute -top-2 ${alignment === 'right' ? '-right-2' : '-left-2'} z-40 group cursor-help`}>
                <div className="w-8 h-8 rounded-full blue-tarp border-2 border-white flex items-center justify-center text-xs shadow-lg animate-bounce">
                    ?
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 bg-blue-900 text-white text-[10px] p-1 rounded text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {player.activeSecrets.length} Secret{player.activeSecrets.length > 1 ? 's' : ''} in play
                </div>
             </div>
        )}
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

        {/* Emotes (Player Only) */}
        {isPlayer && onEmoteClick && (
            <div className="flex gap-2">
                <button onClick={() => onEmoteClick('hello')} className="bg-stone-200 hover:bg-white text-xs px-2 py-1 rounded border border-stone-400 shadow-sm active:scale-95">👋</button>
                <button onClick={() => onEmoteClick('threaten')} className="bg-stone-200 hover:bg-white text-xs px-2 py-1 rounded border border-stone-400 shadow-sm active:scale-95">🤬</button>
            </div>
        )}

      </div>
    </div>
  );
};