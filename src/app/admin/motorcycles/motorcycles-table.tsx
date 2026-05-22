'use client'

import { useState, useMemo, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Motorbike, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { updateMotorcycleStatus } from './actions'
import type { MotorcycleWithVendor } from './page'

const STATUS_OPTIONS = ['available', 'rented', 'maintenance', 'inactive'] as const

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'available': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'rented': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'maintenance': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    case 'inactive': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
  }
}

type Booking = {
  id: string
  guest_name: string | null
  pickup_date: string
  return_date: string
  total_price: number
  status: string
}

export function MotorcyclesTable({
  motorcycles,
  vendors,
}: {
  motorcycles: MotorcycleWithVendor[]
  vendors: { id: string; label: string }[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [selected, setSelected] = useState<MotorcycleWithVendor | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return motorcycles.filter((m) => {
      const matchSearch =
        !q ||
        m.plate_number.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || m.status === statusFilter
      const matchVendor = vendorFilter === 'all' || m.vendor_id === vendorFilter
      return matchSearch && matchStatus && matchVendor
    })
  }, [motorcycles, search, statusFilter, vendorFilter])

  async function handleRowClick(m: MotorcycleWithVendor) {
    setSelected(m)
    setBookings([])
    setLoadingBookings(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('bookings')
      .select('id, guest_name, pickup_date, return_date, total_price, status')
      .eq('motorcycle_id', m.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setBookings(data ?? [])
    setLoadingBookings(false)
  }

  function openEditStatus(m: MotorcycleWithVendor) {
    setEditTarget(m.id)
    setEditStatus(m.status)
    setEditOpen(true)
  }

  function handleSaveStatus() {
    if (!editTarget) return
    startTransition(async () => {
      const result = await updateMotorcycleStatus(editTarget, editStatus)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Status updated')
        setEditOpen(false)
        setEditTarget(null)
        if (selected?.id === editTarget) {
          setSelected((prev) => prev ? { ...prev, status: editStatus } : null)
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
          <Input
            placeholder="Search plate or model…"
            className="pl-8 bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-[#F5F7FA]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#132A4D] border-white/10">
            <SelectItem value="all" className="text-[#F5F7FA]">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-[#F5F7FA] capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-[#F5F7FA]">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent className="bg-[#132A4D] border-white/10">
            <SelectItem value="all" className="text-[#F5F7FA]">All vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-[#F5F7FA]">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-[#94A3B8] ml-auto">{filtered.length} motorcycle{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#94A3B8] font-medium">Model</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Plate</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Vendor</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Color</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Year</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Daily Price</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Status</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow
                key={m.id}
                className="border-white/8 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => handleRowClick(m)}
              >
                <TableCell className="font-medium text-[#F5F7FA]">
                  <div className="flex items-center gap-2">
                    <Motorbike className="size-4 text-[#94A3B8] shrink-0" />
                    {m.model}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[#FF9B4D]">{m.plate_number}</TableCell>
                <TableCell className="text-[#94A3B8]">{m.vendor_company ?? m.vendor_name ?? '—'}</TableCell>
                <TableCell className="text-[#94A3B8]">{m.color ?? '—'}</TableCell>
                <TableCell className="text-[#94A3B8]">{m.year ?? '—'}</TableCell>
                <TableCell className="text-[#F5F7FA]">RM {m.daily_price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={getStatusBadge(m.status)}>{m.status}</span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    onClick={() => openEditStatus(m)}
                    className="gap-1.5 bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10 hover:text-[#F5F7FA]"
                  >
                    <Edit className="size-3.5" />
                    Status
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="border-white/8">
                <TableCell colSpan={8} className="text-center text-[#94A3B8] py-10">
                  No motorcycles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-[#132A4D] border-white/8">
          <SheetHeader>
            <SheetTitle className="text-[#F5F7FA] flex items-center gap-2">
              <Motorbike className="size-5 text-[#FF6A00]" />
              {selected?.model}
            </SheetTitle>
            <SheetDescription className="text-[#94A3B8]">
              {selected?.plate_number}
            </SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="flex flex-col gap-6 px-4 pb-6">
              {/* Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Vendor</p>
                  <p className="font-medium text-[#F5F7FA]">{selected.vendor_company ?? selected.vendor_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Status</p>
                  <span className={getStatusBadge(selected.status)}>{selected.status}</span>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Color</p>
                  <p className="font-medium text-[#F5F7FA]">{selected.color ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Year</p>
                  <p className="font-medium text-[#F5F7FA]">{selected.year ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Daily Price</p>
                  <p className="font-medium text-[#FF6A00]">RM {selected.daily_price.toFixed(2)}</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => openEditStatus(selected)}
                className="w-fit bg-[#FF6A00] hover:bg-[#e05e00] text-white gap-1.5"
              >
                <Edit className="size-3.5" />
                Change Status
              </Button>

              {/* Booking History */}
              <div>
                <h3 className="text-sm font-semibold text-[#F5F7FA] mb-3">Booking History</h3>
                {loadingBookings ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 bg-white/5" />)}
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">No bookings for this motorcycle.</p>
                ) : (
                  <div className="rounded-xl border border-white/8 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/8 hover:bg-transparent">
                          <TableHead className="text-[#94A3B8] text-xs">Tourist</TableHead>
                          <TableHead className="text-[#94A3B8] text-xs">Pickup</TableHead>
                          <TableHead className="text-[#94A3B8] text-xs">Return</TableHead>
                          <TableHead className="text-[#94A3B8] text-xs">Total</TableHead>
                          <TableHead className="text-[#94A3B8] text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => (
                          <TableRow key={b.id} className="border-white/8 hover:bg-white/5">
                            <TableCell className="text-[#F5F7FA] text-xs">{b.guest_name ?? '—'}</TableCell>
                            <TableCell className="text-[#94A3B8] text-xs">{format(new Date(b.pickup_date), 'dd MMM yy')}</TableCell>
                            <TableCell className="text-[#94A3B8] text-xs">{format(new Date(b.return_date), 'dd MMM yy')}</TableCell>
                            <TableCell className="text-[#F5F7FA] text-xs">RM {b.total_price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`${getStatusBadge(b.status)} text-[10px] px-1.5`}>{b.status}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Status Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#132A4D] border-white/8 text-[#F5F7FA] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">Update Motorcycle Status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label className="text-[#94A3B8]">New Status</Label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-[#F5F7FA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#132A4D] border-white/10">
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-[#F5F7FA] capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setEditOpen(false)}
              className="bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStatus}
              disabled={isPending}
              className="bg-[#FF6A00] hover:bg-[#e05e00] text-white"
            >
              {isPending ? 'Saving…' : 'Save Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
