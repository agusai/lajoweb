import { createClient } from '@/lib/supabase/server'
import { VendorsTable } from './vendors-table'

export type VendorWithCount = {
  id: string
  email: string
  name: string | null
  phone: string | null
  company_name: string | null
  is_verified: boolean
  is_active: boolean
  motorcycle_count: number
}

export default async function VendorsPage() {
  const supabase = await createClient()

  const { data: vendors } = await supabase
    .from('users')
    .select('id, email, name, phone, company_name, is_verified, is_active')
    .eq('user_type', 'vendor')
    .order('created_at', { ascending: false })

  const vendorIds = vendors?.map((v) => v.id) ?? []
  const { data: motorcycles } = vendorIds.length
    ? await supabase.from('motorcycles').select('vendor_id').in('vendor_id', vendorIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  ;(motorcycles ?? []).forEach((m) => {
    countMap[m.vendor_id] = (countMap[m.vendor_id] ?? 0) + 1
  })

  const vendorsWithCount: VendorWithCount[] = (vendors ?? []).map((v) => ({
    ...v,
    motorcycle_count: countMap[v.id] ?? 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Vendors</h1>
      <VendorsTable vendors={vendorsWithCount} />
    </div>
  )
}
