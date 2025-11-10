
import React, { useEffect, useMemo, useRef, useState } from 'react'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import ThumbStrip from './components/ThumbStrip'
import LogoSpinner from './components/LogoSpinner'

type Job = { id: string; file: File; name: string; status: 'queued'|'processing'|'done'|'error'; url?: string; err?: string; originalUrl?: string }

const workerFactory = () => new Worker(new URL('./workers/tfupscale.worker.ts', import.meta.url), { type: 'module' })

export default function App(){
  const [showSplash, setShowSplash] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentId, setCurrentId] = useState<string | undefined>(undefined)
  const [progress, setProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  useEffect(()=>{
    workerRef.current = workerFactory()
    const w = workerRef.current
    w.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data
      if (msg?.type === 'progress') {
        setProgress(msg.value ?? 0)
      } else if (msg?.type === 'done') {
        setProgress(100)
        setProcessing(false)
        setJobs(prev => prev.map(j => j.status === 'processing' ? { ...j, status:'done', url: msg.blobUrl } : j))
      } else if (msg?.type === 'error') {
        setProcessing(false)
        setJobs(prev => prev.map(j => j.status === 'processing' ? { ...j, status:'error', err: String(msg.error || 'Error') } : j))
      }
    }
    return () => { w.terminate() }
  }, [])

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr: Job[] = []
    for (const f of Array.from(files)) {
      const id = Math.random().toString(36).slice(2)
      const originalUrl = URL.createObjectURL(f)
      arr.push({ id, file: f, name: f.name, status:'queued', originalUrl })
    }
    setJobs(prev => [...prev, ...arr])
    if (!currentId && arr.length) setCurrentId(arr[0].id)
  }

  const current = useMemo(() => jobs.find(j => j.id === currentId), [jobs, currentId])

  const startUpscale = () => {
    if (!current || !workerRef.current) return
    setProcessing(true)
    setProgress(0)
    setJobs(prev => prev.map(j => j.id === current.id ? { ...j, status:'processing'} : j))
    workerRef.current.postMessage({ id: current.id, file: current.file, modelUrl: '' }) // model selection hidden/auto
  }

  // Header with logo
  const Header = (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', position:'sticky', top:0, zIndex:50, background:'linear-gradient(90deg, rgba(30,32,45,.9), rgba(16,18,28,.9))', backdropFilter:'blur(6px)', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <img src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" alt="logo" style={{width:28, height:28, borderRadius:'50%', boxShadow:'0 0 12px rgba(178,102,255,.8)'}}/>
        <b>LavenderDragonDesign Upscaler</b>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <label className="btn">
          <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>onFiles(e.target.files)}/>
          Add Images
        </label>
        <button className="btn" onClick={startUpscale} disabled={!current || processing}>Upscale</button>
        <a className="btn" href={current?.url} download={current?.name?.replace(/\.[^.]+$/, '') + '_upscaled.png'} style={{opacity: current?.url ? 1 : .5, pointerEvents: current?.url ? 'auto':'none'}}>Download</a>
      </div>
    </div>
  )

  return (
    <>
      {!showSplash ? null : (
        <div className="splash-veil">
          <div className="splash-card">
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
              <img src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" alt="logo" style={{width:28, height:28, borderRadius:'50%', boxShadow:'0 0 12px rgba(178,102,255,.8)'}}/>
              <div style={{fontSize:22, fontWeight:700}}>LavenderDragonDesign Tools</div>
            </div>
            <div style={{opacity:.8, marginBottom:14}}>On‑device, private image upscaling…</div>
            <div className="bar" style={{'--prog': `100%`} as React.CSSProperties}><span/></div>
            <div style={{opacity:.6, fontSize:12, marginTop:8}}>Ready</div>
            <button className="btn" style={{marginTop:14}} onClick={()=>setShowSplash(false)}>Enter</button>
          </div>
        </div>
      )}

      <div style={{minHeight:'100vh', background:'linear-gradient(180deg,#0f1220,#0a0d16)'}}>
        {Header}
        <div style={{maxWidth:1100, margin:'0 auto', padding:16, display:'grid', gridTemplateColumns:'1fr 320px', gap:16}}>
          <div>
            {/* Medium live preview with before/after */}
            <div className="card" style={{padding:14}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <b>Live Preview</b>
                {processing && <LogoSpinner src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" size={48} progress={progress}/>}
              </div>
              <BeforeAfterSlider beforeUrl={current?.originalUrl} afterUrl={current?.url} height={380} />
            </div>

            {/* Thumbnail strip */}
            <div className="card" style={{marginTop:12}}>
              <ThumbStrip
                items={jobs.map(j => ({ id: j.id, url: j.originalUrl || '', name: j.name }))}
                current={current?.id}
                onSelect={setCurrentId}
              />
            </div>
          </div>

          {/* Right panel: queue */}
          <div className="card" style={{padding:12}}>
            <b>Queue</b>
            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:10, maxHeight:520, overflow:'auto'}}>
              {jobs.map(j => (
                <div key={j.id} className="row" style={{display:'grid', gridTemplateColumns:'72px 1fr', gap:10, alignItems:'center', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:8, background:'rgba(255,255,255,.02)'}}>
                  <img src={j.originalUrl} alt="" style={{width:72, height:72, borderRadius:8, objectFit:'cover'}}/>
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{fontWeight:600, fontSize:14, opacity:.95, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{j.name}</div>
                      <div style={{fontSize:12, opacity:.8}}>
                        {j.status === 'queued' && 'Queued'}
                        {j.status === 'processing' && `Processing ${progress}%`}
                        {j.status === 'done' && <a href={j.url} download className="link">Download</a>}
                        {j.status === 'error' && <span style={{color:'#fca5a5'}}>Error</span>}
                      </div>
                    </div>
                    {j.status !== 'done' && <div style={{height:6, background:'rgba(255,255,255,.1)', borderRadius:6, overflow:'hidden', marginTop:6}}>
                      <div style={{height:'100%', width:`${j.status==='processing'?progress:0}%`, background:'#22c55e'}}/>
                    </div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .card { background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:16px; }
        .btn { background: #1f2937; border:1px solid rgba(255,255,255,.12); color:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }
        .btn:hover { background:#2b3648 }
        .link { color:#22c55e; text-decoration: none }
        .splash-veil { position:fixed; inset:0; display:grid; place-items:center; background:radial-gradient(1200px 800px at 50% -10%, rgba(102,255,204,.08), transparent), #0b0e17; z-index:100 }
        .splash-card { width:min(480px, 92vw); background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); padding:20px; border-radius:16px; text-align:center }
        .bar { width:100%; height:8px; background:rgba(255,255,255,.2); border-radius:8px; overflow:hidden }
        .bar span { display:block; height:100%; width:var(--prog); background:#22c55e; box-shadow:0 0 14px #22c55e }
      `}</style>
    </>
  )
}
