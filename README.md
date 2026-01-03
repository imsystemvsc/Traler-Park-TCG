# Trailer Park TCG 🚛🍺

**Trailer Park TCG** is a satirical, turn-based card battler where you, **The Tenant**, fight against the oppressive **Landlord** to defend your double-wide. 

Built with **React**, **TypeScript**, and **Tailwind CSS**.

## 🎮 How to Play

1.  **The Goal:** Reduce **The Landlord's** health (Sobriety) to 0 before he evicts you (reduces your health to 0).
2.  **Resources:** You start with 1 **Beer Can** (Mana) and gain one more each turn (up to 10). Cards cost Beer to play.
3.  **The Board:** You can have up to 7 minions on your side of the dirt patch.
4.  **Combat:** 
    *   Minions usually can't attack the turn they are played (unless they have **Charge**).
    *   Drag or click your active minions to attack the enemy Hero or their Minions.
    *   Minions deal damage equal to their Attack value and take damage equal to the defender's Attack value.

## 🃏 Card Mechanics

*   **🛡️ Taunt:** Enemies *must* attack minions with Taunt before they can attack anything else.
*   **⚡ Charge:** This minion can attack immediately after being played.
*   **🚜 Cleave:** When this minion attacks a minion, it also deals full damage to the neighbors of the target.
*   **🛸 Divine Shield:** The first time this minion takes damage, ignore it.
*   **🧛 Lifesteal:** Damage dealt by this minion heals your Hero.
*   **📢 Battlecry:** Something happens immediately when you play the card (e.g., throwing a brick).
*   **🤖 Auto-Attack:** This minion cannot attack manually. At the end of your turn, it deals damage to a random enemy.
*   **💩 Spawn:** At the end of your turn, this minion summons a random trash minion to join your board.
*   **🤢 Gas Leak (AOE):** Spells or effects that damage *everyone* on the board.

## 📦 Tech Stack

*   **Frontend:** React 19
*   **Styling:** Tailwind CSS + Custom CSS for animations
*   **Language:** TypeScript
*   **Audio:** Web Audio API (Synthesized sound effects, no external assets required)
*   **Icons:** Native Emojis

## 🛠️ Development

This project uses a file structure designed for rapid prototyping:

*   `App.tsx`: Main game loop and state management.
*   `types.ts`: TypeScript interfaces for Cards, Players, and Mechanics.
*   `constants.ts`: The database of Cards (Minions/Spells) and game constants.
*   `components/`: Reusable UI components for Cards, Minions, and Heroes.

## 📜 Credits

Created as a request for a "White Trailer Park Trash" themed Hearthstone clone. All art is procedurally generated using CSS and Emojis.
