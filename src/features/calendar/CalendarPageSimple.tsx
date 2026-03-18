import { type FC, useState, useEffect } from 'react'
import { Calendar } from '@/shared/components/Calendar'

export const CalendarPage: FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Calendar</h1>
        <p className="text-muted-foreground">
          View your habits and tasks in calendar format
        </p>
      </div>

      <Calendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        events={[]}
      />
    </div>
  )
}
