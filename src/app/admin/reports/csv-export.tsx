'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function CsvExport({
  bookings,
}: {
  bookings: { created_at: string; total_price: number }[]
}) {
  function handleExport() {
    const rows = [
      ['Date', 'Revenue (RM)'],
      ...bookings.map((b) => [b.created_at.slice(0, 10), b.total_price.toFixed(2)]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lajo-revenue-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <Download className="size-4" />
      Export CSV
    </Button>
  )
}
