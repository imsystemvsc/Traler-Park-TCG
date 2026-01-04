import React from 'react';
import { CARD_DATABASE } from '../constants';
import { CardComponent } from './CardComponent';
import { Card } from '../types';

interface CardGalleryProps {
  onClose: () => void;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ onClose }) => {
  // Convert template database items to full Card objects for the component
  const allCards = CARD_DATABASE.map((c, i) => ({
    ...c,
    id: `gallery-${i}`,
  })) as Card[];

  const minions = allCards.filter(c => c.cardType === 'minion');
  const spells = allCards.filter(c => c.cardType === 'spell');
  const locations = allCards.filter(c => c.cardType === 'location');
  const secrets = allCards.filter(c => c.cardType === 'secret');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-stone-800 rounded-xl border-4 border-stone-600 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-stone-900 border-b-4 border-stone-700">
          <h2 className="text-3xl md:text-4xl text-yellow-500 font-black tracking-widest uppercase shadow-black drop-shadow-md">
            The Stash (Card Collection)
          </h2>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg border-2 border-red-800 transition-colors uppercase"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-800/50">
          
          {/* Minions Section */}
          <div className="mb-12">
            <h3 className="text-2xl text-stone-300 font-bold mb-6 border-b border-stone-600 pb-2 flex items-center gap-2">
              <span>🧟</span> Minions
            </h3>
            <div className="flex flex-wrap gap-8 justify-center">
              {minions.map(card => (
                <div key={card.id} className="transform hover:scale-110 transition-transform duration-200">
                   <CardComponent card={card} playable={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Locations Section */}
          <div className="mb-12">
            <h3 className="text-2xl text-blue-300 font-bold mb-6 border-b border-stone-600 pb-2 flex items-center gap-2">
              <span>🏘️</span> Locations
            </h3>
            <div className="flex flex-wrap gap-8 justify-center">
              {locations.map(card => (
                <div key={card.id} className="transform hover:scale-110 transition-transform duration-200">
                   <CardComponent card={card} playable={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Secrets Section */}
          <div className="mb-12">
            <h3 className="text-2xl text-blue-500 font-bold mb-6 border-b border-stone-600 pb-2 flex items-center gap-2">
              <span>🤐</span> Blue Tarp Specials (Secrets)
            </h3>
            <div className="flex flex-wrap gap-8 justify-center">
              {secrets.map(card => (
                <div key={card.id} className="transform hover:scale-110 transition-transform duration-200">
                   <CardComponent card={card} playable={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Spells Section */}
          <div className="mb-12">
            <h3 className="text-2xl text-purple-300 font-bold mb-6 border-b border-stone-600 pb-2 flex items-center gap-2">
              <span>🔮</span> Spells
            </h3>
            <div className="flex flex-wrap gap-8 justify-center">
              {spells.map(card => (
                 <div key={card.id} className="transform hover:scale-110 transition-transform duration-200">
                    <CardComponent card={card} playable={false} />
                 </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t-4 border-stone-700 text-center text-stone-500 text-sm font-mono">
           Total Cards: {allCards.length}
        </div>
      </div>
    </div>
  );
};