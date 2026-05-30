const COLORS = [
  "#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b",
  "#ec4899", "#06b6d4", "#10b981", "#f97316",
];

export function fireConfetti(originY = 0.4) {
  const count = 72;
  const container = document.body;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";

    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight * originY;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
    const fall = 200 + Math.random() * 280;
    const duration = 0.9 + Math.random() * 0.6;
    const delay = Math.random() * 0.3;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.backgroundColor = color;
    el.style.animationDelay = `${delay}s`;
    el.style.setProperty("--spin", `${spin}deg`);
    el.style.setProperty("--fall", `${fall}px`);
    el.style.setProperty("--duration", `${duration}s`);

    container.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay + 0.2) * 1000);
  }
}
