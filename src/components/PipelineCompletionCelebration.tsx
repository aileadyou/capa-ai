import { useEffect, useState } from "react";
import { CheckCircle2, Database, Sparkles, Filter, Wand2, ArrowDownUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PipelineCompletionCelebrationProps {
  isVisible: boolean;
  completedSteps: string[];
  onComplete?: () => void;
}

const stepIcons = {
  "data-collection": Database,
  "standard-cleaning": Sparkles,
  "filtering": Filter,
  "selective-cleaning": Wand2,
  "grouping-sorting": ArrowDownUp,
};

const stepLabels = {
  "data-collection": "Data Collection",
  "standard-cleaning": "Standard Cleaning",
  "filtering": "Filtering",
  "selective-cleaning": "Selective Cleaning",
  "grouping-sorting": "Grouping & Sorting",
};

export const PipelineCompletionCelebration = ({
  isVisible,
  completedSteps,
  onComplete,
}: PipelineCompletionCelebrationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Play celebratory sound only if user has sound enabled
      checkAndPlaySound();
      
      // Generate colorful confetti particles
      const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--tw-accent))', 'hsl(var(--tw-success))', 'hsl(var(--tw-info))'];
      const particles = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfetti(particles);

      // Show steps after a brief delay
      setTimeout(() => setShowSteps(true), 300);

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowSteps(false);
    }
  }, [isVisible, onComplete]);

  const checkAndPlaySound = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        playCelebrationSound();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("sound_effects_enabled")
        .eq("id", user.id)
        .single();

      if (profile?.sound_effects_enabled !== false) {
        playCelebrationSound();
      }
    } catch (error) {
      // If there's an error loading preference, play sound anyway
      playCelebrationSound();
    }
  };

  const playCelebrationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.35) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Extended celebratory fanfare (C major scale up and down with triumphant finish)
      playNote(523.25, now, 0.12, 0.3); // C5
      playNote(587.33, now + 0.08, 0.12, 0.3); // D5
      playNote(659.25, now + 0.16, 0.12, 0.3); // E5
      playNote(698.46, now + 0.24, 0.12, 0.3); // F5
      playNote(783.99, now + 0.32, 0.12, 0.35); // G5
      playNote(880.00, now + 0.40, 0.12, 0.35); // A5
      playNote(987.77, now + 0.48, 0.12, 0.35); // B5
      playNote(1046.50, now + 0.56, 0.25, 0.4); // C6
      // Triumphant chord finish
      playNote(523.25, now + 0.85, 0.4, 0.35); // C5
      playNote(659.25, now + 0.85, 0.4, 0.35); // E5
      playNote(783.99, now + 0.85, 0.4, 0.35); // G5
      playNote(1046.50, now + 0.85, 0.5, 0.4); // C6
      
    } catch (error) {
      console.log('Audio playback not supported');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            background: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      {/* Celebration card */}
      <div className="relative animate-scale-in max-w-2xl w-full mx-4">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-2xl opacity-60 animate-pulse" />
        
        {/* Main content */}
        <div className="relative bg-card border-2 border-primary rounded-3xl p-8 shadow-2xl">
          {/* Trophy icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
              <Trophy 
                className="relative h-24 w-24 text-primary animate-float" 
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Success message */}
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up">
              Pipeline Complete!
            </h2>
            <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Congratulations! All steps have been successfully completed.
            </p>
          </div>

          {/* Completed steps */}
          {showSteps && (
            <div className="space-y-3 mb-6">
              {completedSteps.map((step, index) => {
                const Icon = stepIcons[step as keyof typeof stepIcons];
                const label = stepLabels[step as keyof typeof stepLabels];
                
                return (
                  <div
                    key={step}
                    className="flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 animate-fade-in-up border border-primary/10"
                    style={{ animationDelay: `${0.3 + index * 0.15}s` }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
                      <CheckCircle2 className="relative h-6 w-6 text-success" />
                    </div>
                    
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    
                    <span className="font-semibold text-foreground flex-1">{label}</span>
                    
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-success animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Celebration particles around the card */}
          <div className="absolute -top-6 -left-6 w-6 h-6 rounded-full bg-primary animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -top-4 -right-8 w-5 h-5 rounded-full bg-secondary animate-float" style={{ animationDelay: '0.7s' }} />
          <div className="absolute -bottom-5 -left-8 w-5 h-5 rounded-full bg-accent animate-float" style={{ animationDelay: '0.9s' }} />
          <div className="absolute -bottom-6 -right-6 w-6 h-6 rounded-full bg-success animate-float" style={{ animationDelay: '1.1s' }} />
          <div className="absolute top-1/2 -left-4 w-4 h-4 rounded-full bg-info animate-float" style={{ animationDelay: '1.3s' }} />
          <div className="absolute top-1/2 -right-4 w-4 h-4 rounded-full bg-warning animate-float" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>
    </div>
  );
};
