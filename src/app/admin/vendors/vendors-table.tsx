'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { toggleVendorStatus, approveVendor } from './actions'
import type { VendorWithCount } from './page'

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
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Motorcycles</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.company_name ?? v.name ?? '—'}</TableCell>
              <TableCell>{v.email}</TableCell>
              <TableCell>{v.phone ?? '—'}</TableCell>
              <TableCell>{v.motorcycle_count}</TableCell>
              <TableCell>
                {v.is_verified ? (
                  <Badge variant="default">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={v.is_active ? 'default' : 'destructive'}>
                  {v.is_active ? 'Active' : 'Suspended'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {!v.is_verified && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(v.id)}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      <CheckCircle className="size-3.5" />
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={v.is_active ? 'destructive' : 'outline'}
                    onClick={() => handleToggle(v.id, v.is_active)}
                    disabled={isPending}
                  >
                    {v.is_active ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {vendors.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                No vendors found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
