import { useState, useEffect } from 'react'

export default function MyOrders({ apiBase, sessionId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetch(`${apiBase}/order/session/${sessionId}`)
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [apiBase, sessionId])

  if (loading) return <div className="loading"><div className="spinner"></div><p>Loading your orders...</p></div>

  const totalSpent = orders.reduce((s, o) => s + (o.final_price || 0), 0)

  return (
    <>
      <div className="page-header">
        <h2>My Orders</h2>
        <p>Your order history and details</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">{'\u20B9'}{totalSpent.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Order</div>
          <div className="stat-value">{'\u20B9'}{orders.length > 0 ? (totalSpent / orders.length).toFixed(0) : 0}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p>No orders yet. Place one via Chat or Voice!</p>
        </div>
      ) : (
        orders.map(o => (
          <div
            className="order-card"
            key={o.order_id}
            onClick={() => setExpandedId(expandedId === o.order_id ? null : o.order_id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="order-card-header">
              <span className="order-id">{o.order_id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${o.order_channel}`}>{o.order_channel}</span>
                <span className="order-date">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Collapsed summary */}
            {expandedId !== o.order_id && (
              <div className="order-card-footer">
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {o.total_items} item{o.total_items !== 1 ? 's' : ''}
                </span>
                <span className="order-total">{'\u20B9'}{o.final_price}</span>
              </div>
            )}

            {/* Expanded details */}
            {expandedId === o.order_id && (
              <>
                <div className="order-items-list">
                  {(o.items || []).map((item, i) => (
                    <div className="order-line" key={i}>
                      <span><span className="qty">{item.quantity}x</span> {item.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{'\u20B9'}{item.base_price * item.quantity}</span>
                    </div>
                  ))}
                  {(o.combos || []).map((combo, i) => (
                    <div className="order-line" key={`c-${i}`}>
                      <span><span className="qty">{combo.quantity}x</span> {combo.combo_name} <span style={{ fontSize: 10, color: 'var(--positive)' }}>(combo)</span></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{'\u20B9'}{combo.combo_price * combo.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="order-card-footer">
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Subtotal: {'\u20B9'}{o.total_price}</span>
                    {o.discount > 0 && <span style={{ color: 'var(--positive)' }}>Discount: -{'\u20B9'}{o.discount}</span>}
                  </div>
                  <span className="order-total">{'\u20B9'}{o.final_price}</span>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </>
  )
}
