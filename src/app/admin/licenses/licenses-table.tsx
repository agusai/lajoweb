'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, CircleX } from 'lucide-react'
import { toast } from 'sonner'
import { approveLicense, rejectLicense } from './actions'
import type { LicenseRow } from './page'

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'verified': return 'default'
    case 'pending': return 'secondary'
    case 'failed': return 'destructive'
    case 'expired': return 'outline'
    default: return 'secondary'
  }
}

export function LicensesTable({ licenses }: { licenses: LicenseRow[] }) {
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveLicense(id)
      if (result.error) toast.error(result.error)
      else toast.success('License approved')
    })
  }

  function handleReject() {
    if (!rejectTarget) return
    startTransition(async () => {
      const result = await rejectLicense(rejectTarget, rejectReason)
      if (result.error) toast.error(result.error)
      else {
        toast.success('License rejected')
        setRejectTarget(null)
        setRejectReason('')
      }
    })
  }

  return (
    <>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>License #</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>OCR Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  {l.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.image_url}
                      alt="License thumbnail"
                      className="size-12 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{l.license_number ?? '—'}</TableCell>
                <TableCell>{l.expiry_date ?? '—'}</TableCell>
                <TableCell>
                  {l.ocr_confidence != null ? (
                    <span
                      className={
                        l.ocr_confidence >= 0.8
                          ? 'text-green-600 font-medium'
                          : 'text-amber-600 font-medium'
                      }
                    >
                      {(l.ocr_confidence * 100).toFixed(0)}%
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(l.verification_status)}>
                    {l.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {l.verification_status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(l.id)}
                        disabled={isPending}
                        className="gap-1.5"
                      >
                        <CheckCircle className="size-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectTarget(l.id)}
                        disabled={isPending}
                        className="gap-1.5"
                      >
                        <CircleX className="size-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No license submissions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject License</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Rejection Reason</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why the license is rejected…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
