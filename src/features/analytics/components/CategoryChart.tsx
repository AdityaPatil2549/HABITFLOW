import { type FC } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/shared/utils/cn'

interface CategoryChartProps {
  data: Array<{
    category: string
    count: number
    percentage: number
  }>
  height?: number
  className?: string
}

const COLORS = [
  'var(--color-brand)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-info)',
  '#7C3AED', // purple
  '#EA580C', // orange
  '#0891B2', // cyan
]

export const CategoryChart: FC<CategoryChartProps> = ({
  data,
  height = 300,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percentage }) => `${category} ${Math.round(percentage)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value: any, name: string, props: any) => [
              `${value} habits`,
              props.payload.category,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: any) => (
              <span style={{ color: 'var(--color-text)' }}>
                {entry.payload.category} ({entry.payload.count})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
