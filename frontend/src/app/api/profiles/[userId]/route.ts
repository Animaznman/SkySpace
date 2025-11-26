import { NextRequest, NextResponse } from 'next/server'
import { getUser, updateUser } from '@/lib/bigquery'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUser(params.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
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
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const authenticatedDid = await requireAuth()
    
    // Ensure user can only update their own profile
    if (authenticatedDid !== params.userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const allowedFields = ['username']
    const updateData: Record<string, string> = {}
    
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

    await updateUser(params.userId, updateData)
    
    // Fetch and return updated user
    const updatedUser = await getUser(params.userId)
    
    return NextResponse.json(updatedUser)
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