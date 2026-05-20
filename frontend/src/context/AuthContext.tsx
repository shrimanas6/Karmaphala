import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'

interface User {
  _id: string
  name: string
  email: string
  role: 'customer' | 'agent'
  skills: string[]
  isAvailable?: boolean
  hourlyRate?: number
  rating?: number
  bio?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  role: 'customer' | 'agent'
  skills?: string[]
  bio?: string
  hourlyRate?: number
  serviceRadius?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('kp_token')
    const storedUser = localStorage.getItem('kp_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('kp_token', t)
    localStorage.setItem('kp_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    const { token: t, user: u } = res.data
    localStorage.setItem('kp_token', t)
    localStorage.setItem('kp_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('kp_token')
    localStorage.removeItem('kp_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
