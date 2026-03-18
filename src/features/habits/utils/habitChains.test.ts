import { describe, it, expect } from 'vitest'
import { calculateCurrentStreak, calculateLongestStreak, getChainStatus } from './habitChains'
import type { HabitEntry } from '@/db/db'

describe('habitChains', () => {
  const createEntry = (date: string, completed: boolean): HabitEntry => ({
    id: '1',
    habitId: 'habit-1',
    date,
    completed,
    value: completed ? 1 : 0,
    createdAt: new Date(),
  })

  describe('calculateCurrentStreak', () => {
    it('should return 0 for no entries', () => {
      const result = calculateCurrentStreak([], new Date())
      expect(result).toBe(0)
    })

    it('should calculate current streak correctly', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', true),
        createEntry('2024-01-03', true),
      ]
      const result = calculateCurrentStreak(entries, new Date('2024-01-03'))
      expect(result).toBe(3)
    })

    it('should break streak on missed day', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', true),
        createEntry('2024-01-03', false),
        createEntry('2024-01-04', true),
      ]
      const result = calculateCurrentStreak(entries, new Date('2024-01-04'))
      expect(result).toBe(1)
    })

    it('should handle streak with gaps', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', false),
        createEntry('2024-01-03', true),
        createEntry('2024-01-04', true),
      ]
      const result = calculateCurrentStreak(entries, new Date('2024-01-04'))
      expect(result).toBe(2)
    })
  })

  describe('calculateLongestStreak', () => {
    it('should return 0 for no entries', () => {
      const result = calculateLongestStreak([])
      expect(result).toBe(0)
    })

    it('should find longest streak', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', true),
        createEntry('2024-01-03', true),
        createEntry('2024-01-04', false),
        createEntry('2024-01-05', true),
        createEntry('2024-01-06', true),
      ]
      const result = calculateLongestStreak(entries)
      expect(result).toBe(3)
    })

    it('should handle single entry', () => {
      const entries = [createEntry('2024-01-01', true)]
      const result = calculateLongestStreak(entries)
      expect(result).toBe(1)
    })

    it('should return 0 for all failed entries', () => {
      const entries = [
        createEntry('2024-01-01', false),
        createEntry('2024-01-02', false),
      ]
      const result = calculateLongestStreak(entries)
      expect(result).toBe(0)
    })
  })

  describe('getChainStatus', () => {
    it('should return empty for no entries', () => {
      const result = getChainStatus([], 7)
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'empty' })]))
    })

    it('should mark completed days correctly', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', true),
      ]
      const result = getChainStatus(entries, 7)
      expect(result[0].status).toBe('completed')
      expect(result[1].status).toBe('completed')
    })

    it('should mark failed days correctly', () => {
      const entries = [
        createEntry('2024-01-01', true),
        createEntry('2024-01-02', false),
      ]
      const result = getChainStatus(entries, 2)
      expect(result[0].status).toBe('completed')
      expect(result[1].status).toBe('failed')
    })
  })
})
