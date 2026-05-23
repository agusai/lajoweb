import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'
import { requireAuth } from '../../../auth/middleware'

export function OPTIONS() { return corsOptions() }

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAuth(request)

    const { userId } = await ctx.params
    if (!userId) return corsError('userId diperlukan.', 400)

    const supabase = createApiClient()

    const { data, error } = await supabase
      .from('licenses')
      .select('id, license_number, expiry_date, verification_status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === 'PGRST116') {
      return corsResponse({ status: 'success', message: 'Tiada rekod lesen dijumpai.', data: null }, { status: 200 })
    }
    if (error) return corsError(error.message, 500)

    return corsResponse({ status: 'success', message: 'Status lesen berjaya diambil.', data }, { status: 200 })
  } catch (err: any) {
    if (err.message === 'Token tidak sah atau telah tamat tempoh.') return corsError(err.message, 401)
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}