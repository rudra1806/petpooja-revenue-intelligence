import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login({ onNavigate }) {
    const { login } = useAuth()
    const [role, setRole] = useState('user')
    const [form, setForm] = useState({ email: '', password: '' })
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
        const errs = {}
        if (!form.email || !EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.'
        if (!form.password) errs.password = 'Password is required.'
        if (Object.keys(errs).length) { setFieldErrs(errs); return }

        setLoading(true); setServerErr(null)
        const data = await login({ email: form.email, password: form.password, role })
        setLoading(false)
        if (!data.success) setServerErr(data.message)
        // On success: AuthContext handles redirect (admin → localhost:5173, user → main app)
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand" style={{ justifyContent: 'center' }}>
                    <img src="/logo.jpeg" alt="PetPooja" className="brand-logo" style={{ width: 130, height: 130 }} />
                </div>

                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-sub">Sign in to continue</p>

                {serverErr && <div className="auth-alert auth-alert--error">{serverErr}</div>}

                <form onSubmit={submit} className="auth-form" noValidate>
                    {/* ── Role selector ── */}
                    <div className="auth-field">
                        <label>Logging in as</label>
                        <div className="role-toggle">
                            {['user', 'admin'].map(r => (
                                <button
                                    key={r} type="button"
                                    className={`role-btn ${role === r ? 'active' : ''}`}
                                    onClick={() => { setRole(r); setServerErr(null) }}
                                >
                                    {r === 'user' ? '👤 User' : '🛡️ Admin'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>Email</label>
                        <input type="email" name="email" value={form.email} onChange={handle}
                            placeholder="you@example.com" autoComplete="email"
                            style={fieldErrs.email ? { borderColor: 'var(--negative)' } : {}} />
                        {fieldErrs.email && <span className="field-error">{fieldErrs.email}</span>}
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input type="password" name="password" value={form.password} onChange={handle}
                            placeholder="••••••••" autoComplete="current-password"
                            style={fieldErrs.password ? { borderColor: 'var(--negative)' } : {}} />
                        {fieldErrs.password && <span className="field-error">{fieldErrs.password}</span>}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : `Sign In as ${role === 'admin' ? 'Admin' : 'User'}`}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <button className="auth-link" onClick={() => onNavigate('register')}>Create one</button>
                </p>
            </div>
        </div>
    )
}
