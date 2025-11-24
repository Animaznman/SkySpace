import { NextRequest, NextResponse } from 'next/server'
import { BlueskyAPI } from '@/lib/bluesky'

export async function GET(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    const profile = await BlueskyAPI.getProfile(params.did)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}