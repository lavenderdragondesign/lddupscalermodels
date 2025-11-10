
import React, { useRef, useState, useEffect } from 'react'
export default function BeforeAfterSlider({ beforeUrl, afterUrl, height=340 }:{ beforeUrl?:string, afterUrl?:string, height?:number }){
  const ref = useRef<HTMLDivElement>(null); const [pos, setPos] = useState(0.5)
  useEffect(()=>{ const el=ref.current; if(!el)return;
    const move=(x:number)=>{ const r=el.getBoundingClientRect(); setPos(Math.min(Math.max((x-r.left)/r.width,0),1)) }
    const onMouse=(e:MouseEvent)=>move(e.clientX); const onTouch=(e:TouchEvent)=>move(e.touches[0].clientX)
    el.addEventListener('mousemove',onMouse); el.addEventListener('touchmove',onTouch,{passive:true})
    return ()=>{ el.removeEventListener('mousemove',onMouse); el.removeEventListener('touchmove',onTouch as any) }
  },[])
  return <div ref={ref} style={{position:'relative',height,width:'100%',borderRadius:16,overflow:'hidden',background:'#111'}}>
    {beforeUrl && <img src={beforeUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}}/>}
    {afterUrl && <div style={{position:'absolute',inset:0,width:`${pos*100}%`,overflow:'hidden'}}>
      <img src={afterUrl} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>}
    <div style={{position:'absolute',top:0,bottom:0,left:`calc(${pos*100}% - 1px)`,width:2,background:'rgba(255,255,255,.8)'}}/>
    <div style={{position:'absolute',top:'50%',left:`calc(${pos*100}% - 12px)`,transform:'translateY(-50%)',width:24,height:24,borderRadius:9999,background:'rgba(255,255,255,.95)'}}/>
  </div>
}
