import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameState, Minion, Player, Banter, SecretTrigger } from './types';
import { CARD_DATABASE, generateDeck, INITIAL_HAND_SIZE, MAX_MANA_CAP, STARTING_HEALTH, BANTER_LINES } from './constants';
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
      deck: playerDeck,
      graveyard: [],
      activeSecrets: [],
      heroPowerUsed: false
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
      deck: enemyDeck,
      graveyard: [],
      activeSecrets: [],
      heroPowerUsed: false
    },
    turn: 'player',
    turnNumber: 1,
    gameOver: false,
    winner: null,
    logs: ['Game Started! Fight for your trailer!'],
    banter: null,
    cardsPlayedThisTurn: 0
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
  const [shake, setShake] = useState(false);
  
  // Interaction State
  const [selectedMinionId, setSelectedMinionId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Animation State
  const [attackingId, setAttackingId] = useState<string | null>(null);
  const [attackDirection, setAttackDirection] = useState<'up' | 'down' | null>(null);
  const [damageEvents, setDamageEvents] = useState<Record<string, number>>({});

  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastBanterTime = useRef<number>(0);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // --- Helpers ---
  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const triggerBanter = useCallback((type: keyof typeof BANTER_LINES, speaker: 'player' | 'enemy', overrideCooldown = false) => {
    const now = Date.now();
    // Cooldown check (5 seconds), unless overridden (like for winning/losing)
    if (!overrideCooldown && now - lastBanterTime.current < 4000) return;

    const lines = BANTER_LINES[type][speaker];
    const text = lines[Math.floor(Math.random() * lines.length)];

    setGameState(prev => ({
        ...prev,
        banter: { speaker, text, id: now }
    }));
    
    lastBanterTime.current = now;

    // Clear banter after 3 seconds
    setTimeout(() => {
        setGameState(prev => {
            if (prev.banter && prev.banter.id === now) {
                return { ...prev, banter: null };
            }
            return prev;
        });
    }, 3500);
  }, []);

  // Initial Banter
  useEffect(() => {
      setTimeout(() => triggerBanter('start', 'enemy', true), 1000);
      setTimeout(() => triggerBanter('start', 'player', true), 3000);
  }, []);

  const triggerDamage = (id: string, amount: number) => {
    setDamageEvents(prev => ({ ...prev, [id]: amount + (Math.random() * 0.00001) }));
    if (amount >= 5) {
      playSound('damage_heavy');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      playSound('damage');
    }
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
    setTimeout(() => triggerBanter('start', 'enemy', true), 1000);
  };

  // --- Secret Logic ---
  const checkSecrets = async (trigger: SecretTrigger, data: any): Promise<boolean> => {
      // Returns TRUE if the action should be blocked/interrupted (e.g. Counterspell)
      const opponentId = gameState.turn === 'player' ? 'enemy' : 'player';
      const opponent = gameState[opponentId];
      let interrupted = false;

      // Find relevant secrets
      const relevantSecrets = opponent.activeSecrets.filter(s => s.secretTrigger === trigger);

      if (relevantSecrets.length > 0) {
          for (const secret of relevantSecrets) {
              // Wait a tiny bit for dramatic effect
              await new Promise(r => setTimeout(r, 400));
              playSound('play'); // Reveal sound
              
              triggerBanter('trigger_secret', opponentId, true);

              // Reveal Log
              addLog(`${opponent.name}'s Secret revealed: ${secret.name}!`);

              // Handle specific effects
              if (secret.name === 'Trespassing!' && trigger === 'on_attack_hero') {
                  const attackerId = data.attackerId;
                  setGameState(prev => {
                      const active = prev[prev.turn];
                      const newBoard = active.board.map(m => m.id === attackerId ? { ...m, currentHealth: 0 } : m).map(markDead);
                      triggerDamage(attackerId, 999);
                      return {
                          ...prev,
                          [prev.turn]: { ...active, board: newBoard }
                      }
                  });
                  interrupted = true; // Attack stops
              }
              else if (secret.name === 'Booby Trap' && trigger === 'on_attack_minion') {
                   setGameState(prev => {
                       const active = prev[prev.turn];
                       const newBoard = active.board.map(m => {
                           triggerDamage(m.id, 2);
                           return m.hasShield ? {...m, hasShield: false} : {...m, currentHealth: m.currentHealth - 2};
                       }).map(markDead);
                       return {
                           ...prev,
                           [prev.turn]: { ...active, board: newBoard }
                       }
                   });
                   // Attack continues, but attacker might die first?
                   // For simplicity, we assume attack happens simultaneously with trap, but we updated state above.
              }
              else if (secret.name === 'Bad Batch' && trigger === 'on_spell_cast') {
                  addLog("Spell was countered!");
                  interrupted = true;
              }
              else if (secret.name === 'Noise Complaint' && trigger === 'on_3rd_card') {
                  addLog("Turn ended due to noise complaint!");
                  // Force end turn logic needs to happen in the main flow, we signal it via state or just handle endTurn call?
                  // We'll signal interrupted here, but we need to actually end the turn.
                  // Since we can't easily call endTurn from here without recursion issues, we'll assume the caller handles logic
                  // Actually, we can schedule it.
                  setTimeout(() => endTurn(), 1000);
                  interrupted = true;
              }
              else if (secret.name === 'Angry Opossum' && trigger === 'on_minion_played') {
                  setGameState(prev => {
                      const opp = prev[opponentId];
                      if (opp.board.length < 7) {
                           const opossum: Minion = {
                               id: `opossum-${Date.now()}`,
                               templateId: 'opo',
                               name: 'Angry Opossum',
                               cost: 2,
                               emoji: '🐀',
                               attack: 4,
                               health: 2,
                               currentHealth: 2,
                               maxHealth: 2,
                               canAttack: true, // Charge
                               justPlayed: true,
                               cardType: 'minion',
                               mechanics: ['charge']
                           } as any;
                           return {
                               ...prev,
                               [opponentId]: { ...opp, board: [...opp.board, opossum] }
                           }
                      }
                      return prev;
                  });
                  addLog("An Opossum jumps out!");
              }

              // Remove the triggered secret
              setGameState(prev => ({
                  ...prev,
                  [opponentId]: {
                      ...prev[opponentId],
                      activeSecrets: prev[opponentId].activeSecrets.filter(s => s.id !== secret.id),
                      graveyard: [...prev[opponentId].graveyard, secret]
                  }
              }));

              if (interrupted) break;
          }
      }
      
      return interrupted;
  };

  // --- Effect to cleanup Dead Minions after animation ---
  useEffect(() => {
    const playerDead = gameState.player.board.some(m => m.isDead);
    const enemyDead = gameState.enemy.board.some(m => m.isDead);

    if (playerDead || enemyDead) {
      const timer = setTimeout(() => {
        setGameState(prev => {
          // Log deaths and move to graveyard
          const newLogs = [...prev.logs];
          const playerDeadMinions = prev.player.board.filter(m => m.isDead);
          const enemyDeadMinions = prev.enemy.board.filter(m => m.isDead);
          
          playerDeadMinions.forEach(m => newLogs.push(`${m.name} was destroyed.`));
          enemyDeadMinions.forEach(m => newLogs.push(`${m.name} was destroyed.`));

          const newPlayerGraveyard = [...prev.player.graveyard, ...playerDeadMinions];
          const newEnemyGraveyard = [...prev.enemy.graveyard, ...enemyDeadMinions];

          return {
            ...prev,
            player: { 
              ...prev.player, 
              board: prev.player.board.filter(m => !m.isDead),
              graveyard: newPlayerGraveyard
            },
            enemy: { 
              ...prev.enemy, 
              board: prev.enemy.board.filter(m => !m.isDead),
              graveyard: newEnemyGraveyard
            },
            logs: newLogs
          };
        });
      }, 600); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [gameState.player.board, gameState.enemy.board]);


  const checkWinCondition = useCallback(async () => {
    // Check for Hidden Stash (Lethal Prevention)
    // We check if health <= 0 but game not over
    const pHealth = gameState.player.health;
    const eHealth = gameState.enemy.health;

    if (!gameState.gameOver) {
        if (pHealth <= 0) {
            // Check for secret
            const hasStash = gameState.player.activeSecrets.find(s => s.name === 'Hidden Stash');
            if (hasStash) {
                 await checkSecrets('on_lethal_damage', {});
                 // Restore health to 1 and immune
                 setGameState(prev => ({
                     ...prev,
                     player: { 
                         ...prev.player, 
                         health: 1, 
                         isImmune: true,
                         activeSecrets: prev.player.activeSecrets.filter(s => s.id !== hasStash.id), // Ensure removed
                         graveyard: [...prev.player.graveyard, hasStash]
                     }
                 }));
                 addLog("Hidden Stash saved you!");
                 return;
            }
        }
        if (eHealth <= 0) {
             const hasStash = gameState.enemy.activeSecrets.find(s => s.name === 'Hidden Stash');
             if (hasStash) {
                 await checkSecrets('on_lethal_damage', {});
                 setGameState(prev => ({
                     ...prev,
                     enemy: { 
                         ...prev.enemy, 
                         health: 1, 
                         isImmune: true,
                         activeSecrets: prev.enemy.activeSecrets.filter(s => s.id !== hasStash.id),
                         graveyard: [...prev.enemy.graveyard, hasStash]
                     }
                 }));
                 addLog("Landlord used Hidden Stash!");
                 return;
             }
        }
    }

    setGameState(prev => {
      if (prev.gameOver) return prev;
      if (prev.player.health <= 0) {
          playSound('lose');
          triggerBanter('lose', 'player', true);
          return { ...prev, gameOver: true, winner: 'enemy', logs: [...prev.logs, "Evicted! GAME OVER."] };
      }
      if (prev.enemy.health <= 0) {
          playSound('win');
          triggerBanter('win', 'player', true);
          return { ...prev, gameOver: true, winner: 'player', logs: [...prev.logs, "You defended your trailer! YOU WIN!"] };
      }
      return prev;
    });
  }, [gameState.player.health, gameState.enemy.health, gameState.gameOver]); // Removed checkSecrets from dep to avoid loop

  useEffect(() => {
    checkWinCondition();
  }, [gameState.player.health, gameState.enemy.health, checkWinCondition]);

  // --- Hero Power Logic ---
  const handleHeroPower = (playerId: 'player' | 'enemy') => {
    setGameState(prev => {
        const isPlayer = playerId === 'player';
        const actor = isPlayer ? prev.player : prev.enemy;
        const opponent = isPlayer ? prev.enemy : prev.player;
        
        if (actor.mana < 2 || actor.heroPowerUsed) return prev;

        const newActor = { ...actor, mana: actor.mana - 2, heroPowerUsed: true };
        let newOpponent = { ...opponent };
        let logs = [...prev.logs];

        if (isPlayer) {
            // Tenant Power: "Chug" - Restore 2 Health
            newActor.health = Math.min(newActor.health + 2, newActor.maxHealth);
            triggerHeal('player-hero', 2);
            logs.push("You used Chug! Healed 2 HP.");
            playSound('heal');
        } else {
            // Landlord Power: "Rent Hike" - Deal 1 damage to random enemy
            const targets = [...newOpponent.board.filter(m => !m.isDead).map(m => m.id), 'player-hero'];
            const targetId = targets[Math.floor(Math.random() * targets.length)];
            
            if (targetId === 'player-hero') {
                if (!newOpponent.isImmune) {
                    newOpponent.health -= 1;
                    triggerDamage('player-hero', 1);
                    logs.push("Landlord used Rent Hike! Dealt 1 dmg to You.");
                    triggerBanter('hurt_small', 'player');
                } else {
                     logs.push("Landlord used Rent Hike! You are Immune.");
                }
            } else {
                const idx = newOpponent.board.findIndex(m => m.id === targetId);
                if (idx !== -1) {
                    const target = newOpponent.board[idx];
                    if (target.hasShield) {
                        newOpponent.board[idx].hasShield = false;
                        triggerDamage(target.id, 0);
                        logs.push("Landlord used Rent Hike! Blocked by Shield.");
                    } else {
                        newOpponent.board[idx].currentHealth -= 1;
                        triggerDamage(target.id, 1);
                        logs.push(`Landlord used Rent Hike on ${target.name}!`);
                    }
                }
            }
            // Cleanup dead
            newOpponent.board = newOpponent.board.map(markDead);
            playSound('attack');
        }

        return {
            ...prev,
            player: isPlayer ? newActor : newOpponent,
            enemy: isPlayer ? newOpponent : newActor,
            logs
        };
    });
  };

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

    // Minion or Location Logic
    if (card.cardType === 'minion' || card.cardType === 'location') {
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
    // Secret Logic
    else if (card.cardType === 'secret') {
        if (gameState.player.activeSecrets.length >= 5) {
            addLog("Too many secrets!");
            return;
        }
        playSecret(card);
    }
  };

  const playSecret = (card: Card) => {
      playSound('play');
      triggerBanter('play_secret', 'player');
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              mana: prev.player.mana - card.cost,
              hand: prev.player.hand.filter(c => c.id !== card.id),
              activeSecrets: [...prev.player.activeSecrets, card]
          },
          logs: [...prev.logs, "You set up a Blue Tarp Special..."],
          cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
      }));
  };

  const playMinion = async (card: Card) => {
    // Check for "Minion Played" secrets (Angry Opossum)
    // NOTE: In local multiplayer/AI, this triggers if *opponent* played a secret.
    // Since this function is used by PLAYER, we check if ENEMY has a secret.
    const interrupted = await checkSecrets('on_minion_played', { card });
    // Note: Opossum doesn't stop the minion from being played, so we ignore 'interrupted' unless we want hard counters later.

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
            canAttack: !!card.mechanics?.includes('charge') && card.cardType !== 'location',
            justPlayed: true,
            hasShield: card.mechanics?.includes('divine_shield'),
            isLocation: card.cardType === 'location',
            isDead: false
        };

        // Scavenge Logic
        if (card.mechanics?.includes('battlecry_scavenge')) {
            if (newPlayer.graveyard.length > 0) {
               const randomIndex = Math.floor(Math.random() * newPlayer.graveyard.length);
               const scavengedCard = newPlayer.graveyard[randomIndex];
               const newCardInstance = { ...scavengedCard, id: `scavenged-${Date.now()}`, isDead: false };
               if (newHand.length < 10) {
                   newHand.push(newCardInstance);
                   logs.push(`Scavenged ${scavengedCard.name} from trash!`);
               } else {
                   logs.push("Hand full! Scavenged item lost.");
               }
            } else {
                logs.push("Nothing in the trash to scavenge.");
            }
        }

        // Battlecry Logic
        if (card.mechanics?.includes('battlecry_damage')) {
            const damage = card.mechanicValue || 1;
            const targets = [
                ...newEnemy.board.filter(m => !m.isDead).map(m => ({type: 'minion', id: m.id})),
                {type: 'hero', id: 'enemy-hero'}
            ];
            const target = targets[Math.floor(Math.random() * targets.length)];
            
            if (target.type === 'hero') {
                if (!newEnemy.isImmune) {
                    newEnemy.health -= damage;
                    triggerDamage('enemy-hero', damage);
                    logs.push(`${card.name} threw a brick at Landlord!`);
                } else {
                    logs.push(`${card.name} threw a brick, but Landlord is Immune!`);
                }
            } else {
                const minionIdx = newEnemy.board.findIndex(m => m.id === target.id);
                if (minionIdx !== -1) {
                    const m = newEnemy.board[minionIdx];
                    if (m.hasShield) {
                        newEnemy.board[minionIdx].hasShield = false;
                        triggerDamage(m.id, 0); 
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
        newEnemy.board = newEnemy.board.map(markDead);

        return {
            ...prev,
            player: newPlayer,
            enemy: newEnemy,
            logs,
            cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
        };
    });
    setSelectedCardId(null);
    
    // Check Noise Complaint
    await checkSecrets('on_3rd_card', {});
  };

  const castGlobalSpell = async (card: Card) => {
      // Check Counterspell (Bad Batch)
      const interrupted = await checkSecrets('on_spell_cast', { card });
      
      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              mana: prev.player.mana - card.cost,
              hand: prev.player.hand.filter(c => c.id !== card.id)
          },
          cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
      }));

      if (interrupted) {
          setSelectedCardId(null);
          return; // Stop effect
      }

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
              playSound('heal'); 
          } else if (card.spellEffect === 'aoe_damage') {
              const dmg = card.spellValue || 1;
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
              
              newPlayer.board = newPlayer.board.map(markDead);
              newEnemy.board = newEnemy.board.map(markDead);
          }

          return { ...prev, player: newPlayer, enemy: newEnemy, logs };
      });
      setSelectedCardId(null);
      await checkSecrets('on_3rd_card', {});
  };

  const resolveTargetedSpell = async (targetId: string, targetType: 'player-hero' | 'enemy-hero' | 'player-minion' | 'enemy-minion') => {
      const card = gameState.player.hand.find(c => c.id === selectedCardId);
      if (!card) return;

      // Check Counterspell
      const interrupted = await checkSecrets('on_spell_cast', { card });

      setGameState(prev => ({
          ...prev,
          player: {
              ...prev.player,
              mana: prev.player.mana - card.cost,
              hand: prev.player.hand.filter(c => c.id !== card.id)
          },
          cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
      }));

      if (interrupted) {
          setSelectedCardId(null);
          return;
      }
      
      playSound('play'); 

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
                  if (!newPlayer.isImmune) {
                      newPlayer.health -= dmg;
                      triggerDamage('player-hero', dmg);
                  }
                  targetName = 'Yourself';
              } else if (targetType === 'enemy-hero') {
                  if (!newEnemy.isImmune) {
                      newEnemy.health -= dmg;
                      triggerDamage('enemy-hero', dmg);
                  }
                  targetName = 'Landlord';
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
                  triggerHeal(minion.id, buff);
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

          return { ...prev, player: newPlayer, enemy: newEnemy, logs };
      });
      setSelectedCardId(null);
      await checkSecrets('on_3rd_card', {});
  };

  const handleMinionSelect = (minion: Minion) => {
    if (gameState.turn !== 'player' || attackingId) return;
    
    if (minion.isDead) return;

    if (selectedCardId) {
        resolveTargetedSpell(minion.id, 'player-minion');
        return;
    }

    if (minion.isLocation) {
        addLog("Locations cannot attack!");
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

    // --- CHECK SECRETS ---
    if (targetType === 'enemy-hero') {
        const interrupted = await checkSecrets('on_attack_hero', { attackerId: attacker.id });
        if (interrupted) {
            setSelectedMinionId(null);
            return;
        }
    } else if (targetType === 'enemy-minion') {
         const interrupted = await checkSecrets('on_attack_minion', { attackerId: attacker.id, targetId });
         // Booby trap doesn't stop the attack technically, just kills things, but if attacker dies from damage, we check:
         if (interrupted || gameState.player.board.find(m => m.id === attacker.id)?.isDead) {
             setSelectedMinionId(null);
             // We continue if not dead, but state updated async? No, we await. 
             // We need to re-fetch attacker state.
         }
    }

    // --- INTOXICATION LOGIC ---
    let finalTargetType = targetType;
    let finalTargetId = targetId;
    const isDrunk = gameState.player.mana >= 10;
    
    if (isDrunk && Math.random() < 0.5) {
        addLog("🥴 BURP! You're drunk and attacked the wrong target!");
        const enemyMinions = gameState.enemy.board.filter(m => !m.isDead);
        const validTargets = [...enemyMinions.map(m => ({type: 'enemy-minion', id: m.id})), {type: 'enemy-hero', id: 'enemy-hero'}];
        const otherTargets = validTargets.filter(t => t.id !== targetId);
        const pool = otherTargets.length > 0 ? otherTargets : validTargets;
        const randomTarget = pool[Math.floor(Math.random() * pool.length)];
        
        finalTargetType = randomTarget.type as any;
        finalTargetId = randomTarget.id;
    }

    const enemyMinions = gameState.enemy.board.filter(m => !m.isDead);
    const hasTaunt = enemyMinions.some(m => m.taunt);
    
    if (!isDrunk || finalTargetId === targetId) { 
        if (hasTaunt) {
            if (finalTargetType === 'enemy-hero') {
                addLog("Must attack Taunt minion!");
                return;
            }
            if (finalTargetType === 'enemy-minion') {
                const target = enemyMinions.find(m => m.id === finalTargetId);
                if (target && !target.taunt) {
                    addLog("Must attack Taunt minion!");
                    return;
                }
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
        let newPlayerHealth = prev.player.health;

        const attIdx = newPlayerBoard.findIndex(m => m.id === attacker.id);
        if (attIdx === -1) return prev; // Attacker might have died from trap
        
        const myAttacker = newPlayerBoard[attIdx];
        newPlayerBoard[attIdx] = { ...myAttacker, canAttack: false };

        // DRUNK BUFF
        const drunkBonus = isDrunk && !myAttacker.isLocation ? 1 : 0;
        const attackDamage = myAttacker.attack + drunkBonus;

        let actualDamageDealt = 0;

        if (finalTargetType === 'enemy-hero') {
            if (!prev.enemy.isImmune) {
                newEnemyHealth -= attackDamage;
                triggerDamage('enemy-hero', attackDamage);
                actualDamageDealt = attackDamage;
                logs.push(`${myAttacker.name} hit Landlord for ${attackDamage}!`);
                if (attackDamage >= 5) triggerBanter('hurt_big', 'enemy');
                else triggerBanter('hurt_small', 'enemy');
            } else {
                 logs.push(`${myAttacker.name} hit Landlord, but he is Immune!`);
            }
        } else if (finalTargetType === 'enemy-minion' && finalTargetId) {
            const defIdx = newEnemyBoard.findIndex(m => m.id === finalTargetId);
            if (defIdx !== -1) {
                const defender = newEnemyBoard[defIdx];
                
                if (defender.hasShield) {
                    newEnemyBoard[defIdx].hasShield = false;
                    triggerDamage(defender.id, 0);
                    actualDamageDealt = 0;
                    logs.push(`${defender.name} blocked the attack!`);
                } else {
                    newEnemyBoard[defIdx] = { ...defender, currentHealth: defender.currentHealth - attackDamage };
                    triggerDamage(defender.id, attackDamage);
                    actualDamageDealt = attackDamage;
                }

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

                if (myAttacker.mechanics?.includes('cleave')) {
                    if (defIdx > 0) {
                        const left = newEnemyBoard[defIdx - 1];
                        if (!left.isDead) {
                          newEnemyBoard[defIdx - 1] = { ...left, currentHealth: left.currentHealth - attackDamage };
                          triggerDamage(left.id, attackDamage);
                          logs.push(`Cleave hit ${left.name}!`);
                        }
                    }
                    if (defIdx < newEnemyBoard.length - 1) {
                        const right = newEnemyBoard[defIdx + 1];
                        if (!right.isDead) {
                          newEnemyBoard[defIdx + 1] = { ...right, currentHealth: right.currentHealth - attackDamage };
                          triggerDamage(right.id, attackDamage);
                          logs.push(`Cleave hit ${right.name}!`);
                        }
                    }
                }
            }
        }

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
    
    // 1. Resolve End of Turn Effects
    const activePlayer = gameState.turn === 'player' ? gameState.player : gameState.enemy;
    const opponent = gameState.turn === 'player' ? gameState.enemy : gameState.player;
    
    // Auto-Attack
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
                     if (!opp.isImmune) {
                         opp.health -= damage;
                         triggerDamage(prev.turn === 'player' ? 'enemy-hero' : 'player-hero', damage);
                     }
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

    // Burning Barrel (Damage All) & Other End Turn Locations
    const damageLocations = activePlayer.board.filter(m => m.mechanics?.includes('end_turn_damage_all') && !m.isDead);
    if (damageLocations.length > 0) {
        for (const l of damageLocations) {
            await new Promise(r => setTimeout(r, 300));
            setGameState(prev => {
                triggerDamage('all', 1);
                // Damage everyone
                const pBoard = prev.player.board.map(m => m.hasShield ? {...m, hasShield: false} : {...m, currentHealth: m.currentHealth - 1}).map(markDead);
                const eBoard = prev.enemy.board.map(m => m.hasShield ? {...m, hasShield: false} : {...m, currentHealth: m.currentHealth - 1}).map(markDead);
                
                return {
                    ...prev,
                    player: { ...prev.player, health: prev.player.isImmune ? prev.player.health : prev.player.health - 1, board: pBoard },
                    enemy: { ...prev.enemy, health: prev.enemy.isImmune ? prev.enemy.health : prev.enemy.health - 1, board: eBoard },
                    logs: [...prev.logs, `${l.name} burned everyone!`]
                }
            });
            playSound('damage');
        }
    }
    
    // Junkyard Doghouse (Summon Taunt)
    const summonTauntLocations = activePlayer.board.filter(m => m.mechanics?.includes('end_turn_summon_taunt') && !m.isDead);
    for (const l of summonTauntLocations) {
         await new Promise(r => setTimeout(r, 200));
         setGameState(prev => {
             const active = prev.turn === 'player' ? {...prev.player} : {...prev.enemy};
             if (active.board.length >= 7) return prev;
             
             const dog: Minion = {
                 id: `dog-${Date.now()}-${Math.random()}`,
                 templateId: 'ankle-biter',
                 name: 'Ankle Biter',
                 cost: 1,
                 emoji: '🐕',
                 attack: 1,
                 health: 1,
                 currentHealth: 1,
                 maxHealth: 1,
                 cardType: 'minion',
                 taunt: true,
                 canAttack: false,
                 justPlayed: true
             } as any;
             
             active.board = [...active.board, dog];
             return {
                 ...prev,
                 player: prev.turn === 'player' ? active : prev.player,
                 enemy: prev.turn === 'player' ? prev.enemy : active,
                 logs: [...prev.logs, `${l.name} let the dogs out!`]
             };
         });
    }

    // Community Fridge (Heal Hero)
    const healHeroLocations = activePlayer.board.filter(m => m.mechanics?.includes('end_turn_heal_hero') && !m.isDead);
    for (const l of healHeroLocations) {
         setGameState(prev => {
             const active = prev.turn === 'player' ? {...prev.player} : {...prev.enemy};
             const oldHealth = active.health;
             const newHealth = Math.min(active.health + 2, active.maxHealth);
             if (newHealth > oldHealth) {
                 triggerHeal(prev.turn === 'player' ? 'player-hero' : 'enemy-hero', newHealth - oldHealth);
                 active.health = newHealth;
                 return {
                     ...prev,
                     player: prev.turn === 'player' ? active : prev.player,
                     enemy: prev.turn === 'player' ? prev.enemy : active,
                     logs: [...prev.logs, `${l.name} restored health!`]
                 };
             }
             return prev;
         });
    }

    // Spawning (Queen Roach)
    const spawners = activePlayer.board.filter(m => m.mechanics?.includes('summon_random') && !m.isDead);
    if (spawners.length > 0) {
       for (const m of spawners) {
           await new Promise(r => setTimeout(r, 200));
           setGameState(prev => {
               const active = prev.turn === 'player' ? {...prev.player} : {...prev.enemy};
               if (active.board.length >= 7) return { ...prev, logs: [...prev.logs, `${m.name} tried to spawn, but board is full!`] };
               
               const randomCard = CARD_DATABASE.filter(c => c.cardType === 'minion')[Math.floor(Math.random() * CARD_DATABASE.filter(c => c.cardType === 'minion').length)];
               const newMinion: Minion = {
                   ...randomCard as Minion,
                   id: `spawned-${Date.now()}-${Math.random()}`,
                   currentHealth: randomCard.health || 1,
                   attack: randomCard.attack || 0,
                   canAttack: false,
                   justPlayed: true,
                   hasShield: randomCard.mechanics?.includes('divine_shield'),
                   isDead: false
               };
               
               active.board = [...active.board, newMinion];
               playSound('play');

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
      
      const updatedPlayerBoard = prev.player.board.map(m => ({ ...m, canAttack: true, justPlayed: false }));
      const updatedEnemyBoard = prev.enemy.board.map(m => ({ ...m, canAttack: true, justPlayed: false }));
      
      // Remove Immune Status
      let nextPlayerState = { ...prev.player, board: updatedPlayerBoard, isImmune: false };
      let nextEnemyState = { ...prev.enemy, board: updatedEnemyBoard, isImmune: false };

      if (isPlayerNext) {
          nextPlayerState.heroPowerUsed = false;
      } else {
          nextEnemyState.heroPowerUsed = false;
      }

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
        logs: [...prev.logs, `--- ${isPlayerNext ? "Your" : "Landlord's"} Turn ---`],
        cardsPlayedThisTurn: 0 // Reset for noise complaint
      };
    });

    setTimeout(() => {
        setGameState(prev => {
            const isPlayerNow = prev.turn === 'player';
            const currentPlayer = isPlayerNow ? prev.player : prev.enemy;
            let logs = [...prev.logs];
            
            // --- START OF TURN EFFECTS ---
            
            // Pool: Heal
            const poolLocations = currentPlayer.board.filter(m => m.mechanics?.includes('start_turn_heal_all') && !m.isDead);
            let boardChanged = false;
            let newBoard = [...currentPlayer.board];

            if (poolLocations.length > 0) {
                newBoard = newBoard.map(m => {
                    if (m.currentHealth < m.health) {
                        boardChanged = true;
                        return { ...m, currentHealth: m.currentHealth + 1 };
                    }
                    return m;
                });
                if (boardChanged) {
                    playSound('heal');
                    logs.push("Above-Ground Pool healed your minions.");
                }
            }

            // Stolen Satellite: Draw
            const satelliteLocations = currentPlayer.board.filter(m => m.mechanics?.includes('start_turn_draw') && !m.isDead);
            let newHand = [...currentPlayer.hand];
            let newDeck = [...currentPlayer.deck];
            
            satelliteLocations.forEach(l => {
                if (newDeck.length > 0 && newHand.length < 10) {
                    const card = newDeck[0];
                    newDeck = newDeck.slice(1);
                    newHand.push(card);
                    logs.push(`${l.name} stole a signal (drew a card)!`);
                    playSound('draw');
                    boardChanged = true; // Signals state update needed
                }
            });

            // Meth Lab: Risk Buff
            const methLabs = currentPlayer.board.filter(m => m.mechanics?.includes('start_turn_buff_risk') && !m.isDead);
            methLabs.forEach(l => {
                 const allies = newBoard.filter(m => m.id !== l.id && !m.isDead);
                 if (allies.length > 0) {
                     const targetIdx = Math.floor(Math.random() * allies.length);
                     const target = allies[targetIdx];
                     // Find target in newBoard
                     const realIdx = newBoard.findIndex(m => m.id === target.id);
                     if (realIdx !== -1) {
                         const m = newBoard[realIdx];
                         const dmg = 1;
                         // Check shield
                         let tookDmg = false;
                         if (m.hasShield) {
                             newBoard[realIdx] = { ...m, attack: m.attack + 2, hasShield: false };
                             triggerDamage(m.id, 0);
                         } else {
                             newBoard[realIdx] = { ...m, attack: m.attack + 2, currentHealth: m.currentHealth - dmg };
                             triggerDamage(m.id, dmg);
                             tookDmg = true;
                         }
                         logs.push(`${l.name} buffed ${m.name} (+2 ATK, -1 HP)!`);
                         boardChanged = true;
                     }
                 }
            });
            // Cleanup dead from Meth Lab
            newBoard = newBoard.map(markDead);
            
            // Illegal Distillery: Gain Mana
            const distilleries = currentPlayer.board.filter(m => m.mechanics?.includes('start_turn_gain_mana') && !m.isDead);
            let extraMana = 0;
            if (distilleries.length > 0) {
                extraMana = distilleries.length;
                logs.push(`Distillery brewed ${extraMana} extra beer!`);
                boardChanged = true;
            }

            if (!boardChanged && extraMana === 0) return prev;

            return {
                ...prev,
                player: isPlayerNow ? { ...prev.player, board: newBoard, hand: newHand, deck: newDeck, mana: prev.player.mana + extraMana } : prev.player,
                enemy: isPlayerNow ? prev.enemy : { ...prev.enemy, board: newBoard, hand: newHand, deck: newDeck, mana: prev.enemy.mana + extraMana },
                logs
            };
        });
    }, 500);

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
                const validCards = affordable.filter(c => c.cardType === 'minion' || c.cardType === 'location' || c.cardType === 'secret' || (c.cardType === 'spell' && !c.requiresTarget) || c.spellEffect === 'gain_mana');

                if (validCards.length === 0 || (current.enemy.board.length >= 7 && validCards.every(c => c.cardType === 'minion' || c.cardType === 'location'))) {
                    playing = false;
                } else {
                    const card = validCards[Math.floor(Math.random() * validCards.length)];
                    playSound('play');
                    
                    // Simple AI Secret Playing
                    if (card.cardType === 'secret') {
                         setGameState(prev => ({
                             ...prev,
                             enemy: {
                                 ...prev.enemy,
                                 mana: prev.enemy.mana - card.cost,
                                 hand: prev.enemy.hand.filter(c => c.id !== card.id),
                                 activeSecrets: [...prev.enemy.activeSecrets, card]
                             },
                             logs: [...prev.logs, "Landlord set a Secret."],
                             cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
                         }));
                         triggerBanter('play_secret', 'enemy');
                         await new Promise(r => setTimeout(r, 800));
                         continue;
                    }

                    setGameState(prev => {
                        let newEnemy = { ...prev.enemy };
                        const logs = [...prev.logs];
                        
                        if (card.cardType === 'minion' || card.cardType === 'location') {
                            const newMinion = { 
                                ...card as Minion, 
                                currentHealth: card.health || 1, 
                                attack: card.attack || 0, 
                                canAttack: !!card.mechanics?.includes('charge') && card.cardType !== 'location', 
                                justPlayed: true,
                                hasShield: card.mechanics?.includes('divine_shield'),
                                isLocation: card.cardType === 'location',
                                isDead: false
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
                                    logs: [...logs, `Landlord cast Gas Leak!`],
                                    cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1
                                };
                            }
                        }
                        
                        newEnemy.mana -= card.cost;
                        newEnemy.hand = newEnemy.hand.filter(c => c.id !== card.id);
                        return { ...prev, enemy: newEnemy, logs, cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1 };
                    });
                    await new Promise(r => setTimeout(r, 800));
                }
            }

            // AI HERO POWER Check
            const currentAfterCards = gameStateRef.current;
            if (!currentAfterCards.gameOver && currentAfterCards.enemy.mana >= 2 && !currentAfterCards.enemy.heroPowerUsed) {
                handleHeroPower('enemy');
                await new Promise(r => setTimeout(r, 800));
            }

            // AI Attack Phase
            let attacking = true;
            while(attacking) {
                const current = gameStateRef.current;
                if (current.gameOver) return;
                const attackers = current.enemy.board.filter(m => m.canAttack && !m.mechanics?.includes('cant_attack') && !m.isDead && !m.isLocation);
                if (attackers.length === 0) { attacking = false; break; }

                const attacker = attackers[0];
                const taunts = current.player.board.filter(m => m.taunt && !m.isDead);
                let targetType = taunts.length > 0 ? 'minion' : (current.player.board.filter(m => !m.isDead).length > 0 && Math.random() > 0.5 ? 'minion' : 'hero');
                let targetId = targetType === 'minion' 
                    ? (taunts.length > 0 ? taunts[0].id : current.player.board.filter(m => !m.isDead)[Math.floor(Math.random() * current.player.board.filter(m => !m.isDead).length)].id)
                    : '';
                
                // CHECK SECRETS
                if (targetType === 'hero') {
                    // Logic hack: Using "player" triggered logic to check player secrets
                    // But here we need to manually invoke the logic in our own state update or helper
                    // Actually, we must use `checkSecrets` here as well, but `checkSecrets` assumes "opponent" based on turn.
                    // Since it's Enemy turn, opponent is Player. Correct.
                    const interrupted = await checkSecrets('on_attack_hero', { attackerId: attacker.id });
                    if (interrupted) {
                         // Force update to stop attack loop for this minion?
                         // checkSecrets handled state update (killing attacker potentially)
                         // We need to re-evaluate loop
                         continue; 
                    }
                } else if (targetType === 'minion') {
                    const interrupted = await checkSecrets('on_attack_minion', { attackerId: attacker.id, targetId });
                    if (interrupted) {
                        continue;
                    }
                }

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

                    // AI DRUNK Logic
                    let finalTType = targetType;
                    let finalTId = targetId;
                    if (prev.enemy.mana >= 10 && Math.random() < 0.5) {
                        const targets = [...newPlayerBoard.map(m => ({type: 'minion', id: m.id})), {type: 'hero', id: 'player-hero'}];
                        const rand = targets[Math.floor(Math.random() * targets.length)];
                        finalTType = rand.type as any;
                        finalTId = rand.id;
                        logs.push("Landlord is drunk and missed!");
                    }

                    const damage = myAttacker.attack + (prev.enemy.mana >= 10 ? 1 : 0);

                    if (finalTType === 'hero') {
                        if (!prev.player.isImmune) {
                            newPlayerHealth -= damage;
                            triggerDamage('player-hero', damage);
                            logs.push(`${myAttacker.name} hit YOU for ${damage}!`);
                            if (damage >= 5) triggerBanter('hurt_big', 'player');
                            else triggerBanter('hurt_small', 'player');
                        } else {
                            logs.push(`${myAttacker.name} hit You, but You are Immune!`);
                        }
                    } else {
                        const defIdx = newPlayerBoard.findIndex(m => m.id === finalTId);
                        if (defIdx !== -1) {
                             const def = newPlayerBoard[defIdx];
                             
                             if (def.hasShield) {
                                 newPlayerBoard[defIdx].hasShield = false;
                                 triggerDamage(def.id, 0);
                             } else {
                                 newPlayerBoard[defIdx] = { ...def, currentHealth: def.currentHealth - damage };
                                 triggerDamage(def.id, damage);
                             }

                             if (def.attack > 0 && !def.isDead) {
                                 if (myAttacker.hasShield) {
                                     newEnemyBoard[atIdx].hasShield = false;
                                     triggerDamage(myAttacker.id, 0);
                                 } else {
                                     newEnemyBoard[atIdx].currentHealth -= def.attack;
                                     triggerDamage(myAttacker.id, def.attack);
                                 }
                             }
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
    <div className={`w-full h-screen flex flex-col items-center p-2 relative bg-stone-900/5 overflow-hidden ${shake ? 'shake-screen' : ''} ${gameState.player.mana >= 10 ? 'drunk-effect' : ''}`}>
      
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
                activeBanter={gameState.banter}
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
                    canAttack={minion.canAttack && !minion.mechanics?.includes('cant_attack') && !minion.isLocation}
                    isSelected={selectedMinionId === minion.id}
                    isValidTarget={!!selectedCardId && gameState.player.hand.find(c => c.id === selectedCardId)?.spellEffect === 'heal'} 
                    onClick={() => handleMinionSelect(minion)}
                    attackDirection={attackingId === minion.id ? attackDirection : null}
                    recentDamage={damageEvents[minion.id] && Math.floor(damageEvents[minion.id])}
                    isDrunk={gameState.player.mana >= 10}
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
                    onHeroPowerClick={() => handleHeroPower('player')}
                    onEmoteClick={(type) => triggerBanter(`emote_${type}` as any, 'player')}
                    alignment="left"
                    activeBanter={gameState.banter}
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