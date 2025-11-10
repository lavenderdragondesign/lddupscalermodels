
import React from 'react'

export default function LogoSpinner({ src, size=72, progress=0 }:{ src:string, size?:number, progress?:number }){
  const glow = { filter: 'drop-shadow(0 0 10px rgba(178, 102, 255, .8)) drop-shadow(0 0 20px rgba(102, 255, 204, .6))' } as React.CSSProperties
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8}}>
      <div className="spin" style={{ width:size, height:size, borderRadius:'50%', display:'grid', placeItems:'center' }}>
        <img src={src} alt="logo" style={{ width:size, height:size, borderRadius:'50%', ...glow }}/>
      </div>
      <div style={{width:160, height:6, background:'rgba(255,255,255,.2)', borderRadius:8, overflow:'hidden'}}>
        <div style={{width:`${Math.max(0,Math.min(100,progress))}%`, height:'100%', background:'#22c55e', boxShadow:'0 0 10px #22c55e'}}/>
      </div>
      <div style={{fontSize:12, opacity:.75}}>{Math.max(0,Math.min(100,progress))}%</div>
      <style>{`
        .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
