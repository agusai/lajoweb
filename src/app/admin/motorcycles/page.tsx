import { createClient } from '@/lib/supabase/server'
import { MotorcyclesTable } from './motorcycles-table'

export type MotorcycleWithVendor = {
  id: string
  model: string
  plate_number: string
  color: string | null
  year: number | null
  daily_price: number
  status: string
  vendor_id: string
  vendor_name: string | null
  vendor_company: string | null
}

export default async function AdminMotorcyclesPage() {
  const supabase = await createClient()

  const { data: motorcycles } = await supabase
    .from('motorcycles')
    .select('id, model, plate_number, color, year, daily_price, status, vendor_id, users(name, company_name)')
    .order('created_at', { ascending: false })

  const { data: vendors } = await supabase
    .from('users')
    .select('id, name, company_name')
    .eq('user_type', 'vendor')
    .order('company_name', { ascending: true })

  const mapped: MotorcycleWithVendor[] = (motorcycles ?? []).map((m) => {
    const u = Array.isArray(m.users) ? m.users[0] : m.users
    return {
      id: m.id,
      model: m.model,
      plate_number: m.plate_number,
      color: m.color,
      year: m.year,
      daily_price: m.daily_price,
      status: m.status,
      vendor_id: m.vendor_id,
      vendor_name: u?.name ?? null,
      vendor_company: u?.company_name ?? null,
    }
  })

  const vendorList = (vendors ?? []).map((v) => ({
    id: v.id,
    label: v.company_name ?? v.name ?? v.id,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Motorcycles</h1>
      <MotorcyclesTable motorcycles={mapped} vendors={vendorList} />
    </div>
  )
}
