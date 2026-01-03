// Simple synth for sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export type SoundType = 'play' | 'attack' | 'damage' | 'heal' | 'draw' | 'win' | 'lose' | 'click' | 'turn';

export const playSound = (type: SoundType) => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    switch (type) {
      case 'play': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Card flip/slap sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'attack': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Whoosh
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'damage': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Punch/Impact
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      
      case 'heal': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Magical shimmer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'draw': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Paper slide
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'turn': {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        // Ding
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
        
      case 'win':
        // Victory Fanfare
        [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = 'square';
            o.frequency.value = freq;
            
            const noteStart = now + i * 0.15;
            const noteDur = i === 5 ? 0.8 : 0.12;

            g.gain.setValueAtTime(0.1, noteStart);
            g.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);
            o.start(noteStart);
            o.stop(noteStart + noteDur);
        });
        break;

      case 'lose':
        // Sad Trombone: Wah-wah-wah-waaaaah
        // Frequencies approximately: C#4, B3, Bb3, A3
        const notes = [277.18, 246.94, 233.08, 220.00];
        const durations = [0.4, 0.4, 0.4, 1.2];
        let startTime = now;
        
        notes.forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth'; // Sawtooth for brassy sound
            o.connect(g);
            g.connect(ctx.destination);
            
            o.frequency.setValueAtTime(freq, startTime);
            
            // Slide pitch down slightly during the note for the "wah" effect
            if (i === notes.length - 1) {
                 // Long slide on last note
                 o.frequency.linearRampToValueAtTime(freq - 20, startTime + durations[i]);
            } else {
                 o.frequency.linearRampToValueAtTime(freq - 5, startTime + durations[i] * 0.8);
            }

            // Envelope
            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.2, startTime + 0.1); // Attack
            g.gain.linearRampToValueAtTime(0, startTime + durations[i]); // Decay

            o.start(startTime);
            o.stop(startTime + durations[i]);
            startTime += durations[i];
        });
        break;

      case 'click':
         // Tiny click
        const oscClick = ctx.createOscillator();
        const gainClick = ctx.createGain();
        oscClick.connect(gainClick);
        gainClick.connect(ctx.destination);
        oscClick.frequency.setValueAtTime(800, now);
        oscClick.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gainClick.gain.setValueAtTime(0.05, now);
        gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        oscClick.start(now);
        oscClick.stop(now + 0.05);
        break;
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};