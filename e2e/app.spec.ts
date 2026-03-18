import { test, expect } from '@playwright/test'

test.describe('Authentication & Navigation', () => {
  test('should load the dashboard', async ({ page }) => {
    await page.goto('/')
    
    // Check if the app loaded
    await expect(page.locator('body')).toContainText('HabitFlow')
  })

  test('should navigate to habits page', async ({ page }) => {
    await page.goto('/')
    
    // Click on habits link
    await page.click('text=Habits')
    
    // Check if we're on habits page
    await expect(page).toHaveURL(/.*habits/)
  })

  test('should navigate to tasks page', async ({ page }) => {
    await page.goto('/')
    
    // Click on tasks link
    await page.click('text=Tasks')
    
    // Check if we're on tasks page
    await expect(page).toHaveURL(/.*tasks/)
  })

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/')
    
    // Click on analytics link
    await page.click('text=Analytics')
    
    // Check if we're on analytics page
    await expect(page).toHaveURL(/.*analytics/)
  })
})

test.describe('Habit Management', () => {
  test('should add a new habit', async ({ page }) => {
    await page.goto('/habits')
    
    // Click add habit button
    await page.click('[data-testid="add-habit-button"]')
    
    // Fill in habit form
    await page.fill('[data-testid="habit-name-input"]', 'Test Habit')
    await page.fill('[data-testid="habit-description-input"]', 'Test Description')
    
    // Save habit
    await page.click('[data-testid="save-habit-button"]')
    
    // Verify habit was added
    await expect(page.locator('text=Test Habit')).toBeVisible()
  })

  test('should complete a habit', async ({ page }) => {
    await page.goto('/habits')
    
    // Find and click complete button for first habit
    await page.click('[data-testid="complete-habit-button"]:first-of-type')
    
    // Verify completion indicator
    await expect(page.locator('[data-testid="habit-completed"]')).toBeVisible()
  })
})

test.describe('Task Management', () => {
  test('should add a new task', async ({ page }) => {
    await page.goto('/tasks')
    
    // Click add task button
    await page.click('[data-testid="add-task-button"]')
    
    // Fill in task form
    await page.fill('[data-testid="task-title-input"]', 'Test Task')
    await page.fill('[data-testid="task-description-input"]', 'Test Description')
    
    // Save task
    await page.click('[data-testid="save-task-button"]')
    
    // Verify task was added
    await expect(page.locator('text=Test Task')).toBeVisible()
  })

  test('should complete a task', async ({ page }) => {
    await page.goto('/tasks')
    
    // Find and click complete button for first task
    await page.click('[data-testid="complete-task-button"]:first-of-type')
    
    // Verify completion
    await expect(page.locator('[data-testid="task-completed"]')).toBeVisible()
  })
})

test.describe('Settings', () => {
  test('should update notification settings', async ({ page }) => {
    await page.goto('/settings')
    
    // Toggle a setting
    await page.click('[data-testid="toggle-habit-reminders"]')
    
    // Verify setting was saved
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Check that mobile menu is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/')
    
    // Check that sidebar is visible on tablet
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
  })
})
