'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { toggleVendorStatus, approveVendor } from './actions'
import type { VendorWithCount } from './page'

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

export function VendorsTable({ vendors }: { vendors: VendorWithCount[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleVendorStatus(id, !current)
      if (result.error) toast.error(result.error)
      else toast.success(current ? 'Vendor suspended' : 'Vendor activated')
    })
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveVendor(id)
      if (result.error) toast.error(result.error)
      else toast.success('Vendor verified')
    })
  }

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/8 hover:bg-transparent">
            <TableHead className="text-[#94A3B8] font-medium">Company</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Email</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Phone</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Motorcycles</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Verified</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Status</TableHead>
            <TableHead className="text-[#94A3B8] font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((v) => (
            <TableRow key={v.id} className="border-white/8 hover:bg-white/5 transition-colors">
              <TableCell className="font-medium text-[#F5F7FA]">{v.company_name ?? v.name ?? '—'}</TableCell>
              <TableCell className="text-[#94A3B8]">{v.email}</TableCell>
              <TableCell className="text-[#94A3B8]">{v.phone ?? '—'}</TableCell>
              <TableCell className="text-[#F5F7FA]">{v.motorcycle_count}</TableCell>
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
              <TableCell>
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
                    onClick={() => handleToggle(v.id, v.is_active)}
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
              <TableCell colSpan={7} className="text-center text-[#94A3B8] py-10">
                No vendors found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
