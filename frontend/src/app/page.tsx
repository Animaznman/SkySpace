'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    try {
      // Convert Bluesky handle to DID
      const cleanHandle = username.startsWith('@') ? username.slice(1) : username
      const response = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${cleanHandle}`)
      
      if (!response.ok) {
        throw new Error('User not found')
      }
      
      const data = await response.json()
      const did = data.did
      
      // Navigate to profile page
      router.push(`/profile/${did}`)
    } catch (err) {
      setError('User not found. Please check the username and try again.')
    } finally {
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
            <p className="tagline">Your MySpace for the AT Protocol era</p>
          </div>
          
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Bluesky username (e.g. alice.bsky.social)"
                  className="search-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={loading || !username.trim()}
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Find Profile'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </form>
            
            <div className="example-searches">
              <p>Try searching for:</p>
              <div className="example-buttons">
                <button 
                  className="example-btn"
                  onClick={() => setUsername('alice.bsky.social')}
                >
                  alice.bsky.social
                </button>
                <button 
                  className="example-btn"
                  onClick={() => setUsername('jay.bsky.social')}
                >
                  jay.bsky.social
                </button>
                <button 
                  className="example-btn"
                  onClick={() => setUsername('2hiraganabot.bsky.social')}
                >
                  2hiraganabot.bsky.social
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Custom Themes</h3>
              <p>AI-powered theme generation and manual customization</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>AT Protocol</h3>
              <p>Built on the decentralized AT Protocol network</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>MySpace Vibes</h3>
              <p>Nostalgic design meets modern web technology</p>
            </div>
          </div>
        </div>
        
        <footer className="home-footer">
          <p>&copy; 2025 SkySpace - Bringing back the personal web</p>
        </footer>
      </div>
    </div>
  )
}