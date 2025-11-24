import { NextRequest, NextResponse } from 'next/server'
import { BlueskyAPI } from '@/lib/bluesky'

export async function GET(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const followers = await BlueskyAPI.getFollowers(params.did, limit)
    
    return NextResponse.json(followers)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}