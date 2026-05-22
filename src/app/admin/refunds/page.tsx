import { createClient } from '@/lib/supabase/server'
import { RefundsTable } from './refunds-table'

export type CompletedBooking = {
  id: string
  guest_name: string | null
  return_date: string
  security_deposit: number
  damage_notes: string | null
  refund_amount: number | null
}

export default async function RefundsPage() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, guest_name, return_date, security_deposit, damage_notes, refund_amount')
    .eq('status', 'completed')
    .gt('security_deposit', 0)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-semibold">Refunds</h1>
      <RefundsTable bookings={(bookings ?? []) as CompletedBooking[]} />
    </div>
  )
}
