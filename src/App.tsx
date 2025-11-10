import React, { useMemo, useState } from 'react'
import { PRESETS, PresetKey, tfjsUrl } from './lib/modelCatalog'
import Splash from './components/Splash'
import SettingsDialog from './components/SettingsDialog'
import { Cog, Download } from 'lucide-react'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import ThumbStrip from './components/ThumbStrip'
import LogoSpinner from './components/LogoSpinner'

type Job = { id: string; file: File; name: string; status: 'queued'|'processing'|'done'|'error'; url?: string; err?: string }

function Tile({ active, label, path, hint, onClick }:{ active:boolean, label:string, path:string, hint:string, onClick:()=>void }){
  const [show, setShow] = useState(false)
  const current = (jobs as any)?.find?.((j:any)=>j.id===currentId)

  return (
    <div className={`tile ${active?'active':''}`} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} onClick={onClick}>
      <div style={{fontWeight:700}}>{label}</div>
      
      {show && (
        <div className="hovercard">
          <div className="title">{label}</div>
          <div className="desc">{hint}</div>
          <div className="desc" style={{marginTop:6}}><b>Model:</b> {path}</div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [files, setFiles] = useState<Job[]>([])
  const [preset, setPreset] = useState<PresetKey>('g2x') // default to a strong general choice
  const [busy, setBusy] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | undefined>(undefined)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const worker = useMemo(() => new Worker(new URL('./workers/tfupscale.worker.ts', import.meta.url), { type:'module' }), [])

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const f = Array.from(e.target.files || [])
    const jobs: Job[] = f.map((file, i) => ({
      id: `${Date.now()}_${i}`,
      file,
      name: file.name,
      status: 'queued'
    }))
    setFiles(j => [...j, ...jobs])
  }

  function start() {
    if (busy) return
    setBusy(true)
    const folder = PRESETS[preset].path
    const modelUrl = tfjsUrl(folder)

    worker.onmessage = (ev: MessageEvent<any>) => {
      const msg = ev.data
      setFiles(prev => prev.map(j => {
        if (j.id !== msg.id) return j
        if (msg.type === 'done') return { ...j, status: 'done', url: msg.blobUrl }
        if (msg.type === 'error') return { ...j, status: 'error', err: msg.error }
        return j
      }))
    }

    setFiles(prev => prev.map(j => {
      if (j.status === 'queued') {
        worker.postMessage({ id: j.id, file: j.file, modelUrl })
        return { ...j, status: 'processing' }
      }
      return j
    }))
    setBusy(false)
  }

  const current = (jobs as any)?.find?.((j:any)=>j.id===currentId)

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <div className="wrap">
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{marginTop:0}}>LavenderDragonDesign Upscaler</h1>
              <p className="muted" style={{marginTop:-10}}>Frontend on Netlify · Models on Hugging Face</p>
            </div>
            <button className="btn" onClick={()=>setSettingsOpen(true)} title="Settings">
              <Cog size={16} style={{marginRight:6}}/> Settings
            </button>
          </div>

          <div style={{marginTop:8, marginBottom:6}} className="muted">Pick a model (hover for tips):</div>
          <div className="row">
            {(Object.keys(PRESETS) as PresetKey[]).map(k => (
              <Tile key={k}
                active={preset===k}
                label={PRESETS[k].label}
                path={PRESETS[k].path}
                hint={PRESETS[k].hint}
                onClick={()=>setPreset(k)}
              />
            ))}
          </div>

          <div style={{marginTop:16}}>
            <input type="file" multiple accept="image/*" onChange={onFiles} />
          </div>

          <div style={{marginTop:16}}>
            <button className="btn" disabled={!files.some(f=>f.status==='queued')} onClick={start}>
              <Download size={16} style={{marginRight:6}}/> Start Upscale
            </button>
          </div>

          <div className="queue" style={{marginTop:16}}>
            <h3 style={{marginTop:0}}>Queue</h3>
            {files.length===0 && <div className="muted">Drop or choose images to begin.</div>}
            {files.map(j => (
              <div key={j.id} className="row" style={{alignItems:'center', justifyContent:'space-between'}}>
                <div>{j.name}</div>
                <div className="muted">{j.status}</div>
                <div>
                  {j.url && <a className="btn" href={j.url} download={`upscaled-${j.name}`}>Download</a>}
                  {j.err && <span style={{color:'#fca5a5'}}> {j.err}</span>}
                </div>
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
        <div className="card" style={{padding:22, textAlign:'center', marginTop:12}}>
          <div style={{fontWeight:700, marginBottom:8}}>Drop images here to start</div>
          <div style={{opacity:.8, fontSize:13, marginBottom:12}}>Preview and tools appear after you add images.</div>
          <label className="btn">
            <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>onFiles(e.target.files)}/>
            Add Images
          </label>
        </div>
      )}

      {jobs.length > 0 && (
        <>
          <div className="card" style={{padding:14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <b>Live Preview</b>
              {processing && <LogoSpinner src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" size={48} progress={progress}/>}
            </div>
            <BeforeAfterSlider beforeUrl={current?.originalUrl || (current?.file ? URL.createObjectURL(current.file) : undefined)} afterUrl={current?.url} height={380} />
          </div>

          <div className="card" style={{marginTop:12}}>
            <ThumbStrip
              items={(jobs||[]).map((j:any)=>({ id:j.id, url:j.originalUrl || (j.file ? URL.createObjectURL(j.file) : ''), name:j.name }))}
              current={current?.id}
              onSelect={setCurrentId}
            />
          </div>

          <div className="card" style={{marginTop:12, padding:12, display:'flex', gap:10, alignItems:'center', justifyContent:'flex-end', flexWrap:'wrap'}}>
            <div style={{marginRight:'auto', opacity:.8, fontSize:12}}>Actions</div>
            <label className="btn">
              <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e=>onFiles(e.target.files)}/>
              Add Images
            </label>
            <button className="btn" onClick={()=>setSettingsOpen(true)} title="Settings"><Cog size={16}/> Settings</button>
            <button className="btn" onClick={start} disabled={!current || processing}>Upscale</button>
            <a className="btn" href={current?.url} download={current?.name?.replace(/\.[^.]+$/, '') + '_upscaled.png'} style={{opacity: current?.url ? 1 : .5, pointerEvents: current?.url ? 'auto':'none'}}><Download size={16}/> Download</a>
          </div>
        </>
      )}

      <div data-fixed-logo style={{position:'fixed',left:12,top:12,zIndex:60}}>
  <img src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" alt="logo" style={{width:28,height:28,borderRadius:'50%',boxShadow:'0 0 12px rgba(178,102,255,.8)'}}/>
</div>

      <div className="footer">© LavenderDragonDesign</div>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onClose={()=>setSettingsOpen(false)} value={preset} onChange={(v)=>{ setPreset(v); setSettingsOpen(false); }} />
    </>
  )
}
