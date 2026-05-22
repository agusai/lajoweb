'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { processRefund } from './actions'
import type { CompletedBooking } from './page'

export function RefundsTable({ bookings }: { bookings: CompletedBooking[] }) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(bookings.map((b) => [b.id, String(b.refund_amount ?? 0)]))
  )
  const [isPending, startTransition] = useTransition()

  function handleProcess(id: string) {
    const amount = parseFloat(amounts[id] ?? '0')
    if (isNaN(amount) || amount < 0) {
      toast.error('Invalid refund amount')
      return
    }
    startTransition(async () => {
      const result = await processRefund(id, amount)
      if (result.error) toast.error(result.error)
      else toast.success(`Refund of RM ${amount.toFixed(2)} processed`)
    })
  }

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/8 hover:bg-transparent">
            <TableHead className="text-[#94A3B8] font-medium">Tourist</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Return Date</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Security Deposit</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Damage Notes</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Refund Amount (RM)</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id} className="border-white/8 hover:bg-white/5 transition-colors">
              <TableCell className="font-medium text-[#F5F7FA]">{b.guest_name ?? '—'}</TableCell>
              <TableCell className="text-[#94A3B8]">{format(new Date(b.return_date), 'dd MMM yyyy')}</TableCell>
              <TableCell className="text-[#F5F7FA]">RM {(b.security_deposit ?? 0).toFixed(2)}</TableCell>
              <TableCell className="max-w-48">
                <span className="block truncate text-[#94A3B8]">{b.damage_notes ?? '—'}</span>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-28 bg-white/5 border-white/10 text-[#F5F7FA]"
                  value={amounts[b.id] ?? '0'}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [b.id]: e.target.value }))
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleProcess(b.id)}
                  disabled={isPending}
                  className="bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                >
                  Process Refund
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {bookings.length === 0 && (
            <TableRow className="border-white/8">
              <TableCell colSpan={6} className="text-center text-[#94A3B8] py-10">
                No completed bookings with security deposits
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
