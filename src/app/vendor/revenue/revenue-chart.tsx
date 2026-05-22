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
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              period === p
                ? 'bg-[#FF6A00] text-white'
                : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-[#F5F7FA]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v: number) => `RM${v}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`RM ${Number(v).toFixed(2)}`, 'Revenue']}
              contentStyle={{
                borderRadius: '8px',
                fontSize: '12px',
                backgroundColor: '#0D1B2A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F5F7FA',
              }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#FF6A00" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
