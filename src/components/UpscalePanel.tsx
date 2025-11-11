
import React, { useRef, useState } from 'react'
import * as ort from 'onnxruntime-web'
import { fetchManifest, createSession, Manifest } from '../lib/onnx'
import { runTiled } from '../lib/tiler'



async function preflightModel(url: string): Promise<{ ok: boolean; url: string; reason?: string }> {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return { ok: false, url, reason: `HTTP ${res.status}` };
    const len = +(res.headers.get('content-length') || '0');
    // Tiny external-data stubs are ~1-5 KB. Real models are usually > 5 MB.
    if (len && len < 5000000) {
      return { ok: false, url, reason: `Too small (${len} bytes)` };
    }
    return { ok: true, url };
  } catch (e:any) {
    return { ok: false, url, reason: e.message };
  }
}

function resolveModelURL(manifestBase: string, modelPath: string) {
  // Absolute URL in path wins
  if (/^https?:\/\//i.test(modelPath)) return modelPath;
  // Prefer Hub "resolve/main" over Space "/file" endpoints (Space must be running)
  const HUB_BASE = "https://huggingface.co/spaces/akessleretsy/onnxmodels/resolve/main";
  const base = manifestBase.includes(".hf.space/file") ? HUB_BASE : manifestBase;
  return base.replace(/\/$/, "") + modelPath;
}

const HF_MANIFEST = "https://huggingface.co/spaces/akessleretsy/onnxmodels/resolve/main/onnx_models/manifest.json"

export default function UpscalePanel(){
  const [manifest, setManifest] = React.useState<Manifest | null>(null)
  const [modelId, setModelId] = React.useState<string>('swin-artscan-n0x2' as any)
  const [tileSize, setTileSize] = React.useState<number>(256)
  const [overlap, setOverlap] = React.useState<number>(32)
  const [busy, setBusy] = React.useState<boolean>(false)
  const [status, setStatus] = React.useState<string>('')

  const inCanvasRef = useRef<HTMLCanvasElement>(null)
  const outCanvasRef = useRef<HTMLCanvasElement>(null)

  React.useEffect(()=>{
    fetchManifest(HF_MANIFEST).then((m)=>{ m.models = m.models.filter(x => (x.scale||1) !== 1); return m }).then(setManifest).catch(e=>{
      console.error(e); setStatus('Failed to load manifest.')
    })
  },[])

  function onFile(file: File){
    const img = new Image()
    img.onload = () => {
      const c = inCanvasRef.current!
      c.width = img.width; c.height = img.height
      const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)
      setStatus(`Loaded ${file.name} (${img.width}×${img.height})`)
    }
    img.onerror = () => setStatus('Failed to read image')
    img.src = URL.createObjectURL(file)
  }

  async function onUpscale(){
    if (!manifest) return
    const m = manifest.models.find(x=>x.id===modelId)
    if (!m) return setStatus('Model not found in manifest.')
    const url = manifest.base.replace(/\/$/,'') + m.path
    setBusy(true); setStatus('Loading model…')
    
    try {
      const pf = await preflightModel(url);
if (!pf.ok && /scale1x\.onnx$/i.test(url)) {
  const alt = url.replace(/scale1x\.onnx$/i, 'scale2x.onnx');
  setStatus(`Model looks invalid (${pf.reason}). Trying 2× instead…`);
  url = alt;
}
const session = await createSession(url)
setStatus('Running upscaler…')
      const result = await runTiled(session, inCanvasRef.current!, {
        tileSize, overlap, expects: m.expects || 'NHWC', scale: m.scale || 2
      })
      const out = outCanvasRef.current!
      out.width = result.width; out.height = result.height
      const ctx = out.getContext('2d')!; ctx.drawImage(result, 0, 0)
      setStatus(`Done • ${inCanvasRef.current!.width}×${inCanvasRef.current!.height} → ${result.width}×${result.height}`)
    } catch (e:any){
      console.error(e)
      // Fallback: if scale1x failed (often broken external-data), try scale2x sibling
      if (/scale1x\.onnx$/i.test(url)) {
        try {
          const alt = url.replace(/scale1x\.onnx$/i, 'scale2x.onnx')
          setStatus('Model failed, retrying with scale2x…')
          const session2 = await createSession(alt)
          const result2 = await runTiled(session2, inCanvasRef.current!, {
            tileSize, overlap, expects: m.expects || 'NHWC', scale: 2
          })
          const out = outCanvasRef.current!
          out.width = result2.width; out.height = result2.height
          const ctx = out.getContext('2d')!; ctx.drawImage(result2, 0, 0)
          setStatus(`Done (fallback 2×) • ${inCanvasRef.current!.width}×${inCanvasRef.current!.height} → ${result2.width}×${result2.height}`)
          return
        } catch (e2:any) {
          console.error(e2)
        }
      }
      setStatus('Error: ' + e.message)
    } finally {
      setBusy(false)
    }
}

  function downloadOut(){
    const out = outCanvasRef.current!
    const a = document.createElement('a')
    a.download = 'upscaled.png'
    a.href = out.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <label>Upload</label>
          <div className="drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); if(e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0])}}>
            Drag & drop an image here<br/>or <input type="file" accept="image/*" onChange={e=>e.target.files&&onFile(e.target.files[0])} />
          </div>
        </div>

        <div className="card">
          <div className="row">
            <div className="col">
              <label>Tile Size</label>
              <input type="number" min={64} max={1024} step={32} value={tileSize} onChange={e=>setTileSize(parseInt(e.target.value||'256'))} />
              <small className="hint">Smaller tiles if you see crashes on WASM; larger for speed on WebGPU.</small>
            </div>
            <div className="col">
              <label>Overlap</label>
              <input type="number" min={0} max={128} step={8} value={overlap} onChange={e=>setOverlap(parseInt(e.target.value||'32'))} />
              <small className="hint">Use 16–32 to avoid seams.</small>
            </div>
          </div>
        </div>

        <div className="card">
          <label>Model</label>
          <select value={modelId} onChange={e=>setModelId(e.target.value)}>
            {!manifest && <option>Loading…</option>}
            {manifest?.models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <div style={{marginTop:12, display:'flex', gap:8}}>
            <button className="btn" onClick={onUpscale} disabled={busy}>Upscale</button>
            <button className="btn secondary" onClick={downloadOut}>Download PNG</button>
          </div>
          <div style={{marginTop:8}}><small className="hint">{status}</small></div>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="preview">
            <div>
              <label>Input</label>
              <canvas ref={inCanvasRef} />
            </div>
            <div>
              <label>Output</label>
              <canvas ref={outCanvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
