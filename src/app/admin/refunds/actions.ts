'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processRefund(bookingId: string, refundAmount: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ refund_amount: refundAmount })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase
    .from('payments')
    .update({ status: 'refunded', refund_amount: refundAmount })
    .eq('booking_id', bookingId)

  revalidatePath('/admin/refunds')
  return { success: true }
}
