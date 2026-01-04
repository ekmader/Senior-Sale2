import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'

export default function Groups(){
  const [groups, setGroups] = useState<any[]>([])
  const [name, setName] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const [message, setMessage] = useState<string|null>(null)

  useEffect(()=>{
    async function load(){
      const { data: profile } = await supabase.from('profiles').select('university_id').single()
      if (!profile?.university_id) return setGroups([])
      const { data } = await supabase.from('groups').select('id,name,privacy').eq('university_id', profile.university_id).order('created_at', {ascending:false})
      setGroups((data as any) || [])
    }
    load()
  },[])

  async function create(){
    setMessage(null)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setMessage('Sign in to create a group'); return }
    const { data: profile } = await supabase.from('profiles').select('university_id').eq('id', user.id).single()
    if (!profile?.university_id) { setMessage('University not assigned'); return }
    // use RPC create_group
    const { data, error } = await supabase.rpc('create_group', { p_university: profile.university_id, p_name: name, p_privacy: privacy, p_creator: user.id })
    if (error) setMessage(error.message)
    else { setMessage('Group created'); setName(''); setPrivacy('public'); setGroups(g=>[{id: data, name, privacy}, ...g]) }
  }

  return (
    <div style={{padding:16}}>
      <h2>Groups</h2>
      <div style={{marginBottom:12}}>
        <input placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} />
        <select value={privacy} onChange={e=>setPrivacy(e.target.value)}>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button onClick={create}>Create</button>
        {message && <div>{message}</div>}
      </div>

      <ul style={{listStyle:'none', padding:0}}>
        {groups.map(g => (
          <li key={g.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
            <Link to={`/groups/${g.id}`}>{g.name}</Link> — {g.privacy}
          </li>
        ))}
      </ul>
    </div>
  )
}
