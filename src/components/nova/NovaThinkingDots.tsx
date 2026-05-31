export function NovaThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Nova is thinking">
      <span className="motion-thinking-dot h-1.5 w-1.5 rounded-full bg-nova [animation-delay:-240ms]" />
      <span className="motion-thinking-dot h-1.5 w-1.5 rounded-full bg-nova [animation-delay:-120ms]" />
      <span className="motion-thinking-dot h-1.5 w-1.5 rounded-full bg-nova" />
    </span>
  );
}
