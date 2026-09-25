import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, type User } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (details: any) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hospital_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hospital_token'))
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  async function refreshUser() {
    try {
      const data = await api.getMe()
      if (data.user) {
        const updatedUser: User = {
          id: (data.user as any)._id || (data.user as any).id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          profileId: data.profile?._id || null,
        }
        setUser(updatedUser)
        localStorage.setItem('hospital_user', JSON.stringify(updatedUser))
      }
    } catch (err) {
      console.warn('Session expired or could not refresh user profile:', err)
      logout()
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const result = await api.login(email, password)
    localStorage.setItem('hospital_token', result.token)
    localStorage.setItem('hospital_user', JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  async function register(details: any): Promise<User> {
    const result = await api.register(details)
    localStorage.setItem('hospital_token', result.token)
    localStorage.setItem('hospital_user', JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  function logout() {
    localStorage.removeItem('hospital_token')
    localStorage.removeItem('hospital_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
