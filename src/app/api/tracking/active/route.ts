import { createAdminClient } from '@/lib/supabase/admin'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return corsOptions()
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        guest_name,
        delivery_lat,
        delivery_lng,
        delivery_address,
        pickup_date,
        return_date,
        motorcycles (
          id,
          model,
          plate_number
        )
      `)
      .in('status', ['confirmed', 'active'])
      .order('created_at', { ascending: false })

    if (error) return corsError(error.message, 500)

    return corsResponse({ data: data ?? [] })
  } catch (err: any) {
    return corsError(err.message ?? 'Internal server error', 500)
  }
}
