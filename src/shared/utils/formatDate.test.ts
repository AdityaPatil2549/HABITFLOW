import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatRelativeDate,
  getISODateString,
  isPast,
  isFuture,
  addDays,
  getWeekStart,
  getMonthStart,
  isSameDay,
} from './formatDate'

describe('formatDate', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
    })

    it('should handle string input', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('Jan')
    })
  })

  describe('formatRelativeDate', () => {
    it('should return "Today" for current date', () => {
      const today = new Date()
      const result = formatRelativeDate(today)
      expect(result).toBe('Today')
    })

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = addDays(new Date(), -1)
      const result = formatRelativeDate(yesterday)
      expect(result).toBe('Yesterday')
    })

    it('should return formatted date for older dates', () => {
      const oldDate = new Date('2024-01-01')
      const result = formatRelativeDate(oldDate)
      expect(result).not.toBe('Today')
      expect(result).not.toBe('Yesterday')
    })
  })

  describe('getISODateString', () => {
    it('should return ISO date string', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = getISODateString(date)
      expect(result).toBe('2024-01-15')
    })

    it('should handle default current date', () => {
      const result = getISODateString()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('isPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01')
      expect(isPast(pastDate)).toBe(true)
    })

    it('should return false for future dates', () => {
      const futureDate = addDays(new Date(), 1)
      expect(isPast(futureDate)).toBe(false)
    })

    it('should handle string input', () => {
      expect(isPast('2020-01-01')).toBe(true)
    })
  })

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = addDays(new Date(), 1)
      expect(isFuture(futureDate)).toBe(true)
    })

    it('should return false for past dates', () => {
      expect(isFuture('2020-01-01')).toBe(false)
    })
  })

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, 5)
      expect(getISODateString(result)).toBe('2024-01-20')
    })

    it('should subtract days correctly', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, -5)
      expect(getISODateString(result)).toBe('2024-01-10')
    })
  })

  describe('getWeekStart', () => {
    it('should return Monday as week start', () => {
      // Wednesday, Jan 17, 2024
      const wednesday = new Date('2024-01-17')
      const weekStart = getWeekStart(wednesday)
      // Should be Monday, Jan 15, 2024
      expect(weekStart.getDay()).toBe(1) // Monday
    })
  })

  describe('getMonthStart', () => {
    it('should return first day of month', () => {
      const date = new Date('2024-01-15')
      const monthStart = getMonthStart(date)
      expect(monthStart.getDate()).toBe(1)
      expect(monthStart.getMonth()).toBe(0) // January
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T10:30:00')
      const date2 = new Date('2024-01-15T18:45:00')
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-16')
      expect(isSameDay(date1, date2)).toBe(false)
    })
  })
})
