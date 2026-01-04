import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Auth from './pages/Auth'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import Groups from './pages/Groups'
import GroupPage from './pages/GroupPage'
import AdminDashboard from './pages/AdminDashboard'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}> 
          <Route index element={<Feed />} />
        </Route>
        <Route path="/auth" element={<Auth />} />
        <Route path="/post" element={<CreatePost />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

// Optional: listen to auth state changes (e.g., show notifications or redirect)
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event', event)
})
