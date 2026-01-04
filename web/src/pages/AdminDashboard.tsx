import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminDashboard(){
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(()=>{ load() }, [])

  async function load(){
    setLoading(true)
    const { data } = await supabase.from('reports').select('id, item_id, reason, status, created_at, reporter_id')
    setReports((data as any) || [])
    setLoading(false)
  }

  async function removeItem(reportId: string, itemId: string){
    setMessage(null)
    const { error } = await supabase.rpc('admin_remove_item', { p_item: itemId })
    if (error) setMessage(error.message)
    else { await supabase.rpc('admin_update_report', { p_report: reportId, p_status: 'reviewed' }); load(); }
  }

  async function dismiss(reportId: string){
    setMessage(null)
    const { error } = await supabase.rpc('admin_update_report', { p_report: reportId, p_status: 'dismissed' })
    if (error) setMessage(error.message)
    else load()
  }

  if (loading) return <p>Loading reports…</p>

  return (
    <div style={{padding:16}}>
      <h2>Admin — Reports</h2>
      {message && <div>{message}</div>}
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead><tr><th>when</th><th>item</th><th>reason</th><th>status</th><th>actions</th></tr></thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} style={{borderTop:'1px solid #eee'}}>
              <td style={{padding:8}}>{new Date(r.created_at).toLocaleString()}</td>
              <td style={{padding:8}}>{r.item_id}</td>
              <td style={{padding:8}}>{r.reason}</td>
              <td style={{padding:8}}>{r.status}</td>
              <td style={{padding:8}}>
                <button onClick={()=>removeItem(r.id, r.item_id)}>Remove item</button>
                <button onClick={()=>dismiss(r.id)}>Dismiss</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && <p>No reports at this time.</p>}
    </div>
  )
}
