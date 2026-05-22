'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Star } from 'lucide-react'
import type { RiderWithDeliveries } from './page'

type DeliveryJob = {
  id: string
  job_type: string | null
  status: string | null
  earnings: number | null
  rating: number | null
}

function getAvailableBadge(available: boolean | null) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  return available
    ? `${base} bg-green-500/15 text-green-400 border-green-500/25`
    : `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
}

export function RidersTable({ riders }: { riders: RiderWithDeliveries[] }) {
  const [selectedRider, setSelectedRider] = useState<RiderWithDeliveries | null>(null)
  const [jobs, setJobs] = useState<DeliveryJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  async function loadJobs(riderId: string) {
    setLoadingJobs(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('delivery_jobs')
      .select('id, job_type, status, earnings, rating')
      .eq('rider_id', riderId)
      .order('id', { ascending: false })
      .limit(20)
    setJobs(data ?? [])
    setLoadingJobs(false)
  }

  function handleView(rider: RiderWithDeliveries) {
    setSelectedRider(rider)
    setJobs([])
    loadJobs(rider.id)
  }

  return (
    <>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#94A3B8] font-medium">Name</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Email</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Phone</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Rating</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Deliveries</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Available</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((r) => (
              <TableRow key={r.id} className="border-white/8 hover:bg-white/5 transition-colors">
                <TableCell className="font-medium text-[#F5F7FA]">{r.name ?? '—'}</TableCell>
                <TableCell className="text-[#94A3B8]">{r.email}</TableCell>
                <TableCell className="text-[#94A3B8]">{r.phone ?? '—'}</TableCell>
                <TableCell>
                  {r.rider_rating != null ? (
                    <span className="flex items-center gap-1 text-[#F5F7FA]">
                      <Star className="size-3.5 fill-[#FF9B4D] text-[#FF9B4D]" />
                      {r.rider_rating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </TableCell>
                <TableCell className="text-[#F5F7FA]">{r.total_deliveries}</TableCell>
                <TableCell>
                  <span className={getAvailableBadge(r.rider_available)}>
                    {r.rider_available ? 'Available' : 'Unavailable'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleView(r)}
                    className="gap-1.5 bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10 hover:text-[#F5F7FA]"
                  >
                    <Eye className="size-3.5" />
                    View Jobs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {riders.length === 0 && (
              <TableRow className="border-white/8">
                <TableCell colSpan={7} className="text-center text-[#94A3B8] py-10">
                  No riders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedRider} onOpenChange={(o) => !o && setSelectedRider(null)}>
        <SheetContent className="overflow-y-auto bg-[#132A4D] border-white/8">
          <SheetHeader>
            <SheetTitle className="text-[#F5F7FA]">
              {selectedRider?.name ?? 'Rider'} — Delivery History
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4 mt-2">
            {loadingJobs ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/5" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No delivery jobs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/8">
                    <TableHead className="text-[#94A3B8]">Type</TableHead>
                    <TableHead className="text-[#94A3B8]">Status</TableHead>
                    <TableHead className="text-[#94A3B8]">Earnings</TableHead>
                    <TableHead className="text-[#94A3B8]">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j) => (
                    <TableRow key={j.id} className="border-white/8 hover:bg-white/5">
                      <TableCell className="text-[#F5F7FA]">{j.job_type ?? '—'}</TableCell>
                      <TableCell className="text-[#94A3B8]">{j.status ?? '—'}</TableCell>
                      <TableCell className="text-[#F5F7FA]">
                        {j.earnings != null ? `RM ${j.earnings.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        {j.rating != null ? (
                          <span className="flex items-center gap-1 text-[#F5F7FA]">
                            <Star className="size-3.5 fill-[#FF9B4D] text-[#FF9B4D]" />
                            {j.rating}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
