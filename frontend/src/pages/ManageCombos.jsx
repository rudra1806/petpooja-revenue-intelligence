import { useState, useEffect } from 'react'

const CLS_META = {
    star: { label: 'Star', cls: 'badge-star' },
    hidden_gem: { label: 'Hidden Gem', cls: 'badge-gem' },
    volume_trap: { label: 'Volume Trap', cls: 'badge-trap' },
    dog: { label: 'Dog', cls: 'badge-dog' },
}

const AFFINITY_STYLE = {
    very_strong: { bg: 'var(--positive-subtle)', color: 'var(--positive)', label: 'Very Strong' },
    strong: { bg: 'var(--classify-gem-bg)', color: 'var(--classify-gem)', label: 'Strong' },
    moderate: { bg: 'var(--caution-subtle)', color: 'var(--caution)', label: 'Moderate' },
    weak: { bg: 'var(--negative-subtle)', color: 'var(--negative)', label: 'Weak' },
}

export default function ManageCombos({ apiBase }) {
    const [combos, setCombos] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null)
    const [confirmId, setConfirmId] = useState(null)
    const [toast, setToast] = useState(null)

    const [analyticsData, setAnalyticsData] = useState(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)

    const fetchCombos = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${apiBase}/combo/all`)
            const data = await res.json()
            if (data.success) setCombos(data.data)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => { fetchCombos() }, [apiBase])

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleDelete = async (id) => {
        setDeleting(id)
        try {
            const res = await fetch(`${apiBase}/combo/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setCombos(prev => prev.filter(c => c._id !== id))
                showToast('Combo deleted')
            } else showToast(data.message || 'Failed to delete', 'error')
        } catch (e) { showToast('Network error', 'error') }
        setDeleting(null)
        setConfirmId(null)
    }

    const openAnalytics = async (comboId) => {
        setAnalyticsLoading(true)
        setAnalyticsData(null)
        try {
            const res = await fetch(`${apiBase}/combo/analytics/combo/${comboId}`)
            const data = await res.json()
            if (data.success) setAnalyticsData(data)
            else showToast('Failed to load analytics', 'error')
        } catch (e) { showToast('Network error', 'error') }
        setAnalyticsLoading(false)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading saved combos...</p></div>

    return (
        <>
            <div className="page-header">
                <h2>Manage Combos</h2>
                <p>{combos.length} combos saved in database</p>
            </div>

            {combos.length === 0 ? (
                <div className="empty-state">
                    <p>No combos saved yet. Generate some from the Combos tab.</p>
                </div>
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-label">Total Combos</div>
                            <div className="stat-value">{combos.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Avg Discount</div>
                            <div className="stat-value">
                                {'\u20B9'}{Math.round(combos.reduce((s, c) => s + (c.discount || 0), 0) / combos.length)}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Avg Items/Combo</div>
                            <div className="stat-value">
                                {(combos.reduce((s, c) => s + (c.items?.length || 0), 0) / combos.length).toFixed(1)}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Avg Score</div>
                            <div className="stat-value">
                                {(combos.reduce((s, c) => s + (c.combo_score || 0), 0) / combos.length).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="combo-grid">
                        {combos.map((combo, idx) => (
                            <div className="combo-card" key={combo._id}>
                                <div className="combo-rank">#{idx + 1}</div>
                                <h4>{combo.combo_name}</h4>

                                {combo.description && (
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4, paddingRight: 30 }}>
                                        {combo.description}
                                    </div>
                                )}

                                <div className="combo-items">
                                    {combo.items?.map((item, i) => (
                                        <span className="combo-item-tag" key={i}>{item.name} ({'\u20B9'}{item.base_price})</span>
                                    ))}
                                </div>

                                <div className="combo-meta">
                                    <div>Score: <span className="meta-value">{combo.combo_score?.toFixed(2) || '\u2014'}</span></div>
                                    {combo.confidence > 0 && <div>Conf: <span className="meta-value">{combo.confidence}</span></div>}
                                    {combo.rating > 0 && <div>Rating: <span className="meta-value">{combo.rating}</span></div>}
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

                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button className="btn-add" style={{ flex: 1 }} onClick={() => openAnalytics(combo._id)}>
                                        View Analytics
                                    </button>
                                    {confirmId === combo._id ? (
                                        <>
                                            <button className="btn-delete-confirm" style={{ flex: 1 }} onClick={() => handleDelete(combo._id)} disabled={deleting === combo._id}>
                                                {deleting === combo._id ? '...' : 'Confirm'}
                                            </button>
                                            <button className="btn-delete-cancel" onClick={() => setConfirmId(null)}>No</button>
                                        </>
                                    ) : (
                                        <button className="btn-delete" style={{ flex: 1 }} onClick={() => setConfirmId(combo._id)}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {analyticsLoading && (
                <div className="modal-overlay">
                    <div className="loading"><div className="spinner"></div><p>Loading combo analytics...</p></div>
                </div>
            )}

            {analyticsData && (
                <div className="modal-overlay" onClick={() => setAnalyticsData(null)}>
                    <div className="modal" style={{ width: 680, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{analyticsData.combo.combo_name} &mdash; Analytics</h3>
                            <button className="modal-close" onClick={() => setAnalyticsData(null)}>&#x2715;</button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <h4 style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Profitability</h4>
                            <div className="stats-row" style={{ marginBottom: 20 }}>
                                <div className="stat-card">
                                    <div className="stat-label">Combo Margin</div>
                                    <div className="stat-value" style={{ fontSize: 18 }}>
                                        {'\u20B9'}{analyticsData.overall.combo_margin}
                                    </div>
                                    <div className="stat-sub">{analyticsData.overall.combo_margin_pct}% margin</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Customer Savings</div>
                                    <div className="stat-value" style={{ fontSize: 18 }}>
                                        {'\u20B9'}{analyticsData.overall.savings_for_customer}
                                    </div>
                                    <div className="stat-sub">{analyticsData.overall.savings_pct}% off</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Compatibility</div>
                                    <div className="stat-value" style={{ fontSize: 18 }}>
                                        {analyticsData.overall.compatibility_score}
                                    </div>
                                    <div className="stat-sub">Category fit</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Naturally Ordered</div>
                                    <div className="stat-value" style={{ fontSize: 18 }}>
                                        {analyticsData.overall.full_combo_orders}
                                    </div>
                                    <div className="stat-sub">{analyticsData.overall.full_combo_rate}% of {analyticsData.overall.total_orders_analyzed} orders</div>
                                </div>
                            </div>

                            <h4 style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Item Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                                {analyticsData.item_analytics.map((item, i) => {
                                    const meta = CLS_META[item.classification] || {}
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                            borderRadius: 'var(--radius)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border-light)'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                                    {item.category} &middot; {'\u20B9'}{item.selling_price} &middot; Cost: {'\u20B9'}{item.cost}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center', minWidth: 48 }}>
                                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: item.margin_pct >= 50 ? 'var(--positive)' : 'var(--caution)' }}>
                                                    {item.margin_pct}%
                                                </div>
                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Margin</div>
                                            </div>
                                            <div style={{ textAlign: 'center', minWidth: 40 }}>
                                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{item.units_sold}</div>
                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sold</div>
                                            </div>
                                            <div style={{ textAlign: 'center', minWidth: 40 }}>
                                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{(item.order_frequency * 100).toFixed(0)}%</div>
                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Freq</div>
                                            </div>
                                            <span className={`badge ${meta.cls}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                                                {meta.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            {analyticsData.pairwise_associations.length > 0 && (
                                <>
                                    <h4 style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Buying Patterns</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {analyticsData.pairwise_associations.map((pair, i) => {
                                            const af = AFFINITY_STYLE[pair.affinity] || AFFINITY_STYLE.weak
                                            return (
                                                <div key={i} style={{
                                                    padding: '10px 14px', borderRadius: 'var(--radius)',
                                                    background: 'var(--bg-surface-alt)', border: '1px solid var(--border-light)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ fontWeight: 600, fontSize: 13 }}>{pair.item_a} &harr; {pair.item_b}</span>
                                                        <span style={{
                                                            fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                                                            background: af.bg, color: af.color
                                                        }}>{af.label}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                                                        <span>{pair.times_bought_together}x together</span>
                                                        <span>Lift: {pair.lift}</span>
                                                        <span>A&#x2192;B: {(pair.confidence_a_to_b * 100).toFixed(0)}%</span>
                                                        <span>B&#x2192;A: {(pair.confidence_b_to_a * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setAnalyticsData(null)}>Close</button>
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
