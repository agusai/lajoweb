import type { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token tidak ditemui. Sila log masuk.')
  }
  const token = authHeader.slice(7)
  const supabase = createApiClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new Error('Token tidak sah atau telah tamat tempoh.')
  }
  return data.user
}