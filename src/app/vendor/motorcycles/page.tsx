import { createClient } from '@/lib/supabase/server'
import { MotorcyclesClient } from './motorcycles-client'

export type MotorcycleRow = {
  id: string
  model: string
  plate_number: string
  color: string | null
  year: number | null
  daily_price: number
  status: string
}

export default async function VendorMotorcyclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: motorcycles } = await supabase
    .from('motorcycles')
    .select('id, model, plate_number, color, year, daily_price, status')
    .eq('vendor_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-semibold">My Motorcycles</h1>
      <MotorcyclesClient motorcycles={(motorcycles ?? []) as MotorcycleRow[]} />
    </div>
  )
}
