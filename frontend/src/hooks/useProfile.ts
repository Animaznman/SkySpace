import { useState, useEffect } from 'react'

interface UserProfile {
  user_id: string
  name: string
  bio: string
  location: string
  website: string
  created_at: string
  updated_at: string
}

interface UseProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refetch: () => Promise<void>
}

export function useProfile(userId: string): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/profiles/${userId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found')
        }
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/profiles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err // Re-throw to allow components to handle the error
    }
  }

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  }
}