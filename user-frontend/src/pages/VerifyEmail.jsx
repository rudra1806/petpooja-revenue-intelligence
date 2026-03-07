import { useEffect, useState } from 'react'

export default function VerifyEmail({ onNavigate }) {
    const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
    const [msg, setMsg] = useState('')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')

        // Also handle the redirect from server (/verify-email.html?status=success)
        const serverStatus = params.get('status')
        if (serverStatus === 'success') {
            setStatus('success')
            setMsg('Your email has been verified. You can now sign in.')
            return
        }
        if (serverStatus === 'error') {
            setStatus('error')
            setMsg('The verification link is invalid or has expired.')
            return
        }

        if (!token) {
            setStatus('error')
            setMsg('No verification token found in the URL.')
            return
        }

        // If navigated to #verify-email with token param on URL
        fetch(`http://localhost:3002/api/auth/verify-email?token=${token}`, {
            redirect: 'manual', // don't follow the server redirect
        })
            .then(r => {
                if (r.ok || r.status === 302) {
                    setStatus('success')
                    setMsg('Your email has been verified successfully!')
                } else {
                    setStatus('error')
                    setMsg('Verification failed. The link may have expired.')
                }
            })
            .catch(() => {
                setStatus('error')
                setMsg('Network error. Please try again.')
            })
    }, [])

    const icon = status === 'verifying' ? '⏳'
        : status === 'success' ? '✅'
            : '❌'

    return (
        <div className="auth-page">
            <div className="auth-card auth-card--center">
                <div className="auth-verify-icon">{icon}</div>

                <h2 className="auth-title">
                    {status === 'verifying' && 'Verifying your email…'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                <p className="auth-sub">{msg}</p>

                {status !== 'verifying' && (
                    <button
                        className="auth-btn"
                        style={{ marginTop: '24px' }}
                        onClick={() => onNavigate('login')}
                    >
                        Go to Login
                    </button>
                )}

                {status === 'verifying' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <span className="auth-spinner auth-spinner--lg" />
                    </div>
                )}
            </div>
        </div>
    )
}
