// Lucide-style stroke icons (1.75px). Inline so the kit is self-contained.
const I = ({d, size=20, sw=1.75, children, ...p}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d}/> : children}
  </svg>
);

const Icons = {
  grid:   (p)=> <I {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></I>,
  pulse:  (p)=> <I d="M3 12h4l3 8 4-16 3 8h4" {...p}/>,
  shield: (p)=> <I d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" {...p}/>,
  layers: (p)=> <I {...p}><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></I>,
  cpu:    (p)=> <I {...p}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></I>,
  settings:(p)=> <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></I>,
  arrowR: (p)=> <I d="M5 12h14M13 6l6 6-6 6" {...p}/>,
  arrowUR:(p)=> <I d="M7 17 17 7M8 7h9v9" {...p}/>,
  search: (p)=> <I {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></I>,
  bell:   (p)=> <I d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" {...p}/>,
  check:  (p)=> <I d="M20 6 9 17l-5-5" {...p}/>,
  plus:   (p)=> <I d="M12 5v14M5 12h14" {...p}/>,
  chevD:  (p)=> <I d="m6 9 6 6 6-6" {...p}/>,
  globe:  (p)=> <I {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></I>,
  lock:   (p)=> <I {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></I>,
  zap:    (p)=> <I d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" {...p}/>,
};

window.Icons = Icons;
