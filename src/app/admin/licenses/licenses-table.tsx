'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, CircleX } from 'lucide-react'
import { toast } from 'sonner'
import { approveLicense, rejectLicense } from './actions'
import type { LicenseRow } from './page'

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border'
  switch (status) {
    case 'verified': return `${base} bg-green-500/15 text-green-400 border-green-500/25`
    case 'pending': return `${base} bg-orange-500/15 text-[#FF9B4D] border-orange-500/25`
    case 'failed': return `${base} bg-red-500/15 text-red-400 border-red-500/25`
    case 'expired': return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
    default: return `${base} bg-slate-500/15 text-slate-400 border-slate-500/25`
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
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              <TableHead className="text-[#94A3B8] font-medium">Thumbnail</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">License #</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Expiry</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">OCR Confidence</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Status</TableHead>
              <TableHead className="text-[#94A3B8] font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((l) => (
              <TableRow key={l.id} className="border-white/8 hover:bg-white/5 transition-colors">
                <TableCell>
                  {l.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.image_url}
                      alt="License thumbnail"
                      className="size-12 object-cover rounded-lg border border-white/10"
                    />
                  ) : (
                    <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center text-xs text-[#94A3B8]">
                      No img
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-[#F5F7FA]">{l.license_number ?? '—'}</TableCell>
                <TableCell className="text-[#94A3B8]">{l.expiry_date ?? '—'}</TableCell>
                <TableCell>
                  {l.ocr_confidence != null ? (
                    <span
                      className={
                        l.ocr_confidence >= 0.8
                          ? 'text-green-400 font-medium'
                          : 'text-[#FF9B4D] font-medium'
                      }
                    >
                      {(l.ocr_confidence * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={getStatusBadge(l.verification_status)}>
                    {l.verification_status}
                  </span>
                </TableCell>
                <TableCell>
                  {l.verification_status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(l.id)}
                        disabled={isPending}
                        className="gap-1.5 bg-[#FF6A00] hover:bg-[#e05e00] text-white"
                      >
                        <CheckCircle className="size-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setRejectTarget(l.id)}
                        disabled={isPending}
                        className="gap-1.5 bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25"
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
              <TableRow className="border-white/8">
                <TableCell colSpan={6} className="text-center text-[#94A3B8] py-10">
                  No license submissions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="bg-[#132A4D] border-white/8 text-[#F5F7FA]">
          <DialogHeader>
            <DialogTitle className="text-[#F5F7FA]">Reject License</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#94A3B8]">Rejection Reason</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why the license is rejected…"
              className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              className="border-white/10 text-[#94A3B8] hover:bg-white/5 hover:text-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isPending}
              className="bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25"
            >
              {isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
