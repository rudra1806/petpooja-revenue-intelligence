import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const PIN_RE = /^\d{6}$/

function validate(form, isAdmin) {
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2)
        errs.name = 'Name must be at least 2 characters.'
    if (!isAdmin) {
        if (!form.street.trim() || form.street.trim().length < 3)
            errs.street = 'Street address must be at least 3 characters.'
        if (!form.city.trim() || form.city.trim().length < 2)
            errs.city = 'City is required.'
        if (!form.state.trim() || form.state.trim().length < 2)
            errs.state = 'State is required.'
        if (!form.pincode || !PIN_RE.test(form.pincode.trim()))
            errs.pincode = 'Pincode must be a 6-digit number.'
    }
    return errs
}

export default function Profile() {
    const { user, updateProfile, logout } = useAuth()
    const addr = user?.address || {}
    const isAdmin = user?.role === 'admin'

    const [form, setForm] = useState({
        name: user?.name || '',
        street: addr.street || '',
        landmark: addr.landmark || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
    })
    const [fieldErrs, setFieldErrs] = useState({})
    const [serverMsg, setServerMsg] = useState(null)
    const [loading, setLoading] = useState(false)

    const handle = e => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
        if (fieldErrs[name]) setFieldErrs(f => { const n = { ...f }; delete n[name]; return n })
    }

    const submit = async e => {
        e.preventDefault()
        const errs = validate(form, isAdmin)
        if (Object.keys(errs).length) { setFieldErrs(errs); return }

        setLoading(true); setServerMsg(null)
        const payload = { name: form.name.trim() }
        if (!isAdmin) {
            payload.address = {
                street: form.street, landmark: form.landmark,
                city: form.city, state: form.state, pincode: form.pincode
            }
        }
        const data = await updateProfile(payload)
        setLoading(false)
        setServerMsg(data.success
            ? { type: 'success', msg: '✅ Profile updated successfully!' }
            : { type: 'error', msg: data.message }
        )
    }

    const field = (label, name, placeholder = '') => (
        <div className="auth-field">
            <label>{label}</label>
            <input type="text" name={name} value={form[name]} onChange={handle}
                placeholder={placeholder}
                style={fieldErrs[name] ? { borderColor: 'var(--negative)' } : {}} />
            {fieldErrs[name] && <span className="field-error">{fieldErrs[name]}</span>}
        </div>
    )

    // Build info rows conditionally
    const infoRows = [
        ['Name', user?.name],
        ['Email', user?.email],
        ['Role', isAdmin ? '🛡️ Admin' : '👤 User'],
        ...(!isAdmin ? [
            ['Street', addr.street || '—'],
            ['Landmark', addr.landmark || '—'],
            ['City', addr.city || '—'],
            ['State', addr.state || '—'],
            ['Pincode', addr.pincode || '—'],
        ] : []),
    ]

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '8px 0' }}>
            <div className="page-header">
                <h2>My Profile</h2>
                <p>{isAdmin ? 'Manage your admin account details' : 'Manage your account and delivery address'}</p>
            </div>

            {/* Info summary card */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3>Account Info</h3>
                    <span className={`badge ${isAdmin ? 'badge-order' : 'badge-voice'}`}>
                        {isAdmin ? 'Admin' : 'Active'}
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    {infoRows.map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{label}</span>
                            <span style={{ fontWeight: label === 'Name' ? 600 : 400 }}>{val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit form */}
            <div className="card">
                <div className="card-header"><h3>Edit Profile</h3></div>

                {serverMsg && (
                    <div className={`auth-alert auth-alert--${serverMsg.type}`} style={{ margin: '0 0 16px' }}>
                        {serverMsg.msg}
                    </div>
                )}

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
                    <p className="form-section-label">Personal Info</p>
                    {field('Full Name', 'name', 'Your full name')}

                    {!isAdmin && (
                        <>
                            <p className="form-section-label">Delivery Address</p>
                            {field('Street / House No.', 'street', 'e.g. 42-B, MG Road')}
                            {field('Landmark (optional)', 'landmark', 'e.g. Near City Mall')}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {field('City', 'city', 'e.g. Ahmedabad')}
                                {field('State', 'state', 'e.g. Gujarat')}
                            </div>
                            {field('Pincode', 'pincode', '6-digit pincode')}
                        </>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="submit" className="auth-btn" disabled={loading}
                            style={{ margin: 0, flex: 1 }}>
                            {loading ? <span className="auth-spinner" /> : 'Save Changes'}
                        </button>
                        <button type="button" onClick={logout}
                            style={{
                                padding: '10px 18px', borderRadius: '6px',
                                border: '1px solid var(--negative)', background: 'var(--bg-surface)',
                                color: 'var(--negative)', fontSize: 13, fontWeight: 600,
                                fontFamily: 'inherit', cursor: 'pointer',
                            }}>
                            Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
