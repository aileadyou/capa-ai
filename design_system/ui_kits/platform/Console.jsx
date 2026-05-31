// Product surface: the LEAD AI console (app shell + views)
const { useState } = React;

const NAV = [
  ['grid','Overview'],['pulse','Observability'],['shield','Governance'],['layers','Deployments'],['cpu','Compute'],['settings','Settings'],
];

function Sidebar({ active, setActive }) {
  return (
    <aside style={{width:236,flexShrink:0,borderRight:'1px solid var(--line-1)',background:'var(--bg-1)',
      display:'flex',flexDirection:'column',padding:'18px 14px'}}>
      <div style={{padding:'6px 8px 18px',display:'flex',alignItems:'center',gap:10}}>
        <img src="../../assets/logo-real.png" alt="Lead.AI" style={{height:24}}/>
      </div>
      <nav style={{display:'flex',flexDirection:'column',gap:2}}>
        {NAV.map(([ic,t])=>{
          const Ico = Icons[ic]; const on = active===t;
          return (
            <button key={t} onClick={()=>setActive(t)} style={{
              display:'flex',alignItems:'center',gap:11,padding:'9px 11px',borderRadius:'var(--r-sm)',
              fontSize:14,fontWeight:on?600:500,textAlign:'left',
              color: on?'var(--accent)':'var(--fg-2)',
              background: on?'var(--accent-soft)':'transparent',transition:'all .18s'}}
              onMouseEnter={e=>{if(!on){e.currentTarget.style.background='var(--bg-3)';e.currentTarget.style.color='var(--fg-1)'}}}
              onMouseLeave={e=>{if(!on){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--fg-2)'}}}>
              <Ico size={18}/> {t}
            </button>
          );
        })}
      </nav>
      <div style={{marginTop:'auto',padding:10,borderRadius:'var(--r-md)',border:'1px solid var(--line-2)',background:'var(--bg-2)'}}>
        <div className="eyebrow" style={{marginBottom:8}}>PLAN · ENTERPRISE</div>
        <div className="body-sm" style={{color:'var(--fg-2)',fontSize:12,marginBottom:10}}>4 of 8 GPU pools in use</div>
        <div style={{height:5,borderRadius:3,background:'var(--bg-4)',overflow:'hidden'}}>
          <div style={{height:'100%',width:'50%',background:'var(--accent)'}}></div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, onExit, onDeploy }) {
  return (
    <header style={{height:60,flexShrink:0,borderBottom:'1px solid var(--line-1)',display:'flex',
      alignItems:'center',gap:16,padding:'0 24px',background:'rgba(10,12,15,0.72)',backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:20}}>
      <h2 className="h4" style={{fontSize:17}}>{title}</h2>
      <div style={{marginLeft:18,display:'flex',alignItems:'center',gap:9,padding:'8px 12px',width:300,
        background:'var(--bg-3)',border:'1px solid var(--line-2)',borderRadius:'var(--r-sm)',color:'var(--fg-3)'}}>
        <Icons.search size={16}/>
        <span className="mono" style={{fontSize:13}}>Search models, runs…</span>
        <span className="mono" style={{marginLeft:'auto',fontSize:11,padding:'2px 6px',border:'1px solid var(--line-2)',borderRadius:5}}>⌘K</span>
      </div>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:14}}>
        <button className="btn btn-primary btn-sm" onClick={onDeploy}><Icons.plus size={15}/> Deploy</button>
        <button style={{color:'var(--fg-2)'}} title="Notifications"><Icons.bell size={19}/></button>
        <div style={{width:32,height:32,borderRadius:'var(--r-full)',background:'linear-gradient(135deg,var(--accent),#7CA6FF)',
          display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'var(--on-accent)'}}>AR</div>
        <button className="btn btn-ghost btn-sm" onClick={onExit} title="Back to site">Exit</button>
      </div>
    </header>
  );
}

function MetricCard({ label, value, unit, delta, good }) {
  return (
    <div className="kit-card" style={{padding:20}}>
      <div className="eyebrow" style={{marginBottom:14}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:6}}>
        <span className="metric" style={{fontSize:34}}>{value}</span>
        {unit && <span className="mono" style={{color:'var(--fg-3)'}}>{unit}</span>}
      </div>
      {delta && <div className="mono" style={{fontSize:12,marginTop:10,color:good?'var(--success)':'var(--danger)'}}>{delta}</div>}
    </div>
  );
}

function LatencyChart() {
  const pts = [38,34,40,30,33,28,31,24,27,22,25,20,23,18];
  const W=620,H=140,max=44;
  const path = pts.map((v,i)=>`${i===0?'M':'L'} ${(i/(pts.length-1))*W} ${H-(v/max)*H}`).join(' ');
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;
  return (
    <div className="kit-card" style={{padding:24,gridColumn:'span 2'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div><div className="eyebrow" style={{marginBottom:6}}>P99 LATENCY · 24H</div><div className="h4" style={{fontSize:16,color:'var(--fg-2)'}}>Trending down — 142ms now</div></div>
        <span className="mono" style={{fontSize:12,color:'var(--success)'}}>▼ 18%</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:140,overflow:'visible'}}>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient></defs>
        <path d={area} fill="url(#lg)"/>
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2"/>
      </svg>
    </div>
  );
}

