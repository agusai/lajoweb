import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return corsError('email dan password diperlukan.', 400)

    const supabase = createApiClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) return corsError(error?.message ?? 'Emel atau kata laluan tidak sah.', 401)

    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, phone, user_type')
      .eq('id', data.user.id)
      .single()

    return corsResponse({
      status: 'success',
      message: 'Log masuk berjaya.',
      token: data.session.access_token,
      user: profile ?? { id: data.user.id, email: data.user.email, name: null, phone: null, user_type: 'registered' },
    }, { status: 200 })
  } catch (err: any) {
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}