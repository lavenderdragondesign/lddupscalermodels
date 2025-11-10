import React, { useEffect, useState } from 'react'

export default function Splash({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(8)
  useEffect(() => {
    const seen = localStorage.getItem('lddSplashSeen')
    if (seen === '1') { onDone(); return }
    const int = setInterval(() => setProgress(p => Math.min(100, p + Math.max(1, Math.round((100-p)/6)))), 250)
    const to = setTimeout(() => { localStorage.setItem('lddSplashSeen','1'); onDone() }, 4000)
    return () => { clearInterval(int); clearTimeout(to) }
  }, [onDone])

  return (
    <div className="splash-veil">
      <div className="splash-card">
        <div style={{fontSize:22, fontWeight:700, marginBottom:6}}>LavenderDragonDesign Tools</div>
        <div style={{opacity:.8, marginBottom:14}}>On‑device, private image upscaling…</div>
        <div className="bar" style={{'--prog': `${progress}%`} as React.CSSProperties}><span/></div>
        <div style={{opacity:.6, fontSize:12, marginTop:8}}>{progress}%</div>
      </div>
    </div>
  )
}
