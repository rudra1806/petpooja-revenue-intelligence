import { getEmoji } from './OrderCard'

export default function OrderSummary({ items, combos }) {
    const allItems = items || []
    const allCombos = combos || []
    const hasAnything = allItems.length > 0 || allCombos.length > 0

    const subtotal =
        allItems.reduce((s, i) => s + (i.base_price || 0) * (i.quantity || 1), 0) +
        allCombos.reduce((s, c) => s + (c.combo_price || 0) * (c.quantity || 1), 0)

    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + tax
    const count = allItems.reduce((s, i) => s + (i.quantity || 1), 0) +
        allCombos.reduce((s, c) => s + (c.quantity || 1), 0)

    if (!hasAnything) {
        return (
            <div className="order-panel">
                <div className="panel-header">
                    <h2>Your Order</h2>
                    <div className="item-count">No items yet</div>
                </div>
                <div className="order-empty">
                    <span className="empty-icon">🎙️</span>
                    <span>Speak to start ordering</span>
                </div>
            </div>
        )
    }

    return (
        <div className="order-panel">
            <div className="panel-header">
                <h2>Your Order</h2>
                <div className="item-count">{count} item{count !== 1 ? 's' : ''}</div>
            </div>

            <div className="order-list">
                {allItems.map((item, i) => (
                    <div className="order-list-item" key={`item-${i}`}>
                        <span className="item-emoji">{getEmoji(item.name)}</span>
                        <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-qty">x{item.quantity}</div>
                        </div>
                        <span className="item-price">₹{(item.base_price || 0) * (item.quantity || 1)}</span>
                    </div>
                ))}
                {allCombos.map((combo, i) => (
                    <div className="order-list-item" key={`combo-${i}`}>
                        <span className="item-emoji">🎁</span>
                        <div className="item-info">
                            <div className="item-name">{combo.combo_name}</div>
                            <div className="item-qty">x{combo.quantity} (combo)</div>
                        </div>
                        <span className="item-price">₹{(combo.combo_price || 0) * (combo.quantity || 1)}</span>
                    </div>
                ))}
            </div>

            <div className="total-bar">
                <div className="total-row">
                    <span className="total-label">Subtotal</span>
                    <span className="total-value">₹{subtotal}</span>
                </div>
                <div className="total-row">
                    <span className="total-label">Tax (5%)</span>
                    <span className="total-value">₹{tax}</span>
                </div>
                <div className="total-row grand">
                    <span className="total-label grand">Total</span>
                    <span className="total-value grand">₹{total}</span>
                </div>
            </div>
        </div>
    )
}