const ROWS = [
  ['prod-inference-01','llama-3-70b','us-east-1','HEALTHY','138ms'],
  ['prod-inference-02','mistral-large','eu-west-1','HEALTHY','151ms'],
  ['edge-classify','distil-bert','us-west-2','DEGRADED','402ms'],
  ['batch-embed','text-embed-3','us-east-1','HEALTHY','— '],
  ['canary-rerank','rerank-v2','ap-south-1','OFFLINE','—'],
];
const STATUS = {HEALTHY:'var(--success)',DEGRADED:'var(--warning)',OFFLINE:'var(--danger)'};

function DeployTable() {
  return (
    <div className="kit-card" style={{padding:0,overflow:'hidden',gridColumn:'span 3'}}>
      <div style={{padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--line-1)'}}>
        <h3 className="h4" style={{fontSize:16}}>Active deployments</h3>
        <button className="btn btn-secondary btn-sm">View all <Icons.arrowR size={14}/></button>
      </div>
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1.2fr 1fr .9fr .7fr',gap:16,padding:'10px 22px'}} className="eyebrow">
          <span>DEPLOYMENT</span><span>MODEL</span><span>REGION</span><span>STATUS</span><span style={{textAlign:'right'}}>P99</span>
        </div>
        {ROWS.map((r,i)=>(
          <div key={r[0]} style={{display:'grid',gridTemplateColumns:'1.4fr 1.2fr 1fr .9fr .7fr',gap:16,padding:'14px 22px',
            borderTop:'1px solid var(--line-1)',alignItems:'center',transition:'background .18s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{fontSize:14,fontWeight:600,color:'var(--fg-1)'}}>{r[0]}</span>
            <span className="mono" style={{fontSize:13,color:'var(--fg-2)'}}>{r[1]}</span>
            <span className="mono" style={{fontSize:13,color:'var(--fg-3)'}}>{r[2]}</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:7,fontFamily:'var(--font-mono)',fontSize:11,fontWeight:500,color:STATUS[r[3]]}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:STATUS[r[3]]}}></span>{r[3]}</span>
            <span className="mono" style={{fontSize:13,color:'var(--fg-2)',textAlign:'right'}}>{r[4]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div style={{padding:28,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,alignContent:'start'}}>
      <MetricCard label="MEASURED UPTIME" value="99.99" unit="%" delta="▲ 0.01 vs last 30d" good/>
      <MetricCard label="REQUESTS · 24H" value="48.2" unit="M" delta="▲ 12% week over week" good/>
      <MetricCard label="ACTIVE MODELS" value="23" delta="3 deploying" good/>
      <LatencyChart/>
      <MetricCard label="EST. SPEND · MTD" value="$18.4" unit="K" delta="▼ 6% vs forecast" good/>
      <DeployTable/>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div style={{padding:28}}>
      <div className="kit-card" style={{padding:'64px 32px',textAlign:'center'}}>
        <div className="eyebrow" style={{justifyContent:'center',marginBottom:14}}>{title.toUpperCase()}</div>
        <h3 className="h3" style={{marginBottom:8}}>{title} workspace</h3>
        <p className="body" style={{maxWidth:420,margin:'0 auto'}}>This surface is part of the kit's structure. Wire it to real data to build out the {title.toLowerCase()} view.</p>
      </div>
    </div>
  );
}

function DeployModal({ onClose }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:100,background:'rgba(6,7,9,0.6)',
      backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',
      animation:'fade .3s var(--ease-out)'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:480,background:'var(--bg-2)',border:'1px solid var(--line-2)',
        borderRadius:'var(--r-lg)',boxShadow:'var(--shadow-lg)',padding:28}}>
        <div className="eyebrow" style={{marginBottom:14}}>NEW DEPLOYMENT</div>
        <h3 className="h3" style={{marginBottom:20}}>Deploy a model</h3>
        {[['Model','llama-3-70b'],['Region','us-east-1'],['Cluster','prod-inference']].map(([l,v])=>(
          <div key={l} style={{marginBottom:14}}>
            <label className="caption" style={{display:'block',marginBottom:6,color:'var(--fg-3)'}}>{l}</label>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',
              background:'var(--bg-4)',border:'1px solid var(--line-2)',borderRadius:'var(--r-sm)'}}>
              <span className="mono" style={{fontSize:13,color:'var(--fg-1)'}}>{v}</span><Icons.chevD size={16} style={{color:'var(--fg-3)'}}/>
            </div>
          </div>
        ))}
        <div style={{display:'flex',gap:10,marginTop:24,justifyContent:'flex-end'}}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onClose}><Icons.check size={15}/> Deploy now</button>
        </div>
      </div>
    </div>
  );
}

function Console({ onExit }) {
  const [active, setActive] = useState('Overview');
  const [modal, setModal] = useState(false);
  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg-1)'}}>
        <Topbar title={active} onExit={onExit} onDeploy={()=>setModal(true)}/>
        <div style={{flex:1,overflowY:'auto'}}>
          {active==='Overview' ? <Overview/> : <Placeholder title={active}/>}
        </div>
      </div>
      {modal && <DeployModal onClose={()=>setModal(false)}/>}
    </div>
  );
}

Object.assign(window, { Console });
