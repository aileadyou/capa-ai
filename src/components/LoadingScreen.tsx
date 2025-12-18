import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Processing data..." }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-8">
        {/* Animated Molecular Structure */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Center atom */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary shadow-glow animate-glow" />
          
          {/* Orbiting atoms */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: `orbit ${3 + i * 0.5}s linear infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <div
                className="w-40 h-40 rounded-full border-2 border-primary/20"
                style={{
                  transform: `rotate(${i * 60}deg)`,
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent to-accent-light shadow-glow" />
                </div>
              </div>
            </div>
          ))}

          {/* Connecting bonds */}
          {[0, 1, 2].map((i) => (
            <div
              key={`bond-${i}`}
              className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-primary/50 to-transparent origin-left"
              style={{
                transform: `rotate(${i * 120}deg)`,
                animation: `pulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up">
            {message}
          </h3>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Analyzing molecular structures...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
