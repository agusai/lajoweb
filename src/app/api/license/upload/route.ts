import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'
import { requireAuth } from '../../auth/middleware'

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { license_image_url, license_number, expiry_date } = body

    if (!license_image_url || !license_number) {
      return corsError('license_image_url dan license_number diperlukan.', 400)
    }

    const supabase = createApiClient()

    const { data, error } = await supabase
      .from('licenses')
      .insert([{
        user_id: user.id,
        license_image_url,
        license_number,
        expiry_date: expiry_date ?? null,
        verification_status: 'pending',
      }])
      .select('id, verification_status, license_number')
      .single()

    if (error) return corsError(error.message, 500)

    return corsResponse({ status: 'success', message: 'Lesen berjaya dimuat naik dan sedang dalam semakan.', data }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Token tidak sah atau telah tamat tempoh.') return corsError(err.message, 401)
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}