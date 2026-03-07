import { useState } from 'react'
import './index.css'

import { AuthProvider, useAuth } from './context/AuthContext'

import Menu from './pages/Menu'
import MyOrders from './pages/MyOrders'
import ChatOrder from './pages/ChatOrder'
import VoiceOrder from './pages/VoiceOrder'
import CallOrder from './pages/CallOrder'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

const API_BASE = 'http://localhost:3002/api'

function getSessionId() {
  let sid = localStorage.getItem('petpooja_session')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('petpooja_session', sid)
  }
  return sid
}

const SESSION_ID = getSessionId()

const APP_NAV = [
  { id: 'menu', label: 'Menu' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'voice', label: 'Voice' },
  { id: 'call', label: 'Call' },
  { id: 'orders', label: 'My Orders' },
]

const AUTH_TABS = ['login', 'register']

const ALL_APP_TABS = [...APP_NAV.map(n => n.id), 'profile']

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  const allTabs = [...ALL_APP_TABS, ...AUTH_TABS]
  return allTabs.includes(hash) ? hash : null
}

// ── Inner app (has access to AuthContext) ────────────────────────────────────
function AppInner() {
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(() => getTabFromHash() || 'login')

  const navigate = (id) => {
    window.location.hash = id
    setActiveTab(id)
  }

  // While checking session
  if (loading) {
    return (
      <div className="auth-page">
        <div className="loading">
          <div className="spinner" />
          <span>Loading…</span>
        </div>
      </div>
    )
  }

  // ── Auth pages (always accessible when not logged in) ─────────────────────
  if (!user) {
    if (activeTab === 'register') return <Register onNavigate={navigate} />
    return <Login onNavigate={navigate} />
  }

  // ── Main app (logged-in) ──────────────────────────────────────────────────
  const safeTab = ALL_APP_TABS.includes(activeTab) ? activeTab : 'menu'

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.jpeg" alt="PetPooja" className="brand-logo" />
          <h1>PetPooja<span>Order & Dine</span></h1>
        </div>

        <nav className="nav-items">
          {APP_NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${safeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Clickable user name → profile page */}
        <button
          className={`topbar-profile-btn ${safeTab === 'profile' ? 'active' : ''}`}
          onClick={() => navigate('profile')}
          title="My Profile"
        >
          <span className="topbar-avatar">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="topbar-user-name">{user.name}</span>
        </button>
      </header>

      <main className="main-content">
        <div style={{ display: safeTab === 'menu' ? 'block' : 'none' }}>
          <Menu apiBase={API_BASE} />
        </div>
        <div style={{ display: safeTab === 'chat' ? 'block' : 'none' }}>
          <ChatOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'voice' ? 'flex' : 'none', flexDirection: 'column' }}>
          <VoiceOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'call' ? 'flex' : 'none', flexDirection: 'column' }}>
          <CallOrder />
        </div>
        <div style={{ display: safeTab === 'orders' ? 'block' : 'none' }}>
          <MyOrders apiBase={API_BASE} sessionId={SESSION_ID} />
        </div>
        <div style={{ display: safeTab === 'profile' ? 'block' : 'none' }}>
          <Profile />
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
