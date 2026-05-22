import { createClient } from '@/lib/supabase/server'
import { RidersTable } from './riders-table'

export type RiderWithDeliveries = {
  id: string
  name: string | null
  email: string
  phone: string | null
  rider_available: boolean | null
  rider_rating: number | null
  total_deliveries: number
}

export default async function RidersPage() {
  const supabase = await createClient()

  const { data: riders } = await supabase
    .from('users')
    .select('id, name, email, phone, rider_available, rider_rating')
    .eq('user_type', 'rider')
    .order('created_at', { ascending: false })

  const riderIds = riders?.map((r) => r.id) ?? []
  const { data: jobs } = riderIds.length
    ? await supabase.from('delivery_jobs').select('rider_id').in('rider_id', riderIds)
    : { data: [] }

  const jobCountMap: Record<string, number> = {}
  ;(jobs ?? []).forEach((j) => {
    jobCountMap[j.rider_id] = (jobCountMap[j.rider_id] ?? 0) + 1
  })

  const ridersWithDeliveries: RiderWithDeliveries[] = (riders ?? []).map((r) => ({
    ...r,
    total_deliveries: jobCountMap[r.id] ?? 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-semibold">Riders</h1>
      <RidersTable riders={ridersWithDeliveries} />
    </div>
  )
}
