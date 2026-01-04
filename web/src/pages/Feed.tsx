import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Item = {
  id: string
  title: string
  price: number | null
  image_path: string | null
}

export default function Feed(){
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      // Get current user's profile to determine university
      const { data: profile } = await supabase.from('profiles').select('university_id').single()
      if (!profile?.university_id){ setItems([]); setLoading(false); return }
      const { data } = await supabase.from('items').select('id, title, price, image_path').eq('university_id', profile.university_id).order('created_at', {ascending:false}).limit(30)
      setItems((data as Item[]) || [])
      setLoading(false)
    }
    load()
  },[])

  if (loading) return <p>Loading...</p>
  return (
    <div style={{paddingTop: 16}}>
      <h2>Campus Feed</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12}}>
        {items.map(it => (
          <div key={it.id} style={{border:'1px solid #ddd', padding:8, borderRadius:8}}>
            <div style={{height:120, background:'#f6f6f6', marginBottom:8}}>
              {it.image_path ? <img src={"/storage/v1/object/public/"+it.image_path} alt={it.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
            </div>
            <strong>{it.title}</strong>
            <div>{it.price ? `$${it.price}` : 'Free'}</div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p>No items yet — try posting something!</p>}
    </div>
  )
}
