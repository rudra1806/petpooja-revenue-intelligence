import { useState } from 'react'
import './index.css'
import ProductAnalytics from './pages/ProductAnalytics'
import ComboGenerator from './pages/ComboGenerator'
import SuggestView from './pages/SuggestView'
import ManageCombos from './pages/ManageCombos'

const API_BASE = 'http://localhost:3001/api'

const NAV_ITEMS = [
  { id: 'products', label: 'Analytics' },
  { id: 'combos', label: 'Combos' },
  { id: 'manage', label: 'Manage' },
  { id: 'suggest', label: 'Upsell' },
]

function App() {
  const [activeTab, setActiveTab] = useState('products')

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
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

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
