import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'
import { requireAuth } from '../../auth/middleware'

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { booking_id, payment_method, amount } = body

    if (!booking_id || !payment_method || !amount) {
      return corsError('booking_id, payment_method, dan amount diperlukan.', 400)
    }

    const validMethods = ['online_banking', 'credit_card', 'counter']
    if (!validMethods.includes(payment_method)) {
      return corsError('Kaedah pembayaran tidak sah.', 400)
    }

    const supabase = createApiClient()

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, user_id, status')
      .eq('id', booking_id)
      .single()

    if (bookingErr || !booking) return corsError('Tempahan tidak dijumpai.', 404)
    if (booking.user_id !== user.id) return corsError('Akses tidak dibenarkan.', 403)

    const isCounter = payment_method === 'counter'

    const { data: payment, error: paymentErr } = await supabase
      .from('payments')
      .insert([{
        booking_id,
        user_id: user.id,
        amount,
        payment_method,
        payment_status: 'pending',
      }])
      .select('id, payment_status, payment_method, amount')
      .single()

    if (paymentErr) return corsError(paymentErr.message, 500)

    if (isCounter) {
      await supabase
        .from('payments')
        .update({ payment_status: 'paid' })
        .eq('id', payment.id)

      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking_id)

      return corsResponse({
        status: 'success',
        message: 'Bayaran kaunter telah disahkan. Tempahan anda aktif.',
        data: { ...payment, payment_status: 'paid', booking_status: 'confirmed' },
      }, { status: 200 })
    }

    return corsResponse({
      status: 'success',
      message: 'Rekod pembayaran berjaya dicipta. Sila selesaikan pembayaran.',
      data: { ...payment, checkout_url: null },
    }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Token tidak sah atau telah tamat tempoh.') return corsError(err.message, 401)
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}