import { useState, useEffect } from 'react'

export default function SuggestView({ apiBase }) {
    const [products, setProducts] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [suggestions, setSuggestions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [suggestLoading, setSuggestLoading] = useState(false)

    useEffect(() => {
        fetch(`${apiBase}/combo/analytics/products`)
            .then(r => r.json())
            .then(d => {
                if (d.success) setProducts(d.data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [apiBase])

    const handleSelect = async (productId) => {
        setSelectedId(productId)
        setSuggestLoading(true)
        setSuggestions(null)
        try {
            const res = await fetch(`${apiBase}/combo/suggest/${productId}`)
            const data = await res.json()
            if (data.success) setSuggestions(data)
        } catch (e) {
            console.error(e)
        }
        setSuggestLoading(false)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading menu…</p></div>

    const selectedProduct = products.find(p => p.product_id === selectedId)

    return (
        <>
            <div className="page-header">
                <h2>💡 Upsell Suggestions</h2>
                <p>Select a product to see what customers usually order with it</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Select a Product</h3>
                    <span className="badge badge-success">{products.length} items</span>
                </div>
                <div className="product-select-grid">
                    {products.map(p => (
                        <button
                            key={p.product_id}
                            className={`product-select-btn ${selectedId === p.product_id ? 'selected' : ''}`}
                            onClick={() => handleSelect(p.product_id)}
                        >
                            {p.name}
                            <span className="product-cat">{p.category} · ₹{p.selling_price}</span>
                        </button>
                    ))}
                </div>
            </div>

            {suggestLoading && (
                <div className="loading"><div className="spinner"></div><p>Finding suggestions for {selectedProduct?.name}…</p></div>
            )}

            {suggestions && (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-label">Selected Product</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{suggestions.product.name}</div>
                            <div className="stat-sub">₹{suggestions.product.selling_price} · {suggestions.product.category}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Orders Analyzed</div>
                            <div className="stat-value">{suggestions.total_orders_analyzed}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Orders with this item</div>
                            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{suggestions.orders_containing_product}</div>
                            <div className="stat-sub">{((suggestions.orders_containing_product / suggestions.total_orders_analyzed) * 100).toFixed(1)}% of all orders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Suggestions Found</div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{suggestions.individual_suggestions.length}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="card">
                            <div className="card-header">
                                <h3>🛒 Individual Suggestions</h3>
                                <span className="badge badge-success">Top {suggestions.individual_suggestions.length}</span>
                            </div>
                            {suggestions.individual_suggestions.length === 0 ? (
                                <div className="empty-state"><p>No individual suggestions found</p></div>
                            ) : (
                                suggestions.individual_suggestions.map((s, i) => (
                                    <div className="suggestion-item" key={i} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="suggestion-rank">{i + 1}</div>
                                            <div className="suggestion-info" style={{ flex: 1 }}>
                                                <h4>{s.name} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>₹{s.selling_price} · {s.category}</span></h4>
                                                <div className="reason" style={{ fontWeight: 500 }}>{s.reason}</div>
                                            </div>
                                            <div className="suggestion-score">
                                                <div className="score-val">{(s.upsell_score * 100).toFixed(0)}</div>
                                                <div className="score-label">score</div>
                                            </div>
                                        </div>

                                        {/* Insight Tags */}
                                        {s.insight_tags && s.insight_tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {s.insight_tags.map((tag, t) => (
                                                    <span key={t} style={{
                                                        fontSize: 10, padding: '3px 8px', borderRadius: 4,
                                                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        background: tag.includes('Margin') ? (tag.includes('High') ? 'var(--success-bg)' : tag.includes('Good') ? 'var(--star-bg)' : 'var(--trap-bg)')
                                                            : tag.includes('Strong') ? 'var(--gem-bg)' : 'var(--accent-bg)',
                                                        color: tag.includes('Margin') ? (tag.includes('High') ? 'var(--success)' : tag.includes('Good') ? 'var(--star)' : 'var(--trap)')
                                                            : tag.includes('Strong') ? 'var(--gem)' : 'var(--accent-light)',
                                                    }}>{tag}</span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Detailed Insight */}
                                        {s.insight && (
                                            <div style={{
                                                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                                                padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                                                borderLeft: '3px solid var(--accent)'
                                            }}>
                                                {s.insight}
                                            </div>
                                        )}

                                        {/* Quick Stats */}
                                        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                                            <span>📊 Conf: {(s.confidence * 100).toFixed(1)}%</span>
                                            <span>📈 Lift: {s.lift}</span>
                                            <span>🤝 Compat: {s.compatibility}</span>
                                            <span>💰 Profit: ₹{s.profit_per_unit || '—'}/unit</span>
                                            <span>🛒 Bought together: {s.times_bought_together}x</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3>🎯 Combo Suggestions</h3>
                                <span className="badge badge-gem">{suggestions.combo_suggestions.length} combos</span>
                            </div>
                            {suggestions.combo_suggestions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📦</div>
                                    <p>No saved combos contain this product yet.<br />Use the Smart Combos tab to generate new ones!</p>
                                </div>
                            ) : (
                                suggestions.combo_suggestions.map((c, i) => (
                                    <div className="combo-card" key={i} style={{ marginBottom: 12 }}>
                                        <h4>{c.combo_name}</h4>
                                        <div className="combo-items">
                                            {c.items.map((item, j) => (
                                                <span className="combo-item-tag" key={j}>
                                                    {item.name} (₹{item.base_price})
                                                </span>
                                            ))}
                                        </div>
                                        <div className="combo-price-row">
                                            <span className="combo-discount">Save ₹{c.discount}</span>
                                            <span className="combo-final-price">₹{c.combo_price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
