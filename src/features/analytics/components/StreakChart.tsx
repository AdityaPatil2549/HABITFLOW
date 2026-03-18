import { type FC } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/shared/utils/cn'

interface StreakChartProps {
  data: Array<{
    range: string
    count: number
    percentage: number
  }>
  height?: number
  className?: string
}

const STREAK_COLORS = {
  '0': 'var(--color-muted)',    // No streak
  '1-7': 'var(--color-warning)', // 1-7 days
  '8-30': 'var(--color-info)',   // 8-30 days
  '31+': 'var(--color-success)', // 31+ days
}

export const StreakChart: FC<StreakChartProps> = ({
  data,
  height = 300,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--color-border)" 
            className="opacity-30"
          />
          <XAxis
            dataKey="range"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelStyle={{ color: 'var(--color-text)' }}
            formatter={(value: any, name: string, props: any) => [
              `${value} habits`,
              `${props.payload.range} day streak`,
            ]}
          />
          <Bar
            dataKey="count"
            fill={(entry: any) => STREAK_COLORS[entry.range as keyof typeof STREAK_COLORS]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
