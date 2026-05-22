import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from './revenue-chart'
import { CsvExport } from './csv-export'
import { format, subDays, subMonths, startOfWeek } from 'date-fns'
import { TrendingUp, BookOpen, DollarSign } from 'lucide-react'

export type RevenueDataPoint = { label: string; revenue: number }

type BookingRow = { created_at: string; total_price: number }

function groupByDay(bookings: BookingRow[]): RevenueDataPoint[] {
  const map: Record<string, number> = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const key = format(subDays(today, i), 'yyyy-MM-dd')
    map[key] = 0
  }
  for (const b of bookings) {
    const key = format(new Date(b.created_at), 'yyyy-MM-dd')
    if (key in map) map[key] = (map[key] ?? 0) + b.total_price
  }
  return Object.entries(map).map(([k, v]) => ({ label: format(new Date(k), 'MMM d'), revenue: v }))
}

function groupByWeek(bookings: BookingRow[]): RevenueDataPoint[] {
  const map: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const ws = startOfWeek(subDays(new Date(), i * 7))
    map[format(ws, 'yyyy-II')] = 0
  }
  for (const b of bookings) {
    const ws = startOfWeek(new Date(b.created_at))
    const key = format(ws, 'yyyy-II')
    if (key in map) map[key] = (map[key] ?? 0) + b.total_price
  }
  return Object.entries(map).map(([k, v]) => ({ label: `W${k.split('-')[1]}`, revenue: v }))
}

function groupByMonth(bookings: BookingRow[]): RevenueDataPoint[] {
  const map: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const key = format(subMonths(new Date(), i), 'yyyy-MM')
    map[key] = 0
  }
  for (const b of bookings) {
    const key = format(new Date(b.created_at), 'yyyy-MM')
    if (key in map) map[key] = (map[key] ?? 0) + b.total_price
  }
  return Object.entries(map).map(([k, v]) => ({
    label: format(new Date(k + '-01'), 'MMM yyyy'),
    revenue: v,
  }))
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const oneYearAgo = subMonths(new Date(), 12).toISOString()
  const { data: rawBookings } = await supabase
    .from('bookings')
    .select('created_at, total_price')
    .in('status', ['confirmed', 'active', 'completed'])
    .gte('created_at', oneYearAgo)

  const bookings: BookingRow[] = (rawBookings ?? []).map((b) => ({
    created_at: b.created_at,
    total_price: b.total_price ?? 0,
  }))

  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0)
  const totalBookings = bookings.length
  const avgValue = totalBookings ? totalRevenue / totalBookings : 0

  const daily = groupByDay(bookings)
  const weekly = groupByWeek(bookings)
  const monthly = groupByMonth(bookings)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold">Reports</h1>
        <CsvExport bookings={bookings} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (12mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">RM {totalRevenue.toFixed(2)}</span>
            <TrendingUp className="size-8 text-green-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings (12mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{totalBookings}</span>
            <BookOpen className="size-8 text-blue-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Booking Value
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">RM {avgValue.toFixed(2)}</span>
            <DollarSign className="size-8 text-purple-600 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart daily={daily} weekly={weekly} monthly={monthly} />
        </CardContent>
      </Card>
    </div>
  )
}
