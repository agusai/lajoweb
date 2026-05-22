import { createClient } from '@/lib/supabase/server'
import { BookingsTable } from './bookings-table'

export type BookingWithRelations = {
  id: string
  guest_name: string | null
  guest_phone: string | null
  pickup_date: string
  return_date: string
  rental_price: number
  security_deposit: number
  total_price: number
  status: string
  qr_code_image_url: string | null
  motorcycles:
    | { model: string; plate_number: string }
    | { model: string; plate_number: string }[]
    | null
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, guest_name, guest_phone, pickup_date, return_date, rental_price, security_deposit, total_price, status, qr_code_image_url, motorcycles(model, plate_number)'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-semibold">Bookings</h1>
      <BookingsTable bookings={(bookings ?? []) as BookingWithRelations[]} />
    </div>
  )
}
