'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(`/profile/${user.did}`)
    }
  }, [isAuthenticated, authLoading, user, router])

  if (authLoading || isAuthenticated) {
    return (
      <div className="skyspace-home">
        <div className="stars-background"></div>
        <div className="home-container">
          <div className="home-hero">
            <div className="logo-container">
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await login(username, password)
      if (userData) {
        // Redirect to user's profile page
        router.push(`/profile/${userData.did}`)
      } else {
        setError('Invalid username or password')
        setLoading(false)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="skyspace-home">
      <div className="stars-background"></div>
      <div className="home-container">
        <div className="home-hero">
          <div className="logo-container">
            <h1 className="skyspace-logo">
              <span className="logo-sky">Sky</span>
              <span className="logo-space">Space</span>
            </h1>
            <p className="tagline">Login to your account</p>
          </div>
          
          <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-group" style={{ flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username (e.g. 2hiraganabot.bsky.social)"
                  className="search-input"
                  disabled={loading}
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="search-input"
                  disabled={loading}
                  required
                />
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={loading || !username.trim() || !password.trim()}
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </form>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <a 
                href="/" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Back to home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

