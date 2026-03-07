import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PIN_RE = /^\d{6}$/

function validate(form) {
    const errs = {}
    if (!form.name.trim() || form.name.trim().length < 2)
        errs.name = 'Name must be at least 2 characters.'
    if (!form.email || !EMAIL_RE.test(form.email))
        errs.email = 'Enter a valid email address.'
    if (!form.password || form.password.length < 6)
        errs.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirm)
        errs.confirm = 'Passwords do not match.'

    // Address only required for user role
    if (form.role === 'user') {
        if (!form.street.trim() || form.street.trim().length < 3)
            errs.street = 'Street address must be at least 3 characters.'
        if (!form.city.trim() || form.city.trim().length < 2)
            errs.city = 'City is required.'
        if (!form.state.trim() || form.state.trim().length < 2)
            errs.state = 'State is required.'
        if (!form.pincode || !PIN_RE.test(form.pincode.trim()))
            errs.pincode = 'Pincode must be a 6-digit number.'
    } else if (form.role === 'admin') {
        if (!form.adminCode || !form.adminCode.trim())
            errs.adminCode = 'Admin Registration Code is required.'
    }
    return errs
}

export default function Register({ onNavigate }) {
    const { register } = useAuth()
    const [form, setForm] = useState({
        role: 'user',
        name: '', email: '',
        street: '', landmark: '', city: '', state: '', pincode: '',
        password: '', confirm: '', adminCode: ''
    })
    const [fieldErrs, setFieldErrs] = useState({})
    const [serverErr, setServerErr] = useState(null)
    const [loading, setLoading] = useState(false)

    const handle = e => {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
        if (fieldErrs[name]) setFieldErrs(f => { const n = { ...f }; delete n[name]; return n })
    }

    const submit = async e => {
        e.preventDefault()
        const errs = validate(form)
        if (Object.keys(errs).length) { setFieldErrs(errs); return }

        setLoading(true); setServerErr(null)
        const payload = {
            name: form.name.trim(), email: form.email,
            password: form.password, role: form.role,
        }
        if (form.role === 'user') {
            payload.address = {
                street: form.street, landmark: form.landmark,
                city: form.city, state: form.state, pincode: form.pincode
            }
        } else if (form.role === 'admin') {
            payload.adminCode = form.adminCode.trim()
        }
        const data = await register(payload)
        setLoading(false)
        if (!data.success) setServerErr(data.message)
        // On success: AuthContext auto-logs in → redirects admin or sets user state
    }

    const field = (label, name, type = 'text', placeholder = '') => (
        <div className="auth-field">
            <label>{label}</label>
            <input type={type} name={name} value={form[name]} onChange={handle}
                placeholder={placeholder}
                style={fieldErrs[name] ? { borderColor: 'var(--negative)' } : {}} />
            {fieldErrs[name] && <span className="field-error">{fieldErrs[name]}</span>}
        </div>
    )

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div className="auth-brand">
                    <div className="brand-mark">P</div>
                    <span>PetPooja</span>
                </div>

                <h2 className="auth-title">Create your account</h2>
                <p className="auth-sub">Fill in all details to get started</p>

                {serverErr && <div className="auth-alert auth-alert--error">{serverErr}</div>}

                <form onSubmit={submit} className="auth-form" noValidate>
                    {/* ── Role selector ── */}
                    <div className="auth-field">
                        <label>I am registering as</label>
                        <div className="role-toggle">
                            {['user', 'admin'].map(r => (
                                <button
                                    key={r} type="button"
                                    className={`role-btn ${form.role === r ? 'active' : ''}`}
                                    onClick={() => setForm(f => ({ ...f, role: r }))}
                                >
                                    {r === 'user' ? '👤 User' : '🛡️ Admin'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Personal Info ── */}
                    <p className="form-section-label">Personal Info</p>
                    {field('Full Name', 'name', 'text', 'John Doe')}
                    {field('Email', 'email', 'email', 'you@example.com')}

                    {/* ── Delivery Address (users only) ── */}
                    {form.role === 'user' && (
                        <>
                            <p className="form-section-label">Delivery Address</p>
                            {field('Street / House No.', 'street', 'text', 'e.g. 42-B, MG Road')}
                            {field('Landmark (optional)', 'landmark', 'text', 'e.g. Near City Mall')}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {field('City', 'city', 'text', 'e.g. Ahmedabad')}
                                {field('State', 'state', 'text', 'e.g. Gujarat')}
                            </div>
                            {field('Pincode', 'pincode', 'text', '6-digit pincode')}
                        </>
                    )}

                    {/* ── Admin Auth (admins only) ── */}
                    {form.role === 'admin' && (
                        <>
                            <p className="form-section-label">Admin Authentication</p>
                            {field('Admin Registration Code', 'adminCode', 'password', 'Enter admin code')}
                        </>
                    )}

                    {/* ── Security ── */}
                    <p className="form-section-label">Security</p>
                    {field('Password', 'password', 'password', 'Min. 6 characters')}
                    {field('Confirm Password', 'confirm', 'password', 'Re-enter password')}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <button className="auth-link" onClick={() => onNavigate('login')}>Sign in</button>
                </p>
            </div>
        </div>
    )
}
