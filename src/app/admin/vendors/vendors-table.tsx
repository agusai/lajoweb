'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Bike, TrendingUp, BookOpen, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { toggleVendorStatusWithReason, approveVendor } from './actions'
import type { VendorFull } from './page'

function getVerifiedBadge(verified: boolean) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  return verified
    ? `${base} bg-green-500/15 text-green-400 border-green-500/25`
    : `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
}

function getStatusBadge(active: boolean) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  return active
    ? `${base} bg-green-500/15 text-green-400 border-green-500/25`
    : `${base} bg-red-500/15 text-red-400 border-red-500/25`
}

function getBookingBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'active': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'confirmed': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'completed': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    case 'cancelled': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
  }
}

type MotorcycleInfo = { id: string; model: string; plate_number: string; status: string; daily_price: number }
type BookingInfo = {
  id: string
  guest_name: string | null
  pickup_date: string
  return_date: string
  total_price: number
  status: string
  motorcycle_model: string
}

export function VendorsTable({ vendors }: { vendors: VendorFull[] }) {
  const [selected, setSelected] = useState<VendorFull | null>(null)
  const [motorcycles, setMotorcycles] = useState<MotorcycleInfo[]>([])
  const [bookings, setBookings] = useState<BookingInfo[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<VendorFull | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [activeSection, setActiveSection] = useState<'details' | 'motorcycles' | 'bookings'>('details')
  const [isPending, startTransition] = useTransition()

  async function handleRowClick(v: VendorFull) {
    setSelected(v)
    setActiveSection('details')
    setMotorcycles([])
    setBookings([])
    setLoadingDetail(true)

    const supabase = createClient()
    const { data: motos } = await supabase
      .from('motorcycles')
      .select('id, model, plate_number, status, daily_price')
      .eq('vendor_id', v.id)
      .order('model')

    setMotorcycles(motos ?? [])

    if (motos && motos.length > 0) {
      const motoIds = motos.map((m) => m.id)
      const motoMap = Object.fromEntries(motos.map((m) => [m.id, m.model]))
      const { data: bks } = await supabase
        .from('bookings')
        .select('id, guest_name, pickup_date, return_date, total_price, status, motorcycle_id')
        .in('motorcycle_id', motoIds)
        .order('created_at', { ascending: false })
        .limit(30)

      setBookings(
        (bks ?? []).map((b) => ({
          id: b.id,
          guest_name: b.guest_name,
          pickup_date: b.pickup_date,
          return_date: b.return_date,
          total_price: b.total_price ?? 0,
          status: b.status,
          motorcycle_model: motoMap[b.motorcycle_id] ?? '—',
        }))
      )
    }

    setLoadingDetail(false)
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveVendor(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Vendor verified')
        if (selected?.id === id) setSelected((v) => v ? { ...v, is_verified: true } : null)
      }
    })
  }

  function openSuspend(v: VendorFull) {
    setSuspendTarget(v)
    setSuspendReason('')
  }

  function handleToggle() {
    if (!suspendTarget) return
    const newActive = !suspendTarget.is_active
    startTransition(async () => {
      const result = await toggleVendorStatusWithReason(suspendTarget.id, newActive, suspendReason)
      if (result.error) toast.error(result.error)
      else {
        toast.success(newActive ? 'Vendor activated' : 'Vendor suspended')
        setSuspendTarget(null)
        if (selected?.id === suspendTarget.id) {
          setSelected((v) => v ? { ...v, is_active: newActive } : null)
        }
      }
    })
  }

  const vendorBookings = bookings
  const totalRevenue = bookings.reduce((s, b) => s + b.total_price, 0)

  return (
    <>
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#94A3B8] font-medium">Company</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Email</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Phone</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Bikes</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Revenue</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Verified</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Status</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow
                key={v.id}
                className="border-white/8 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => handleRowClick(v)}
              >
                <TableCell className="font-medium text-[#F5F7FA]">
                  <div className="flex items-center gap-2">
                    {v.company_name ?? v.name ?? '—'}
                    <ChevronRight className="size-3.5 text-[#94A3B8]" />
                  </div>
                </TableCell>
                <TableCell className="text-[#94A3B8]">{v.email}</TableCell>
                <TableCell className="text-[#94A3B8]">{v.phone ?? '—'}</TableCell>
                <TableCell className="text-[#F5F7FA]">{v.motorcycle_count}</TableCell>
                <TableCell className="text-[#FF6A00] font-medium">RM {v.total_revenue.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={getVerifiedBadge(v.is_verified)}>
                    {v.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={getStatusBadge(v.is_active)}>
                    {v.is_active ? 'Active' : 'Suspended'}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2 flex-wrap">
                    {!v.is_verified && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(v.id)}
                        disabled={isPending}
                        className="gap-1.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                      >
                        <CheckCircle className="size-3.5" />
                        Verify
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openSuspend(v)}
                      disabled={isPending}
                      className={
                        v.is_active
                          ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                          : 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                      }
                    >
                      {v.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow className="border-white/8">
                <TableCell colSpan={8} className="text-center text-[#94A3B8] py-10">
                  No vendors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vendor Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#132A4D] border-white/8">
          <SheetHeader>
            <SheetTitle className="text-[#F5F7FA]">
              {selected?.company_name ?? selected?.name ?? 'Vendor'}
            </SheetTitle>
          </SheetHeader>

          {selected && (
            <div className="flex flex-col gap-5 px-4 pb-6">
              {/* Section tabs */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                {(['details', 'motorcycles', 'bookings'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                      activeSection === s
                        ? 'bg-[#FF6A00] text-white'
                        : 'text-[#94A3B8] hover:text-[#F5F7FA]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Details section */}
              {activeSection === 'details' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Full Name</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Company</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.company_name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Email</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.email}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Phone</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.phone ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">IC Number</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.ic_number ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Bank Name</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.bank_name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Bank Account</p>
                      <p className="font-medium text-[#F5F7FA]">{selected.bank_account ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] text-xs mb-0.5">Status</p>
                      <span className={getStatusBadge(selected.is_active)}>
                        {selected.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>

                  {/* Revenue summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="size-4 text-[#FF6A00]" />
                        <span className="text-xs text-[#94A3B8]">Total Revenue</span>
                      </div>
                      <p className="text-lg font-bold text-[#F5F7FA]">RM {selected.total_revenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                      <div className="flex items-center gap-2 mb-1">
                        <Bike className="size-4 text-[#FF9B4D]" />
                        <span className="text-xs text-[#94A3B8]">Motorcycles</span>
                      </div>
                      <p className="text-lg font-bold text-[#F5F7FA]">{motorcycles.length || selected.motorcycle_count}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/8">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="size-4 text-[#22C55E]" />
                        <span className="text-xs text-[#94A3B8]">Bookings</span>
                      </div>
                      <p className="text-lg font-bold text-[#F5F7FA]">{bookings.length}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!selected.is_verified && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(selected.id)}
                        disabled={isPending}
                        className="gap-1.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                      >
                        <CheckCircle className="size-3.5" />
                        Verify Vendor
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openSuspend(selected)}
                      disabled={isPending}
                      className={
                        selected.is_active
                          ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                          : 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                      }
                    >
                      {selected.is_active ? 'Suspend Vendor' : 'Activate Vendor'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Motorcycles section */}
              {activeSection === 'motorcycles' && (
                <div>
                  {loadingDetail ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 bg-white/5" />)}
                    </div>
                  ) : motorcycles.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No motorcycles registered.</p>
                  ) : (
                    <div className="rounded-xl border border-white/8 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/8 hover:bg-transparent">
                            <TableHead className="text-[#94A3B8] text-xs">Model</TableHead>
                            <TableHead className="text-[#94A3B8] text-xs">Plate</TableHead>
                            <TableHead className="text-[#94A3B8] text-xs">Status</TableHead>
                            <TableHead className="text-[#94A3B8] text-xs">Daily Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {motorcycles.map((m) => (
                            <TableRow key={m.id} className="border-white/8 hover:bg-white/5">
                              <TableCell className="text-[#F5F7FA] text-sm">{m.model}</TableCell>
                              <TableCell className="font-mono text-[#FF9B4D] text-sm">{m.plate_number}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                  m.status === 'available' ? 'bg-green-500/15 text-green-400 border-green-500/25' :
                                  m.status === 'rented' ? 'bg-orange-500/15 text-[#FF9B4D] border-orange-500/25' :
                                  'bg-slate-500/15 text-slate-400 border-slate-500/25'
                                }`}>{m.status}</span>
                              </TableCell>
                              <TableCell className="text-[#F5F7FA] text-sm">RM {m.daily_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {/* Bookings section */}
              {activeSection === 'bookings' && (
                <div className="flex flex-col gap-3">
                  {loadingDetail ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 bg-white/5" />)}
                    </div>
                  ) : vendorBookings.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No bookings yet.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#94A3B8]">{vendorBookings.length} bookings</span>
                        <span className="text-sm font-semibold text-[#FF6A00]">
                          Total: RM {totalRevenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/8 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/8 hover:bg-transparent">
                              <TableHead className="text-[#94A3B8] text-xs">Tourist</TableHead>
                              <TableHead className="text-[#94A3B8] text-xs">Motorcycle</TableHead>
                              <TableHead className="text-[#94A3B8] text-xs">Pickup</TableHead>
                              <TableHead className="text-[#94A3B8] text-xs">Total</TableHead>
                              <TableHead className="text-[#94A3B8] text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vendorBookings.map((b) => (
                              <TableRow key={b.id} className="border-white/8 hover:bg-white/5">
                                <TableCell className="text-[#F5F7FA] text-xs">{b.guest_name ?? '—'}</TableCell>
                                <TableCell className="text-[#94A3B8] text-xs">{b.motorcycle_model}</TableCell>
                                <TableCell className="text-[#94A3B8] text-xs">{format(new Date(b.pickup_date), 'dd MMM yy')}</TableCell>
                                <TableCell className="text-[#F5F7FA] text-xs">RM {b.total_price.toFixed(2)}</TableCell>
                                <TableCell>
                                  <span className={`${getBookingBadge(b.status)} text-[10px] px-1.5`}>{b.status}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Suspend/Activate dialog with reason */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent className="bg-[#132A4D] border-white/8 text-[#F5F7FA] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">
              {suspendTarget?.is_active ? 'Suspend Vendor' : 'Activate Vendor'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#94A3B8]">
              {suspendTarget?.is_active
                ? `Suspending ${suspendTarget?.company_name ?? suspendTarget?.name} will prevent them from receiving new bookings.`
                : `Activating ${suspendTarget?.company_name ?? suspendTarget?.name} will restore their access.`}
            </p>
            {suspendTarget?.is_active && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#94A3B8]">Reason (optional)</Label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension…"
                  className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setSuspendTarget(null)}
              className="bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggle}
              disabled={isPending}
              className={
                suspendTarget?.is_active
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                  : 'bg-[#FF6A00] hover:bg-[#e05e00] text-white'
              }
            >
              {isPending ? 'Saving…' : suspendTarget?.is_active ? 'Suspend' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
