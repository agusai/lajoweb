import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function OPTIONS() { return corsOptions() }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { id: billplz_id, paid, paid_at } = body

    if (!billplz_id) return corsError('billplz_id diperlukan.', 400)

    const supabase = createServiceClient()

    const { data: payment, error: findErr } = await supabase
      .from('payments')
      .select('id, booking_id, payment_status')
      .eq('billplz_bill_id', billplz_id)
      .single()

    if (findErr || !payment) return corsError('Rekod pembayaran tidak dijumpai.', 404)

    if (payment.payment_status === 'paid') {
      return corsResponse({ status: 'success', message: 'Pembayaran sudah disahkan sebelum ini.' }, { status: 200 })
    }

    const newStatus = paid === true || paid === 'true' ? 'paid' : 'failed'

    await supabase
      .from('payments')
      .update({ payment_status: newStatus, paid_at: paid_at ?? null })
      .eq('id', payment.id)

    if (newStatus === 'paid') {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', payment.booking_id)
    }

    return corsResponse({ status: 'success', message: `Status pembayaran dikemaskini kepada ${newStatus}.` }, { status: 200 })
  } catch (err: any) {
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}