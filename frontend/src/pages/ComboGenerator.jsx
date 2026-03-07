import { useState, useEffect } from 'react'

export default function ComboGenerator({ apiBase }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modalCombo, setModalCombo] = useState(null)
    const [saving, setSaving] = useState(false)
    const [savedIds, setSavedIds] = useState(new Set())
    const [toast, setToast] = useState(null)

    useEffect(() => {
        fetch(`${apiBase}/combo/generate`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [apiBase])

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const openModal = (combo, idx) => {
        setModalCombo({
            ...combo,
            _idx: idx,
            combo_name: combo.combo_name,
            description: combo.description || '',
            combo_price: combo.combo_price,
            discount: combo.discount,
            total_selling_price: combo.total_selling_price,
            total_cost: combo.total_cost || 0,
            support: combo.support || 0,
            confidence: combo.confidence || 0,
            combo_score: combo.combo_score || 0,
            rating: 0,
        })
    }

    const handleFormChange = (field, value) => {
        setModalCombo(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!modalCombo) return
        setSaving(true)
        try {
            const body = {
                combo_name: modalCombo.combo_name,
                description: modalCombo.description || '',
                items: modalCombo.items.map(i => ({
                    product_id: i.product_id,
                    name: i.name,
                    quantity: i.quantity || 1,
                    base_price: i.base_price,
                })),
                total_selling_price: Number(modalCombo.total_selling_price),
                combo_price: Number(modalCombo.combo_price),
                discount: Number(modalCombo.discount),
                total_cost: Number(modalCombo.total_cost),
                support: Number(modalCombo.support),
                confidence: Number(modalCombo.confidence),
                combo_score: Number(modalCombo.combo_score),
                rating: Number(modalCombo.rating),
            }
            const res = await fetch(`${apiBase}/combo/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const result = await res.json()
            if (result.success) {
                setSavedIds(prev => new Set([...prev, modalCombo._idx]))
                showToast(`"${modalCombo.combo_name}" saved to database`)
                setModalCombo(null)
            } else {
                showToast(result.message || 'Failed to save', 'error')
            }
        } catch (e) {
            showToast('Network error: ' + e.message, 'error')
        }
        setSaving(false)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Generating combos from order data...</p></div>
    if (!data?.success) return <div className="empty-state"><p>Failed to generate combos</p></div>

    const cls = data.product_classifications

    return (
        <>
            <div className="page-header">
                <h2>Combo Generator</h2>
                <p>Generated from {data.total_orders_analyzed} orders across {data.total_products} products</p>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label">Orders Analyzed</div>
                    <div className="stat-value">{data.total_orders_analyzed}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Combos Generated</div>
                    <div className="stat-value">{data.combos_generated}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Stars</div>
                    <div className="stat-value">{cls.stars.length}</div>
                    <div className="stat-sub">{cls.stars.slice(0, 3).join(', ')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Hidden Gems</div>
                    <div className="stat-value">{cls.hidden_gems.length}</div>
                    <div className="stat-sub">{cls.hidden_gems.slice(0, 3).join(', ')}</div>
                </div>
            </div>

            <div className="combo-grid">
                {data.combos.map((combo, idx) => (
                    <div className="combo-card" key={idx}>
                        <div className="combo-rank">#{idx + 1}</div>
                        <h4>{combo.combo_name}</h4>

                        <div style={{ marginBottom: 8 }}>
                            <span className={`strategy-tag ${combo.strategy === 'pattern_based' ? 'pattern' : 'hidden_gem'}`}>
                                {combo.strategy === 'pattern_based' ? 'Pattern-Based' : 'Hidden Gem'}
                            </span>
                        </div>

                        <div className="combo-items">
                            {combo.items.map((item, i) => (
                                <span className="combo-item-tag" key={i}>{item.name} ({'\u20B9'}{item.base_price})</span>
                            ))}
                        </div>

                        <div className="combo-meta">
                            <div>Score: <span className="meta-value">{combo.combo_score}</span></div>
                            <div>Compat: <span className="meta-value">{combo.compatibility_score}</span></div>
                            {combo.confidence > 0 && <div>Conf: <span className="meta-value">{combo.confidence}</span></div>}
                            {combo.lift > 0 && <div>Lift: <span className="meta-value">{combo.lift}</span></div>}
                        </div>

                        {(() => {
                            const cost = combo.total_cost || combo.items?.reduce((s, it) => s + (it.base_price * 0.5), 0) || 0
                            const margin = combo.combo_price - cost
                            const marginPct = combo.combo_price > 0 ? ((margin / combo.combo_price) * 100).toFixed(1) : 0
                            return (
                                <div className={`margin-bar ${marginPct >= 50 ? 'high' : 'low'}`}>
                                    <span className="margin-label">Profit Margin</span>
                                    <span className="margin-value">{marginPct}%</span>
                                </div>
                            )
                        })()}

                        <div className="combo-price-row">
                            <div>
                                <span className="combo-original-price">{'\u20B9'}{combo.total_selling_price}</span>
                                {' '}
                                <span className="combo-discount">-{'\u20B9'}{combo.discount}</span>
                            </div>
                            <span className="combo-final-price">{'\u20B9'}{combo.combo_price}</span>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            {savedIds.has(idx) ? (
                                <button className="btn-saved" disabled>Saved</button>
                            ) : (
                                <button className="btn-add" onClick={() => openModal(combo, idx)}>
                                    Add to Menu
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modalCombo && (
                <div className="modal-overlay" onClick={() => setModalCombo(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Combo</h3>
                            <button className="modal-close" onClick={() => setModalCombo(null)}>&#x2715;</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Combo Name</label>
                                <input
                                    type="text"
                                    value={modalCombo.combo_name}
                                    onChange={e => handleFormChange('combo_name', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={modalCombo.description}
                                    onChange={e => handleFormChange('description', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Combo Price ({'\u20B9'})</label>
                                    <input
                                        type="number"
                                        value={modalCombo.combo_price}
                                        onChange={e => handleFormChange('combo_price', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Original Price ({'\u20B9'})</label>
                                    <input
                                        type="number"
                                        value={modalCombo.total_selling_price}
                                        onChange={e => handleFormChange('total_selling_price', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Discount ({'\u20B9'})</label>
                                    <input
                                        type="number"
                                        value={modalCombo.discount}
                                        onChange={e => handleFormChange('discount', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total Cost ({'\u20B9'})</label>
                                    <input
                                        type="number"
                                        value={modalCombo.total_cost}
                                        onChange={e => handleFormChange('total_cost', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rating (0-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={modalCombo.rating}
                                        onChange={e => handleFormChange('rating', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Combo Score</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={modalCombo.combo_score}
                                        readOnly
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Items</label>
                                <div className="modal-items-list">
                                    {modalCombo.items.map((item, i) => (
                                        <div className="modal-item" key={i}>
                                            <span className="modal-item-name">{item.name}</span>
                                            <span className="modal-item-price">{'\u20B9'}{item.base_price}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setModalCombo(null)}>Cancel</button>
                            <button className="btn-save" onClick={handleSave} disabled={saving}>
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
