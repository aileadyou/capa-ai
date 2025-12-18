import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SuccessOverlayProps {
  isVisible: boolean;
  message: string;
  onComplete?: () => void;
  type?: "step" | "pipeline";
}

export const SuccessOverlay = ({ isVisible, message, onComplete, type = "step" }: SuccessOverlayProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);
  const [funMessage, setFunMessage] = useState("");

  const funMessages = [
    "You've reduced 45% of your data handling work. Stay productive! 🚀",
    "That's 60% less manual processing. Your future self says thanks! 🙏",
    "Saving you ~3 hours of tedious work. Time for a coffee break! ☕",
    "Your data is cleaner than your lab coat ever was! ✨",
    "Processing complete! You're basically a data wizard now 🧙‍♂️",
    "Another dataset conquered. The machines are impressed! 🤖",
    "Data cleaned faster than you can say 'pIC50'! 🎯",
    "55% efficiency boost unlocked. Level up! 💪",
    "Manual processing? That's so last decade. Welcome to the future! 🌟",
    "Your ML models will thank you for this pristine data! 🎓",
    "Automated 70% of the grunt work. You're welcome! 😎",
    "Data quality: Chef's kiss! 👨‍🍳💋",
    "Time saved: Approximately one paper's worth of writing! 📝",
    "Your dataset is ready to dazzle! Shine on! ✨",
    "Processing speed: Faster than peer review! 📈"
  ];

  useEffect(() => {
    if (isVisible) {
      // Pick a random fun message
      const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
      setFunMessage(randomMessage);
      
      // Play success sound only if user has sound enabled
      checkAndPlaySound();
      
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1.5,
      }));
      setConfetti(particles);

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const checkAndPlaySound = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        playSuccessSound(type);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("sound_effects_enabled")
        .eq("id", user.id)
        .single();

      if (profile?.sound_effects_enabled !== false) {
        playSuccessSound(type);
      }
    } catch (error) {
      // If there's an error loading preference, play sound anyway
      playSuccessSound(type);
    }
  };

  const playSuccessSound = (soundType: "step" | "pipeline") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant success chime with multiple notes
      const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      
      if (soundType === "step") {
        // Light, quick chime for regular steps (C major arpeggio)
        playNote(523.25, now, 0.2, 0.25); // C5
        playNote(659.25, now + 0.1, 0.2, 0.25); // E5
        playNote(783.99, now + 0.2, 0.3, 0.25); // G5
      } else {
        // Celebratory fanfare for pipeline completion (full C major scale with flourish)
        playNote(523.25, now, 0.15, 0.3); // C5
        playNote(587.33, now + 0.1, 0.15, 0.3); // D5
        playNote(659.25, now + 0.2, 0.15, 0.3); // E5
        playNote(698.46, now + 0.3, 0.15, 0.3); // F5
        playNote(783.99, now + 0.4, 0.2, 0.35); // G5
        playNote(880.00, now + 0.55, 0.2, 0.35); // A5
        playNote(1046.50, now + 0.7, 0.4, 0.4); // C6 (higher octave for triumphant finish)
      }
      
    } catch (error) {
      // Silently fail if audio context is not supported
      console.log('Audio playback not supported');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            background: `hsl(var(--primary))`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      {/* Success card */}
      <div className="relative animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
        <div className="relative bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[320px]">
          {/* Success icon with pulse animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <CheckCircle2 
              className="relative h-20 w-20 text-primary animate-scale-in" 
              strokeWidth={2}
              style={{ animationDelay: '0.2s' }}
            />
          </div>

          {/* Success message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Success!
            </h3>
            <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {message}
            </p>
            <p className="text-primary font-medium animate-fade-in-up text-sm mt-3" style={{ animationDelay: '0.5s' }}>
              {funMessage}
            </p>
          </div>

          {/* Celebration particles around the card */}
          <div className="absolute -top-4 -left-4 w-4 h-4 rounded-full bg-accent animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -top-2 -right-6 w-3 h-3 rounded-full bg-primary animate-float" style={{ animationDelay: '0.7s' }} />
          <div className="absolute -bottom-3 -left-6 w-3 h-3 rounded-full bg-primary-light animate-float" style={{ animationDelay: '0.9s' }} />
          <div className="absolute -bottom-4 -right-4 w-4 h-4 rounded-full bg-accent-light animate-float" style={{ animationDelay: '1.1s' }} />
        </div>
      </div>
    </div>
  );
};
