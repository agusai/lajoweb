import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VendorRevenueChart } from './revenue-chart'
import { format, subDays, subMonths, startOfWeek } from 'date-fns'
import { TrendingUp } from 'lucide-react'

export type RevenueDataPoint = { label: string; revenue: number }

type BookingRow = { created_at: string; total_price: number; motorcycle_id: string }

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

export default async function VendorRevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: motorcycles } = await supabase
    .from('motorcycles')
    .select('id, model, plate_number')
    .eq('vendor_id', user!.id)

  const motorcycleIds = motorcycles?.map((m) => m.id) ?? []
  const oneYearAgo = subMonths(new Date(), 12).toISOString()

  const { data: rawBookings } = motorcycleIds.length
    ? await supabase
        .from('bookings')
        .select('created_at, total_price, motorcycle_id')
        .in('motorcycle_id', motorcycleIds)
        .in('status', ['confirmed', 'active', 'completed'])
        .gte('created_at', oneYearAgo)
    : { data: [] }

  const bookings: BookingRow[] = (rawBookings ?? []).map((b) => ({
    created_at: b.created_at,
    total_price: b.total_price ?? 0,
    motorcycle_id: b.motorcycle_id,
  }))

  const perMoto: Record<string, number> = {}
  bookings.forEach((b) => {
    perMoto[b.motorcycle_id] = (perMoto[b.motorcycle_id] ?? 0) + b.total_price
  })

  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0)

  const daily = groupByDay(bookings)
  const weekly = groupByWeek(bookings)
  const monthly = groupByMonth(bookings)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Revenue</h1>

      <Card className="bg-[#132A4D] border-white/8">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#94A3B8]">
            Total Revenue (12 months)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <span className="text-2xl font-bold text-[#F5F7FA]">RM {totalRevenue.toFixed(2)}</span>
          <TrendingUp className="size-8 text-[#22C55E] opacity-80" />
        </CardContent>
      </Card>

      <Card className="bg-[#132A4D] border-white/8">
        <CardHeader>
          <CardTitle className="text-[#F5F7FA]">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorRevenueChart daily={daily} weekly={weekly} monthly={monthly} />
        </CardContent>
      </Card>

      <Card className="bg-[#132A4D] border-white/8">
        <CardHeader>
          <CardTitle className="text-[#F5F7FA]">Revenue by Motorcycle</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="text-[#94A3B8]">Model</TableHead>
                <TableHead className="text-[#94A3B8]">Plate</TableHead>
                <TableHead className="text-[#94A3B8]">Revenue (12mo)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(motorcycles ?? []).map((m) => (
                <TableRow key={m.id} className="border-white/8 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-[#F5F7FA]">{m.model}</TableCell>
                  <TableCell className="text-[#94A3B8]">{m.plate_number}</TableCell>
                  <TableCell className="text-[#FF6A00] font-medium">RM {(perMoto[m.id] ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!(motorcycles?.length) && (
                <TableRow className="border-white/8">
                  <TableCell colSpan={3} className="text-center text-[#94A3B8] py-8">
                    No motorcycles found
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
