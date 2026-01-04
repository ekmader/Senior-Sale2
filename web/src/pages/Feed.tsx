import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import ItemCard from '../components/ItemCard'

type Item = {
  id: string
  title: string
  price: number | null
  image_path: string | null
}

const PAGE_SIZE = 20

export default function Feed(){
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState<Array<{name:string,label:string}>>([])

  useEffect(()=>{
    async function loadCategories(){
      const { data } = await supabase.from('categories').select('name,label').order('name')
      setCategories((data as any) || [])
    }
    loadCategories()
  },[])

  const load = useCallback(async (pageIdx = 0, q = query, cat = category) =>{
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('university_id').single()
    if (!profile?.university_id){ setItems([]); setLoading(false); return }

    // Call RPC that uses full-text search and pagination
    const { data, error } = await supabase.rpc('search_items', { p_university: profile.university_id, p_query: q || null, p_category: cat || null, p_limit: PAGE_SIZE, p_offset: pageIdx * PAGE_SIZE })
    if (error) { console.error(error); setItems([]) }
    else setItems((data as Item[]) || [])
    setLoading(false)
  },[query, category])

  // debounce search input
  useEffect(()=>{
    const t = setTimeout(()=>{ setPage(0); load(0) }, 300)
    return ()=>clearTimeout(t)
  },[query, category, load])

  useEffect(()=>{ load(page) },[page, load])

  return (
    <div style={{paddingTop: 16}}>
      <h2>Campus Feed</h2>

      <div style={{marginBottom:12}}>
        <input
          placeholder="Search for items..."
          value={query}
          onChange={e=>setQuery(e.target.value)}
          style={{width:'100%', padding:8, borderRadius:6, border:'1px solid #ddd'}}
        />
      </div>

      <div style={{display:'flex', gap:8, overflowX:'auto', marginBottom:12}}>
        <button onClick={()=>{ setCategory(''); setPage(0)}} style={{padding:'6px 10px', borderRadius:20, background: category==='' ? '#333' : '#f0f0f0', color: category==='' ? '#fff' : '#000'}}>All</button>
        {categories.map(c=> (
          <button key={c.name} onClick={()=>{ setCategory(c.name); setPage(0)}} style={{padding:'6px 10px', borderRadius:20, background: category===c.name ? '#333' : '#f0f0f0', color: category===c.name ? '#fff' : '#000'}}>{c.label}</button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12}}>
          {items.map(it => (
            <div key={it.id}>
              <ItemCard item={it} />
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', marginTop:12}}>
        <button onClick={()=>setPage(p=>Math.max(0, p-1))} disabled={page===0}>Prev</button>
        <div>Page {page+1}</div>
        <button onClick={()=>setPage(p=>p+1)} disabled={items.length < PAGE_SIZE}>Next</button>
      </div>

      {items.length === 0 && !loading && <p>No items found — try broadening your search or creating the first post!</p>}
    </div>
  )
}
