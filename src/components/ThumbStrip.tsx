
import React from 'react'
export default function ThumbStrip({ items, current, onSelect }:{ items:{id:string,url:string,name?:string}[], current?:string, onSelect:(id:string)=>void }){
  return <div style={{display:'flex',gap:10,overflowX:'auto',padding:'8px 4px'}}>
    {items.map(it => <button key={it.id} onClick={()=>onSelect(it.id)} title={it.name||''}
      style={{border:'none',background:'transparent',padding:0,cursor:'pointer'}}>
      <div style={{width:72,height:72,borderRadius:10,overflow:'hidden',border: it.id===current ? '2px solid #22c55e' : '1px solid rgba(255,255,255,.2)'}}>
        <img src={it.url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>
    </button>)}
  </div>
}
