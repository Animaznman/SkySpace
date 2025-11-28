import { NextRequest, NextResponse } from 'next/server'
import { getUserPage, updateUserPage } from '@/lib/bigquery'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    const page = await getUserPage(params.did)
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    // Check authentication
    const authenticatedDid = await requireAuth()
    
    // Ensure user can only update their own page
    if (authenticatedDid !== params.did) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own page' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    if (!body.pageId) {
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      )
    }
    
    // Get current page data to implement Slowly Changing Dimensions (SCD)
    const currentPage = await getUserPage(params.did)
    if (!currentPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }
    
    // Prepare update data with Slowly Changing Dimensions (SCD) logic
    // When current_theme changes, automatically move old current_theme to previous_theme
    const updateData: Record<string, any> = {}
    
    // If updating current_theme, implement SCD pattern
    if (body.current_theme !== undefined) {
      updateData.current_theme = body.current_theme
      
      // Check if current_theme is actually changing (compare JSON strings)
      const currentThemeStr = JSON.stringify(currentPage.current_theme)
      const newThemeStr = JSON.stringify(body.current_theme)
      const themeIsChanging = currentThemeStr !== newThemeStr
      
      // Only update previous_theme if:
      // 1. The theme is actually changing, AND
      // 2. previous_theme is not explicitly provided (to allow manual overrides)
      if (themeIsChanging && body.previous_theme === undefined) {
        // Move current theme to previous_theme (SCD pattern)
        updateData.previous_theme = currentPage.current_theme
      } else if (body.previous_theme !== undefined) {
        // Allow explicit previous_theme override
        updateData.previous_theme = body.previous_theme
      }
    } else if (body.previous_theme !== undefined) {
      // Allow updating previous_theme independently if needed
      updateData.previous_theme = body.previous_theme
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided' },
        { status: 400 }
      )
    }

    await updateUserPage(body.pageId, updateData)
    
    // Fetch and return updated page
    const updatedPage = await getUserPage(params.did)
    
    return NextResponse.json(updatedPage)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}