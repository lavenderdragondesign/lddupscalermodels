import React from 'react'
import { X, Settings, Info } from 'lucide-react'
import { PRESETS, PresetKey } from '../lib/modelCatalog'

export default function SettingsDialog({
  open, onClose, value, onChange
}: { open: boolean, onClose: () => void, value: PresetKey, onChange: (v: PresetKey)=>void }) {
  if (!open) return null
  return (
    <div style={{position:'fixed', inset:0 as any, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:40}}>
      <div style={{width:'min(560px, 92vw)'}} className="card">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}><Settings size={18}/> <b>Upscale Settings</b></div>
          <button className="btn" onClick={onClose} title="Close"><X size={16}/></button>
        </div>
        <div className="row" style={{marginTop:14}}>
          {(Object.keys(PRESETS) as PresetKey[]).map(k => (
            <div key={k} className={`tile ${value===k?'active':''}`} onClick={()=>onChange(k)} title={'Preset'}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <Info size={14}/> <b>{PRESETS[k].label}</b>
              </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  )
}
