import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Motorbike, Activity, TrendingUp } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'confirmed': return 'secondary'
    case 'active': return 'default'
    case 'completed': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
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
      <h1 className="text-2xl font-heading font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Motorcycles
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{motorcycles?.length ?? 0}</span>
            <Motorbike className="size-8 text-blue-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{activeRentals}</span>
            <Activity className="size-8 text-green-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">RM {revenueThisMonth.toFixed(2)}</span>
            <TrendingUp className="size-8 text-purple-600 opacity-80" />
          </CardContent>
        </Card>
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
                    <TableCell>
                      {moto ? `${moto.model} (${moto.plate_number})` : '—'}
                    </TableCell>
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
