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
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}><img src="https://i.postimg.cc/y6M6KPZ5/logo.jpg" alt="logo" style={{width:28,height:28,borderRadius:'50%',boxShadow:'0 0 12px rgba(178,102,255,.8)'}}/><div style={{fontSize:22,fontWeight:700}}>LavenderDragonDesign Tools</div></div>
        <div style={{opacity:.8, marginBottom:14}}>Initializing Upscaler Engine…</div>
        <div className="bar" style={{'--prog': `${progress}%`} as React.CSSProperties}><span/></div>
        <div style={{opacity:.6, fontSize:12, marginTop:8}}>{progress}%</div>
      </div>
    </div>
  )
}
