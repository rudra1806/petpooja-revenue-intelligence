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

    // Add Product Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [addError, setAddError] = useState('')
    const [newProduct, setNewProduct] = useState({
        name: '', category: 'main', selling_price: '', cost: '', description: ''
    })

    // Edit Product Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editError, setEditError] = useState('')
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '', category: 'main', selling_price: '', cost: '', description: ''
    })

    const fetchData = () => {
        setLoading(true)
        fetch(`${apiBase}/combo/analytics/products`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchData()
    }, [apiBase])

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setAddError('')

        try {
            const res = await fetch(`${apiBase}/product/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    selling_price: Number(newProduct.selling_price),
                    cost: Number(newProduct.cost)
                })
            })

            const json = await res.json()

            if (json.success) {
                setIsAddModalOpen(false)
                setNewProduct({ name: '', category: 'main', selling_price: '', cost: '', description: '' })
                fetchData() // Refresh list
            } else {
                setAddError(json.message || 'Failed to add product')
            }
        } catch (error) {
            setAddError('Failed to add product')
        }
        setIsSubmitting(false)
    }

    const openEditModal = (p) => {
        setEditingProduct(p)
        setEditForm({
            name: p.name || '',
            category: p.category || 'main',
            selling_price: p.selling_price || '',
            cost: p.cost || '',
            description: p.description || ''
        })
        setIsEditModalOpen(true)
    }

    const handleEditProduct = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setEditError('')

        try {
            const res = await fetch(`${apiBase}/product/${editingProduct.product_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    selling_price: Number(editForm.selling_price),
                    cost: Number(editForm.cost)
                })
            })

            const json = await res.json()

            if (json.success) {
                setIsEditModalOpen(false)
                const newSelling = Number(editForm.selling_price)
                const newCost = Number(editForm.cost)
                const newMargin = newSelling - newCost
                const newMarginPct = newSelling > 0
                    ? parseFloat(((newMargin / newSelling) * 100).toFixed(1))
                    : 0
                setData(prev => ({
                    ...prev,
                    data: prev.data.map(p =>
                        p.product_id === editingProduct.product_id
                            ? {
                                ...p,
                                name: editForm.name,
                                category: editForm.category,
                                selling_price: newSelling,
                                cost: newCost,
                                description: editForm.description,
                                margin: newMargin,
                                margin_pct: newMarginPct,
                            }
                            : p
                    )
                }))
            } else {
                setEditError(json.message || 'Failed to update product')
            }
        } catch (error) {
            setEditError('Failed to update product')
        }
        setIsSubmitting(false)
    }

    const handleDeleteProduct = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${apiBase}/product/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                setData(prev => ({
                    ...prev,
                    total_products: prev.total_products - 1,
                    data: prev.data.filter(p => p.product_id !== id)
                }))
            } else {
                alert(json.message || 'Failed to delete product');
            }
        } catch (error) {
            alert('Failed to delete product');
        }
        setIsDeleting(false);
    }

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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Product Analytics</h2>
                    <p>Profitability matrix for {data.total_products} products across all categories</p>
                </div>
                <button
                    className="btn-add"
                    style={{ width: 'auto' }}
                    onClick={() => setIsAddModalOpen(true)}
                >
                    + Add Product
                </button>
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
                                <th>Actions</th>
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
                                        <td style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-add"
                                                style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                                                onClick={() => openEditModal(p)}
                                                disabled={isDeleting}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-delete"
                                                style={{ padding: '4px 8px', fontSize: '11px', width: 'auto' }}
                                                onClick={() => handleDeleteProduct(p.product_id, p.name)}
                                                disabled={isDeleting}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD PRODUCT MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Product</h3>
                            <button className="modal-close" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="modal-body">
                                {addError && (
                                    <div style={{ padding: '10px 14px', background: 'var(--negative-subtle)', color: 'var(--negative)', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
                                        {addError}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProduct.name}
                                        onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Garlic Bread"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        required
                                        value={newProduct.category}
                                        onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit' }}
                                    >
                                        <option value="main">Main</option>
                                        <option value="snack">Snack</option>
                                        <option value="dessert">Dessert</option>
                                        <option value="beverages">Beverages</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Selling Price (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newProduct.selling_price}
                                            onChange={e => setNewProduct(prev => ({ ...prev, selling_price: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Cost (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newProduct.cost}
                                            onChange={e => setNewProduct(prev => ({ ...prev, cost: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea
                                        rows="2"
                                        value={newProduct.description}
                                        onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={isSubmitting || !newProduct.name || !newProduct.selling_price || !newProduct.cost}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PRODUCT MODAL */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Product</h3>
                            <button className="modal-close" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditProduct}>
                            <div className="modal-body">
                                {editError && (
                                    <div style={{ padding: '10px 14px', background: 'var(--negative-subtle)', color: 'var(--negative)', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
                                        {editError}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        required
                                        value={editForm.category}
                                        onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit' }}
                                    >
                                        <option value="main">Main</option>
                                        <option value="snack">Snack</option>
                                        <option value="dessert">Dessert</option>
                                        <option value="beverages">Beverages</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Selling Price (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editForm.selling_price}
                                            onChange={e => setEditForm(prev => ({ ...prev, selling_price: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Cost (&#x20B9;)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editForm.cost}
                                            onChange={e => setEditForm(prev => ({ ...prev, cost: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea
                                        rows="2"
                                        value={editForm.description}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    />
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
                                    disabled={isSubmitting || !editForm.name || !editForm.selling_price || !editForm.cost}
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
