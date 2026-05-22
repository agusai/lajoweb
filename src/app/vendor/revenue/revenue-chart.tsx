'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { RevenueDataPoint } from './page'

type Period = 'daily' | 'weekly' | 'monthly'

export function VendorRevenueChart({
  daily,
  weekly,
  monthly,
}: {
  daily: RevenueDataPoint[]
  weekly: RevenueDataPoint[]
  monthly: RevenueDataPoint[]
}) {
  const [period, setPeriod] = useState<Period>('monthly')
  const data = period === 'daily' ? daily : period === 'weekly' ? weekly : monthly

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `RM${v}`} />
            <Tooltip
              formatter={(v) => [`RM ${Number(v).toFixed(2)}`, 'Revenue']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
