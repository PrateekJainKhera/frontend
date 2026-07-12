"use client"

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { MonthCount, StatusCount, TopCustomerRow } from '@/lib/api/mis'

// Palette validated (dataviz six checks, light surface):
export const MIS_BLUE = '#2563EB'
export const MIS_GREEN = '#059669'
export const MIS_VIOLET = '#7C3AED'

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="pt-0"><p className="text-xs text-muted-foreground">{hint}</p></CardContent>}
    </Card>
  )
}

// Single-series monthly bar chart — thin rounded bars, hover tooltip, no legend (title names the series).
export function MonthBarChart({ title, description, data, color, valueKey = 'count', valueName }: {
  title: string
  description?: string
  data: MonthCount[]
  color: string
  valueKey?: 'count' | 'qty'
  valueName: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data in the last 12 months.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey={valueKey} name={valueName} fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Horizontal category bars as HTML — direct labels + values (identity never color-alone).
export function CategoryBars({ title, description, rows, color, unit }: {
  title: string
  description?: string
  rows: { label: string; count: number }[]
  color: string
  unit?: string
}) {
  const max = Math.max(1, ...rows.map(r => r.count))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No data.</p>}
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-56 shrink-0 text-sm truncate" title={r.label}>{r.label}</span>
            <div className="flex-1 h-4 bg-muted/60 rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(r.count / max) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="w-16 shrink-0 text-sm font-semibold text-right tabular-nums">
              {r.count}{unit ? ` ${unit}` : ''}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function statusRows(rows: StatusCount[]) {
  return rows.map(r => ({ label: r.label, count: r.count }))
}
export function customerRows(rows: TopCustomerRow[]) {
  return rows.map(r => ({ label: r.customerName, count: r.orders }))
}

export function NotCapturedNote({ what }: { what: string }) {
  return (
    <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-4 py-3">
      {what} will appear here once that data is captured in the system — no estimated or sample figures are shown.
    </p>
  )
}
