import { useState, useEffect } from 'react'

const CLASSIFICATION_META = {
    star: { label: 'Star', badgeClass: 'badge-star', desc: 'High Margin + High Sales' },
    hidden_gem: { label: 'Hidden Gem', badgeClass: 'badge-gem', desc: 'High Margin + Low Sales' },
    volume_trap: { label: 'Volume Trap', badgeClass: 'badge-trap', desc: 'Low Margin + High Sales' },
    dog: { label: 'Dog', badgeClass: 'badge-dog', desc: 'Low Margin + Low Sales' },
}

export default function ProductAnalytics({ apiBase }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState('classification')

    useEffect(() => {
        fetch(`${apiBase}/combo/analytics/products`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [apiBase])

    if (loading) return <div className="loading"><div className="spinner"></div><p>Analyzing products...</p></div>
    if (!data?.success) return <div className="empty-state"><p>No data available</p></div>

    const products = [...data.data]
    if (sortBy === 'classification') {
        const order = { star: 0, hidden_gem: 1, volume_trap: 2, dog: 3 }
        products.sort((a, b) => (order[a.classification] ?? 4) - (order[b.classification] ?? 4))
    } else if (sortBy === 'margin') {
        products.sort((a, b) => b.margin_pct - a.margin_pct)
    } else if (sortBy === 'frequency') {
        products.sort((a, b) => b.order_frequency - a.order_frequency)
    } else if (sortBy === 'revenue') {
        products.sort((a, b) => b.revenue_share - a.revenue_share)
    }

    const counts = {}
    for (const p of data.data) {
        counts[p.classification] = (counts[p.classification] || 0) + 1
    }

    return (
        <>
            <div className="page-header">
                <h2>Product Analytics</h2>
                <p>Profitability matrix for {data.total_products} products across all categories</p>
            </div>

            <div className="stats-row">
                {Object.entries(CLASSIFICATION_META).map(([key, meta]) => (
                    <div className="stat-card" key={key}>
                        <div className="stat-label">{meta.label}</div>
                        <div className="stat-value">{counts[key] || 0}</div>
                        <div className="stat-sub">{meta.desc}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>All Products</h3>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{
                            background: 'var(--bg-surface)', color: 'var(--text-primary)',
                            border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)',
                            padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
                        }}
                    >
                        <option value="classification">Sort: Classification</option>
                        <option value="margin">Sort: Margin %</option>
                        <option value="frequency">Sort: Order Frequency</option>
                        <option value="revenue">Sort: Revenue Share</option>
                    </select>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Cost</th>
                                <th>Margin</th>
                                <th>Margin %</th>
                                <th>Units Sold</th>
                                <th>Order Freq</th>
                                <th>Revenue Share</th>
                                <th>Classification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => {
                                const meta = CLASSIFICATION_META[p.classification] || {}
                                return (
                                    <tr key={p.product_id}>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td><span style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                                        <td>{'\u20B9'}{p.selling_price}</td>
                                        <td>{'\u20B9'}{p.cost}</td>
                                        <td>{'\u20B9'}{p.margin}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {p.margin_pct}%
                                                <div className="score-bar" style={{ width: 50 }}>
                                                    <div className="score-bar-fill" style={{
                                                        width: `${p.margin_pct}%`,
                                                        background: p.margin_pct >= 60 ? 'var(--positive)' : p.margin_pct >= 40 ? 'var(--caution)' : 'var(--negative)'
                                                    }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td>{p.units_sold}</td>
                                        <td>{(p.order_frequency * 100).toFixed(1)}%</td>
                                        <td>{p.revenue_share}%</td>
                                        <td>
                                            <span className={`badge ${meta.badgeClass}`}>
                                                {meta.label}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
