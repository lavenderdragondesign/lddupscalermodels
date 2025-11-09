import React, { useMemo, useState } from 'react'
import { PRESETS, PresetKey, tfjsUrl } from './lib/modelCatalog'

type Job = { id: string; file: File; name: string; status: 'queued'|'processing'|'done'|'error'; url?: string; err?: string }

export default function App() {
  const [files, setFiles] = useState<Job[]>([])
  const [preset, setPreset] = useState<PresetKey>('auto')
  const [busy, setBusy] = useState(false)

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

  return (
    <div className="wrap">
      <div className="card">
        <h1 style={{marginTop:0}}>LavenderDragonDesign Upscaler</h1>
        <p className="muted">Frontend hosted on Netlify · Models loaded from Hugging Face</p>

        <div className="stack">
          <div>
            <div className="muted">Choose a preset:</div>
            <div className="row">
              {(Object.keys(PRESETS) as PresetKey[]).map(k => (
                <div key={k} className={`tile ${preset===k?'active':''}`} onClick={() => setPreset(k)} title={PRESETS[k].hint}>
                  <div style={{fontWeight:600}}>{PRESETS[k].label}</div>
                  <div className="muted" style={{fontSize:12}}>{PRESETS[k].path}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <input type="file" multiple accept="image/*" onChange={onFiles} />
          </div>

          <div>
            <button className="btn" disabled={!files.some(f=>f.status==='queued')} onClick={start}>Start Upscale</button>
          </div>

          <div className="card" style={{background:'#0c132a'}}>
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
        </div>

        <div className="footer">© LavenderDragonDesign</div>
      </div>
    </div>
  )
}
