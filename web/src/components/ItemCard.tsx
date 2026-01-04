import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ItemCard({item}:{item:any}){
  const [message, setMessage] = useState<string|null>(null)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')

  async function report(){
    if (!reason) { setMessage('Please enter a reason'); return }
    setReporting(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setMessage('Sign in to report'); setReporting(false); return }
    const { error } = await supabase.from('reports').insert([{ item_id: item.id, reporter_id: user.id, reason }])
    if (error) setMessage(error.message)
    else { setMessage('Reported — thank you'); setReason('') }
    setReporting(false)
  }

  return (
    <div style={{border:'1px solid #ddd', padding:8, borderRadius:8}}>
      <div style={{height:120, background:'#f6f6f6', marginBottom:8}}>
        {item.image_path ? <img src={"/storage/v1/object/public/"+item.image_path} alt={item.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
      </div>
      <strong>{item.title}</strong>
      <div>{item.price ? `$${item.price}` : 'Free'}</div>

      <div style={{marginTop:8}}>
        <details>
          <summary style={{cursor:'pointer'}}>Report</summary>
          <textarea placeholder="Why are you reporting this?" value={reason} onChange={e=>setReason(e.target.value)} style={{width:'100%', height:80}} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button onClick={report} disabled={reporting}>Send report</button>
          </div>
          {message && <div style={{marginTop:8}}>{message}</div>}
        </details>
      </div>
    </div>
  )
}
