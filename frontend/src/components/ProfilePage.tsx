import { User } from 'lucide-react'

interface UserProfile {
  name: string
  bio: string
  location: string
  website: string
}

interface FeedItem {
  id: string
  content: string
  timestamp: string
}

interface ProfilePageProps {
  profile: UserProfile
  feedItems: FeedItem[]
  isEditMode: boolean
}

export default function ProfilePage({ profile, feedItems, isEditMode }: ProfilePageProps) {
  return (
    <div style={{ 
      marginTop: isEditMode ? '80px' : '20px',
      transition: 'margin-top 0.3s ease'
    }}>
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={60} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {profile.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {profile.bio}
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {profile.location && (
              <span>📍 {profile.location}</span>
            )}
            {profile.website && (
              <span>🌐 {profile.website}</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Feed update area</h2>
        <div>
          {feedItems.map((item) => (
            <div key={item.id} className="feed-item">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {item.timestamp}
                </span>
              </div>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}