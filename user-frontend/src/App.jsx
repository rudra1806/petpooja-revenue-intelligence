import { useState } from 'react'
import './index.css'
import Menu from './pages/Menu'
import MyOrders from './pages/MyOrders'
import ChatOrder from './pages/ChatOrder'
import VoiceOrder from './pages/VoiceOrder'
import CallOrder from './pages/CallOrder'

const API_BASE = 'http://localhost:3001/api'

// Persistent session ID for this user
function getSessionId() {
  let sid = localStorage.getItem('petpooja_session')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('petpooja_session', sid)
  }
  return sid
}

const SESSION_ID = getSessionId()

const NAV_ITEMS = [
  { id: 'menu', label: 'Menu' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'voice', label: 'Voice' },
  { id: 'call', label: 'Call' },
  { id: 'orders', label: 'My Orders' },
]

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return NAV_ITEMS.some(n => n.id === hash) ? hash : 'menu'
}

function App() {
  const [activeTab, setActiveTab] = useState(getTabFromHash)

  const navigate = (id) => {
    window.location.hash = id
    setActiveTab(id)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/menu/logo.jpeg" alt="PetPooja Logo" className="brand-logo" />
          <h1>PetPooja<span>Order & Dine</span></h1>
        </div>
        <nav className="nav-items">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <div style={{ display: activeTab === 'menu' ? 'block' : 'none' }}>
          <Menu apiBase={API_BASE} />
        </div>
        <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
          <ChatOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: activeTab === 'voice' ? 'flex' : 'none', flexDirection: 'column' }}>
          <VoiceOrder sessionId={SESSION_ID} />
        </div>
        <div style={{ display: activeTab === 'call' ? 'flex' : 'none', flexDirection: 'column' }}>
          <CallOrder />
        </div>
        <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
          <MyOrders apiBase={API_BASE} sessionId={SESSION_ID} />
        </div>
      </main>
    </div>
  )
}

export default App
