import type { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json()

    if (!email || !password || !name) {
      return corsError('email, password, dan name diperlukan.', 400)
    }

    const supabase = createApiClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    })

    if (error) return corsError(error.message, 400)

    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ id: data.user.id, email, phone: phone ?? null, name, user_type: 'registered' }])

      if (insertError) {
        console.error('[register] users insert error:', insertError.message)
      }
    }

    return corsResponse(
      {
        status: 'success',
        message: 'Akaun berjaya didaftarkan! Sila semak emel untuk pengesahan.',
        data: { id: data.user?.id, email: data.user?.email },
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat tidak dijangka'
    return corsError(msg)
  }
}