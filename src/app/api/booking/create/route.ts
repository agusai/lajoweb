import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'
import { requireAuth } from '../../auth/middleware'

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { motorcycle_id, pickup_date, return_date, pickup_location, payment_method } = body

    if (!motorcycle_id || !pickup_date || !return_date || !payment_method) {
      return corsError('motorcycle_id, pickup_date, return_date, dan payment_method diperlukan.', 400)
    }

    const supabase = createApiClient()

    const { data: motor, error: motorErr } = await supabase
      .from('motorcycles')
      .select('daily_price, available_stock')
      .eq('id', motorcycle_id)
      .single()

    if (motorErr || !motor) return corsError('Motosikal tidak dijumpai.', 404)
    if (motor.available_stock < 1) return corsError('Stok motosikal tidak mencukupi.', 409)

    const start = new Date(pickup_date)
    const end = new Date(return_date)
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const total_price = motor.daily_price * duration

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert([{
        user_id: user.id,
        motorcycle_id,
        pickup_date,
        return_date,
        pickup_location: pickup_location ?? null,
        payment_method,
        total_price,
        status: 'pending',
      }])
      .select('id, status, total_price, pickup_date, return_date')
      .single()

    if (bookingErr) return corsError(bookingErr.message, 500)

    await supabase
      .from('motorcycles')
      .update({ available_stock: motor.available_stock - 1 })
      .eq('id', motorcycle_id)

    return corsResponse({ status: 'success', message: 'Tempahan berjaya dicipta.', data: booking }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Token tidak sah atau telah tamat tempoh.') return corsError(err.message, 401)
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}