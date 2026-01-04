import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CreatePost(){
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Textbooks')
  const [image, setImage] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

    const { error } = await supabase.from('items').insert([{ user_id: user.id, university_id: profile.university_id, title, price: price || null, category, image_path: imagePath }])
    if (error) setMessage(error.message)
    else { setMessage('Posted!'); setTitle(''); setPrice(''); setImage(null) }
  }

  return (
    <div style={{padding:16}}>
      <h2>Create post</h2>
      <form onSubmit={submit}>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} />
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option>Textbooks</option>
          <option>Furniture</option>
          <option>Dorm essentials</option>
          <option>Clothing</option>
        </select>
        <input type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0]||null)} />
        <button type="submit">Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
