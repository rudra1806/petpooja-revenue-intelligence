import { useState, useEffect } from 'react'

// BCG classification display metadata — maps quadrant keys to UI labels and badge classes
const CLASSIFICATION_META = {
    star: { label: 'Star', badgeClass: 'badge-star', color: 'var(--classify-star)' },
    hidden_gem: { label: 'Hidden Gem', badgeClass: 'badge-gem', color: 'var(--classify-gem)' },
    volume_trap: { label: 'Volume Trap', badgeClass: 'badge-trap', color: 'var(--classify-trap)' },
    dog: { label: 'Dog', badgeClass: 'badge-dog', color: 'var(--classify-dog)' },
}

// PricingDashboard — Displays data-driven pricing & discount recommendations
// for every product. The owner can:
//   1. See the analytics-computed suggested price and max discount threshold
//   2. Apply the suggestion with one click ("Apply Suggestion" button)
//   3. Customize the price/discount values before saving ("Customize" button)
// Data comes from GET /api/combo/analytics/pricing (getPricingRecommendations)
// Applying saves via PUT /api/product/:id/pricing (applyPricing)
export default function PricingDashboard({ apiBase }) {
    const [data, setData] = useState(null)           // Full API response from /analytics/pricing
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState({})      // Tracks which product IDs are being saved
    const [toast, setToast] = useState(null)           // Toast notification {msg, type}
    const [filterClass, setFilterClass] = useState('all')  // BCG quadrant filter
    const [editingId, setEditingId] = useState(null)   // Product ID currently being customized
    const [editValues, setEditValues] = useState({})   // Custom price/discount values while editing

    const fetchData = () => {
        setLoading(true)
        fetch(`${apiBase}/combo/analytics/pricing`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { fetchData() }, [apiBase])

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const applyPricing = async (product, overrides = {}) => {
        const id = product.product_id
        setApplying(prev => ({ ...prev, [id]: true }))

<<<<<<< HEAD
        const body = {
            selling_price: overrides.selling_price ?? product.suggested_price,
            suggested_price: product.suggested_price,
            max_discount_pct: overrides.max_discount_pct ?? product.max_discount_pct,
=======
        const newSellingPrice = overrides.selling_price ?? product.suggested_price
        const newMaxDiscountPct = overrides.max_discount_pct ?? product.max_discount_pct

        const body = {
            selling_price: newSellingPrice,
            suggested_price: product.suggested_price,
            max_discount_pct: newMaxDiscountPct,
>>>>>>> 735fc33a3ef026984823929fad0408d575601243
            min_price: product.min_price,
        }

        try {
            const res = await fetch(`${apiBase}/product/${id}/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const json = await res.json()
            if (json.success) {
                showToast(`${product.name} pricing updated`)
                setEditingId(null)
<<<<<<< HEAD
                fetchData()
=======
                // Update only the affected product in local state — no full page reload
                setData(prev => ({
                    ...prev,
                    data: prev.data.map(p =>
                        p.product_id === id
                            ? {
                                ...p,
                                current_price: newSellingPrice,
                                suggested_price: newSellingPrice,   // suggestion is now the live price
                                price_change_amt: 0,                // no remaining change after applying
                                price_change_pct: 0,
                                max_discount_pct: newMaxDiscountPct,
                                max_discount_amt: Math.round(newSellingPrice * newMaxDiscountPct / 100),
                            }
                            : p
                    )
                }))
>>>>>>> 735fc33a3ef026984823929fad0408d575601243
            } else {
                showToast(json.message || 'Failed to apply', 'error')
            }
        } catch {
            showToast('Failed to apply pricing', 'error')
        }
        setApplying(prev => ({ ...prev, [id]: false }))
    }

    const startEdit = (p) => {
        setEditingId(p.product_id)
        setEditValues({
            selling_price: p.suggested_price,
            max_discount_pct: p.max_discount_pct,
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditValues({})
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Computing pricing recommendations...</p></div>
    if (!data?.success) return <div className="empty-state"><p>No data available</p></div>

    const products = filterClass === 'all' ? data.data : data.data.filter(p => p.classification === filterClass)
    const summary = data.summary

    return (
        <>
            <div className="page-header">
                <h2>Pricing & Discount Intelligence</h2>
                <p>Data-driven price suggestions and discount thresholds for {data.total_products} products based on {data.total_orders_analyzed} orders</p>
            </div>

            {/* SUMMARY CARDS */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label">Avg Margin</div>
                    <div className="stat-value">{summary.avg_margin}%</div>
                    <div className="stat-sub">Across all products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Price Increases</div>
                    <div className="stat-value" style={{ color: 'var(--positive)' }}>{summary.products_to_increase}</div>
                    <div className="stat-sub">Products to increase</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Price Decreases</div>
                    <div className="stat-value" style={{ color: 'var(--negative)' }}>{summary.products_to_decrease}</div>
                    <div className="stat-sub">Products to decrease</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Revenue Impact</div>
                    <div className="stat-value" style={{ color: summary.potential_revenue_change >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                        {summary.potential_revenue_change >= 0 ? '+' : ''}{'\u20B9'}{summary.potential_revenue_change.toLocaleString()}
                    </div>
                    <div className="stat-sub">Potential change if applied</div>
                </div>
            </div>

            {/* FILTER */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                    <h3>Product Pricing Recommendations</h3>
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        style={{
                            background: 'var(--bg-surface)', color: 'var(--text-primary)',
                            border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)',
                            padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
                        }}
                    >
                        <option value="all">All Classifications</option>
                        <option value="star">Stars</option>
                        <option value="hidden_gem">Hidden Gems</option>
                        <option value="volume_trap">Volume Traps</option>
                        <option value="dog">Dogs</option>
                    </select>
                </div>

                {/* PRICING CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px', padding: '16px' }}>
                    {products.map(p => {
                        const meta = CLASSIFICATION_META[p.classification] || {}
                        const isEditing = editingId === p.product_id
                        const isApplying = applying[p.product_id]
                        const priceUp = p.price_change_amt > 0
                        const priceDown = p.price_change_amt < 0
                        const noChange = p.price_change_amt === 0

                        return (
                            <div key={p.product_id} className="card" style={{ marginBottom: 0, border: '1px solid var(--border-light)' }}>
                                {/* HEADER */}
                                <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{p.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.category}</div>
                                    </div>
                                    <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                                </div>

                                {/* PRICE COMPARISON */}
                                <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Current</div>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 600 }}>{'\u20B9'}{p.current_price}</div>
                                    </div>
                                    <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>→</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Suggested</div>
                                        <div style={{
                                            fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 600,
                                            color: priceUp ? 'var(--positive)' : priceDown ? 'var(--negative)' : 'var(--text-primary)'
                                        }}>
                                            {'\u20B9'}{isEditing ? editValues.selling_price : p.suggested_price}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Change</div>
                                        <div style={{
                                            fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 600,
                                            color: priceUp ? 'var(--positive)' : priceDown ? 'var(--negative)' : 'var(--text-muted)',
                                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                            background: priceUp ? 'var(--positive-subtle)' : priceDown ? 'var(--negative-subtle)' : 'var(--neutral-subtle)',
                                            display: 'inline-block'
                                        }}>
                                            {noChange ? '—' : `${priceUp ? '+' : ''}${p.price_change_pct}%`}
                                        </div>
                                    </div>
                                </div>

                                {/* METRICS */}
                                <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <div style={{ padding: '8px', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Margin</div>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '13px' }}>{p.margin_pct}%</div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Demand</div>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '13px' }}>{p.demand_score}</div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Revenue</div>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '13px' }}>{p.revenue_contribution}%</div>
                                    </div>
                                </div>

                                {/* DISCOUNT THRESHOLD */}
                                <div style={{ padding: '0 16px 12px' }}>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--accent-subtle)', border: '1px solid var(--accent)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Discount Threshold</div>
                                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '16px', color: 'var(--accent-text)' }}>
                                                {isEditing ? editValues.max_discount_pct : p.max_discount_pct}% <span style={{ fontSize: '12px', fontWeight: 400 }}>({'\u20B9'}{p.max_discount_amt} off)</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--accent-text)', textAlign: 'right' }}>
                                            Min: {'\u20B9'}{p.min_price}<br />
                                            Headroom: {p.margin_headroom}%
                                        </div>
                                    </div>
                                </div>

                                {/* STRATEGY */}
                                <div style={{ padding: '0 16px 12px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                                        {p.strategy}
                                    </div>
                                </div>

                                {/* ACTIONS */}
                                <div style={{ padding: '0 16px 14px', display: 'flex', gap: '8px' }}>
                                    {isEditing ? (
                                        <>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Price ({'\u20B9'})</label>
                                                        <input
                                                            type="number"
                                                            min={p.cost}
                                                            value={editValues.selling_price}
                                                            onChange={e => setEditValues(prev => ({ ...prev, selling_price: Number(e.target.value) }))}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Max Discount (%)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={p.margin_headroom}
                                                            value={editValues.max_discount_pct}
                                                            onChange={e => setEditValues(prev => ({ ...prev, max_discount_pct: Number(e.target.value) }))}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button className="btn-save" style={{ flex: 1, fontSize: '11px', padding: '6px 12px' }}
                                                        disabled={isApplying}
                                                        onClick={() => applyPricing(p, editValues)}>
                                                        {isApplying ? 'Saving...' : 'Save Custom'}
                                                    </button>
                                                    <button className="btn-cancel" style={{ fontSize: '11px', padding: '6px 12px' }}
                                                        onClick={cancelEdit}>Cancel</button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn-add"
                                                style={{ flex: 1, fontSize: '11px', padding: '6px 12px' }}
                                                disabled={isApplying || noChange}
                                                onClick={() => applyPricing(p)}
                                            >
                                                {isApplying ? 'Applying...' : noChange ? 'No Change Needed' : 'Apply Suggestion'}
                                            </button>
                                            <button
                                                className="btn-cancel"
                                                style={{ fontSize: '11px', padding: '6px 12px' }}
                                                onClick={() => startEdit(p)}
                                            >
                                                Customize
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* TOAST */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.msg}
                </div>
            )}
        </>
    )
}
