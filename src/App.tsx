
import React from 'react'
import Header from './components/Header'
import UpscalePanel from './components/UpscalePanel'

export default function App(){
  return (
    <div className="container">
      <Header />
      <UpscalePanel />
      <div className="footer">Models served from Hugging Face Space • WebGPU → WASM fallback • © LavenderDragonDesign</div>
    </div>
  )
}
