'use client'

import { useState, useMemo, useTransition } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { activateBooking, completeBooking } from './actions'
import type { BookingWithRelations } from './page'

const STATUS_TABS = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'] as const

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'active': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'confirmed': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'pending': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'completed': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    case 'cancelled': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
  }
}

export function BookingsTable({ bookings }: { bookings: BookingWithRelations[] }) {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeForm, setCompleteForm] = useState({
    bike_condition_rating: '5',
    fuel_level: 'full',
    damage_notes: '',
    refund_amount: '0',
  })
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchTab = activeTab === 'all' || b.status === activeTab
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        (b.guest_name ?? '').toLowerCase().includes(q) ||
        (b.guest_phone ?? '').toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [bookings, activeTab, search])

  function handleActivate(id: string) {
    startTransition(async () => {
      const result = await activateBooking(id)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Booking activated')
        setSelectedBooking(null)
      }
    })
  }

  function handleComplete() {
    if (!selectedBooking) return
    startTransition(async () => {
      const result = await completeBooking(selectedBooking.id, {
        bike_condition_rating: Number(completeForm.bike_condition_rating),
        fuel_level: completeForm.fuel_level,
        damage_notes: completeForm.damage_notes,
        refund_amount: Number(completeForm.refund_amount),
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Booking completed')
        setCompleteOpen(false)
        setSelectedBooking(null)
      }
    })
  }

  const moto = selectedBooking
    ? Array.isArray(selectedBooking.motorcycles)
      ? selectedBooking.motorcycles[0]
      : selectedBooking.motorcycles
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === s
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-[#F5F7FA]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
          <Input
            placeholder="Search name or phone…"
            className="pl-8 w-56 bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#94A3B8] font-medium">Tourist</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Phone</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Motorcycle</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Duration</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Total</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => {
              const motorcycle = Array.isArray(b.motorcycles) ? b.motorcycles[0] : b.motorcycles
              const days = Math.max(
                1,
                Math.ceil(
                  (new Date(b.return_date).getTime() - new Date(b.pickup_date).getTime()) / 86400000
                )
              )
              return (
                <TableRow
                  key={b.id}
                  className="border-white/8 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell className="font-medium text-[#F5F7FA]">{b.guest_name ?? '—'}</TableCell>
                  <TableCell className="text-[#94A3B8]">{b.guest_phone ?? '—'}</TableCell>
                  <TableCell className="text-[#94A3B8]">
                    {motorcycle ? `${motorcycle.model} · ${motorcycle.plate_number}` : '—'}
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">{days}d</TableCell>
                  <TableCell className="text-[#F5F7FA]">RM {(b.total_price ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge(b.status)}>{b.status}</span>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow className="border-white/8">
                <TableCell colSpan={6} className="text-center text-[#94A3B8] py-10">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[#132A4D] border-white/8">
          <SheetHeader>
            <SheetTitle className="text-[#F5F7FA]">Booking Details</SheetTitle>
            <SheetDescription className="text-[#94A3B8]">
              #{selectedBooking?.id.slice(0, 8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Tourist</p>
                  <p className="font-medium text-[#F5F7FA]">{selectedBooking.guest_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Phone</p>
                  <p className="font-medium text-[#F5F7FA]">{selectedBooking.guest_phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Motorcycle</p>
                  <p className="font-medium text-[#F5F7FA]">
                    {moto ? `${moto.model} (${moto.plate_number})` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Status</p>
                  <span className={getStatusBadge(selectedBooking.status)}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Pickup</p>
                  <p className="font-medium text-[#F5F7FA]">
                    {format(new Date(selectedBooking.pickup_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Return</p>
                  <p className="font-medium text-[#F5F7FA]">
                    {format(new Date(selectedBooking.return_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Rental Price</p>
                  <p className="font-medium text-[#F5F7FA]">RM {(selectedBooking.rental_price ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs mb-0.5">Security Deposit</p>
                  <p className="font-medium text-[#F5F7FA]">
                    RM {(selectedBooking.security_deposit ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#94A3B8] text-xs mb-0.5">Total</p>
                  <p className="text-lg font-bold text-[#FF6A00]">
                    RM {(selectedBooking.total_price ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedBooking.qr_code_image_url && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-[#94A3B8]">QR Code</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedBooking.qr_code_image_url}
                    alt="Booking QR Code"
                    className="size-40 border border-white/10 rounded-xl object-contain bg-white"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    onClick={() => handleActivate(selectedBooking.id)}
                    disabled={isPending}
                    className="flex-1 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                  >
                    {isPending ? 'Activating…' : 'Activate Booking'}
                  </Button>
                )}
                {selectedBooking.status === 'active' && (
                  <Button
                    onClick={() => setCompleteOpen(true)}
                    disabled={isPending}
                    className="flex-1 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                  >
                    Complete Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="bg-[#132A4D] border-white/8 text-[#F5F7FA]">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">Complete Booking</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Bike Condition (1–5)</Label>
              <Select
                value={completeForm.bike_condition_rating}
                onValueChange={(v) =>
                  setCompleteForm((f) => ({ ...f, bike_condition_rating: v }))
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-[#F5F7FA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#132A4D] border-white/10">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-[#F5F7FA]">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Fuel Level</Label>
              <Select
                value={completeForm.fuel_level}
                onValueChange={(v) => setCompleteForm((f) => ({ ...f, fuel_level: v }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-[#F5F7FA]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#132A4D] border-white/10">
                  {['empty', 'quarter', 'half', 'three-quarter', 'full'].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize text-[#F5F7FA]">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Damage Notes</Label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F7FA] placeholder:text-[#94A3B8] resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50"
                value={completeForm.damage_notes}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, damage_notes: e.target.value }))
                }
                placeholder="Describe any damage…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#94A3B8]">Refund Amount (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={completeForm.refund_amount}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, refund_amount: e.target.value }))
                }
                className="bg-white/5 border-white/10 text-[#F5F7FA]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteOpen(false)}
              className="border-white/10 text-[#94A3B8] hover:bg-white/5 hover:text-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="bg-[#FF6A00] hover:bg-[#e05e00] text-white"
            >
              {isPending ? 'Completing…' : 'Complete Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
