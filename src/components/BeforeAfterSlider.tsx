
import React, { useRef, useState, useEffect } from 'react'

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  height = 320,
}: { beforeUrl?: string, afterUrl?: string, height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0.5)

  useEffect(()=>{
    function onMove(e: MouseEvent) {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const x = Math.min(Math.max(e.clientX - r.left, 0), r.width)
      setPos(x / r.width)
    }
    function onTouch(e: TouchEvent){
      if (!ref.current) return
      const t = e.touches[0]; if (!t) return
      const r = ref.current.getBoundingClientRect()
      const x = Math.min(Math.max(t.clientX - r.left, 0), r.width)
      setPos(x / r.width)
    }
    const el = ref.current
    el?.addEventListener('mousemove', onMove)
    el?.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      el?.removeEventListener('mousemove', onMove)
      el?.removeEventListener('touchmove', onTouch as any)
    }
  }, [])

  return (
    <div ref={ref} style={{position:'relative', height, width:'100%', borderRadius:16, overflow:'hidden', background:'#111'}}>
      {beforeUrl && <img src={beforeUrl} alt="before" style={{position:'absolute', inset:0, objectFit:'contain', width:'100%', height:'100%'}}/>}
      {afterUrl && (
        <div style={{position:'absolute', inset:0, width: `${pos*100}%`, overflow:'hidden'}}>
          <img src={afterUrl} alt="after" style={{objectFit:'contain', width:'100%', height:'100%'}}/>
        </div>
      )}
      <div style={{position:'absolute', top:0, bottom:0, left:`calc(${pos*100}% - 1px)`, width:2, background:'rgba(255,255,255,.7)'}}/>
      <div style={{position:'absolute', top:'50%', left:`calc(${pos*100}% - 12px)`, transform:'translateY(-50%)', width:24, height:24, borderRadius:9999, background:'rgba(255,255,255,.9)', boxShadow:'0 0 16px rgba(255,255,255,.7)'}}/>
      <div style={{position:'absolute', left:10, bottom:10, color:'#fff', fontSize:12, opacity:.85}}>Before</div>
      <div style={{position:'absolute', right:10, bottom:10, color:'#fff', fontSize:12, opacity:.85}}>After</div>
    </div>
  )
}
