// Marketing surface — media-forward: glass cards over abstract AI imagery.
const { useEffect, useRef } = React;

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const els = ref.current.querySelectorAll('.reveal');
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function MarketingNav({ onEnter }) {
  return (
    <header style={{position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
      background:'rgba(10,12,15,0.7)',borderBottom:'1px solid var(--line-1)'}}>
      <div style={{maxWidth:1240,margin:'0 auto',padding:'15px 32px',display:'flex',alignItems:'center',gap:32}}>
        <img src="../../assets/logo-real.png" alt="Lead.AI" style={{height:28}}/>
        <nav style={{display:'flex',gap:28,marginLeft:16}} className="nav-links">
          {['Platform','Observability','Governance','Research','Pricing'].map(t=>(
            <a key={t} style={{color:'var(--fg-2)',fontSize:14,transition:'color .2s',cursor:'pointer'}}
               onMouseEnter={e=>e.target.style.color='var(--fg-1)'}
               onMouseLeave={e=>e.target.style.color='var(--fg-2)'}>{t}</a>
          ))}
        </nav>
        <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
          <button className="btn btn-ghost btn-sm" onClick={onEnter}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={onEnter}>Open console</button>
        </div>
      </div>
    </header>
  );
}

// Floating glass stat used over the hero media
function GlassStat({ value, label }) {
  return (
    <div className="glass" style={{padding:'16px 22px',borderRadius:'var(--r-md)',minWidth:140}}>
      <div className="metric" style={{fontSize:30}}>{value}</div>
      <div className="eyebrow" style={{marginTop:8,letterSpacing:'.1em'}}>{label}</div>
    </div>
  );
}

