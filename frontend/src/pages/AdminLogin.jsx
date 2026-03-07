import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminLogin() {
    const { login } = useAuth()
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
        const data = await login({ email: form.email, password: form.password })
        setLoading(false)
        if (!data.success) setServerErr(data.message)
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-page)', padding: '24px 16px',
        }}>
            <div style={{
                width: '100%', maxWidth: 400,
                background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)', padding: '40px 36px',
                boxShadow: 'var(--shadow-md)',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                    <img src="/logo.jpeg" alt="PetPooja" style={{
                        width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                        border: '1px solid var(--border-light)',
                    }} />
                </div>

                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Admin Sign In
                </h2>
                <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 14 }}>
                    🛡️ Admin credentials only. Access will be verified server-side.
                </p>

                {serverErr && (
                    <div style={{
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16,
                    }}>{serverErr}</div>
                )}

                <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
                        <input type="email" name="email" value={form.email} onChange={handle}
                            placeholder="admin@example.com"
                            style={{
                                padding: '10px 13px', borderRadius: 6, fontSize: 14, fontFamily: 'inherit',
                                border: `1px solid ${fieldErrs.email ? 'var(--negative)' : 'var(--border-medium)'}`,
                                background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
                            }} />
                        {fieldErrs.email && <span style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 500 }}>{fieldErrs.email}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                        <input type="password" name="password" value={form.password} onChange={handle}
                            placeholder="••••••••"
                            style={{
                                padding: '10px 13px', borderRadius: 6, fontSize: 14, fontFamily: 'inherit',
                                border: `1px solid ${fieldErrs.password ? 'var(--negative)' : 'var(--border-medium)'}`,
                                background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
                            }} />
                        {fieldErrs.password && <span style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 500 }}>{fieldErrs.password}</span>}
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: 4, padding: '11px 0', borderRadius: 6, border: 'none',
                        background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700,
                        fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1, transition: 'opacity 150ms',
                    }}>
                        {loading ? 'Signing in…' : '🛡️ Sign In as Admin'}
                    </button>
                </form>
            </div>
        </div>
    )
}
