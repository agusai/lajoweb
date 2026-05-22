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
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tourist</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Security Deposit</TableHead>
            <TableHead>Damage Notes</TableHead>
            <TableHead>Refund Amount (RM)</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.guest_name ?? '—'}</TableCell>
              <TableCell>{format(new Date(b.return_date), 'dd MMM yyyy')}</TableCell>
              <TableCell>RM {(b.security_deposit ?? 0).toFixed(2)}</TableCell>
              <TableCell className="max-w-48">
                <span className="block truncate">{b.damage_notes ?? '—'}</span>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-28"
                  value={amounts[b.id] ?? '0'}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [b.id]: e.target.value }))
                  }
                />
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => handleProcess(b.id)} disabled={isPending}>
                  Process Refund
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {bookings.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                No completed bookings with security deposits
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
