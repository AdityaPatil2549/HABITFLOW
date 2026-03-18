import { type FC } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/shared/utils/cn'

interface CompletionChartProps {
  data: Array<{
    date: string
    completionRate: number
    completed: number
    total: number
  }>
  height?: number
  className?: string
}

export const CompletionChart: FC<CompletionChartProps> = ({
  data,
  height = 300,
  className,
}) => {
  // Format data for display
  const chartData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    }),
  }))

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--color-border)" 
            className="opacity-30"
          />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelStyle={{ color: 'var(--color-text)' }}
            formatter={(value: any, name: string) => {
              if (name === 'completionRate') {
                return [`${Math.round(Number(value))}%`, 'Completion Rate']
              }
              if (name === 'completed') {
                return [`${value}`, 'Completed']
              }
              if (name === 'total') {
                return [`${value}`, 'Total Habits']
              }
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="completionRate"
            stroke="var(--color-brand)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-brand)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
