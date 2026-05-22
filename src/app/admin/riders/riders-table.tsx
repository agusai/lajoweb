'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
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
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name ?? '—'}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.phone ?? '—'}</TableCell>
                <TableCell>
                  {r.rider_rating != null ? (
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {r.rider_rating.toFixed(1)}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{r.total_deliveries}</TableCell>
                <TableCell>
                  <Badge variant={r.rider_available ? 'default' : 'secondary'}>
                    {r.rider_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(r)}
                    className="gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    View Jobs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {riders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No riders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedRider} onOpenChange={(o) => !o && setSelectedRider(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedRider?.name ?? 'Rider'} — Delivery History</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4 mt-2">
            {loadingJobs ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No delivery jobs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell>{j.job_type ?? '—'}</TableCell>
                      <TableCell>{j.status ?? '—'}</TableCell>
                      <TableCell>
                        {j.earnings != null ? `RM ${j.earnings.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        {j.rating != null ? (
                          <span className="flex items-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {j.rating}
                          </span>
                        ) : (
                          '—'
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
