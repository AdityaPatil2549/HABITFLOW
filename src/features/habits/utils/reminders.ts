export interface Reminder {
  enabled: boolean
  time: string // Format: "HH:mm"
  days?: number[] // 0-6 for weekly reminders
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export const scheduleNotification = (title: string, body: string, delay: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  setTimeout(() => {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'habit-reminder',
    })
  }, delay)
}

export const calculateReminderDelay = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const reminder = new Date()
  reminder.setHours(hours, minutes, 0, 0)

  if (reminder <= now) {
    reminder.setDate(reminder.getDate() + 1)
  }

  return reminder.getTime() - now.getTime()
}

export const scheduleHabitReminder = (habitName: string, reminder: Reminder) => {
  if (!reminder.enabled) return

  const delay = calculateReminderDelay(reminder.time)
  scheduleNotification(
    `Time for ${habitName}`,
    `Don't forget to complete your habit!`,
    delay
  )
}

export const checkAndScheduleReminders = async (habits: Array<{ name: string; reminder?: Reminder }>) => {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return

  habits.forEach(habit => {
    if (habit.reminder?.enabled) {
      scheduleHabitReminder(habit.name, habit.reminder)
    }
  })
}
