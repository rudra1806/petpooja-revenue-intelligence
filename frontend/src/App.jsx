import { useState } from 'react'
import './index.css'
import ProductAnalytics from './pages/ProductAnalytics'
import ComboGenerator from './pages/ComboGenerator'
import SuggestView from './pages/SuggestView'
import ManageCombos from './pages/ManageCombos'

const API_BASE = 'http://localhost:3000/api'

const NAV_ITEMS = [
  { id: 'products', icon: '📊', label: 'Product Analytics' },
  { id: 'combos', icon: '🎯', label: 'Smart Combos' },
  { id: 'manage', icon: '📋', label: 'Manage Combos' },
  { id: 'suggest', icon: '💡', label: 'Upsell Suggest' },
]

function App() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🍽️</div>
          <h1>
            MinedAI
            <span>Revenue Intelligence</span>
          </h1>
        </div>
        <nav className="nav-items">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'products' && <ProductAnalytics apiBase={API_BASE} />}
        {activeTab === 'combos' && <ComboGenerator apiBase={API_BASE} />}
        {activeTab === 'manage' && <ManageCombos apiBase={API_BASE} />}
        {activeTab === 'suggest' && <SuggestView apiBase={API_BASE} />}
      </main>
    </div>
  )
}

export default App
