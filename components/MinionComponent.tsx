import React, { useEffect, useState } from 'react';
import { Minion } from '../types';
import { MECHANIC_DESCRIPTIONS } from '../constants';

interface MinionProps {
  minion: Minion;
  canAttack: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  isValidTarget?: boolean;
  attackDirection?: 'up' | 'down' | null;
  recentDamage?: number | null;
}

export const MinionComponent: React.FC<MinionProps> = ({ 
  minion, 
  canAttack, 
  onClick, 
  isSelected, 
  isValidTarget,
  attackDirection,
  recentDamage
}) => {
  const [showDamage, setShowDamage] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (recentDamage) {
      setShowDamage(recentDamage);
      const timer = setTimeout(() => setShowDamage(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentDamage]);

  const mechanics = [
    ...(minion.taunt ? ['taunt'] : []),
    ...(minion.mechanics || [])
  ];

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`
        relative w-24 h-32 rounded-md flex flex-col items-center p-1 transition-all duration-200
        ${isSelected ? 'ring-4 ring-blue-500 -translate-y-2 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20' : ''}
        ${isValidTarget ? 'ring-4 ring-red-500 cursor-crosshair scale-105 z-20' : ''}
        ${!isValidTarget && !isSelected && onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${minion.taunt ? 'taunt-border bg-stone-300 taunt-shield' : 'border-2 border-stone-600 bg-[#e3dac9]'}
        ${attackDirection === 'up' ? 'attack-up' : ''}
        ${attackDirection === 'down' ? 'attack-down' : ''}
        ${minion.isDead ? 'death-anim' : ''}
        shadow-md
      `}
    >
      {/* Tooltip */}
      {showTooltip && mechanics.length > 0 && (
        <div className="absolute -right-[150%] top-0 w-40 bg-stone-900/95 text-stone-100 text-[10px] p-2 rounded border border-stone-500 z-50 pointer-events-none shadow-xl backdrop-blur-sm text-left">
           {mechanics.map(m => (
             <div key={m} className="mb-2 last:mb-0">
               <span className="font-bold text-yellow-500 uppercase block text-[9px] mb-0.5">{m.replace('_', ' ')}</span>
               <span className="text-stone-300 leading-tight">{MECHANIC_DESCRIPTIONS[m] || 'Special effect.'}</span>
             </div>
           ))}
        </div>
      )}

      {/* Divine Shield Overlay */}
      {minion.hasShield && (
        <div className="absolute -inset-2 rounded-lg border-4 border-yellow-400 opacity-60 bg-yellow-100/20 pointer-events-none animate-pulse z-10 box-content shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      )}

      {/* Damage Text Overlay */}
      {showDamage !== null && (
        <div className="damage-text z-50">
           {showDamage === 0 ? 'BLOCKED' : `-${showDamage}`}
        </div>
      )}

      {/* Sleeping Zzz */}
      {!minion.canAttack && !minion.justPlayed && !minion.mechanics?.includes('cant_attack') && !minion.isDead && (
         <div className="absolute -top-4 right-0 text-xl animate-bounce z-20">💤</div>
      )}

      {/* Charge Icon */}
      {minion.mechanics?.includes('charge') && (
        <div className="absolute -top-2 left-0 text-lg z-20 drop-shadow-md" title="Charge">⚡</div>
      )}
      
      {/* Art */}
      <div className="w-full h-16 bg-stone-300 rounded border border-stone-400 flex items-center justify-center text-4xl mb-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-orange-900/10 pointer-events-none"></div>
         {minion.emoji}
      </div>

      <div className="text-center font-bold text-xs leading-none text-stone-900 mb-1 w-full truncate px-1">
        {minion.name}
      </div>

      <div className="w-full flex justify-between mt-auto px-1 pb-1 relative z-10">
         {/* Attack */}
        <div className={`w-6 h-6 rounded-full border border-black flex items-center justify-center text-white font-bold text-sm shadow-sm ${canAttack ? 'bg-blue-600 animate-pulse' : 'bg-blue-400'}`}>
          {minion.attack}
        </div>
        {/* Health */}
        <div className={`w-6 h-6 rounded-full border border-black flex items-center justify-center text-white font-bold text-sm shadow-sm ${minion.currentHealth < minion.health ? 'bg-red-600' : 'bg-green-600'}`}>
          {minion.currentHealth}
        </div>
      </div>
      
      {/* Lifesteal Indicator */}
      {minion.mechanics?.includes('lifesteal') && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-pink-600 font-bold z-10 drop-shadow-sm">
           ❤️
        </div>
      )}
    </div>
  );
};