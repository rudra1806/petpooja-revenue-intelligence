import { useState, useEffect } from 'react'

export default function Orders({ apiBase }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingOrder, setEditingOrder] = useState(null)
    const [editForm, setEditForm] = useState({ final_price: '', discount: '', order_channel: '' })

    const fetchOrders = () => {
        setLoading(true)
        fetch(`${apiBase}/order`)
            .then(r => r.json())
            .then(d => { setOrders(d.data || []); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchOrders()
    }, [apiBase])

    const openEditModal = (order) => {
        setEditingOrder(order)
        setEditForm({
            final_price: order.final_price,
            discount: order.discount,
            order_channel: order.order_channel
        })
        setIsEditModalOpen(true)
    }

    const handleEditOrder = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch(`${apiBase}/order/${editingOrder.order_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    final_price: Number(editForm.final_price),
                    discount: Number(editForm.discount),
                    order_channel: editForm.order_channel
                })
            })
            const json = await res.json()
            if (json.success) {
                setIsEditModalOpen(false)
<<<<<<< HEAD
                fetchOrders()
=======
                // Patch only the edited row in local state — no full reload
                setOrders(prev => prev.map(o =>
                    o.order_id === editingOrder.order_id
                        ? {
                            ...o,
                            final_price: Number(editForm.final_price),
                            discount: Number(editForm.discount),
                            order_channel: editForm.order_channel,
                        }
                        : o
                ))
>>>>>>> 735fc33a3ef026984823929fad0408d575601243
            } else {
                alert(json.message || 'Failed to update order')
            }
        } catch (error) {
            alert('Failed to update order')
        }
        setIsSubmitting(false)
    }

    const handleDeleteOrder = async (id) => {
        if (!window.confirm(`Are you sure you want to delete order ${id}?`)) return
        try {
            const res = await fetch(`${apiBase}/order/${id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
<<<<<<< HEAD
                fetchOrders()
=======
                // Remove the deleted row from local state — no full reload
                setOrders(prev => prev.filter(o => o.order_id !== id))
>>>>>>> 735fc33a3ef026984823929fad0408d575601243
            } else {
                alert(json.message || 'Failed to delete order')
            }
        } catch (error) {
            alert('Failed to delete order')
        }
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Fetching orders...</p></div>

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Orders Management</h2>
                    <p>View, modify, or delete customer orders</p>
                </div>
            </div>

            <div className="card">
                {orders.length === 0 ? (
                    <div className="empty-state"><p>No orders found.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Channel</th>
                                    <th>Total Items</th>
                                    <th>Base Price</th>
                                    <th>Discount</th>
                                    <th>Final Price</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.order_id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.order_id}</td>
                                        <td><span className={`badge ${o.order_channel === 'app' ? 'badge-star' : o.order_channel === 'voice' ? 'badge-gem' : 'badge-trap'}`}>{o.order_channel}</span></td>
                                        <td>{o.total_items}</td>
                                        <td>{'\u20B9'}{o.total_price}</td>
                                        <td>{'\u20B9'}{o.discount}</td>
                                        <td style={{ fontWeight: 600 }}>{'\u20B9'}{o.final_price}</td>
                                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-add"
                                                style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                                                onClick={() => openEditModal(o)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-delete"
                                                style={{ padding: '4px 12px', fontSize: '11px', width: 'auto' }}
                                                onClick={() => handleDeleteOrder(o.order_id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* EDIT ORDER MODAL */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Order ({editingOrder?.order_id})</h3>
                            <button className="modal-close" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditOrder}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Order Channel</label>
                                    <select
                                        required
                                        value={editForm.order_channel}
                                        onChange={e => setEditForm(prev => ({ ...prev, order_channel: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit' }}
                                    >
                                        <option value="app">App</option>
                                        <option value="voice">Voice</option>
                                        <option value="counter">Counter</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Final Price (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editForm.final_price}
                                            onChange={e => setEditForm(prev => ({ ...prev, final_price: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Discount (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editForm.discount}
                                            onChange={e => setEditForm(prev => ({ ...prev, discount: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface-alt)', padding: '10px', borderRadius: 'var(--radius)' }}>
                                    <strong>Note:</strong> Original base price was &#x20B9;{editingOrder?.total_price}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
