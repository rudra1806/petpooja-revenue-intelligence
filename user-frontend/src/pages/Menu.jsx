import { useState, useEffect } from 'react'

// Map product names to image filenames in /menu/
const IMAGE_MAP = {
  'Classic Burger': 'Classic Burger.avif',
  'Margherita Pizza': 'Margherita Pizza.avif',
  'Penne Pasta': 'Penne Pasta.avif',
  'Grilled Sandwich': '2db633712b7911bcd2a0bb1fe12ec811.avif',
  'Chicken Wrap': 'Chicken Wrap.avif',
  'Paneer Tikka Wrap': 'Paneer Tikka Wrap.avif',
  'Veggie Burger': 'veggie_burger.avif',
  'Pepperoni Pizza': 'Pepperoni_Pizza .avif',
  'French Fries': 'french_fries.avif',
  'Chicken Nuggets': 'chicken_nuggets.avif',
  'Garlic Bread': 'Garlic_bread.avif',
  'Onion Rings': 'onion_rings.avif',
  'Mozzarella Sticks': 'Mozarella_sticks.avif',
  'Chocolate Brownie': 'Chocolate Brownie.avif',
  'Vanilla Ice Cream': 'Vanilla Ice Cream.avif',
  'New York Cheesecake': 'New York Cheesecake.avif',
  'Gulab Jamun': 'Gulab Jamun.avif',
  'Chocolate Mousse': 'Chocolate Mousse.avif',
  'Coke': 'Coke.avif',
  'Mango Lassi': 'Mango Lassi.avif',
  'Cold Coffee': 'Cold Coffee.avif',
  'Fresh Lemonade': 'Fresh Lemonade.avif',
  'Masala Chai': 'Masala Chai.avif',
  'Mojito': 'Mojito.avif',
  'Chocolate Milkshake': 'Chocolate Milkshake.avif',
}

function getImageUrl(name) {
  const file = IMAGE_MAP[name]
  if (file) return `/menu/${file}`
  return null
}

// Veg / Non-veg indicator helper
const NON_VEG_ITEMS = ['Classic Burger', 'Chicken Wrap', 'Pepperoni Pizza', 'Chicken Nuggets']

function isVeg(name) {
  return !NON_VEG_ITEMS.includes(name)
}

export default function Menu({ apiBase }) {
  const [products, setProducts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [popupImg, setPopupImg] = useState(null)

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
  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const categoryIcons = {
    all: '🍽️',
    main: '🍔',
    snack: '🍟',
    dessert: '🍰',
    beverages: '🥤',
  }

  return (
    <>
      <div className="menu-page-header">
        <div className="menu-header-left">
          <h2>Our Menu</h2>
          <p>Discover delicious dishes crafted with love</p>
        </div>
        <div className="menu-search-wrap">
          <span className="menu-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="menu-search-input"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="filter-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            <span className="filter-tab-icon">{categoryIcons[cat] || '🍽️'}</span>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Products Section */}
      <div className="section-header">
        <h3>Dishes</h3>
        <span className="section-count">{filtered.length} items</span>
      </div>

      <div className="swiggy-menu-grid">
        {filtered.map(p => {
          const imgUrl = getImageUrl(p.name)
          const veg = isVeg(p.name)

          return (
            <div className="swiggy-card" key={p._id}>
              <div className="swiggy-card-info">
                <div className="swiggy-veg-badge">
                  <span className={`veg-indicator ${veg ? 'veg' : 'non-veg'}`}>
                    <span className="veg-dot"></span>
                  </span>
                </div>
                <h4 className="swiggy-item-name">{p.name}</h4>
                <div className="swiggy-price-row">
                  <span className="swiggy-price">₹{p.selling_price}</span>
                  {p.rating > 0 && (
                    <span className="swiggy-rating">★ {p.rating.toFixed(1)}</span>
                  )}
                </div>
                {p.description && <p className="swiggy-desc">{p.description}</p>}
              </div>
              <div
                className="swiggy-card-img-wrap"
                onClick={() => imgUrl && setPopupImg({ src: imgUrl, name: p.name })}
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={p.name} className="swiggy-card-img" loading="lazy" />
                ) : (
                  <div className="swiggy-card-img-placeholder">
                    <span>{categoryIcons[p.category] || '🍽️'}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Combos */}
      {combos.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 40 }}>
            <h3>🔥 Combo Deals</h3>
            <span className="section-count">{combos.length} combos</span>
          </div>
          <div className="combo-grid">
            {combos.map(c => (
              <div className="combo-card" key={c._id}>
                <div className="combo-badge-strip">
                  <span className="combo-save-badge">
                    SAVE ₹{c.discount}
                  </span>
                </div>
                <h4>{c.combo_name}</h4>
                <div className="combo-items">
                  {(c.items || []).map((item, i) => (
                    <span className="combo-item-tag" key={i}>{item.name || item.product_name || `Item ${i + 1}`}</span>
                  ))}
                </div>
                <div className="combo-price-row">
                  <div>
                    <span className="combo-final-price">₹{c.combo_price}</span>
                    {c.total_selling_price > c.combo_price && (
                      <span className="combo-original-price" style={{ marginLeft: 8 }}>₹{c.total_selling_price}</span>
                    )}
                  </div>
                  {c.discount > 0 && <span className="combo-discount">Save ₹{c.discount}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Image Popup / Lightbox */}
      {popupImg && (
        <div className="img-popup-overlay" onClick={() => setPopupImg(null)}>
          <div className="img-popup-box" onClick={e => e.stopPropagation()}>
            <button className="img-popup-close" onClick={() => setPopupImg(null)}>✕</button>
            <img src={popupImg.src} alt={popupImg.name} className="img-popup-img" />
            <p className="img-popup-name">{popupImg.name}</p>
          </div>
        </div>
      )}
    </>
  )
}
