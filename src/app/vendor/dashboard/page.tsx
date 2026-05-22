import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Motorbike, Activity, TrendingUp } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'active': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'confirmed': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'completed': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    case 'cancelled': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
  }
}

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: motorcycles } = await supabase
    .from('motorcycles')
    .select('id, status')
    .eq('vendor_id', user!.id)

  const motorcycleIds = motorcycles?.map((m) => m.id) ?? []
  const activeRentals = motorcycles?.filter((m) => m.status === 'rented').length ?? 0
  const monthStart = startOfMonth(new Date()).toISOString()

  const [{ data: monthBookings }, { data: recentBookings }] = await Promise.all([
    motorcycleIds.length
      ? supabase
          .from('bookings')
          .select('total_price')
          .in('motorcycle_id', motorcycleIds)
          .in('status', ['confirmed', 'active', 'completed'])
          .gte('created_at', monthStart)
      : Promise.resolve({ data: [] }),
    motorcycleIds.length
      ? supabase
          .from('bookings')
          .select(
            'id, guest_name, pickup_date, return_date, total_price, status, motorcycles(model, plate_number)'
          )
          .in('motorcycle_id', motorcycleIds)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ])

  const revenueThisMonth = (monthBookings ?? []).reduce(
    (sum, b) => sum + (b.total_price ?? 0),
    0
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#132A4D] border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Total Motorcycles
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-0">
            <span className="text-2xl font-bold text-[#F5F7FA]">{motorcycles?.length ?? 0}</span>
            <Motorbike className="size-8 text-[#FF9B4D] opacity-80" />
          </CardContent>
        </Card>
        <Card className="bg-[#132A4D] border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-0">
            <span className="text-2xl font-bold text-[#F5F7FA]">{activeRentals}</span>
            <Activity className="size-8 text-[#22C55E] opacity-80" />
          </CardContent>
        </Card>
        <Card className="bg-[#132A4D] border-white/8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#94A3B8]">
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-0">
            <span className="text-2xl font-bold text-[#F5F7FA]">RM {revenueThisMonth.toFixed(2)}</span>
            <TrendingUp className="size-8 text-[#FF6A00] opacity-80" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#132A4D] border-white/8">
        <CardHeader>
          <CardTitle className="text-[#F5F7FA]">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-[#94A3B8]">Tourist</TableHead>
                <TableHead className="text-[#94A3B8]">Motorcycle</TableHead>
                <TableHead className="text-[#94A3B8]">Pickup</TableHead>
                <TableHead className="text-[#94A3B8]">Return</TableHead>
                <TableHead className="text-[#94A3B8]">Total</TableHead>
                <TableHead className="text-[#94A3B8]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentBookings ?? []).map((b) => {
                const moto = Array.isArray(b.motorcycles) ? b.motorcycles[0] : b.motorcycles
                return (
                  <TableRow key={b.id} className="border-white/8 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-[#F5F7FA]">{b.guest_name ?? '—'}</TableCell>
                    <TableCell className="text-[#94A3B8]">
                      {moto ? `${moto.model} (${moto.plate_number})` : '—'}
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{format(new Date(b.pickup_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-[#94A3B8]">{format(new Date(b.return_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-[#F5F7FA]">RM {(b.total_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={getStatusBadge(b.status)}>{b.status}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!(recentBookings?.length) && (
                <TableRow className="border-white/8">
                  <TableCell colSpan={6} className="text-center text-[#94A3B8] py-8">
                    No bookings yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
