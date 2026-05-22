'use client'

import { useState, useMemo, useTransition } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { activateBooking, completeBooking } from './actions'
import type { BookingWithRelations } from './page'

const STATUS_TABS = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'] as const

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'confirmed': return 'secondary'
    case 'active': return 'default'
    case 'completed': return 'outline'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name or phone…"
            className="pl-8 w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tourist</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Motorcycle</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell className="font-medium">{b.guest_name ?? '—'}</TableCell>
                  <TableCell>{b.guest_phone ?? '—'}</TableCell>
                  <TableCell>
                    {motorcycle ? `${motorcycle.model} · ${motorcycle.plate_number}` : '—'}
                  </TableCell>
                  <TableCell>{days}d</TableCell>
                  <TableCell>RM {(b.total_price ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>
              #{selectedBooking?.id.slice(0, 8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Tourist</p>
                  <p className="font-medium">{selectedBooking.guest_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                  <p className="font-medium">{selectedBooking.guest_phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Motorcycle</p>
                  <p className="font-medium">
                    {moto ? `${moto.model} (${moto.plate_number})` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                  <Badge variant={statusVariant(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Pickup</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.pickup_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Return</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.return_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Rental Price</p>
                  <p className="font-medium">RM {(selectedBooking.rental_price ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Security Deposit</p>
                  <p className="font-medium">
                    RM {(selectedBooking.security_deposit ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Total</p>
                  <p className="text-lg font-bold">
                    RM {(selectedBooking.total_price ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedBooking.qr_code_image_url && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground">QR Code</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedBooking.qr_code_image_url}
                    alt="Booking QR Code"
                    className="size-40 border rounded-xl object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    onClick={() => handleActivate(selectedBooking.id)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? 'Activating…' : 'Activate Booking'}
                  </Button>
                )}
                {selectedBooking.status === 'active' && (
                  <Button
                    onClick={() => setCompleteOpen(true)}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Complete Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Complete Booking Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Booking</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Bike Condition (1–5)</Label>
              <Select
                value={completeForm.bike_condition_rating}
                onValueChange={(v) =>
                  setCompleteForm((f) => ({ ...f, bike_condition_rating: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fuel Level</Label>
              <Select
                value={completeForm.fuel_level}
                onValueChange={(v) => setCompleteForm((f) => ({ ...f, fuel_level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['empty', 'quarter', 'half', 'three-quarter', 'full'].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Damage Notes</Label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                value={completeForm.damage_notes}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, damage_notes: e.target.value }))
                }
                placeholder="Describe any damage…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Refund Amount (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={completeForm.refund_amount}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, refund_amount: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isPending}>
              {isPending ? 'Completing…' : 'Complete Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
