import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = 'http://localhost:3002/api/auth'

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null)   // { id, name, email, role }
    const [loading, setLoading] = useState(true)

    // Restore session on mount
    useEffect(() => {
        fetch(`${API}/me`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                // Only allow admin accounts in this portal
                if (data?.success && data.user.role === 'admin') setAdmin(data.user)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const login = async ({ email, password }) => {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: 'admin' }),
        })
        const data = await res.json()
        if (data.success && data.user.role === 'admin') {
            setAdmin(data.user)
        }
        return data
    }

    const logout = async () => {
        await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
        setAdmin(null)
    }

    return (
        <AuthContext.Provider value={{ admin, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
