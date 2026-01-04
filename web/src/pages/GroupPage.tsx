import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import ItemCard from '../components/ItemCard'

export default function GroupPage(){
  const { id } = useParams()
  const [group, setGroup] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [message, setMessage] = useState<string|null>(null)

  useEffect(()=>{
    async function load(){
      if (!id) return
      const { data } = await supabase.from('groups').select('id,name,privacy,university_id').eq('id', id).single()
      setGroup(data)
      // membership
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      const { data: mem } = await supabase.from('group_memberships').select('id').eq('group_id', id).eq('user_id', user.id).single()
      setIsMember(!!mem)

      // load items (using RPC which enforces visibility per RLS and group membership)
      const { data: its } = await supabase.rpc('get_group_items', { p_group: id, p_limit: 50, p_offset: 0 })
      setItems((its as any) || [])
    }
    load()
  }, [id])

  async function requestJoin(){
    setMessage(null)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setMessage('Sign in to request to join'); return }
    const { error } = await supabase.rpc('request_join_group', { p_group: id, p_user: user.id, p_message: '' })
    if (error) setMessage(error.message)
    else setMessage('Join request sent')
  }

  return (
    <div style={{padding:16}}>
      {!group ? <p>Loading group…</p> : (
        <>
          <h2>{group.name} — {group.privacy}</h2>
          {!isMember && group.privacy === 'private' && <div><button onClick={requestJoin}>Request to join</button> {message && <span>{message}</span>}</div>}
          <div style={{marginTop:12}}>
            <h3>Posts</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
              {items.map(i => <ItemCard key={i.id} item={i} />)}
            </div>
            {items.length === 0 && <p>No posts yet in this group.</p>}
          </div>
        </>
      )}
    </div>
  )
}
