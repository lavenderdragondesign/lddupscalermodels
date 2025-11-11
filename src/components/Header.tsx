
import React from 'react'

export default function Header(){
  return (
    <div className="header">
      <div className="hleft">
        <div className="logo" />
        <div>
          <div className="title">LavenderDragonDesign’s Image Upscaler</div>
          <div className="subtitle">Upscale & denoise images 100% client‑side (WebGPU/WASM). Models hosted on HF.</div>
        </div>
      </div>
      <div><span className="badge">BETA</span></div>
    </div>
  )
}
