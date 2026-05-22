import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Activity, FileText, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

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

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: totalBookings },
    { count: activeRentals },
    { count: pendingLicenses },
    { data: todayBookings },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase
      .from('bookings')
      .select('total_price')
      .in('status', ['confirmed', 'active', 'completed'])
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('bookings')
      .select('id, guest_name, pickup_date, return_date, total_price, status, motorcycles(model, plate_number)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const revenueToday = (todayBookings ?? []).reduce((sum, b) => sum + (b.total_price ?? 0), 0)

  const metrics = [
    { label: 'Total Bookings', value: totalBookings ?? 0, icon: BookOpen, color: 'text-[#FF9B4D]' },
    { label: 'Active Rentals', value: activeRentals ?? 0, icon: Activity, color: 'text-[#22C55E]' },
    { label: 'Pending Licenses', value: pendingLicenses ?? 0, icon: FileText, color: 'text-[#FF9B4D]' },
    { label: 'Revenue Today', value: `RM ${revenueToday.toFixed(2)}`, icon: TrendingUp, color: 'text-[#FF6A00]' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-[#132A4D] border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8]">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <span className="text-2xl font-bold text-[#F5F7FA]">{value}</span>
              <Icon className={`size-8 ${color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#132A4D] border-white/8">
        <CardHeader>
          <CardTitle className="text-[#F5F7FA]">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-white/5">
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
                  <TableRow key={b.id} className="border-white/8 hover:bg-white/5">
                    <TableCell className="font-medium text-[#F5F7FA]">{b.guest_name ?? '—'}</TableCell>
                    <TableCell className="text-[#94A3B8]">{moto ? `${moto.model} (${moto.plate_number})` : '—'}</TableCell>
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
