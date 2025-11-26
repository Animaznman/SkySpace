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
    
    // Validate required fields
    const allowedFields = ['current_theme', 'previous_theme']
    const updateData: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
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