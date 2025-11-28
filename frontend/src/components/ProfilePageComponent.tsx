'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { User, Page, Post } from '@/lib/bigquery'
import { BlueskyProfile, BlueskyFollower, BlueskyAPI } from '@/lib/bluesky'
import ThemeUtils from '@/lib/theme-utils'
import { EditPageModal } from './EditPageModal'
import { EditThemeModal } from './EditThemeModal'

interface ProfilePageComponentProps {
  userData: User
  pageData: Page
  did: string
}

export function ProfilePageComponent({ userData, pageData, did }: ProfilePageComponentProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPageData, setCurrentPageData] = useState<Page>(pageData)
  const [showEditPageModal, setShowEditPageModal] = useState(false)
  const [showEditThemeModal, setShowEditThemeModal] = useState(false)
  const [blueskyProfile, setBlueskyProfile] = useState<BlueskyProfile | null>(null)
  const [followers, setFollowers] = useState<BlueskyFollower[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  
  // Check if the logged-in user owns this profile
  // Wait for auth to finish loading before checking
  // Normalize DIDs by trimming whitespace, decoding URL encoding, and lowercasing for comparison
  const normalizeDid = (did: string | undefined) => {
    if (!did) return undefined
    try {
      // Decode URL encoding (e.g., %3A -> :)
      const decoded = decodeURIComponent(did)
      return decoded.trim().toLowerCase()
    } catch {
      // If decoding fails, just trim and lowercase
      return did.trim().toLowerCase()
    }
  }
  const canEdit = !authLoading && isAuthenticated && normalizeDid(user?.did) === normalizeDid(did)

  // Debug logging (remove in production)
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth Debug:', {
        authLoading,
        isAuthenticated,
        userDid: user?.did,
        profileDid: did,
        normalizedUserDid: normalizeDid(user?.did),
        normalizedProfileDid: normalizeDid(did),
        canEdit,
        match: normalizeDid(user?.did) === normalizeDid(did)
      })
    }
  }, [authLoading, isAuthenticated, user?.did, did, canEdit])

  useEffect(() => {
    if (theme) {
      ThemeUtils.applyTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    setCurrentPageData(pageData)
  }, [pageData])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts from BigQuery
        const postsResponse = await fetch(`/api/feed/${did}`)
        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          setPosts(postsData)
        }

        // Fetch Bluesky profile data
        const profileResponse = await fetch(`/api/bluesky/profile/${did}`)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setBlueskyProfile(profileData)
        }

        // Fetch followers (top 100 for MySpace-style display)
        const followersResponse = await fetch(`/api/bluesky/followers/${did}?limit=100`)
        if (followersResponse.ok) {
          const followersData = await followersResponse.json()
          setFollowers(followersData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
        setProfileLoading(false)
      }
    }

    fetchData()
  }, [did])

  const handlePageSave = (updatedPage: Page) => {
    setCurrentPageData(updatedPage)
  }

  const handleRevertTheme = async () => {
    if (!currentPageData.previous_theme) {
      alert('No previous theme to revert to')
      return
    }

    try {
      // Swap current_theme and previous_theme
      const response = await fetch(`/api/pages/${did}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: currentPageData.page_id,
          current_theme: currentPageData.previous_theme,
          previous_theme: currentPageData.current_theme
        })
      })

      if (response.ok) {
        const updatedPage = await response.json()
        setCurrentPageData(updatedPage)
        setTheme(updatedPage.current_theme)
        alert('Theme reverted successfully!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to revert theme: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to revert theme:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to revert theme: ${errorMessage}. Please try again.`)
    }
  }


  return (
    <>
    <div className={`profile-container ${theme.customization.animations ? 'animations-enabled' : ''} ${theme.customization.glitter ? 'glitter-enabled' : ''} ${showEditPageModal ? 'live-editor-active' : ''}`}>
      <div className="profile-header">
        {/* Banner background */}
        {blueskyProfile?.banner && (
          <div 
            className="profile-banner"
            style={{ backgroundImage: `url(${blueskyProfile.banner})` }}
          ></div>
        )}
        
        <div className="profile-container-inner">
          {profileLoading ? (
            <div className="animate-pulse profile-info">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-white/20 rounded-full"></div>
                <div>
                  <div className="h-8 bg-white/20 rounded mb-2 w-48"></div>
                  <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-64"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="flex items-start gap-6 flex-wrap">
                {blueskyProfile?.avatar && (
                  <img 
                    src={blueskyProfile.avatar} 
                    alt="Profile avatar"
                    className="profile-avatar"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="profile-name text-3xl font-bold mb-1">
                    {blueskyProfile?.displayName || userData.username}
                  </div>
                  <div className="profile-did text-lg opacity-90 mb-2">
                    {blueskyProfile?.handle ? BlueskyAPI.formatHandle(blueskyProfile.handle) : BlueskyAPI.getShortDID(userData.did)}
                  </div>
                  {blueskyProfile?.description && (
                    <div className="text-lg opacity-95 mb-4 max-w-2xl">
                      {blueskyProfile.description}
                    </div>
                  )}
                  
                  {/* Stats */}
                  {blueskyProfile && (
                    <div className="profile-stats">
                      {blueskyProfile.postsCount !== undefined && (
                        <div className="profile-stat">
                          <strong>{blueskyProfile.postsCount.toLocaleString()}</strong> posts
                        </div>
                      )}
                      {blueskyProfile.followersCount !== undefined && (
                        <div className="profile-stat">
                          <strong>{blueskyProfile.followersCount.toLocaleString()}</strong> followers
                        </div>
                      )}
                      {blueskyProfile.followsCount !== undefined && (
                        <div className="profile-stat">
                          <strong>{blueskyProfile.followsCount.toLocaleString()}</strong> following
                        </div>
                      )}
                      {blueskyProfile?.createdAt && (
                        <div className="profile-stat">
                          Joined {new Date(blueskyProfile.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Auth buttons */}
              <div className="flex gap-3 mt-6 items-center">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => setShowEditPageModal(true)}
                      className="theme-button px-4 py-2 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                        color: 'white',
                        fontSize: 'var(--theme-font-size-medium)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      ⚙️ Edit Page Settings
                    </button>
                    <button
                      onClick={() => setShowEditThemeModal(true)}
                      className="theme-button px-4 py-2 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                        color: 'white',
                        fontSize: 'var(--theme-font-size-medium)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      🎨 AI Theme Generator
                    </button>
                    {currentPageData.previous_theme && (
                      <button
                        onClick={handleRevertTheme}
                        className="theme-button px-4 py-2 rounded-full"
                        style={{ 
                          backgroundColor: 'rgba(251, 191, 36, 0.3)', 
                          color: 'white',
                          fontSize: 'var(--theme-font-size-medium)',
                          border: '2px solid rgba(251, 191, 36, 0.5)',
                          backdropFilter: 'blur(10px)'
                        }}
                        title="Revert to previous theme"
                      >
                        ↶ Revert Theme
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await logout()
                        router.push('/')
                      }}
                      className="theme-button px-4 py-2 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.3)', 
                        color: 'white',
                        fontSize: 'var(--theme-font-size-medium)',
                        border: '2px solid rgba(239, 68, 68, 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="theme-button px-4 py-2 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(59, 130, 246, 0.3)', 
                      color: 'white',
                      fontSize: 'var(--theme-font-size-medium)',
                      border: '2px solid rgba(59, 130, 246, 0.5)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    🔐 Login to Edit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-container-inner">
        <div className={`profile-content layout-${theme.layout.profilePosition || 'left'}`}>
          {theme.layout.profilePosition !== 'center' && (
            <div className="profile-sidebar">
            <h3 className="font-bold mb-2" style={{ fontFamily: 'var(--theme-font-heading)' }}>
              About
            </h3>
            {profileLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ) : (
              <div>
                {blueskyProfile?.description ? (
                  <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                    {blueskyProfile.description}
                  </p>
                ) : (
                  <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                    Welcome to my SkySpace profile! This is a MySpace-style social platform built on AT Protocol.
                  </p>
                )}
                
                <div className="mt-4">
                  <h4 className="font-bold mb-2" style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                    Profile Info
                  </h4>
                  <ul style={{ fontSize: 'var(--theme-font-size-small)' }}>
                    <li>Posts: {posts.length}</li>
                    <li>Followers: {blueskyProfile?.followersCount || followers.length}</li>
                    <li>Following: {blueskyProfile?.followsCount || 0}</li>
                    {blueskyProfile?.createdAt && (
                      <li>Joined: {new Date(blueskyProfile.createdAt).toLocaleDateString()}</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            </div>
          )}

          <div className="profile-main">
            {theme.layout.musicPlayer === 'top' && (
              <div className={`music-player position-${theme.layout.musicPlayer}`}>
                <div className="flex items-center gap-2">
                  <span>🎵</span>
                  <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                    Now Playing: Your Profile Song
                  </span>
                  <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                    ⏸️
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
              Recent Posts
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto" style={{ borderColor: 'var(--theme-primary)' }}></div>
                <p className="mt-2" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                  Loading posts...
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div className="post">
                <p className="post-content">
                  No posts yet. This user hasn't shared anything!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.cid} className="post">
                  <div className="post-content">
                    {post.text}
                  </div>
                  <div className="text-xs mt-2" style={{ 
                    fontSize: 'var(--theme-font-size-small)',
                    color: 'var(--theme-text)',
                    opacity: 0.7
                  }}>
                    {new Date(post.created_at / 1000).toLocaleString()}
                  </div>
                </div>
              ))
            )}

            {theme.layout.musicPlayer === 'bottom' && (
              <div className={`music-player position-${theme.layout.musicPlayer}`}>
                <div className="flex items-center gap-2">
                  <span>🎵</span>
                  <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                    Now Playing: Your Profile Song
                  </span>
                  <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                    ⏸️
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MySpace-style Followers Section */}
        <div className={`myspace-followers ${theme.layout.friendsList === 'hidden' ? 'hidden' : ''}`}>
          <div className="followers-header">
            <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
              Followers ({blueskyProfile?.followersCount?.toLocaleString() || followers.length})
            </h3>
            {followers.length > 0 && (
              <p className="mb-4" style={{ fontSize: 'var(--theme-font-size-small)', opacity: 0.8 }}>
                Showing {followers.length} of {blueskyProfile?.followersCount?.toLocaleString() || followers.length} followers
              </p>
            )}
          </div>
          
          {profileLoading ? (
            <div className="followers-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="follower-card animate-pulse">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : followers.length > 0 ? (
            <div className="followers-grid">
              {followers.map((follower) => (
                <div key={follower.did} className="follower-card">
                  {follower.avatar ? (
                    <img 
                      src={follower.avatar} 
                      alt={`${follower.displayName || follower.handle} avatar`}
                      className="follower-avatar"
                    />
                  ) : (
                    <div className="follower-avatar-placeholder">
                      {(follower.displayName || follower.handle).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="follower-name" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                    {follower.displayName || follower.handle}
                  </div>
                  {follower.displayName && (
                    <div className="follower-handle" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                      @{follower.handle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-followers">
              <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                No followers yet. Be the first to follow!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live Editor Modal */}
      {showEditPageModal && (
        <EditPageModal
          isOpen={showEditPageModal}
          onClose={() => setShowEditPageModal(false)}
          pageData={currentPageData}
          did={did}
          onSave={handlePageSave}
          previewContent={
            <div className={`profile-container ${theme?.customization?.animations ? 'animations-enabled' : ''} ${theme?.customization?.glitter ? 'glitter-enabled' : ''}`}>
              <div className="profile-header">
                {/* Banner background */}
                {blueskyProfile?.banner && (
                  <div 
                    className="profile-banner"
                    style={{ backgroundImage: `url(${blueskyProfile.banner})` }}
                  ></div>
                )}
                
                <div className="profile-container-inner">
                  {profileLoading ? (
                    <div className="animate-pulse profile-info">
                      <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-white/20 rounded-full"></div>
                        <div>
                          <div className="h-8 bg-white/20 rounded mb-2 w-48"></div>
                          <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-white/20 rounded w-64"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-info">
                      <div className="flex items-start gap-6 flex-wrap">
                        {blueskyProfile?.avatar && (
                          <img 
                            src={blueskyProfile.avatar} 
                            alt="Profile avatar"
                            className="profile-avatar"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="profile-name text-3xl font-bold mb-1">
                            {blueskyProfile?.displayName || userData.username}
                          </div>
                          <div className="profile-did text-lg opacity-90 mb-2">
                            {blueskyProfile?.handle ? BlueskyAPI.formatHandle(blueskyProfile.handle) : BlueskyAPI.getShortDID(userData.did)}
                          </div>
                          {blueskyProfile?.description && (
                            <div className="text-lg opacity-95 mb-4 max-w-2xl">
                              {blueskyProfile.description}
                            </div>
                          )}
                          
                          {/* Stats */}
                          {blueskyProfile && (
                            <div className="profile-stats">
                              {blueskyProfile.postsCount !== undefined && (
                                <div className="profile-stat">
                                  <strong>{blueskyProfile.postsCount.toLocaleString()}</strong> posts
                                </div>
                              )}
                              {blueskyProfile.followersCount !== undefined && (
                                <div className="profile-stat">
                                  <strong>{blueskyProfile.followersCount.toLocaleString()}</strong> followers
                                </div>
                              )}
                              {blueskyProfile.followsCount !== undefined && (
                                <div className="profile-stat">
                                  <strong>{blueskyProfile.followsCount.toLocaleString()}</strong> following
                                </div>
                              )}
                              {blueskyProfile?.createdAt && (
                                <div className="profile-stat">
                                  Joined {new Date(blueskyProfile.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Edit buttons - hidden in preview */}
                      <div className="flex gap-3 mt-6" style={{ display: 'none' }}>
                        <button className="theme-button px-4 py-2 rounded-full">
                          ⚙️ Edit Page Settings
                        </button>
                        <button className="theme-button px-4 py-2 rounded-full">
                          🎨 AI Theme Generator
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-container-inner">
                <div className={`profile-content layout-${theme?.layout?.profilePosition || 'left'}`}>
                  {theme?.layout?.profilePosition !== 'center' && (
                    <div className="profile-sidebar">
                    <h3 className="font-bold mb-2" style={{ fontFamily: 'var(--theme-font-heading)' }}>
                      About
                    </h3>
                    {profileLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    ) : (
                      <div>
                        {blueskyProfile?.description ? (
                          <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                            {blueskyProfile.description}
                          </p>
                        ) : (
                          <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                            Welcome to my SkySpace profile! This is a MySpace-style social platform built on AT Protocol.
                          </p>
                        )}
                        
                        <div className="mt-4">
                          <h4 className="font-bold mb-2" style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                            Profile Info
                          </h4>
                          <ul style={{ fontSize: 'var(--theme-font-size-small)' }}>
                            <li>Posts: {posts.length}</li>
                            <li>Followers: {blueskyProfile?.followersCount || followers.length}</li>
                            <li>Following: {blueskyProfile?.followsCount || 0}</li>
                            {blueskyProfile?.createdAt && (
                              <li>Joined: {new Date(blueskyProfile.createdAt).toLocaleDateString()}</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                    </div>
                  )}

                  <div className="profile-main">
                    {theme?.layout?.musicPlayer === 'top' && (
                      <div className={`music-player position-${theme.layout.musicPlayer}`}>
                        <div className="flex items-center gap-2">
                          <span>🎵</span>
                          <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                            Now Playing: Your Profile Song
                          </span>
                          <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                            ⏸️
                          </button>
                        </div>
                      </div>
                    )}

                    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
                      Recent Posts
                    </h2>

                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto" style={{ borderColor: 'var(--theme-primary)' }}></div>
                        <p className="mt-2" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                          Loading posts...
                        </p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="post">
                        <p className="post-content">
                          No posts yet. This user hasn't shared anything!
                        </p>
                      </div>
                    ) : (
                      posts.slice(0, 3).map((post) => (
                        <div key={post.cid} className="post">
                          <div className="post-content">
                            {post.text}
                          </div>
                          <div className="text-xs mt-2" style={{ 
                            fontSize: 'var(--theme-font-size-small)',
                            color: 'var(--theme-text)',
                            opacity: 0.7
                          }}>
                            {new Date(post.created_at / 1000).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}

                    {theme?.layout?.musicPlayer === 'bottom' && (
                      <div className={`music-player position-${theme.layout.musicPlayer}`}>
                        <div className="flex items-center gap-2">
                          <span>🎵</span>
                          <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                            Now Playing: Your Profile Song
                          </span>
                          <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                            ⏸️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* MySpace-style Followers Section - Limited for preview */}
                <div className={`myspace-followers ${theme?.layout?.friendsList === 'hidden' ? 'hidden' : ''}`}>
                  <div className="followers-header">
                    <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
                      Followers ({blueskyProfile?.followersCount?.toLocaleString() || followers.length})
                    </h3>
                  </div>
                  
                  {profileLoading ? (
                    <div className="followers-grid">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="follower-card animate-pulse">
                          <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : followers.length > 0 ? (
                    <div className="followers-grid">
                      {followers.slice(0, 12).map((follower) => (
                        <div key={follower.did} className="follower-card">
                          {follower.avatar ? (
                            <img 
                              src={follower.avatar} 
                              alt={`${follower.displayName || follower.handle} avatar`}
                              className="follower-avatar"
                            />
                          ) : (
                            <div className="follower-avatar-placeholder">
                              {(follower.displayName || follower.handle).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="follower-name" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                            {follower.displayName || follower.handle}
                          </div>
                          {follower.displayName && (
                            <div className="follower-handle" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                              @{follower.handle}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-followers">
                      <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                        No followers yet. Be the first to follow!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        />
      )}
      
      <EditThemeModal
        isOpen={showEditThemeModal}
        onClose={() => setShowEditThemeModal(false)}
        pageData={currentPageData}
        did={did}
        onSave={handlePageSave}
        previewContent={
          <div className={`profile-container ${theme?.customization?.animations ? 'animations-enabled' : ''} ${theme?.customization?.glitter ? 'glitter-enabled' : ''}`}>
            <div className="profile-header">
              {/* Banner background */}
              {blueskyProfile?.banner && (
                <div 
                  className="profile-banner"
                  style={{ backgroundImage: `url(${blueskyProfile.banner})` }}
                ></div>
              )}
              
              <div className="profile-container-inner">
                {profileLoading ? (
                  <div className="animate-pulse profile-info">
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-32 bg-white/20 rounded-full"></div>
                      <div>
                        <div className="h-8 bg-white/20 rounded mb-2 w-48"></div>
                        <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-white/20 rounded w-64"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="profile-info">
                    <div className="flex items-start gap-6 flex-wrap">
                      {blueskyProfile?.avatar && (
                        <img 
                          src={blueskyProfile.avatar} 
                          alt="Profile avatar"
                          className="profile-avatar"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="profile-name text-3xl font-bold mb-1">
                          {blueskyProfile?.displayName || userData.username}
                        </div>
                        <div className="profile-did text-lg opacity-90 mb-2">
                          {blueskyProfile?.handle ? BlueskyAPI.formatHandle(blueskyProfile.handle) : BlueskyAPI.getShortDID(userData.did)}
                        </div>
                        {blueskyProfile?.description && (
                          <div className="text-lg opacity-95 mb-4 max-w-2xl">
                            {blueskyProfile.description}
                          </div>
                        )}
                        
                        {/* Stats */}
                        {blueskyProfile && (
                          <div className="profile-stats">
                            {blueskyProfile.postsCount !== undefined && (
                              <div className="profile-stat">
                                <strong>{blueskyProfile.postsCount.toLocaleString()}</strong> posts
                              </div>
                            )}
                            {blueskyProfile.followersCount !== undefined && (
                              <div className="profile-stat">
                                <strong>{blueskyProfile.followersCount.toLocaleString()}</strong> followers
                              </div>
                            )}
                            {blueskyProfile.followsCount !== undefined && (
                              <div className="profile-stat">
                                <strong>{blueskyProfile.followsCount.toLocaleString()}</strong> following
                              </div>
                            )}
                            {blueskyProfile?.createdAt && (
                              <div className="profile-stat">
                                Joined {new Date(blueskyProfile.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit buttons - hidden in preview */}
                    <div className="flex gap-3 mt-6" style={{ display: 'none' }}>
                      <button className="theme-button px-4 py-2 rounded-full">
                        ⚙️ Edit Page Settings
                      </button>
                      <button className="theme-button px-4 py-2 rounded-full">
                        🎨 AI Theme Generator
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-container-inner">
              <div className={`profile-content layout-${theme?.layout?.profilePosition || 'left'}`}>
                {theme?.layout?.profilePosition !== 'center' && (
                  <div className="profile-sidebar">
                  <h3 className="font-bold mb-2" style={{ fontFamily: 'var(--theme-font-heading)' }}>
                    About
                  </h3>
                  {profileLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <div>
                      {blueskyProfile?.description ? (
                        <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                          {blueskyProfile.description}
                        </p>
                      ) : (
                        <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                          Welcome to my SkySpace profile! This is a MySpace-style social platform built on AT Protocol.
                        </p>
                      )}
                      
                      <div className="mt-4">
                        <h4 className="font-bold mb-2" style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                          Profile Info
                        </h4>
                        <ul style={{ fontSize: 'var(--theme-font-size-small)' }}>
                          <li>Posts: {posts.length}</li>
                          <li>Followers: {blueskyProfile?.followersCount || followers.length}</li>
                          <li>Following: {blueskyProfile?.followsCount || 0}</li>
                          {blueskyProfile?.createdAt && (
                            <li>Joined: {new Date(blueskyProfile.createdAt).toLocaleDateString()}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                <div className="profile-main">
                  {theme?.layout?.musicPlayer === 'top' && (
                    <div className={`music-player position-${theme.layout.musicPlayer}`}>
                      <div className="flex items-center gap-2">
                        <span>🎵</span>
                        <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                          Now Playing: Your Profile Song
                        </span>
                        <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                          ⏸️
                        </button>
                      </div>
                    </div>
                  )}

                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
                    Recent Posts
                  </h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto" style={{ borderColor: 'var(--theme-primary)' }}></div>
                      <p className="mt-2" style={{ fontSize: 'var(--theme-font-size-small)' }}>
                        Loading posts...
                      </p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="post">
                      <p className="post-content">
                        No posts yet. This user hasn't shared anything!
                      </p>
                    </div>
                  ) : (
                    posts.slice(0, 3).map((post) => (
                      <div key={post.cid} className="post">
                        <div className="post-content">
                          {post.text}
                        </div>
                        <div className="text-xs mt-2" style={{ 
                          fontSize: 'var(--theme-font-size-small)',
                          color: 'var(--theme-text)',
                          opacity: 0.7
                        }}>
                          {new Date(post.created_at / 1000).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}

                  {theme?.layout?.musicPlayer === 'bottom' && (
                    <div className={`music-player position-${theme.layout.musicPlayer}`}>
                      <div className="flex items-center gap-2">
                        <span>🎵</span>
                        <span style={{ fontSize: 'var(--theme-font-size-medium)' }}>
                          Now Playing: Your Profile Song
                        </span>
                        <button className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                          ⏸️
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* MySpace-style Followers Section - Clean Grid Format */}
                <div className={`myspace-followers ${theme?.layout?.friendsList === 'hidden' ? 'hidden' : ''}`}>
                  <div className="followers-header-clean">
                    <h3 className="followers-title" style={{ fontFamily: 'var(--theme-font-heading)', fontSize: 'var(--theme-font-size-large)' }}>
                      Followers ({blueskyProfile?.followersCount?.toLocaleString() || followers.length})
                    </h3>
                  </div>
                  
                  {profileLoading ? (
                    <div className="followers-grid-clean">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                        <div key={i} className="follower-card-clean animate-pulse">
                          <div className="follower-avatar-clean bg-gray-300"></div>
                          <div className="follower-details-clean">
                            <div className="h-4 bg-gray-300 rounded mb-1 w-full"></div>
                            <div className="h-3 bg-gray-300 rounded w-4/5"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : followers.length > 0 ? (
                    <div className="followers-grid-clean">
                      {followers.slice(0, 12).map((follower) => (
                        <div key={follower.did} className="follower-card-clean">
                          {follower.avatar ? (
                            <img 
                              src={follower.avatar} 
                              alt={`${follower.displayName || follower.handle} avatar`}
                              className="follower-avatar-clean"
                            />
                          ) : (
                            <div className="follower-avatar-clean follower-avatar-placeholder-clean">
                              {(follower.displayName || follower.handle).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="follower-details-clean">
                            <div className="follower-name-clean" title={follower.displayName || follower.handle}>
                              {follower.displayName || follower.handle}
                            </div>
                            <div className="follower-handle-clean" title={`@${follower.handle}`}>
                              @{follower.handle}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-followers-clean">
                      <p style={{ fontSize: 'var(--theme-font-size-small)' }}>
                        No followers yet. Be the first to follow!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
    </>
  )
}