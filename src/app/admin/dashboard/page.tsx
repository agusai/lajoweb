import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Activity, FileText, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'confirmed': return 'secondary'
    case 'active': return 'default'
    case 'completed': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
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
    { label: 'Total Bookings', value: totalBookings ?? 0, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Active Rentals', value: activeRentals ?? 0, icon: Activity, color: 'text-green-600' },
    { label: 'Pending Licenses', value: pendingLicenses ?? 0, icon: FileText, color: 'text-amber-600' },
    { label: 'Revenue Today', value: `RM ${revenueToday.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-heading font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-2xl font-bold">{value}</span>
              <Icon className={`size-8 ${color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tourist</TableHead>
                <TableHead>Motorcycle</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentBookings ?? []).map((b) => {
                const moto = Array.isArray(b.motorcycles) ? b.motorcycles[0] : b.motorcycles
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.guest_name ?? '—'}</TableCell>
                    <TableCell>{moto ? `${moto.model} (${moto.plate_number})` : '—'}</TableCell>
                    <TableCell>{format(new Date(b.pickup_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(b.return_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>RM {(b.total_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!(recentBookings?.length) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
