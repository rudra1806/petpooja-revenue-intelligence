import { useState } from 'react'
import './index.css'
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

export default App
