import { useState, useEffect } from 'react'

export default function ManageCombos({ apiBase }) {
    const [combos, setCombos] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null)
    const [toast, setToast] = useState(null)
    const [confirmId, setConfirmId] = useState(null)

    const fetchCombos = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${apiBase}/combo/all`)
            const data = await res.json()
            if (data.success) setCombos(data.data)
        } catch (e) {
            console.error(e)
        }
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
                showToast('Combo deleted successfully')
            } else {
                showToast(data.message || 'Failed to delete', 'error')
            }
        } catch (e) {
            showToast('Network error', 'error')
        }
        setDeleting(null)
        setConfirmId(null)
    }

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading saved combos…</p></div>

    return (
        <>
            <div className="page-header">
                <h2>📋 Manage Combos</h2>
                <p>{combos.length} combos saved in database</p>
            </div>

            {combos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <p>No combos saved yet. Go to Smart Combos and add some!</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Combo Name</th>
                                <th>Description</th>
                                <th>Items</th>
                                <th>Original Price</th>
                                <th>Combo Price</th>
                                <th>Discount</th>
                                <th>Score</th>
                                <th>Rating</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {combos.map((combo, idx) => (
                                <tr key={combo._id}>
                                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{combo.combo_name}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, whiteSpace: 'normal' }}>{combo.description || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {combo.items?.map((item, i) => (
                                                <span className="combo-item-tag" key={i}>{item.name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>₹{combo.total_selling_price}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{combo.combo_price}</td>
                                    <td>
                                        <span className="badge badge-success">-₹{combo.discount}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {combo.combo_score?.toFixed(2) || '—'}
                                            <div className="score-bar" style={{ width: 50 }}>
                                                <div className="score-bar-fill" style={{
                                                    width: `${(combo.combo_score || 0) * 100}%`,
                                                    background: 'linear-gradient(90deg, var(--accent), var(--gem))'
                                                }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>{combo.rating || '—'}</td>
                                    <td>
                                        {confirmId === combo._id ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="btn-delete-confirm"
                                                    onClick={() => handleDelete(combo._id)}
                                                    disabled={deleting === combo._id}
                                                >
                                                    {deleting === combo._id ? '…' : 'Yes, Delete'}
                                                </button>
                                                <button
                                                    className="btn-delete-cancel"
                                                    onClick={() => setConfirmId(null)}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-delete"
                                                onClick={() => setConfirmId(combo._id)}
                                            >
                                                🗑️ Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                </div>
            )}
        </>
    )
}
