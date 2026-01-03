import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameState, Minion, Player } from './types';
import { CARD_DATABASE, generateDeck, INITIAL_HAND_SIZE, MAX_MANA_CAP, STARTING_HEALTH } from './constants';
import { CardComponent } from './components/CardComponent';
import { MinionComponent } from './components/MinionComponent';
import { HeroComponent } from './components/HeroComponent';
import { CardGallery } from './components/CardGallery';
import { playSound } from './utils/sound';

// --- Initialization Logic ---
const initializeGame = (): GameState => {
  const playerDeck = generateDeck(25);
  const enemyDeck = generateDeck(25);
  
  const playerHand = playerDeck.splice(0, INITIAL_HAND_SIZE);
  const enemyHand = enemyDeck.splice(0, INITIAL_HAND_SIZE);

  return {
    player: {
      id: 'player',
      name: 'The Tenant',
      health: STARTING_HEALTH,
      maxHealth: STARTING_HEALTH,
      mana: 1,
      maxMana: 1,
      hand: playerHand,
      board: [],
      deck: playerDeck
    },
    enemy: {
      id: 'enemy',
      name: 'The Landlord',
      health: STARTING_HEALTH,
      maxHealth: STARTING_HEALTH,
      mana: 1,
      maxMana: 1,
      hand: enemyHand,
      board: [],
      deck: enemyDeck
    },
    turn: 'player',
    turnNumber: 1,
    gameOver: false,
    winner: null,
    logs: ['Game Started! Fight for your trailer!']
  };
};

