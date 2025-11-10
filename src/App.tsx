
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Splash from './components/Splash'
import SettingsDialog from './components/SettingsDialog'
import { PRESETS, PresetKey, tfjsUrl } from './lib/modelCatalog'
import { Cog, Download } from 'lucide-react'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import ThumbStrip from './components/ThumbStrip'
import LogoSpinner from './components/LogoSpinner'

type Job = {
  id: string
  file: File
  name: string
  status: 'queued' | 'processing' | 'done' | 'error'
  url?: string
  err?: string
  originalUrl?: string
}

const makeId = () => Math.random().toString(36).slice(2)

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [preset, setPreset] = useState<PresetKey>('auto')
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentId, setCurrentId] = useState<string | undefined>(undefined)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // web worker
  const workerRef = useRef<Worker | null>(null)
  useEffect(() => {
    const w = new Worker(new URL('./workers/tfupscale.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = w
    w.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data
      if (!msg) return
      if (msg.type === 'progress') setProgress(msg.value ?? 0)
      if (msg.type === 'done') {
        setProcessing(false)
        setProgress(100)
        setJobs(prev => prev.map(j => j.status === 'processing' ? { ...j, status: 'done', url: msg.blobUrl } : j))
      }
      if (msg.type === 'error') {
        setProcessing(false)
        setJobs(prev => prev.map(j => j.status === 'processing' ? { ...j, status: 'error', err: String(msg.error || 'Error') } : j))
      }
    }
    return () => { w.terminate() }
  }, [])

  const onFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    const arr: Job[] = []
    for (const f of Array.from(files)) {
      const id = makeId()
      arr.push({ id, file: f, name: f.name, status: 'queued', originalUrl: URL.createObjectURL(f) })
    }
    setJobs(prev => [...prev, ...arr])
    if (!currentId) setCurrentId(arr[0].id)
  }

  const current = useMemo(() => jobs.find(j => j.id === currentId), [jobs, currentId])

  const start = () => {
    if (!current || !workerRef.current) return
    const modelUrl = tfjsUrl(PRESETS[preset].path) // internal; not shown in UI
    setProcessing(true)
    setProgress(0)
    setJobs(prev => prev.map(j => j.id === current.id ? { ...j, status: 'processing' } : j))
    workerRef.current.postMessage({ id: current.id, file: current.file, modelUrl })
  }

  const Header = (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', position:'sticky', top:0, zIndex:50, background:'linear-gradient(90deg, rgba(30,32,45,.9), rgba(16,18,28,.9))', backdropFilter:'blur(6px)', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <img src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" alt="logo" style={{width:28, height:28, borderRadius:'50%', boxShadow:'0 0 12px rgba(178,102,255,.8)'}}/>
        <b>LavenderDragonDesign Upscaler</b>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>      </div>
    </div>
  )

  return (
    <>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}

      <div style={{minHeight:'100vh', background:'linear-gradient(180deg,#0f1220,#0a0d16)'}}>
        {Header}

        <div className="wrap" style={{maxWidth:1100, margin:'0 auto', padding:16}}>
          {jobs.length > 0 && (<div className="card" style={{padding:14}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <b>Live Preview</b>
              {processing && <LogoSpinner src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" size={48} progress={progress}/>}
            </div>
            <BeforeAfterSlider beforeUrl={current?.originalUrl} afterUrl={current?.url} height={380} />
          </div>) /* end preview card */

          {jobs.length > 0 && (<div className="card" style={{marginTop:12}}>
            <ThumbStrip
              items={jobs.map(j => ({ id: j.id, url: j.originalUrl || '', name: j.name }))}
              current={current?.id}
              onSelect={setCurrentId}
            />
          </div>

          <div className="card" style={{padding:12, marginTop:12}}>
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
                        {j.status === 'error' && <span style={{color:'#fca5a5'}} title={j.err || 'Error'}>Error</span>}
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

          <div className="footer" style={{opacity:.6, fontSize:12, marginTop:18}}>© LavenderDragonDesign</div>
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={()=>setSettingsOpen(false)}
        value={preset}
        onChange={(v)=>{ setPreset(v); setSettingsOpen(false); }}
      />
    </>
  )
}
