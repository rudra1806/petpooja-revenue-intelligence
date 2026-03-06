import { useState, useEffect } from 'react'

export default function SuggestView({ apiBase }) {
    const [products, setProducts] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [suggestions, setSuggestions] = useState(null)
    const [loading, setLoading] = useState(true)
    const [suggestLoading, setSuggestLoading] = useState(false)

    const [pickedItems, setPickedItems] = useState(new Set())
    const [modalOpen, setModalOpen] = useState(false)
    const [comboForm, setComboForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

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
        setPickedItems(new Set())
        try {
            const res = await fetch(`${apiBase}/combo/suggest/${productId}`)
            const data = await res.json()
            if (data.success) setSuggestions(data)
        } catch (e) {
            console.error(e)
        }
        setSuggestLoading(false)
    }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const togglePick = (productId) => {
        setPickedItems(prev => {
            const next = new Set(prev)
            if (next.has(productId)) next.delete(productId)
            else next.add(productId)
            return next
        })
    }

    const openCreateCombo = () => {
        if (!suggestions) return
        const baseProduct = suggestions.product

        // Build item list — include the base product and all picked suggestions
        const allItems = [
            { product_id: baseProduct._id, name: baseProduct.name, quantity: 1, base_price: baseProduct.selling_price }
        ]

        // Map products by id for quick lookup of max_discount_pct
        const productMap = {}
        for (const p of products) productMap[String(p.product_id)] = p

        for (const s of suggestions.individual_suggestions) {
            if (pickedItems.has(s.product_id)) {
                allItems.push({ product_id: s.product_id, name: s.name, quantity: 1, base_price: s.selling_price })
            }
        }

        const totalSelling = allItems.reduce((sum, i) => sum + i.base_price, 0)

        // ── DATA-DRIVEN DISCOUNT ──────────────────────────────────────────────
        // Average max_discount_pct across all items in this custom combo.
        // Fall back to 10% per item if not yet set via Pricing Dashboard.
        // Cap at 15% to prevent over-discounting (matches backend logic).
        const avgMaxDiscount = allItems.reduce((sum, item) => {
            const p = productMap[String(item.product_id)]
            return sum + (p?.max_discount_pct != null ? p.max_discount_pct : 10)
        }, 0) / allItems.length
        const discountPct = Math.min(avgMaxDiscount, 15) / 100
        const discount = Math.round(totalSelling * discountPct)
        const comboPrice = totalSelling - discount

        setComboForm({
            combo_name: allItems.map(i => i.name.split(' ')[0]).join(' + ') + ' Combo',
            description: `Custom combo: ${allItems.map(i => i.name).join(' + ')}`,
            items: allItems,
            total_selling_price: totalSelling,
            combo_price: comboPrice,
            discount: discount,
            total_cost: 0,
            combo_score: 0,
            rating: 0,
        })
        setModalOpen(true)
    }

    const handleFormChange = (field, value) => {
        setComboForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveCombo = async () => {
        if (!comboForm) return
        setSaving(true)
        try {
            const res = await fetch(`${apiBase}/combo/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    combo_name: comboForm.combo_name,
                    description: comboForm.description,
                    items: comboForm.items,
                    total_selling_price: Number(comboForm.total_selling_price),
                    combo_price: Number(comboForm.combo_price),
                    discount: Number(comboForm.discount),
                    total_cost: Number(comboForm.total_cost),
                    combo_score: Number(comboForm.combo_score),
                    rating: Number(comboForm.rating),
                }),
            })
            const result = await res.json()
            if (result.success) {
                showToast(`"${comboForm.combo_name}" saved`)
                setModalOpen(false)
                setPickedItems(new Set())
            } else {
                showToast(result.message || 'Failed to save', 'error')
            }
        } catch (e) {
            showToast('Network error: ' + e.message, 'error')
        }
        setSaving(false)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading menu...</p></div>

    const selectedProduct = products.find(p => p.product_id === selectedId)
    const pickedCount = pickedItems.size

    return (
        <>
            <div className="page-header">
                <h2>Upsell Suggestions</h2>
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
                            <span className="product-cat">{p.category} &middot; {'\u20B9'}{p.selling_price}</span>
                        </button>
                    ))}
                </div>
            </div>

            {suggestLoading && (
                <div className="loading"><div className="spinner"></div><p>Finding suggestions for {selectedProduct?.name}...</p></div>
            )}

            {suggestions && (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-label">Selected</div>
                            <div className="stat-value" style={{ fontSize: 18 }}>{suggestions.product.name}</div>
                            <div className="stat-sub">{'\u20B9'}{suggestions.product.selling_price} &middot; {suggestions.product.category}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Orders Analyzed</div>
                            <div className="stat-value">{suggestions.total_orders_analyzed}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Contains This Item</div>
                            <div className="stat-value">{suggestions.orders_containing_product}</div>
                            <div className="stat-sub">{((suggestions.orders_containing_product / suggestions.total_orders_analyzed) * 100).toFixed(1)}% of orders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Suggestions</div>
                            <div className="stat-value">{suggestions.individual_suggestions.length}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="card">
                            <div className="card-header">
                                <h3>Individual Suggestions</h3>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {pickedCount > 0 && (
                                        <button className="btn-add" style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }} onClick={openCreateCombo}>
                                            Create Combo ({pickedCount} + {suggestions.product.name.split(' ')[0]})
                                        </button>
                                    )}
                                    <span className="badge badge-success">Top {suggestions.individual_suggestions.length}</span>
                                </div>
                            </div>

                            {pickedCount > 0 && (
                                <div style={{
                                    padding: '8px 12px', marginBottom: 10, borderRadius: 'var(--radius)',
                                    background: 'var(--accent-subtle)', border: '1px solid var(--accent)',
                                    fontSize: 12, color: 'var(--accent-text)'
                                }}>
                                    <strong>{suggestions.product.name}</strong> + {
                                        suggestions.individual_suggestions
                                            .filter(s => pickedItems.has(s.product_id))
                                            .map(s => s.name).join(' + ')
                                    }
                                </div>
                            )}

                            {suggestions.individual_suggestions.length === 0 ? (
                                <div className="empty-state"><p>No individual suggestions found</p></div>
                            ) : (
                                suggestions.individual_suggestions.map((s, i) => {
                                    const isPicked = pickedItems.has(s.product_id)
                                    return (
                                        <div
                                            className="suggestion-item"
                                            key={i}
                                            style={{
                                                flexDirection: 'column', alignItems: 'stretch', gap: 6,
                                                borderColor: isPicked ? 'var(--accent)' : undefined,
                                                background: isPicked ? 'var(--accent-subtle)' : undefined,
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <button
                                                    onClick={() => togglePick(s.product_id)}
                                                    style={{
                                                        width: 22, height: 22, borderRadius: 'var(--radius-sm)',
                                                        border: `2px solid ${isPicked ? 'var(--accent)' : 'var(--border-medium)'}`,
                                                        background: isPicked ? 'var(--accent)' : 'transparent', color: 'white',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, flexShrink: 0, transition: 'all var(--transition)', fontFamily: 'inherit'
                                                    }}
                                                >
                                                    {isPicked ? '\u2713' : ''}
                                                </button>

                                                <div className="suggestion-rank">{i + 1}</div>
                                                <div className="suggestion-info" style={{ flex: 1 }}>
                                                    <h4>{s.name} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>{'\u20B9'}{s.selling_price} &middot; {s.category}</span></h4>
                                                    <div className="reason" style={{ fontWeight: 500 }}>{s.reason}</div>
                                                </div>
                                                <div className="suggestion-score">
                                                    <div className="score-val">{(s.upsell_score * 100).toFixed(0)}</div>
                                                    <div className="score-label">score</div>
                                                </div>
                                            </div>

                                            {s.insight_tags && s.insight_tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {s.insight_tags.map((tag, t) => (
                                                        <span key={t} style={{
                                                            fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                                                            fontWeight: 600, letterSpacing: '0.2px',
                                                            background: tag.includes('Margin') ? (tag.includes('High') ? 'var(--positive-subtle)' : tag.includes('Good') ? 'var(--caution-subtle)' : 'var(--negative-subtle)')
                                                                : tag.includes('Strong') ? 'var(--classify-gem-bg)' : 'var(--neutral-subtle)',
                                                            color: tag.includes('Margin') ? (tag.includes('High') ? 'var(--positive)' : tag.includes('Good') ? 'var(--caution)' : 'var(--negative)')
                                                                : tag.includes('Strong') ? 'var(--classify-gem)' : 'var(--neutral)',
                                                        }}>{tag}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {s.insight && (
                                                <div style={{
                                                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                                                    padding: '6px 10px', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-sm)',
                                                    borderLeft: '2px solid var(--accent)'
                                                }}>
                                                    {s.insight}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                                <span>Conf: {(s.confidence * 100).toFixed(1)}%</span>
                                                <span>Lift: {s.lift}</span>
                                                <span>Compat: {s.compatibility}</span>
                                                <span>Profit: {'\u20B9'}{s.profit_per_unit || '\u2014'}/unit</span>
                                                <span>Together: {s.times_bought_together}x</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3>Combo Suggestions</h3>
                                <span className="badge badge-gem">{suggestions.combo_suggestions.length} combos</span>
                            </div>
                            {suggestions.combo_suggestions.length === 0 ? (
                                <div className="empty-state">
                                    <p>No saved combos contain this product yet.<br />Use the Combos tab to generate new ones.</p>
                                </div>
                            ) : (
                                suggestions.combo_suggestions.map((c, i) => (
                                    <div className="combo-card" key={i} style={{ marginBottom: 10 }}>
                                        <h4>{c.combo_name}</h4>
                                        <div className="combo-items">
                                            {c.items.map((item, j) => (
                                                <span className="combo-item-tag" key={j}>
                                                    {item.name} ({'\u20B9'}{item.base_price})
                                                </span>
                                            ))}
                                        </div>
                                        <div className="combo-price-row">
                                            <span className="combo-discount">Save {'\u20B9'}{c.discount}</span>
                                            <span className="combo-final-price">{'\u20B9'}{c.combo_price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {modalOpen && comboForm && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Combo</h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>&#x2715;</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Combo Name</label>
                                <input type="text" value={comboForm.combo_name} onChange={e => handleFormChange('combo_name', e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={comboForm.description}
                                    onChange={e => handleFormChange('description', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Combo Price ({'\u20B9'})</label>
                                    <input type="number" value={comboForm.combo_price} onChange={e => handleFormChange('combo_price', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Original Price ({'\u20B9'})</label>
                                    <input type="number" value={comboForm.total_selling_price} onChange={e => handleFormChange('total_selling_price', e.target.value)} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Discount ({'₹'})
                                        {comboForm.total_selling_price > 0 && (
                                            <span style={{
                                                fontSize: 10, padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                                                background: 'var(--accent-subtle)', color: 'var(--accent-text)',
                                                fontWeight: 600, letterSpacing: '0.3px'
                                            }}>
                                                {((comboForm.discount / comboForm.total_selling_price) * 100).toFixed(1)}% auto
                                            </span>
                                        )}
                                    </label>
                                    <input type="number" value={comboForm.discount} onChange={e => handleFormChange('discount', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Rating (0-5)</label>
                                    <input type="number" step="0.1" min="0" max="5" value={comboForm.rating} onChange={e => handleFormChange('rating', e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Items</label>
                                <div className="modal-items-list">
                                    {comboForm.items.map((item, i) => (
                                        <div className="modal-item" key={i}>
                                            <span className="modal-item-name">{item.name}</span>
                                            <span className="modal-item-price">{'\u20B9'}{item.base_price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveCombo} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Combo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.msg}
                </div>
            )}
        </>
    )
}
