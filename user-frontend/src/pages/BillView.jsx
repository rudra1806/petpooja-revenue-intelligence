import { useState } from 'react'

export default function BillView({ order, orderId, total, onClose }) {
    const [mode, setMode] = useState('normal') // normal | json

    if (!order && !orderId) return null

    const items = order?.items || []
    const combos = order?.combos || []
    const subtotal = [
        ...items.map(i => (i.base_price || 0) * (i.quantity || 1)),
        ...combos.map(c => (c.combo_price || 0) * (c.quantity || 1))
    ].reduce((s, v) => s + v, 0)
    const discount = order?.discount || 0
    const finalPrice = total || order?.final_price || subtotal - discount
    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : new Date().toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
    const billOrderId = orderId || order?.order_id || 'N/A'

    const fullOrderJSON = {
        order_id: billOrderId,
        order_channel: order?.order_channel || 'voice',
        items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            base_price: i.base_price,
            line_total: i.base_price * i.quantity,
            selected_modifiers: i.selected_modifiers || []
        })),
        combos: combos.map(c => ({
            combo_name: c.combo_name,
            quantity: c.quantity,
            combo_price: c.combo_price,
            line_total: c.combo_price * c.quantity
        })),
        total_items: items.reduce((s, i) => s + i.quantity, 0) + combos.reduce((s, c) => s + c.quantity, 0),
        total_price: subtotal,
        discount,
        final_price: finalPrice,
        date: orderDate
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
      <html><head><title>Bill - ${billOrderId}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 400px; margin: auto; color: #1C1917; }
        h2 { text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #78350F; font-size: 13px; margin-bottom: 16px; }
        .meta { display: flex; justify-content: space-between; font-size: 12px; color: #57534E; border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; border-bottom: 2px solid #ccc; padding: 6px 4px; font-size: 11px; text-transform: uppercase; color: #A8A29E; }
        td { padding: 6px 4px; border-bottom: 1px solid #eee; }
        .right { text-align: right; }
        .total-row { border-top: 2px solid #1C1917; font-weight: 700; font-size: 16px; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #A8A29E; }
      </style></head><body>
      <div style="text-align:center;margin-bottom:8px"><img src="/logo.jpeg" alt="PetPooja" style="width:48px;height:48px;border-radius:50%;object-fit:cover" /></div>
      <h2>PetPooja</h2>
      <div class="sub">Order & Dine</div>
      <div class="meta"><span>Order: ${billOrderId.substring(0, 8)}...</span><span>${orderDate}</span></div>
      <table>
        <tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr>
        ${items.map(i => `<tr><td>${i.name}</td><td class="right">${i.quantity}</td><td class="right">₹${i.base_price}</td><td class="right">₹${i.base_price * i.quantity}</td></tr>`).join('')}
        ${combos.map(c => `<tr><td>${c.combo_name} <small style="color:#15803D">(combo)</small></td><td class="right">${c.quantity}</td><td class="right">₹${c.combo_price}</td><td class="right">₹${c.combo_price * c.quantity}</td></tr>`).join('')}
      </table>
      <table style="margin-top: 12px;">
        <tr><td>Subtotal</td><td class="right">₹${subtotal}</td></tr>
        ${discount > 0 ? `<tr><td style="color:#15803D">Discount</td><td class="right" style="color:#15803D">-₹${discount}</td></tr>` : ''}
        <tr class="total-row"><td>Total</td><td class="right">₹${finalPrice}</td></tr>
      </table>
      <div class="footer">Thank you for your order!</div>
      <script>window.print()</script>
      </body></html>
    `)
        printWindow.document.close()
    }

    return (
        <div className="bill-overlay" onClick={onClose}>
            <div className="bill-container" onClick={e => e.stopPropagation()}>

                {/* Toggle Bar */}
                <div className="bill-toggle-bar">
                    <button
                        className={`bill-toggle-btn ${mode === 'normal' ? 'active' : ''}`}
                        onClick={() => setMode('normal')}
                    >
                        🧾 Normal Bill
                    </button>
                    <button
                        className={`bill-toggle-btn ${mode === 'json' ? 'active' : ''}`}
                        onClick={() => setMode('json')}
                    >
                        {'{ }'} JSON Mode
                    </button>
                    <button className="bill-close-btn" onClick={onClose}>✕</button>
                </div>

                {mode === 'normal' ? (
                    <div className="bill-receipt">
                        {/* Header */}
                        <div className="bill-header">
                            <img src="/logo.jpeg" alt="PetPooja" className="bill-brand-logo" />
                            <h3>PetPooja</h3>
                            <span className="bill-subtitle">Order & Dine</span>
                        </div>

                        {/* Order Meta */}
                        <div className="bill-meta">
                            <span>Order: <strong>{billOrderId.substring(0, 8)}...</strong></span>
                            <span>{orderDate}</span>
                        </div>

                        {/* Items Table */}
                        <div className="bill-items-section">
                            <table className="bill-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th style={{ textAlign: 'right' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Price</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td>
                                                {item.name}
                                                {item.selected_modifiers?.length > 0 && (
                                                    <div className="bill-modifiers">
                                                        {item.selected_modifiers.map((m, mi) => (
                                                            <span key={mi} className="bill-modifier-tag">{m.name || m.value}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{'\u20B9'}{item.base_price}</td>
                                            <td style={{ textAlign: 'right' }}>{'\u20B9'}{item.base_price * item.quantity}</td>
                                        </tr>
                                    ))}
                                    {combos.map((combo, i) => (
                                        <tr key={`c-${i}`} className="bill-combo-row">
                                            <td>{combo.combo_name} <span className="bill-combo-tag">combo</span></td>
                                            <td style={{ textAlign: 'right' }}>{combo.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{'\u20B9'}{combo.combo_price}</td>
                                            <td style={{ textAlign: 'right' }}>{'\u20B9'}{combo.combo_price * combo.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="bill-totals">
                            <div className="bill-total-line">
                                <span>Subtotal</span>
                                <span>{'\u20B9'}{subtotal}</span>
                            </div>
                            {discount > 0 && (
                                <div className="bill-total-line bill-discount-line">
                                    <span>Discount</span>
                                    <span>-{'\u20B9'}{discount}</span>
                                </div>
                            )}
                            <div className="bill-total-line bill-grand-total">
                                <span>Total</span>
                                <span>{'\u20B9'}{finalPrice}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bill-footer">
                            <p>Thank you for your order! 🎉</p>
                            <button className="bill-print-btn" onClick={handlePrint}>🖨️ Print Bill</button>
                        </div>
                    </div>
                ) : (
                    <div className="bill-json-view">
                        <div className="bill-json-header">
                            <span>Order JSON Structure</span>
                            <button
                                className="bill-copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(fullOrderJSON, null, 2))
                                    const btn = document.querySelector('.bill-copy-btn')
                                    btn.textContent = '✓ Copied!'
                                    setTimeout(() => { btn.textContent = '📋 Copy' }, 1500)
                                }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        <pre className="bill-json-code">{JSON.stringify(fullOrderJSON, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    )
}
