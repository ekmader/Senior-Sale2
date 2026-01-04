import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CreatePost(){
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('textbooks')
  const [groups, setGroups] = useState<Array<any>>([])
  const [groupId, setGroupId] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(()=>{
    async function loadGroups(){
      // fetch public groups for the university and groups the user belongs to
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('university_id').eq('id', user.id).single()
      if (!profile?.university_id) return
      const { data } = await supabase.rpc('get_public_or_member_groups', { p_university: profile.university_id, p_user: user.id })
      setGroups((data as any) || [])
    }
    loadGroups()
  }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault(); setMessage(null)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) { setMessage('Please sign in first'); return }

    // Get user's university via profiles
    const { data: profile } = await supabase.from('profiles').select('university_id').eq('id', user.id).single()
    if (!profile?.university_id) { setMessage('Profile missing university. Please verify your email.'); return }

    let imagePath = null
    if (image){
      const fileName = `${user.id}/${Date.now()}-${image.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('public').upload(fileName, image)
      if (uploadError) { setMessage('Upload failed: '+uploadError.message); return }
      imagePath = uploadData.path
    }

    const payload: any = { user_id: user.id, university_id: profile.university_id, title, price: price || null, category, image_path: imagePath }
    if (groupId) payload.group_id = groupId

    const { error } = await supabase.from('items').insert([payload])
    if (error) setMessage(error.message)
    else { setMessage('Posted!'); setTitle(''); setPrice(''); setImage(null); setGroupId(null) }
  }

  return (
    <div style={{padding:16}}>
      <h2>Create post</h2>
      <form onSubmit={submit}>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="textbooks">Textbooks</option>
          <option value="furniture">Furniture</option>
          <option value="dorm">Dorm essentials</option>
          <option value="clothing">Clothing</option>
        </select>

        <div style={{marginTop:8}}>
          <label>Post to group (optional)</label>
          <select value={groupId || ''} onChange={e=>setGroupId(e.target.value || null)}>
            <option value="">-- none --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.privacy})</option>)}
          </select>
        </div>

        <input type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0]||null)} />
        <button type="submit">Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
