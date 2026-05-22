'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function activateBooking(bookingId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'active' })
    .eq('id', bookingId)

  if (error) return { error: error.message }
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function completeBooking(
  bookingId: string,
  data: {
    bike_condition_rating: number
    fuel_level: string
    damage_notes: string
    refund_amount: number
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      bike_condition_rating: data.bike_condition_rating,
      fuel_level: data.fuel_level,
      damage_notes: data.damage_notes || null,
      refund_amount: data.refund_amount > 0 ? data.refund_amount : null,
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
