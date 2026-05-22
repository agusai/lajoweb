import { createClient } from '@/lib/supabase/server'
import { VendorsTable } from './vendors-table'

export type VendorFull = {
  id: string
  email: string
  name: string | null
  phone: string | null
  company_name: string | null
  ic_number: string | null
  bank_account: string | null
  bank_name: string | null
  is_verified: boolean
  is_active: boolean
  motorcycle_count: number
  total_revenue: number
}

export default async function VendorsPage() {
  const supabase = await createClient()

  const { data: vendors } = await supabase
    .from('users')
    .select('id, email, name, phone, company_name, ic_number, bank_account, bank_name, is_verified, is_active')
    .eq('user_type', 'vendor')
    .order('created_at', { ascending: false })

  const vendorIds = vendors?.map((v) => v.id) ?? []

  const [{ data: motorcycles }, { data: bookings }] = await Promise.all([
    vendorIds.length
      ? supabase.from('motorcycles').select('id, vendor_id').in('vendor_id', vendorIds)
      : Promise.resolve({ data: [] }),
    vendorIds.length
      ? supabase
          .from('bookings')
          .select('motorcycle_id, total_price')
          .in('status', ['confirmed', 'active', 'completed'])
      : Promise.resolve({ data: [] }),
  ])

  // Build motorcycle-to-vendor map
  const motoToVendor: Record<string, string> = {}
  ;(motorcycles ?? []).forEach((m) => { motoToVendor[m.id] = m.vendor_id })

  const motoCountMap: Record<string, number> = {}
  const revenueMap: Record<string, number> = {}
  ;(motorcycles ?? []).forEach((m) => {
    motoCountMap[m.vendor_id] = (motoCountMap[m.vendor_id] ?? 0) + 1
  })
  ;(bookings ?? []).forEach((b) => {
    const vendorId = motoToVendor[b.motorcycle_id]
    if (vendorId) revenueMap[vendorId] = (revenueMap[vendorId] ?? 0) + (b.total_price ?? 0)
  })

  const vendorsFull: VendorFull[] = (vendors ?? []).map((v) => ({
    id: v.id,
    email: v.email,
    name: v.name ?? null,
    phone: v.phone ?? null,
    company_name: v.company_name ?? null,
    ic_number: (v as Record<string, unknown>).ic_number as string ?? null,
    bank_account: (v as Record<string, unknown>).bank_account as string ?? null,
    bank_name: (v as Record<string, unknown>).bank_name as string ?? null,
    is_verified: v.is_verified ?? false,
    is_active: v.is_active ?? false,
    motorcycle_count: motoCountMap[v.id] ?? 0,
    total_revenue: revenueMap[v.id] ?? 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Vendors</h1>
      <VendorsTable vendors={vendorsFull} />
    </div>
  )
}
