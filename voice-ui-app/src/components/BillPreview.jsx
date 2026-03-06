import { getEmoji } from './OrderCard'

export default function BillPreview({ items, combos, orderId, onClose, onNewOrder }) {
    const allItems = items || []
    const allCombos = combos || []

    const subtotal =
        allItems.reduce((s, i) => s + (i.base_price || 0) * (i.quantity || 1), 0) +
        allCombos.reduce((s, c) => s + (c.combo_price || 0) * (c.quantity || 1), 0)

    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + tax
    const now = new Date()

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="bill-overlay" onClick={onClose}>
            <div className="bill-modal" onClick={e => e.stopPropagation()}>
                <div className="bill-content" id="print-bill">
                    <div className="bill-restaurant">
                        <h2>🍽️ PetPooja Restaurant</h2>
                        <div className="bill-date">
                            {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' '}
                            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {orderId && <div className="bill-order-id">Order: {orderId.slice(0, 8).toUpperCase()}</div>}
                    </div>

                    <div className="bill-items">
                        {allItems.map((item, i) => (
                            <div className="bill-item" key={`i-${i}`}>
                                <span className="bi-name">
                                    {getEmoji(item.name)} {item.name} x{item.quantity}
                                </span>
                                <span className="bi-price">₹{(item.base_price || 0) * (item.quantity || 1)}</span>
                            </div>
                        ))}
                        {allCombos.map((combo, i) => (
                            <div className="bill-item" key={`c-${i}`}>
                                <span className="bi-name">
                                    🎁 {combo.combo_name} x{combo.quantity}
                                </span>
                                <span className="bi-price">₹{(combo.combo_price || 0) * (combo.quantity || 1)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bill-totals">
                        <div className="bill-total-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div className="bill-total-row">
                            <span>Tax (5%)</span>
                            <span>₹{tax}</span>
                        </div>
                        <div className="bill-total-row final">
                            <span>TOTAL</span>
                            <span>₹{total}</span>
                        </div>
                    </div>

                    <div className="bill-footer">
                        Thank you for ordering!<br />
                        Powered by PetPooja Voice AI
                    </div>
                </div>

                <div className="bill-actions">
                    <button className="bill-btn print" onClick={handlePrint}>
                        🖨️ Print Bill
                    </button>
                    <button className="bill-btn new-order" onClick={onNewOrder}>
                        🆕 New Order
                    </button>
                    <button className="bill-btn close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
