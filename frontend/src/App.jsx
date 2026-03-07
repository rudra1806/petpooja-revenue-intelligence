import { useState } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLogin from './pages/AdminLogin'
import ProductAnalytics from './pages/ProductAnalytics'
import ComboGenerator from './pages/ComboGenerator'
import SuggestView from './pages/SuggestView'
import ManageCombos from './pages/ManageCombos'
import Orders from './pages/Orders'
// Pricing Dashboard — data-driven price suggestions & discount thresholds page
import PricingDashboard from './pages/PricingDashboard'

const API_BASE = 'http://localhost:3001/api'

const NAV_ITEMS = [
  { id: 'products', label: 'Analytics' },
  { id: 'pricing', label: 'Pricing' },   // Pricing & Discount Intelligence tab
  { id: 'combos', label: 'Combos' },
  { id: 'manage', label: 'Manage' },
  { id: 'suggest', label: 'Upsell' },
  { id: 'orders', label: 'Orders' },
]

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return NAV_ITEMS.some(n => n.id === hash) ? hash : 'products'
}

function AppInner() {
  const { admin, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(getTabFromHash)

  const navigate = (id) => {
    window.location.hash = id
    setActiveTab(id)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading session...</div>
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">P</div>
          <h1>PetPooja<span>Revenue Intelligence</span></h1>
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

        {/* Admin user info & logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700
            }}>
              {admin.name.charAt(0).toUpperCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{admin.name}</span>
          </div>
          <button onClick={logout} style={{
            padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-medium)',
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)'
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--negative)'; e.currentTarget.style.color = 'var(--negative)'; e.currentTarget.style.background = 'var(--negative-subtle)' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'products' && <ProductAnalytics apiBase={API_BASE} />}
        {/* Pricing Dashboard — shows per-product price/discount recommendations from analytics */}
        {activeTab === 'pricing' && <PricingDashboard apiBase={API_BASE} />}
        {activeTab === 'combos' && <ComboGenerator apiBase={API_BASE} />}
        {activeTab === 'manage' && <ManageCombos apiBase={API_BASE} />}
        {activeTab === 'suggest' && <SuggestView apiBase={API_BASE} />}
        {activeTab === 'orders' && <Orders apiBase={API_BASE} />}
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
