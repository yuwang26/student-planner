import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('access_token').then(async (token) => {
      if (token) {
        try {
          const r = await api.get('/auth/me')
          setUser(r.data)
        } catch {
          await SecureStore.deleteItemAsync('access_token')
        }
      }
      setIsLoading(false)
    })
  }, [])

  const login = async (email: string, password: string) => {
    const resp = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('access_token', resp.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const register = async (email: string, password: string, fullName?: string) => {
    await api.post('/auth/register', { email, password, full_name: fullName })
    await login(email, password)
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
