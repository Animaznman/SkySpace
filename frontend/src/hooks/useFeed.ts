import { useState, useEffect } from 'react'

interface FeedItem {
  id: string
  user_id: string
  content: string
  timestamp: string
  post_type: string
}

interface UseFeedReturn {
  feedItems: FeedItem[]
  loading: boolean
  error: string | null
  addFeedItem: (content: string, postType?: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useFeed(userId: string, limit: number = 10): UseFeedReturn {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/feed/${userId}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch feed')
      }
      
      const data = await response.json()
      setFeedItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const addFeedItem = async (content: string, postType: string = 'status') => {
    try {
      setError(null)
      
      const response = await fetch(`/api/feed/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, post_type: postType }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create feed item')
      }
      
      // Refetch the feed to get the updated list
      await fetchFeed()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err // Re-throw to allow components to handle the error
    }
  }

  useEffect(() => {
    if (userId) {
      fetchFeed()
    }
  }, [userId, limit])

  return {
    feedItems,
    loading,
    error,
    addFeedItem,
    refetch: fetchFeed
  }
}