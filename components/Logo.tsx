import React, { useState, useCallback } from 'react';
import { Crown } from 'lucide-react';

const ANIMATIONS = [
  'animate-[logo-spin_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)]',
  'animate-[logo-flip_0.6s_ease-in-out]',
  'animate-[logo-wobble_0.5s_ease-in-out]',
  'animate-[logo-zoom_0.5s_ease-in-out]',
  'animate-[logo-shake_0.5s_ease-in-out]'
];

// Re-use a single AudioContext to prevent hitting the browser's 6-context limit
let sharedAudioCtx: AudioContext | null = null;

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  const [animClass, setAnimClass] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const playRandomSound = useCallback(() => {
    try {
      if (!sharedAudioCtx) {
        sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume context if browser suspended it
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }

      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      
      const profiles = [
        // 1. Premium Chime
        () => {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, sharedAudioCtx!.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1760, sharedAudioCtx!.currentTime + 0.1);
          osc.frequency.exponentialRampToValueAtTime(440, sharedAudioCtx!.currentTime + 0.5);
        },
        // 2. Fun Warp
        () => {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, sharedAudioCtx!.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, sharedAudioCtx!.currentTime + 0.3);
        },
        // 3. Digital Boop
        () => {
          osc.type = 'square';
          osc.frequency.setValueAtTime(300, sharedAudioCtx!.currentTime);
          osc.frequency.setValueAtTime(600, sharedAudioCtx!.currentTime + 0.1);
        },
        // 4. Magic Sparkle
        () => {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, sharedAudioCtx!.currentTime);
          osc.frequency.exponentialRampToValueAtTime(2400, sharedAudioCtx!.currentTime + 0.2);
        }
      ];

      // Pick random profile
      const profile = profiles[Math.floor(Math.random() * profiles.length)];
      profile();
      
      gain.gain.setValueAtTime(0, sharedAudioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, sharedAudioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      
      osc.start();
      osc.stop(sharedAudioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }, []);

  const handleClick = () => {
    if (animClass) return;
    
    playRandomSound();
    const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
    setAnimClass(randomAnim);
    
    setTimeout(() => {
      setAnimClass('');
    }, 600);
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] ${animClass} ${className}`}
    >
       {!imageFailed ? (
         <img 
           src="/logo.png" 
           alt="NIFO Logo" 
           className="w-full h-full object-contain mix-blend-screen contrast-200 grayscale drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
           onError={() => setImageFailed(true)}
         />
       ) : (
         <div className="w-full h-full flex items-center justify-center text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            <Crown size="100%" strokeWidth={1.5} />
         </div>
       )}
    </div>
  );
};

export default Logo;