const markDead = (m: Minion): Minion => {
  if (m.currentHealth <= 0 && !m.isDead) {
    return { ...m, isDead: true };
  }
  return m;
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [showGallery, setShowGallery] = useState(false);
  
  // Interaction State
  const [selectedMinionId, setSelectedMinionId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Animation State
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [attackDirection, setAttackDirection] = useState<'up' | 'down' | null>(null);
  const [damageEvents, setDamageEvents] = useState<Record<string, number>>({});

  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // --- Helpers ---
  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const triggerDamage = (id: string, amount: number) => {
    setDamageEvents(prev => ({ ...prev, [id]: amount + (Math.random() * 0.00001) }));
    playSound('damage');
  };

  const triggerHeal = (id: string, amount: number) => {
    setDamageEvents(prev => ({ ...prev, [id]: -amount + (Math.random() * 0.00001) }));
    playSound('heal');
  };

  const resetGame = () => {
    setGameState(initializeGame());
    setSelectedMinionId(null);
    setSelectedCardId(null);
    setAttackingId(null);
    setDamageEvents({});
    playSound('click');
  };

  // --- Effect to cleanup Dead Minions after animation ---
  useEffect(() => {
    const playerDead = gameState.player.board.some(m => m.isDead);
    const enemyDead = gameState.enemy.board.some(m => m.isDead);

    if (playerDead || enemyDead) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          // Log deaths
          const newLogs = [...prev.logs];
          prev.player.board.filter(m => m.isDead).forEach(m => newLogs.push(`${m.name} was destroyed.`));
          prev.enemy.board.filter(m => m.isDead).forEach(m => newLogs.push(`${m.name} was destroyed.`));

          return {
            ...prev,
            player: { ...prev.player, board: prev.player.board.filter(m => !m.isDead) },
            enemy: { ...prev.enemy, board: prev.enemy.board.filter(m => !m.isDead) },
            logs: newLogs
          };
        });
      }, 600); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [gameState.player.board, gameState.enemy.board]);


  const checkWinCondition = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver) return prev;
      if (prev.player.health <= 0) {
          playSound('lose');
          return { ...prev, gameOver: true, winner: 'enemy', logs: [...prev.logs, "Evicted! GAME OVER."] };
      }
      if (prev.enemy.health <= 0) {
          playSound('win');
          return { ...prev, gameOver: true, winner: 'player', logs: [...prev.logs, "You defended your trailer! YOU WIN!"] };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    checkWinCondition();
  }, [gameState.player.health, gameState.enemy.health, checkWinCondition]);

  // --- Player Interaction Logic ---

  // 1. Click Card in Hand
  const handleCardClick = (card: Card) => {
    if (gameState.turn !== 'player' || attackingId) return;

    if (selectedCardId === card.id) {
        setSelectedCardId(null);
        return;
    }

    if (gameState.player.mana < card.cost) {
        addLog("Not enough Beer!");
        return;
    }

    // Minion Logic
    if (card.cardType === 'minion') {
        if (gameState.player.board.length >= 7) {
            addLog("Board is full!");
            return;
        }
        playMinion(card);
    } 
    // Spell Logic
    else if (card.cardType === 'spell') {
        if (card.requiresTarget) {
            setSelectedCardId(card.id);
            playSound('click');
            addLog(`Select a target for ${card.name}...`);
        } else {
            castGlobalSpell(card);
        }
    }
  };

  const playMinion = (card: Card) => {
    playSound('play');
    setGameState(prev => {
        let newPlayer = { ...prev.player };
        let newEnemy = { ...prev.enemy };
        const logs = [...prev.logs, `You played ${card.name}.`];

        const newHand = newPlayer.hand.filter(c => c.id !== card.id);
        const newMinion: Minion = {
            ...card as Minion,
            currentHealth: card.health || 1,
            attack: card.attack || 0,
            canAttack: !!card.mechanics?.includes('charge'), // Charge logic
            justPlayed: true,
            hasShield: card.mechanics?.includes('divine_shield')
        };

        // Battlecry Logic
        if (card.mechanics?.includes('battlecry_damage')) {
            const damage = card.mechanicValue || 1;
            const targets = [
                ...newEnemy.board.filter(m => !m.isDead).map(m => ({type: 'minion', id: m.id})),
                {type: 'hero', id: 'enemy-hero'}
            ];
            const target = targets[Math.floor(Math.random() * targets.length)];
            
            if (target.type === 'hero') {
                newEnemy.health -= damage;
                triggerDamage('enemy-hero', damage);
                logs.push(`${card.name} threw a brick at Landlord!`);
            } else {
                const minionIdx = newEnemy.board.findIndex(m => m.id === target.id);
                if (minionIdx !== -1) {
                    // Handle Divine Shield logic for battlecry (simplified)
                    const m = newEnemy.board[minionIdx];
                    if (m.hasShield) {
                        newEnemy.board[minionIdx].hasShield = false;
                        triggerDamage(m.id, 0); // Visual block
                        logs.push(`${m.name} blocked the damage!`);
                    } else {
                        newEnemy.board[minionIdx].currentHealth -= damage;
                        triggerDamage(target.id, damage);
                    }
                }
            }
        }

        newPlayer.mana -= card.cost;
        newPlayer.hand = newHand;
        newPlayer.board = [...newPlayer.board, newMinion];

        // Clean dead minions from battlecry
        newEnemy.board = newEnemy.board.map(markDead);

        return {
            ...prev,
            player: newPlayer,
            enemy: newEnemy,
            logs
        };
    });
    setSelectedCardId(null);
  };

  const castGlobalSpell = (card: Card) => {
      playSound('play');
      setGameState(prev => {
          let newPlayer = { ...prev.player };
          let newEnemy = { ...prev.enemy };
          const logs = [...prev.logs, `Cast ${card.name}.`];

          if (card.spellEffect === 'draw') {
              const drawCount = card.spellValue || 1;
              const drawn = newPlayer.deck.slice(0, drawCount);
              newPlayer.deck = newPlayer.deck.slice(drawCount);
              newPlayer.hand = [...newPlayer.hand, ...drawn].slice(0, 10);
              logs.push(`Drew ${drawn.length} cards.`);
              playSound('draw');
          } else if (card.spellEffect === 'gain_mana') {
              const amount = card.spellValue || 0;
              newPlayer.mana = Math.min(newPlayer.mana + amount, MAX_MANA_CAP);
              logs.push(`Gained ${amount} Beer.`);
              playSound('heal'); // Reuse heal sound for mana gain
          } else if (card.spellEffect === 'aoe_damage') {
              const dmg = card.spellValue || 1;
              // Damage both boards - Divine Shield Logic
              newPlayer.board.forEach((m, i) => {
                  if (m.isDead) return;
                  if (m.hasShield) {
                      newPlayer.board[i].hasShield = false;
                      triggerDamage(m.id, 0);
                  } else {
                      m.currentHealth -= dmg;
                      triggerDamage(m.id, dmg);
                  }
              });
              newEnemy.board.forEach((m, i) => {
                  if (m.isDead) return;
                  if (m.hasShield) {
                      newEnemy.board[i].hasShield = false;
                      triggerDamage(m.id, 0);
                  } else {
                      m.currentHealth -= dmg;
                      triggerDamage(m.id, dmg);
                  }
              });
              logs.push(`Gas leak! Everyone took ${dmg} damage.`);
              
              // Cleanup
              newPlayer.board = newPlayer.board.map(markDead);
              newEnemy.board = newEnemy.board.map(markDead);
          }

          newPlayer.mana -= card.cost;
          newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);

          return { ...prev, player: newPlayer, enemy: newEnemy, logs };
      });
      setSelectedCardId(null);
  };

  const resolveTargetedSpell = (targetId: string, targetType: 'player-hero' | 'enemy-hero' | 'player-minion' | 'enemy-minion') => {
      const card = gameState.player.hand.find(c => c.id === selectedCardId);
      if (!card) return;
      
      playSound('play'); // Cast sound

      setGameState(prev => {
          let newPlayer = { ...prev.player };
          let newEnemy = { ...prev.enemy };
          const logs = [...prev.logs];
          
          let targetName = '';
          const getTargetMinion = (id: string, isEnemy: boolean) => {
              const board = isEnemy ? newEnemy.board : newPlayer.board;
              const idx = board.findIndex(m => m.id === id);
              return { minion: board[idx], idx, board };
          };

          if (card.spellEffect === 'damage') {
              const dmg = card.spellValue || 0;
              if (targetType === 'player-hero') {
                  newPlayer.health -= dmg;
                  targetName = 'Yourself';
                  triggerDamage('player-hero', dmg);
              } else if (targetType === 'enemy-hero') {
                  newEnemy.health -= dmg;
                  targetName = 'Landlord';
                  triggerDamage('enemy-hero', dmg);
              } else {
                  const isEnemy = targetType === 'enemy-minion';
                  const { minion, idx, board } = getTargetMinion(targetId, isEnemy);
                  if (idx !== -1) {
                      if (minion.hasShield) {
                          board[idx].hasShield = false;
                          triggerDamage(minion.id, 0);
                          logs.push(`${minion.name} blocked the spell!`);
                      } else {
                          board[idx] = { ...minion, currentHealth: minion.currentHealth - dmg };
                          triggerDamage(minion.id, dmg);
                      }
                      targetName = minion.name;
                  }
              }
              if (!targetName.includes('blocked')) logs.push(`${card.name} dealt ${dmg} to ${targetName}.`);
          } else if (card.spellEffect === 'heal') {
              const heal = card.spellValue || 0;
              if (targetType === 'player-hero') {
                  newPlayer.health = Math.min(newPlayer.health + heal, newPlayer.maxHealth);
                  targetName = 'Yourself';
                  triggerHeal('player-hero', heal);
              } else if (targetType === 'enemy-hero') {
                  newEnemy.health = Math.min(newEnemy.health + heal, newEnemy.maxHealth);
                  targetName = 'Landlord';
                  triggerHeal('enemy-hero', heal);
              } else {
                   const isEnemy = targetType === 'enemy-minion';
                   const { minion, idx, board } = getTargetMinion(targetId, isEnemy);
                   if (idx !== -1 && !minion.isDead) {
                       board[idx] = { ...minion, currentHealth: Math.min(minion.currentHealth + heal, minion.health) };
                       targetName = minion.name;
                       triggerHeal(minion.id, heal);
                   }
              }
              logs.push(`${card.name} healed ${targetName} for ${heal}.`);
          } else if (card.spellEffect === 'buff') {
              const buff = card.spellValue || 0;
              if (targetType.includes('hero')) {
                  logs.push("Can't buff a hero!");
                  return prev;
              }
              const isEnemy = targetType === 'enemy-minion';
              const { minion, idx, board } = getTargetMinion(targetId, isEnemy);
              if (idx !== -1 && !minion.isDead) {
                  board[idx] = { 
                      ...minion, 
                      attack: minion.attack + buff, 
                      health: minion.health + buff,
                      currentHealth: minion.currentHealth + buff 
                    };
                  targetName = minion.name;
                  triggerHeal(minion.id, buff); // Buff sound
              }
              logs.push(`${card.name} buffed ${targetName}.`);
          } else if (card.spellEffect === 'destroy') {
              if (targetType.includes('hero')) {
                  logs.push("Can't repo a person!");
                  return prev;
              }
              const isEnemy = targetType === 'enemy-minion';
              const { minion, idx, board } = getTargetMinion(targetId, isEnemy);
              if (idx !== -1) {
                  board[idx] = { ...minion, currentHealth: 0 }; // Kill it
                  targetName = minion.name;
                  triggerDamage(minion.id, 999);
              }
              logs.push(`${card.name} repossessed ${targetName}.`);
          }

          newPlayer.board = newPlayer.board.map(markDead);
          newEnemy.board = newEnemy.board.map(markDead);

          newPlayer.mana -= card.cost;
          newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);

          return { ...prev, player: newPlayer, enemy: newEnemy, logs };
      });
      setSelectedCardId(null);
  };

  const handleMinionSelect = (minion: Minion) => {
    if (gameState.turn !== 'player' || attackingId) return;
    
    if (minion.isDead) return;

    if (selectedCardId) {
        resolveTargetedSpell(minion.id, 'player-minion');
        return;
    }

    if (minion.mechanics?.includes('cant_attack')) {
        addLog(`${minion.name} cannot attack manually.`);
        return;
    }

    if (selectedMinionId === minion.id) {
      setSelectedMinionId(null);
      return;
    }

    if (minion.canAttack) {
      setSelectedMinionId(minion.id);
      playSound('click');
      addLog(`Selected ${minion.name} to attack.`);
    } else {
      addLog(`${minion.name} is sleeping.`);
    }
  };

  const handleTargetClick = (targetType: 'enemy-hero' | 'enemy-minion', targetId?: string) => {
    if (gameState.turn !== 'player' || attackingId) return;

    if (selectedCardId) {
        resolveTargetedSpell(targetId || 'enemy-hero', targetType);
        return;
    }

    if (selectedMinionId) {
        executeAttack(targetType, targetId);
        return;
    }
  };

  const executeAttack = async (targetType: 'enemy-hero' | 'enemy-minion', targetId?: string) => {
    const attacker = gameState.player.board.find(m => m.id === selectedMinionId);
    if (!attacker) return;
    if (attacker.isDead) return;

    const enemyMinions = gameState.enemy.board.filter(m => !m.isDead);
    const hasTaunt = enemyMinions.some(m => m.taunt);
    if (hasTaunt) {
        if (targetType === 'enemy-hero') {
            addLog("Must attack Taunt minion!");
            return;
        }
        if (targetType === 'enemy-minion') {
            const target = enemyMinions.find(m => m.id === targetId);
            if (target && !target.taunt) {
                addLog("Must attack Taunt minion!");
                return;
            }
        }
    }

    playSound('attack');
    setAttackingId(attacker.id);
    setAttackDirection('up');
    await new Promise(r => setTimeout(r, 200));

    setGameState(prev => {
        let newPlayerBoard = [...prev.player.board];
        let newEnemyBoard = [...prev.enemy.board];
        let logs = [...prev.logs];
        let newEnemyHealth = prev.enemy.health;
        let newPlayerHealth = prev.player.health; // For Lifesteal update

        const attIdx = newPlayerBoard.findIndex(m => m.id === attacker.id);
        if (attIdx === -1) return prev;
        
        const myAttacker = newPlayerBoard[attIdx];
        newPlayerBoard[attIdx] = { ...myAttacker, canAttack: false };

        let actualDamageDealt = 0;

        if (targetType === 'enemy-hero') {
            newEnemyHealth -= myAttacker.attack;
            triggerDamage('enemy-hero', myAttacker.attack);
            actualDamageDealt = myAttacker.attack;
            logs.push(`${myAttacker.name} hit Landlord for ${myAttacker.attack}!`);
        } else if (targetType === 'enemy-minion' && targetId) {
            const defIdx = newEnemyBoard.findIndex(m => m.id === targetId);
            if (defIdx !== -1) {
                const defender = newEnemyBoard[defIdx];
                
                // Attack logic with Divine Shield
                if (defender.hasShield) {
                    newEnemyBoard[defIdx].hasShield = false;
                    triggerDamage(defender.id, 0);
                    actualDamageDealt = 0;
                    logs.push(`${defender.name} blocked the attack!`);
                } else {
                    newEnemyBoard[defIdx] = { ...defender, currentHealth: defender.currentHealth - myAttacker.attack };
                    triggerDamage(defender.id, myAttacker.attack);
                    actualDamageDealt = myAttacker.attack;
                }

                // Counter-attack logic (Defender hits Attacker)
                if (defender.attack > 0 && !defender.isDead) {
                     if (myAttacker.hasShield) {
                         newPlayerBoard[attIdx].hasShield = false;
                         triggerDamage(myAttacker.id, 0);
                         logs.push(`${myAttacker.name} blocked counter-attack!`);
                     } else {
                         newPlayerBoard[attIdx].currentHealth -= defender.attack;
                         triggerDamage(myAttacker.id, defender.attack);
                     }
                }
                
                logs.push(`${myAttacker.name} attacked ${defender.name}.`);

                // CLEAVE LOGIC
                if (myAttacker.mechanics?.includes('cleave')) {
                    if (defIdx > 0) {
                        const left = newEnemyBoard[defIdx - 1];
                        if (!left.isDead) {
                          newEnemyBoard[defIdx - 1] = { ...left, currentHealth: left.currentHealth - myAttacker.attack };
                          triggerDamage(left.id, myAttacker.attack);
                          logs.push(`Cleave hit ${left.name}!`);
                        }
                    }
                    if (defIdx < newEnemyBoard.length - 1) {
                        const right = newEnemyBoard[defIdx + 1];
                        if (!right.isDead) {
                          newEnemyBoard[defIdx + 1] = { ...right, currentHealth: right.currentHealth - myAttacker.attack };
                          triggerDamage(right.id, myAttacker.attack);
                          logs.push(`Cleave hit ${right.name}!`);
                        }
                    }
                }
            }
        }

        // Lifesteal Logic
        if (myAttacker.mechanics?.includes('lifesteal') && actualDamageDealt > 0) {
            newPlayerHealth = Math.min(newPlayerHealth + actualDamageDealt, prev.player.maxHealth);
            triggerHeal('player-hero', actualDamageDealt);
            logs.push(`Lifesteal healed you for ${actualDamageDealt}!`);
        }

        
        return {
            ...prev,
            player: { ...prev.player, board: newPlayerBoard.map(markDead), health: newPlayerHealth },
            enemy: { ...prev.enemy, board: newEnemyBoard.map(markDead), health: newEnemyHealth },
            logs
        };
    });

    await new Promise(r => setTimeout(r, 100));
    setAttackingId(null);
    setAttackDirection(null);
    setSelectedMinionId(null);
  };

  const endTurn = async () => {
    if (gameState.gameOver || attackingId) return;
    
    // 1. Resolve End of Turn Effects (Auto-Attack & Spawning)
    const activePlayer = gameState.turn === 'player' ? gameState.player : gameState.enemy;
    const opponent = gameState.turn === 'player' ? gameState.enemy : gameState.player;
    
    // A. Auto-Attack Logic
    const autoAttackers = activePlayer.board.filter(m => m.mechanics?.includes('auto_attack') && !m.isDead);
    if (autoAttackers.length > 0) {
        for (const m of autoAttackers) {
             addLog(`${m.name} is going wild!`);
             setAttackingId(m.id);
             setAttackDirection(gameState.turn === 'player' ? 'up' : 'down');
             playSound('attack');
             await new Promise(r => setTimeout(r, 300));

             setGameState(prev => {
                 let active = prev.turn === 'player' ? {...prev.player} : {...prev.enemy};
                 let opp = prev.turn === 'player' ? {...prev.enemy} : {...prev.player};
                 
                 const damage = m.mechanicValue || 1;
                 const targets = [...opp.board.filter(t => !t.isDead).map(t => t.id), 'hero'];
                 const targetId = targets[Math.floor(Math.random() * targets.length)];

                 if (targetId === 'hero') {
                     opp.health -= damage;
                     triggerDamage(prev.turn === 'player' ? 'enemy-hero' : 'player-hero', damage);
                 } else {
                     const idx = opp.board.findIndex(b => b.id === targetId);
                     if (idx !== -1) {
                         if (opp.board[idx].hasShield) {
                             opp.board[idx].hasShield = false;
                             triggerDamage(targetId, 0);
                         } else {
                             opp.board[idx].currentHealth -= damage;
                             triggerDamage(targetId, damage);
                         }
                     }
                 }
                 opp.board = opp.board.map(markDead);
                 return {
                     ...prev,
                     player: prev.turn === 'player' ? active : opp,
                     enemy: prev.turn === 'player' ? opp : active,
                     logs: [...prev.logs, `${m.name} dealt ${damage} random damage!`]
                 };
             });
             
             await new Promise(r => setTimeout(r, 300));
             setAttackingId(null);
             setAttackDirection(null);
        }
    }

    // B. Spawning Logic
    const spawners = activePlayer.board.filter(m => m.mechanics?.includes('summon_random') && !m.isDead);
    if (spawners.length > 0) {
       for (const m of spawners) {
           await new Promise(r => setTimeout(r, 200));
           setGameState(prev => {
               const active = prev.turn === 'player' ? {...prev.player} : {...prev.enemy};
               // Check board space
               if (active.board.length >= 7) {
                   return { ...prev, logs: [...prev.logs, `${m.name} tried to spawn, but board is full!`] };
               }
               
               // Find random minion
               const randomCard = CARD_DATABASE.filter(c => c.cardType === 'minion')[Math.floor(Math.random() * CARD_DATABASE.filter(c => c.cardType === 'minion').length)];
               const newMinion: Minion = {
                   ...randomCard as Minion,
                   id: `spawned-${Date.now()}-${Math.random()}`,
                   currentHealth: randomCard.health || 1,
                   attack: randomCard.attack || 0,
                   canAttack: false,
                   justPlayed: true,
                   hasShield: randomCard.mechanics?.includes('divine_shield')
               };
               
               active.board = [...active.board, newMinion];
               playSound('play'); // Spawn sound

               return {
                   ...prev,
                   player: prev.turn === 'player' ? active : prev.player,
                   enemy: prev.turn === 'player' ? prev.enemy : active,
                   logs: [...prev.logs, `${m.name} spawned ${newMinion.name}!`]
               };
           });
       }
    }

    playSound('turn');
    
    // 2. Pass Turn
    const nextTurn = gameState.turn === 'player' ? 'enemy' : 'player';

    setGameState(prev => {
      const isPlayerNext = nextTurn === 'player';
      const activePlayer = isPlayerNext ? prev.player : prev.enemy;
      
      const newMaxMana = Math.min(activePlayer.maxMana + 1, MAX_MANA_CAP);
      
      // Reset attack state and clean justPlayed
      const updatedPlayerBoard = prev.player.board.map(m => ({ ...m, canAttack: true, justPlayed: false }));
      const updatedEnemyBoard = prev.enemy.board.map(m => ({ ...m, canAttack: true, justPlayed: false }));
      
      let nextPlayerState = { ...prev.player, board: updatedPlayerBoard };
      let nextEnemyState = { ...prev.enemy, board: updatedEnemyBoard };

      if (isPlayerNext) {
          nextPlayerState.maxMana = newMaxMana;
          nextPlayerState.mana = newMaxMana;
           if (nextPlayerState.deck.length > 0) {
              const card = nextPlayerState.deck[0];
              nextPlayerState.deck = nextPlayerState.deck.slice(1);
              if (nextPlayerState.hand.length < 10) nextPlayerState.hand = [...nextPlayerState.hand, card];
              playSound('draw');
           }
      } else {
          nextEnemyState.maxMana = newMaxMana;
          nextEnemyState.mana = newMaxMana;
          if (nextEnemyState.deck.length > 0) {
              const card = nextEnemyState.deck[0];
              nextEnemyState.deck = nextEnemyState.deck.slice(1);
              if (nextEnemyState.hand.length < 10) nextEnemyState.hand = [...nextEnemyState.hand, card];
          }
      }

      return {
        ...prev,
        turn: nextTurn,
        turnNumber: prev.turnNumber + 1,
        player: nextPlayerState,
        enemy: nextEnemyState,
        logs: [...prev.logs, `--- ${isPlayerNext ? "Your" : "Landlord's"} Turn ---`]
      };
    });
    setSelectedMinionId(null);
    setSelectedCardId(null);
  };

  // --- AI ---
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    if (gameState.turn === 'enemy' && !gameState.gameOver) {
        const runAi = async () => {
            await new Promise(r => setTimeout(r, 1000));
            
            let playing = true;
            while (playing) {
                const current = gameStateRef.current;
                if (current.gameOver) return;
                const affordable = current.enemy.hand.filter(c => c.cost <= current.enemy.mana);
                const validCards = affordable.filter(c => c.cardType === 'minion' || (c.cardType === 'spell' && !c.requiresTarget) || c.spellEffect === 'gain_mana');

                if (validCards.length === 0 || (current.enemy.board.length >= 7 && validCards.every(c => c.cardType === 'minion'))) {
                    playing = false;
                } else {
                    const card = validCards[Math.floor(Math.random() * validCards.length)];
                    playSound('play');
                    setGameState(prev => {
                        let newEnemy = { ...prev.enemy };
                        const logs = [...prev.logs];
                        
                        if (card.cardType === 'minion') {
                            const newMinion = { 
                                ...card as Minion, 
                                currentHealth: card.health || 1, 
                                attack: card.attack || 0, 
                                canAttack: !!card.mechanics?.includes('charge'), 
                                justPlayed: true,
                                hasShield: card.mechanics?.includes('divine_shield')
                            };
                            newEnemy.board.push(newMinion);
                            logs.push(`Landlord played ${card.name}.`);
                        } else {
                            if (card.spellEffect === 'draw') {
                                const drawn = newEnemy.deck.splice(0, card.spellValue || 1);
                                newEnemy.hand.push(...drawn);
                                logs.push("Landlord cast Draw.");
                                playSound('draw');
                            } else if (card.spellEffect === 'gain_mana') {
                                newEnemy.mana += (card.spellValue || 0);
                                logs.push("Landlord gained mana.");
                            } else if (card.spellEffect === 'aoe_damage') {
                                const dmg = card.spellValue || 1;
                                // Simple AI state update for AOE
                                prev.player.board.forEach(m => triggerDamage(m.id, dmg));
                                prev.enemy.board.forEach(m => triggerDamage(m.id, dmg));
                                
                                return {
                                    ...prev,
                                    player: { ...prev.player, board: prev.player.board.map(m => ({...m, currentHealth: m.currentHealth - dmg})).map(markDead)},
                                    enemy: { 
                                        ...newEnemy, 
                                        mana: newEnemy.mana - card.cost, 
                                        hand: newEnemy.hand.filter(c => c.id !== card.id),
                                        board: newEnemy.board.map(m => ({...m, currentHealth: m.currentHealth - dmg})).map(markDead)
                                    },
                                    logs: [...logs, `Landlord cast Gas Leak!`]
                                };
                            }
                        }
                        
                        newEnemy.mana -= card.cost;
                        newEnemy.hand = newEnemy.hand.filter(c => c.id !== card.id);
                        return { ...prev, enemy: newEnemy, logs };
                    });
                    await new Promise(r => setTimeout(r, 800));
                }
            }

            // AI Attack Phase
            let attacking = true;
            while(attacking) {
                const current = gameStateRef.current;
                if (current.gameOver) return;
                const attackers = current.enemy.board.filter(m => m.canAttack && !m.mechanics?.includes('cant_attack') && !m.isDead);
                if (attackers.length === 0) { attacking = false; break; }

                const attacker = attackers[0];
                const taunts = current.player.board.filter(m => m.taunt && !m.isDead);
                let targetType = taunts.length > 0 ? 'minion' : (current.player.board.filter(m => !m.isDead).length > 0 && Math.random() > 0.5 ? 'minion' : 'hero');
                let targetId = targetType === 'minion' 
                    ? (taunts.length > 0 ? taunts[0].id : current.player.board.filter(m => !m.isDead)[Math.floor(Math.random() * current.player.board.filter(m => !m.isDead).length)].id)
                    : '';

                playSound('attack');
                setAttackingId(attacker.id);
                setAttackDirection('down');
                await new Promise(r => setTimeout(r, 200));

                setGameState(prev => {
                    let newEnemyBoard = [...prev.enemy.board];
                    let newPlayerBoard = [...prev.player.board];
                    let newPlayerHealth = prev.player.health;
                    let logs = [...prev.logs];

                    const atIdx = newEnemyBoard.findIndex(m => m.id === attacker.id);
                    if (atIdx === -1) return prev;
                    
                    const myAttacker = newEnemyBoard[atIdx];
                    newEnemyBoard[atIdx] = { ...myAttacker, canAttack: false };

                    if (targetType === 'hero') {
                        newPlayerHealth -= myAttacker.attack;
                        triggerDamage('player-hero', myAttacker.attack);
                        logs.push(`${myAttacker.name} hit YOU for ${myAttacker.attack}!`);
                    } else {
                        const defIdx = newPlayerBoard.findIndex(m => m.id === targetId);
                        if (defIdx !== -1) {
                             const def = newPlayerBoard[defIdx];
                             
                             // AI Hit Player Minion (Check Shield)
                             if (def.hasShield) {
                                 newPlayerBoard[defIdx].hasShield = false;
                                 triggerDamage(def.id, 0);
                             } else {
                                 newPlayerBoard[defIdx] = { ...def, currentHealth: def.currentHealth - myAttacker.attack };
                                 triggerDamage(def.id, myAttacker.attack);
                             }

                             // Player Counter Attack (Check AI Shield)
                             if (def.attack > 0 && !def.isDead) {
                                 if (myAttacker.hasShield) {
                                     newEnemyBoard[atIdx].hasShield = false;
                                     triggerDamage(myAttacker.id, 0);
                                 } else {
                                     newEnemyBoard[atIdx].currentHealth -= def.attack;
                                     triggerDamage(myAttacker.id, def.attack);
                                 }
                             }

                             logs.push(`${myAttacker.name} attacked ${def.name}.`);
                             
                        }
                    }

                    return {
                        ...prev,
                        player: { ...prev.player, board: newPlayerBoard.map(markDead), health: newPlayerHealth },
                        enemy: { ...prev.enemy, board: newEnemyBoard.map(markDead) },
                        logs
                    };
                });
                await new Promise(r => setTimeout(r, 300));
                setAttackingId(null);
                setAttackDirection(null);
            }

            if (!gameStateRef.current.gameOver) endTurn();
        };
        runAi();
    }
  }, [gameState.turn]);

  // --- UI Render ---
  return (
    <div className="w-full h-screen flex flex-col items-center p-2 relative bg-stone-900/5 overflow-hidden">
      
      {/* Top Bar for Tools */}
      <div className="absolute top-2 left-2 z-40">
        <button 
           onClick={() => setShowGallery(true)}
           className="bg-stone-800 text-yellow-500 border-2 border-yellow-600 px-3 py-1 rounded shadow-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-1"
        >
           <span>📖</span> Collection
        </button>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <CardGallery onClose={() => setShowGallery(false)} />
      )}

      {/* Game Over Screen */}
      {gameState.gameOver && (
          <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm overflow-hidden">
              <h1 className="text-6xl font-black text-center mb-4 text-red-600 uppercase tracking-widest animate-pulse" style={{textShadow: '0 0 10px white'}}>
                  {gameState.winner === 'player' ? 'VICTORY' : 'EVICTED'}
              </h1>

              {/* Victory Visuals */}
              {gameState.winner === 'player' ? (
                  <>
                    <div className="text-6xl animate-bounce mb-8">🎉🍺🎆</div>
                    {/* Confetti Generation */}
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div 
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}vw`,
                                top: `-${Math.random() * 20}vh`,
                                backgroundColor: ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#a855f7'][Math.floor(Math.random() * 5)],
                                animationDuration: `${2 + Math.random() * 3}s`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                  </>
              ) : (
                  /* Loss Visuals */
                  <div className="flex flex-col items-center">
                      <div className="text-9xl towing-scene mt-4 transform">
                          🚛🏠💨
                      </div>
                      <p className="text-stone-400 mt-8 italic text-xl animate-pulse">"There goes the neighborhood..."</p>
                  </div>
              )}

              <div className="flex gap-4 mt-8 z-50">
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-yellow-500 text-black font-bold text-xl rounded hover:bg-yellow-400 border-4 border-white transform hover:scale-110 transition-transform shadow-lg"
                >
                    PLAY AGAIN
                </button>
                <button 
                  onClick={() => setShowGallery(true)}
                  className="px-8 py-3 bg-stone-600 text-white font-bold text-xl rounded hover:bg-stone-500 border-4 border-stone-400 transform hover:scale-110 transition-transform shadow-lg"
                >
                    VIEW CARDS
                </button>
              </div>
          </div>
      )}

      {/* --- Top Area: Enemy --- */}
      <div className="w-full max-w-6xl flex-none flex flex-col justify-start pt-4 px-2 md:px-6">
        <div className="w-full flex justify-between items-start">
             {/* Enemy Hand */}
            <div className="flex -space-x-8 md:-space-x-12 perspective-1000 pl-4">
               {gameState.enemy.hand.map((card, i) => (
                   <div key={card.id} style={{ transform: `rotate(${(i - gameState.enemy.hand.length/2) * 2}deg)`}}>
                       <CardComponent card={card} playable={false} isEnemy={true} />
                   </div>
               ))}
            </div>
            
            {/* Enemy Hero */}
            <HeroComponent 
                player={gameState.enemy} 
                isCurrentTurn={gameState.turn === 'enemy'} 
                avatarEmoji="🕴️"
                isValidTarget={!!selectedMinionId || !!selectedCardId}
                onClick={() => handleTargetClick('enemy-hero')}
                recentDamage={damageEvents['enemy-hero'] && Math.floor(damageEvents['enemy-hero'])}
                attackDirection={null} 
                alignment="right"
            />
        </div>
      </div>
      
      {/* --- Middle Area: Board --- */}
      <div className="w-full max-w-5xl flex-grow flex flex-col justify-center gap-6 py-2">
         {/* Enemy Minions */}
         <div className="w-full flex justify-center items-center h-32 gap-3 min-h-[140px]">
            {gameState.enemy.board.map(minion => (
                <MinionComponent 
                    key={minion.id} 
                    minion={minion} 
                    canAttack={false}
                    isValidTarget={!!selectedMinionId || !!selectedCardId}
                    onClick={() => handleTargetClick('enemy-minion', minion.id)}
                    attackDirection={attackingId === minion.id ? attackDirection : null}
                    recentDamage={damageEvents[minion.id] && Math.floor(damageEvents[minion.id])}
                />
            ))}
        </div>

        {/* Divider */}
        <div className="w-full h-1 bg-stone-500/30 rounded-full"></div>

        {/* Player Minions */}
        <div className="w-full flex justify-center items-center h-32 gap-3 min-h-[140px]">
            {gameState.player.board.map(minion => (
                <MinionComponent 
                    key={minion.id} 
                    minion={minion} 
                    canAttack={minion.canAttack && !minion.mechanics?.includes('cant_attack')}
                    isSelected={selectedMinionId === minion.id}
                    isValidTarget={!!selectedCardId && gameState.player.hand.find(c => c.id === selectedCardId)?.spellEffect === 'heal'} 
                    onClick={() => handleMinionSelect(minion)}
                    attackDirection={attackingId === minion.id ? attackDirection : null}
                    recentDamage={damageEvents[minion.id] && Math.floor(damageEvents[minion.id])}
                />
            ))}
        </div>
      </div>

      {/* --- Bottom Area: Player --- */}
      <div className="w-full max-w-6xl flex-none pb-4 px-2 md:px-6">
        <div className="w-full flex justify-between items-end">
             
             {/* Player Hero */}
             <div className="flex flex-col items-start gap-2">
                <HeroComponent 
                    player={gameState.player} 
                    isCurrentTurn={gameState.turn === 'player'} 
                    avatarEmoji="🧔"
                    recentDamage={damageEvents['player-hero'] && Math.floor(damageEvents['player-hero'])}
                    isValidTarget={!!selectedCardId && gameState.player.hand.find(c => c.id === selectedCardId)?.spellEffect === 'heal'}
                    onClick={() => {
                        if (selectedCardId) resolveTargetedSpell('player', 'player-hero');
                    }}
                    alignment="left"
                />
             </div>
            
            {/* Player Hand (Fanned) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex justify-center items-end -space-x-8 md:-space-x-12 hover:space-x-2 transition-all duration-300">
                    {gameState.player.hand.map((card, i) => {
                        const isSelected = selectedCardId === card.id;
                        const rotation = isSelected ? 0 : (i - (gameState.player.hand.length - 1) / 2) * 5;
                        const translateY = isSelected ? -40 : Math.abs(rotation) * 2;
                        
                        return (
                            <div 
                                key={card.id} 
                                style={{ 
                                    transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                                    zIndex: i 
                                }}
                                className="transition-all duration-300 hover:z-20 hover:!rotate-0 hover:!-translate-y-16"
                            >
                                <CardComponent 
                                    card={card} 
                                    playable={gameState.turn === 'player' && gameState.player.mana >= card.cost && !attackingId} 
                                    onClick={() => handleCardClick(card)}
                                    isSelected={isSelected}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-end gap-2 z-20 w-32 md:w-48 mb-2">
                <button 
                    onClick={endTurn}
                    disabled={gameState.turn !== 'player' || !!attackingId}
                    className={`
                        w-full py-4 rounded-xl font-black text-lg md:text-xl shadow-lg border-b-8 active:border-b-0 active:translate-y-2
                        transition-all duration-100 uppercase tracking-wider
                        ${gameState.turn === 'player' && !attackingId
                            ? 'bg-green-500 text-white border-green-800 hover:bg-green-400' 
                            : 'bg-stone-500 text-stone-300 border-stone-700 cursor-not-allowed'}
                    `}
                >
                    {gameState.turn === 'player' ? 'End Turn' : 'Wait...'}
                </button>
            </div>
        </div>
      </div>
      
      {/* Logs Overlay (Bottom Left, distinct from game) */}
      <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 w-64 h-32 pointer-events-none z-0 opacity-60">
        <div className="w-full h-full bg-stone-900/90 text-green-400 p-2 rounded-lg border border-stone-600 text-[10px] font-mono overflow-y-auto">
             {gameState.logs.slice(-8).map((log, i) => <div key={i}>&gt; {log}</div>)}
             <div ref={logsEndRef} />
        </div>
      </div>

      {/* Selection Overlay Instructions */}
      {selectedCardId && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <div className="bg-black/80 text-white px-6 py-3 rounded-full font-bold text-2xl animate-bounce border-2 border-white shadow-[0_0_20px_white]">
                  Select a Target!
              </div>
          </div>
      )}
    </div>
  );
};

export default App;