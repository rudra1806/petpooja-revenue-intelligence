import { useState, useEffect } from 'react'

export default function Menu({ apiBase }) {
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/product/all`).then(r => r.json()),
      fetch(`${apiBase}/combo/all`).then(r => r.json()),
    ])
      .then(([prodData, comboData]) => {
        setProducts(prodData.data || [])
        setCombos(comboData.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiBase])

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading menu...</p></div>

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory)

  return (
    <>
      <div className="page-header">
        <h2>Our Menu</h2>
        <p>Browse our dishes and combos</p>
      </div>

      {/* Category filter */}
      <div className="filter-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="section-header">
        <h3>Dishes</h3>
        <span className="section-count">{filtered.length} items</span>
      </div>

      <div className="menu-grid">
        {filtered.map(p => (
          <div className="menu-card" key={p._id}>
            <div className="menu-card-top">
              <h4>{p.name}</h4>
              <span className={`badge badge-${p.category}`}>{p.category}</span>
            </div>
            {p.description && <p className="menu-desc">{p.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="menu-price">{'\u20B9'}{p.selling_price}</span>
              {p.rating > 0 && <span className="menu-rating">{'\u2605'} {p.rating.toFixed(1)}</span>}
            </div>
            {p.modifiers && p.modifiers.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {p.modifiers.map((m, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                    {m.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Combos */}
      {combos.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <h3>Combo Deals</h3>
            <span className="section-count">{combos.length} combos</span>
          </div>
          <div className="combo-grid">
            {combos.map(c => (
              <div className="combo-card" key={c._id}>
                <h4>{c.combo_name}</h4>
                <div className="combo-items">
                  {(c.items || []).map((item, i) => (
                    <span className="combo-item-tag" key={i}>{item.name || item.product_name || `Item ${i + 1}`}</span>
                  ))}
                </div>
                <div className="combo-price-row">
                  <div>
                    <span className="combo-final-price">{'\u20B9'}{c.combo_price}</span>
                    {c.total_selling_price > c.combo_price && (
                      <span className="combo-original-price" style={{ marginLeft: 8 }}>{'\u20B9'}{c.total_selling_price}</span>
                    )}
                  </div>
                  {c.discount > 0 && <span className="combo-discount">Save {'\u20B9'}{c.discount}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
