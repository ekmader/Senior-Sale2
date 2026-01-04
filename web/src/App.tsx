import React, { useEffect, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

export default function App(){
  const [profileExists, setProfileExists] = useState(true)

  useEffect(()=>{
    async function checkProfile(){
      const user = await supabase.auth.getUser()
      if (!user.data.user) { setProfileExists(true); return }
      const { data } = await supabase.from('profiles').select('university_id').eq('id', user.data.user.id).single()
      if (!data || !data.university_id) setProfileExists(false)
      else setProfileExists(true)
    }
    checkProfile()
  }, [])

  return (
    <div style={{fontFamily: 'system-ui, Arial', maxWidth: 760, margin: '0 auto', padding: 16}}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1>Senrio Sale</h1>
        <nav>
          <Link to="/">Feed</Link> |
          <Link to="/groups">Groups</Link> |
          <Link to="/post">New Post</Link> |
          <Link to="/auth">Sign in</Link> |
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      {!profileExists && (
        <div style={{background:'#fff4e5', padding:8, borderRadius:6, marginTop:12}}>
          <strong>Almost there:</strong> We need to verify your university address. Check your email or contact support.
        </div>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  )
}
