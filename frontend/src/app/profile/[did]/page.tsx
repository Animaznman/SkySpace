'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProfilePageComponent } from '@/components/ProfilePageComponent'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Page, User } from '@/lib/bigquery'

export default function ProfilePage() {
  const params = useParams()
  const did = params.did as string
  const [pageData, setPageData] = useState<Page | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch page data with theme
        const pageResponse = await fetch(`/api/pages/${did}`)
        if (!pageResponse.ok) {
          throw new Error('Failed to fetch page data')
        }
        const page = await pageResponse.json()
        setPageData(page)
        
        // Fetch user data
        const userResponse = await fetch(`/api/profiles/${did}`)
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data')
        }
        const user = await userResponse.json()
        setUserData(user)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (did) {
      fetchData()
    }
  }, [did])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !pageData || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">{error || 'This profile does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider theme={pageData.current_theme}>
      <ProfilePageComponent 
        userData={userData} 
        pageData={pageData}
        did={did}
      />
    </ThemeProvider>
  )
}