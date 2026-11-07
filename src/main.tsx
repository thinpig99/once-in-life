import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './index.css'
import { StoreProvider, useStore } from './store'
import { Welcome, Onboarding, Join } from './pages/Start'
import Home from './pages/Home'
import Task from './pages/Task'
import Budget from './pages/Budget'
import Planner from './pages/Planner'
import Vendors from './pages/Vendors'
import Me from './pages/Me'

function Routed() {
  const { planner, loading } = useStore()
  if (loading) return <div className="spin" aria-label="불러오는 중" />
  return (
    <Routes>
      <Route path="/join/:code" element={<Join />} />
      {planner ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/task/:key" element={<Task />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/me" element={<Me />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Welcome />} />
          <Route path="/start" element={<Onboarding />} />
        </>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <div className="app"><Routed /></div>
      </StoreProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
