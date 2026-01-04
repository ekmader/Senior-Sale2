import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Auth(){
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const nav = useNavigate()

  const eduRegex = /@([A-Za-z0-9.-]+\.(edu))$/i

  async function signUp(){
    setMessage(null)
    if (!eduRegex.test(email)) { setMessage('Please use a .edu email'); return }

    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Check your email for a login link (verify your .edu account)')
  }

  return (
    <div style={{padding: 20}}>
      <h2>Sign in / Sign up</h2>
      <p>Use your <strong>.edu</strong> email to sign in.</p>
      <input placeholder="you@school.edu" value={email} onChange={e=>setEmail(e.target.value)} />
      <button onClick={signUp}>Send sign-in link</button>
      {message && <p>{message}</p>}
    </div>
  )
}
