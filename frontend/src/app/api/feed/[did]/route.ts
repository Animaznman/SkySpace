import { NextRequest, NextResponse } from 'next/server'
import { getUserPosts, createPost } from '@/lib/bigquery'

export async function GET(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const posts = await getUserPosts(params.did, limit)
    
    return NextResponse.json(posts)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { did: string } }
) {
  try {
    const body = await request.json()
    
    if (!body.cid || !body.rkey || !body.text || !body.record) {
      return NextResponse.json(
        { error: 'cid, rkey, text, and record are required' },
        { status: 400 }
      )
    }
    
    await createPost(body.cid, params.did, body.rkey, body.text, body.record)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}