function Hero({ onEnter }) {
  return (
    <section style={{position:'relative',overflow:'hidden',borderBottom:'1px solid var(--line-1)'}}>
      <div className="glow-field"></div>
      <div className="fine-grid" style={{position:'absolute',inset:0,opacity:.45,maskImage:'radial-gradient(70% 55% at 50% 25%,#000,transparent)',WebkitMaskImage:'radial-gradient(70% 55% at 50% 25%,#000,transparent)'}}></div>
      <div style={{position:'relative',maxWidth:1000,margin:'0 auto',padding:'104px 32px 0',textAlign:'center'}}>
        <div className="reveal in eyebrow" style={{justifyContent:'center',marginBottom:26}}>RESEARCH-BACKED AI INFRASTRUCTURE</div>
        <h1 className="display-1 reveal in" style={{marginBottom:22}}>Intelligence you<br/>can operate.</h1>
        <p className="body-lg reveal in" style={{maxWidth:580,margin:'0 auto 34px',color:'var(--fg-2)'}}>
          LEAD AI gives engineering teams the infrastructure to deploy, observe, and govern models in production — with confidence.
        </p>
        <div className="reveal in" style={{display:'flex',gap:12,justifyContent:'center',marginBottom:64}}>
          <button className="btn btn-primary" onClick={onEnter}>Start a deployment <Icons.arrowR size={16}/></button>
          <button className="btn btn-secondary">Watch the platform</button>
        </div>
      </div>
      {/* Showcase media with floating glass cards */}
      <div className="reveal in" style={{position:'relative',maxWidth:1160,margin:'0 auto',padding:'0 32px 110px'}}>
        <div className="media" style={{aspectRatio:'16/9',borderRadius:'var(--r-xl)',boxShadow:'var(--shadow-lg), var(--shadow-glow)'}}>
          <image-slot id="hero-showcase" src="../../assets/media/stock-3.png"
            placeholder="Drop a product shot or demo video" style={{width:'100%',height:'100%'}}></image-slot>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(6,8,12,0.5), transparent 45%)',pointerEvents:'none'}}></div>
          {/* floating glass row */}
          <div style={{position:'absolute',left:24,right:24,bottom:24,display:'flex',gap:14,flexWrap:'wrap'}}>
            <GlassStat value="99.99%" label="MEASURED UPTIME"/>
            <GlassStat value="142ms" label="P99 INFERENCE"/>
            <div className="glass" style={{padding:'16px 22px',borderRadius:'var(--r-md)',display:'flex',alignItems:'center',gap:12,marginLeft:'auto'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 10px var(--success)'}}></span>
              <span className="mono" style={{fontSize:13,color:'var(--fg-1)'}}>23 models live · 4 regions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section style={{borderBottom:'1px solid var(--line-1)',padding:'38px 32px'}}>
      <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',gap:40,flexWrap:'wrap',justifyContent:'center'}}>
        <span className="eyebrow">TRUSTED IN PRODUCTION BY</span>
        {['NORTHWIND','VECTORA','HELIXLABS','MERIDIAN','ATLAS GRID'].map(n=>(
          <span key={n} className="mono" style={{fontSize:15,color:'var(--fg-3)',fontWeight:600,letterSpacing:'.08em'}}>{n}</span>
        ))}
      </div>
    </section>
  );
}

// Media feature card: full-bleed image + frosted glass panel holding text
function MediaFeature({ img, slotId, icon, title, desc, tall }) {
  const Ico = Icons[icon];
  return (
    <div className="media reveal" style={{minHeight:tall?440:300,display:'flex',alignItems:'flex-end',gridColumn:tall?'span 1':'auto'}}>
      <image-slot id={slotId} src={img} placeholder="Drop media"
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(6,8,12,0.7), transparent 55%)',pointerEvents:'none'}}></div>
      <div className="glass-dark" style={{position:'relative',margin:14,padding:'18px 20px',borderRadius:'var(--r-md)',
        border:'1px solid var(--glass-border)',backdropFilter:'blur(var(--glass-blur))',WebkitBackdropFilter:'blur(var(--glass-blur))',
        boxShadow:'inset 0 1px 0 0 var(--glass-border-top)',flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <span style={{color:'var(--accent)'}}><Ico size={18}/></span>
          <h3 className="h4" style={{fontSize:17}}>{title}</h3>
        </div>
        <p className="body-sm" style={{color:'var(--fg-2)',lineHeight:1.55}}>{desc}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section style={{padding:'96px 32px'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <div className="reveal" style={{maxWidth:640,marginBottom:52}}>
          <div className="eyebrow" style={{marginBottom:20}}>THE PLATFORM</div>
          <h2 className="display-2">One control plane for AI in production.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:18}} className="feat-grid">
          <MediaFeature tall img="../../assets/media/stock-1.png" slotId="feat-1" icon="layers"
            title="Unified deployment" desc="Ship models from any registry to multi-region clusters with one declarative config."/>
          <div style={{display:'grid',gap:18,gridTemplateRows:'1fr 1fr'}}>
            <MediaFeature img="../../assets/media/stock-4.png" slotId="feat-2" icon="pulse"
              title="Deep observability" desc="Trace every request — latency, drift, and cost in real time."/>
            <MediaFeature img="../../assets/media/stock-2.png" slotId="feat-3" icon="shield"
              title="Built-in governance" desc="Policy, audit, and access enforced at the gateway."/>
          </div>
          <div style={{display:'grid',gap:18,gridTemplateRows:'1fr 1fr'}}>
            <MediaFeature img="../../assets/media/stock-5.png" slotId="feat-4" icon="cpu"
              title="Elastic compute" desc="Autoscale inference with sub-second cold starts."/>
            <MediaFeature img="../../assets/media/stock-1.png" slotId="feat-5" icon="lock"
              title="Zero-trust access" desc="Short-lived credentials and request-level provenance."/>
          </div>
        </div>
      </div>
    </section>
  );
}

// Large media band with glass content panel — the "showcase" section
function Showcase({ onEnter }) {
  return (
    <section style={{padding:'0 32px 96px'}}>
      <div className="media reveal" style={{maxWidth:1160,margin:'0 auto',minHeight:460,borderRadius:'var(--r-xl)',display:'flex',alignItems:'center'}}>
        <image-slot id="showcase-band" src="../../assets/media/stock-5.png" placeholder="Drop a demo video"
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, rgba(6,8,12,0.85), rgba(6,8,12,0.2))',pointerEvents:'none'}}></div>
        <div className="glass" style={{position:'relative',margin:'0 0 0 48px',padding:'36px 38px',maxWidth:430,borderRadius:'var(--r-lg)'}}>
          <div className="eyebrow" style={{marginBottom:18}}>OBSERVABILITY</div>
          <h2 className="h2" style={{marginBottom:14,fontSize:30}}>See every token, in real time.</h2>
          <p className="body" style={{marginBottom:24}}>Trace requests end to end. Latency, drift, and cost surfaced live — down to the individual call.</p>
          <button className="btn btn-primary btn-sm" onClick={onEnter}>Explore observability <Icons.arrowR size={15}/></button>
        </div>
      </div>
    </section>
  );
}

function CTA({ onEnter }) {
  return (
    <section style={{padding:'0 32px 110px'}}>
      <div className="reveal" style={{position:'relative',overflow:'hidden',maxWidth:1160,margin:'0 auto',
        borderRadius:'var(--r-xl)',border:'1px solid var(--line-2)',background:'var(--bg-2)',padding:'76px 48px',textAlign:'center'}}>
        <div className="glow-field" style={{opacity:.6}}></div>
        <div style={{position:'relative'}}>
          <h2 className="display-2" style={{marginBottom:18}}>Run AI you can trust.</h2>
          <p className="body-lg" style={{maxWidth:480,margin:'0 auto 32px'}}>Deploy in minutes. Observe everything. Govern with confidence.</p>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button className="btn btn-primary" onClick={onEnter}>Open console <Icons.arrowR size={16}/></button>
            <button className="btn btn-secondary">Talk to engineering</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{borderTop:'1px solid var(--line-1)',padding:'48px 32px'}}>
      <div style={{maxWidth:1240,margin:'0 auto',display:'flex',justifyContent:'space-between',gap:24,flexWrap:'wrap',alignItems:'center'}}>
        <img src="../../assets/logo-real.png" alt="Lead.AI" style={{height:24,opacity:.9}}/>
        <span className="mono" style={{fontSize:12,color:'var(--fg-3)'}}>© 2026 LEAD AI · SOC 2 Type II · ISO 27001</span>
      </div>
    </footer>
  );
}

function MarketingSite({ onEnter }) {
  const ref = useReveal();
  return (
    <div ref={ref}>
      <MarketingNav onEnter={onEnter}/>
      <Hero onEnter={onEnter}/>
      <Proof/>
      <Features/>
      <Showcase onEnter={onEnter}/>
      <CTA onEnter={onEnter}/>
      <Footer/>
    </div>
  );
}

Object.assign(window, { MarketingSite, useReveal });
