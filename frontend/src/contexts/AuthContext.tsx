'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  did: string
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User | null>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true
    
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (mounted) {
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            // Only clear user if we get a 401 (not authenticated)
            // Don't clear on other errors to preserve state
            if (response.status === 401) {
              setUser(null)
            }
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
        // Don't clear user on network errors - preserve existing state
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()
    
    return () => {
      mounted = false
    }
  }, [])

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        return null
      }

      const userData = await response.json()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      return null
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

