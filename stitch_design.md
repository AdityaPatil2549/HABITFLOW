---
name: HabitFlow Design System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dbd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fe'
  surface-container: '#efecf8'
  surface-container-high: '#e9e6f3'
  surface-container-highest: '#e4e1ed'
  on-surface: '#1b1b23'
  on-surface-variant: '#464554'
  inverse-surface: '#303038'
  inverse-on-surface: '#f2effb'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#904900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#fcf8ff'
  on-background: '#1b1b23'
  surface-variant: '#e4e1ed'
  brand-50: '#EEF2FF'
  brand-500: '#6366F1'
  brand-600: '#4F46E5'
  brand-700: '#3730A3'
  brand-900: '#1E1B4B'
  success: '#16A34A'
  warning: '#D97706'
  danger: '#DC2626'
  info: '#0D9488'
  neutral-50: '#F8FAFC'
  neutral-900: '#0F172A'
  bg-light: '#F8FAFC'
  surface-light: '#FFFFFF'
  border-light: '#E2E8F0'
  text-muted-light: '#64748B'
  bg-dark: '#0F172A'
  surface-dark: '#1E293B'
  border-dark: '#334155'
  text-dark: '#F1F5F9'
  text-muted-dark: '#94A3B8'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.25'
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.25'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-5: 20px
  space-6: 24px
  space-8: 32px
  space-10: 40px
  space-12: 48px
  space-16: 64px
---


HABITFLOW
Frontend Guidelines
Design System  ·  Component Architecture  ·  Code Standards  ·  Accessibility
Version 1.0  ·  2025

The single source of truth for every UI decision made in HabitFlow.

1. Purpose & Scope
This document is the canonical frontend reference for HabitFlow. Every developer, designer, or contributor must read and follow these guidelines before writing a single line of UI code. Consistency is not a nice-to-have — it is the foundation of a product that feels professional.

SCOPE
Covers: React component architecture, TypeScript conventions, design tokens, Tailwind usage, accessibility standards, performance budgets, animation rules, testing patterns, and folder structure. Does not cover: backend, database schema, or deployment specifics (see PRD).

Attribute
Value
Framework
React 18 + Vite
Language
TypeScript 5.x (strict mode)
Styling
Tailwind CSS v4 + shadcn/ui
State
Zustand + React Query
Charts
Recharts + D3.js
Storage
Dexie.js (IndexedDB)
Testing
Vitest + React Testing Library
Animation
Framer Motion
Icons
Lucide React
Linting
ESLint (airbnb-typescript) + Prettier

2. Project Folder Structure
Strict feature-first architecture. Every feature owns its own folder — no global soup of files.

src/
├── app/                    # App shell: Router, providers, global layout
│   ├── App.tsx
│   ├── Router.tsx
│   └── providers/          # ThemeProvider, QueryProvider, etc.
│
├── features/               # Feature modules (main code lives here)
│   ├── habits/
│   │   ├── components/     # UI components scoped to habits
│   │   ├── hooks/          # useHabits, useHabitForm, etc.
│   │   ├── stores/         # Zustand slice for habits
│   │   ├── services/       # Dexie.js queries (habitService.ts)
│   │   ├── utils/          # Streak calc, schedule logic
│   │   └── types.ts        # Habit-specific TypeScript types
│   ├── tasks/
│   ├── analytics/
│   ├── gamification/
│   └── settings/
│
├── shared/                 # Shared across ALL features
│   ├── components/         # Button, Modal, Badge, Input, etc.
│   ├── hooks/              # useLocalStorage, useDebounce, etc.
│   ├── utils/              # formatDate, cn(), clamp(), etc.
│   └── types/              # Global TS types & Zod schemas
│
├── styles/
│   ├── globals.css         # Tailwind base + CSS variables
│   └── animations.css      # Keyframe definitions
│
├── db/
│   ├── db.ts               # Dexie instance + schema
│   └── migrations/         # Version upgrade handlers
│
└── test/                   # Global test setup & mocks

RULE
Never import from a sibling feature. features/tasks must not import from features/habits. Cross-feature communication goes through the shared/ layer or Zustand stores.

3. Design System & Tokens
All visual decisions are encoded as CSS custom properties and Tailwind tokens. Never hardcode hex values, pixel sizes, or font sizes directly in components.

3.1 Color Palette
Primary & Brand
Swatch
Name
Hex
Usage
 
Brand 50
#EEF2FF
Primary / Light backgrounds, hover states
 
Brand 500
#6366F1
Primary / Default interactive elements
 
Brand 600
#4F46E5
Primary / Hover on brand elements
 
Brand 700
#3730A3
Primary / Active, pressed states
 
Brand 900
#1E1B4B
Primary / Dark mode text on brand

Semantic Colors
Swatch
Name
Hex
Usage
 
Success
#16A34A
Semantic / Completed habits, done tasks
 
Warning
#D97706
Semantic / Streak at risk, overdue tasks
 
Danger
#DC2626
Semantic / Missed habits, delete actions
 
Info
#0D9488
Semantic / Analytics callouts, tips
 
Neutral 50
#F8FAFC
Semantic / Card backgrounds, page bg
 
Neutral 900
#0F172A
Semantic / Primary text

Dark Mode Tokens (CSS Variables)
/* globals.css */
:root {
  --color-bg:          #F8FAFC;
  --color-surface:     #FFFFFF;
  --color-border:      #E2E8F0;
  --color-text:        #0F172A;
  --color-text-muted:  #64748B;
  --color-brand:       #4F46E5;
  --color-brand-lt:    #EEF2FF;
}

.dark {
  --color-bg:          #0F172A;
  --color-surface:     #1E293B;
  --color-border:      #334155;
  --color-text:        #F1F5F9;
  --color-text-muted:  #94A3B8;
  --color-brand:       #818CF8;
  --color-brand-lt:    #1E1B4B;
}

3.2 Typography
One font family. One scale. No exceptions.

Token
Value
Font Family
Inter (with system-ui fallback)
Base Size
16px (1rem)
Scale
12, 14, 16, 18, 20, 24, 30, 36, 48, 60px
Line Height
1.5 body, 1.25 headings, 1.0 labels
Letter Spacing
Normal body; -0.02em headings; 0.05em ALL CAPS labels
Font Weights
400 (regular), 500 (medium), 600 (semibold), 700 (bold)

Token
Usage
Tailwind Class
Display
Hero stats, big numbers (streak count)
text-5xl font-bold tracking-tight
H1
Page titles
text-3xl font-bold
H2
Section headings
text-2xl font-semibold
H3
Card headings
text-lg font-semibold
Body Large
Intro paragraphs, callouts
text-base leading-relaxed
Body
Default text
text-sm leading-normal
Label
Form labels, table headers
text-xs font-medium uppercase tracking-wide
Caption
Helper text, timestamps
text-xs text-muted-foreground
Code
Inline code, shortcuts
font-mono text-sm bg-muted px-1 rounded

3.3 Spacing Scale
All spacing uses Tailwind's 4px base grid. Never use arbitrary values unless absolutely necessary and documented with a comment.

Token
Value
Common Usage
space-1
4px
Icon gaps, tight padding
space-2
8px
Button padding X, badge padding
space-3
12px
Input padding, small card padding
space-4
16px
Card padding, list item gap
space-5
20px
Section padding (mobile)
space-6
24px
Card gap, section padding
space-8
32px
Page section spacing
space-10
40px
Large section gap
space-12
48px
Page top padding
space-16
64px
Hero spacing

3.4 Border Radius
Token
Value
Usage
rounded-sm
4px
Badges, chips, tags
rounded
6px
Buttons, inputs, small cards
rounded-md
8px
Standard cards, dropdowns
rounded-lg
12px
Modal panels, large cards
rounded-xl
16px
Hero cards, feature sections
rounded-2xl
24px
Bottom sheets, overlays
rounded-full
9999px
Avatars, circular buttons, pills

3.5 Elevation & Shadows
Token
Usage
shadow-sm
Subtle card lift, default resting state
shadow
Interactive card hover state
shadow-md
Dropdowns, context menus
shadow-lg
Modals, sidebars, floating panels
shadow-xl
Command palette, full-screen overlays
shadow-none
Inline elements, table rows, flat UI sections

RULE
Elevation must increase with Z-index. A modal (z-50, shadow-lg) must always visually sit above a dropdown (z-40, shadow-md). Never use shadow-xl on inline elements.

4. Component Architecture
4.1 Component Classification
Every component in HabitFlow belongs to exactly one of three tiers:

Tier
Location
Rules
Primitive
shared/components/ui/
Zero domain knowledge. Fully generic. Reusable anywhere. E.g., Button, Input, Modal, Badge.
Composite
shared/components/
Combines Primitives. Still no domain logic. E.g., StatCard, DatePicker, ConfirmDialog.
Feature
features/{name}/components/
Contains domain logic. Uses Primitives + Composites + hooks. E.g., HabitCard, StreakBadge, TaskRow.

4.2 Component File Structure
Every component follows this exact file pattern — no exceptions:

// HabitCard.tsx — Feature component example

import { type FC } from 'react'
import { cn } from '@/shared/utils/cn'
import { Badge } from '@/shared/components/ui/Badge'
import { useHabitStreak } from '../hooks/useHabitStreak'
import type { Habit } from '../types'

// ─── Types ───────────────────────────────────────────────────
interface HabitCardProps {
  habit: Habit
  onComplete: (id: string, value: number) => void
  className?: string
}

// ─── Component ───────────────────────────────────────────────
export const HabitCard: FC<HabitCardProps> = ({
  habit,
  onComplete,
  className,
}) => {
  const { current, best } = useHabitStreak(habit.id)

  return (
    <div className={cn('rounded-lg border bg-surface p-4', className)}>
      {/* ... */}
    </div>
  )
}

// Default export only for lazy-loaded route components
// Named exports for everything else

4.3 Component Rules
✅  DO
❌  DON'T
Use named exports for all components
Use default exports (except route-level lazy components)
Keep components under 150 lines; extract if longer
Write 300+ line component files
Accept className prop for style extension
Use inline styles except for dynamic values
Co-locate test file: HabitCard.test.tsx
Put tests in a separate /tests folder
Use composition over prop drilling (> 2 levels)
Drill props more than 2 levels deep — use context or Zustand
Memoize with React.memo only after profiling
Wrap everything in React.memo 'just in case'
Declare prop types with interface, not type alias
Use anonymous type literals for props
One component per file
Export multiple components from one file

4.4 Shared Component Inventory
These primitives must be built in Phase 1 before any feature work. All are based on shadcn/ui with HabitFlow design tokens applied.

Component
Props Summary
Notes
Button
variant, size, loading, icon, disabled
4 variants: primary, secondary, ghost, danger
Input
label, error, hint, prefix, suffix
Includes floating label animation
Textarea
label, error, maxLength, showCount
Auto-resize on content growth
Badge
variant, size, dot
7 semantic variants matching color tokens
Modal
isOpen, onClose, title, size
Focus trap + ESC key + backdrop click to close
Drawer
isOpen, onClose, side, size
Slides from right (habit detail) or bottom (mobile)
Tooltip
content, side, delay
Accessible — tied to aria-describedby
Progress
value, max, color, size, animated
Used in dashboard ring + project bars
Skeleton
width, height, rounded
Loading state for every data-driven component
EmptyState
icon, title, description, action
Standardized zero-state for all list views
StatCard
label, value, delta, icon, trend
KPI card used throughout analytics
ConfirmDialog
title, message, onConfirm, danger
Wraps Modal; used for destructive actions

5. TypeScript Standards
5.1 Strictness
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

5.2 Type Conventions
✅  DO
❌  DON'T
Use interface for object shapes (Props, DB entities)
Use type alias for object shapes
Use type alias for unions, intersections, primitives
Use interface for unions
Use Zod for runtime validation at DB boundaries
Use 'as' casts to satisfy TypeScript
Use unknown instead of any for external data
Use any — ever
Prefix event handlers: handleClick, handleSubmit
Name handlers onClick inline without extraction
Use satisfies operator to validate config objects
Use as to bypass type checking

// ✅ Correct — Zod schema + inferred type
import { z } from 'zod'

export const HabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['boolean', 'count', 'duration', 'rating']),
  frequency: z.object({
    type: z.enum(['daily', 'weekly', 'interval']),
    days: z.array(z.number().min(0).max(6)).optional(),
    interval: z.number().positive().optional(),
  }),
  targetValue: z.number().positive().optional(),
  createdAt: z.date(),
})

export type Habit = z.infer<typeof HabitSchema>

6. Tailwind CSS Conventions
6.1 Class Ordering
Classes must follow this order (enforced by Prettier + prettier-plugin-tailwindcss):

Layout (display, position, z-index, flex/grid)
Sizing (width, height, min/max)
Spacing (margin, padding)
Typography (font, text, leading)
Visual (background, border, shadow, ring)
Interactive (cursor, transition, hover/focus states)
Dark mode variants
Responsive variants (sm:, md:, lg:)

6.2 The cn() Utility
Always use the cn() utility (clsx + tailwind-merge) for conditional classes. Never use template literals or string concatenation for class names.

// shared/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// Usage:
className={cn(
  'base-classes rounded-md px-4 py-2',
  isActive && 'bg-brand text-white',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className   // always last: allow external override
)}

6.3 Arbitrary Values — When Allowed
✅  DO
❌  DON'T
Use Tailwind scale: w-64, p-4, text-sm
Use w-[250px] when w-64 (256px) works fine
Use arbitrary for chart dimensions: h-[340px]
Use arbitrary for standard spacing
Comment WHY arbitrary is needed
Leave arbitrary values without explanation
Use CSS variables for repeated arbitrary values
Repeat the same arbitrary value in 3+ places

7. State Management
7.1 State Taxonomy
State Type
Solution
Server/DB state (IndexedDB)
React Query (useLiveQuery wrapper for Dexie)
Global UI state (theme, sidebar)
Zustand store
Feature state (habit filters)
Zustand feature slice
Form state
React Hook Form + Zod resolver
Ephemeral UI (tooltip open, modal)
useState local to component
URL state (active tab, filters)
React Router searchParams

7.2 Zustand Store Pattern
// features/habits/stores/habitStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HabitStore {
  selectedDate: string          // ISO date string
  filterCategory: string | null
  viewMode: 'grid' | 'list'
  setSelectedDate: (date: string) => void
  setFilter: (category: string | null) => void
  toggleViewMode: () => void
}

export const useHabitStore = create<HabitStore>()(persist(
  (set, get) => ({
    selectedDate: new Date().toISOString().split('T')[0],
    filterCategory: null,
    viewMode: 'grid',

    setSelectedDate: (date) => set({ selectedDate: date }),
    setFilter: (category) => set({ filterCategory: category }),
    toggleViewMode: () =>
      set({ viewMode: get().viewMode === 'grid' ? 'list' : 'grid' }),
  }),
  { name: 'habit-ui-state' }
))

7.3 Data Fetching Pattern
// features/habits/hooks/useHabits.ts
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { useHabitStore } from '../stores/habitStore'

export const useHabits = () => {
  const { filterCategory } = useHabitStore()

  const habits = useLiveQuery(
    () => filterCategory
      ? db.habits.where('category').equals(filterCategory).toArray()
      : db.habits.where('archived').equals(0).toArray(),
    [filterCategory]  // deps array — re-queries on change
  )

  return {
    habits: habits ?? [],
    isLoading: habits === undefined,
  }
}

8. Animation & Motion
8.1 Principles
Animation must serve purpose: confirm action, guide attention, or show state change.
Default duration: 150–300ms. Never exceed 500ms for UI transitions.
Use ease-out for elements entering, ease-in for elements leaving.
Always respect prefers-reduced-motion. All Framer Motion variants must have a reduced fallback.
Never animate layout properties (width/height) — animate transform and opacity only.

8.2 Motion Variants Library
// shared/utils/motionVariants.ts
import { Variants } from 'framer-motion'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:   { opacity: 0, y: 8,  transition: { duration: 0.15, ease: 'easeIn'  } },
}

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}

// Habit check-in completion burst
export const checkmarkBounce: Variants = {
  unchecked: { scale: 1 },
  checked:   { scale: [1, 1.3, 0.95, 1.05, 1], transition: { duration: 0.4 } },
}

// Streak counter increment
export const counterPop: Variants = {
  rest:  { scale: 1 },
  pop:   { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
}

REDUCED MOTION
Always wrap all animation with: import { useReducedMotion } from 'framer-motion' — if reducedMotion is true, pass duration: 0 to all transitions.

9. Accessibility (a11y)
TARGET
WCAG 2.1 Level AA compliance is non-negotiable. HabitFlow must be fully operable via keyboard and compatible with screen readers.

9.1 Semantic HTML First
✅  DO
❌  DON'T
Use <button> for click actions
Use <div onClick={...}>
Use <nav>, <main>, <section>, <aside> landmarks
Use <div> for every container
Use <ul> + <li> for habit and task lists
Render lists as <div>s
Use <label> associated with every input
Use placeholder as the only label
Use <h1>→<h6> in logical order
Skip heading levels for visual sizing

9.2 ARIA Requirements
Component
Required ARIA
Modal / Drawer
role='dialog', aria-modal='true', aria-labelledby, focus trap
Icon-only buttons
aria-label describing the action
Progress rings
role='progressbar', aria-valuenow, aria-valuemin, aria-valuemax
Habit check checkbox
aria-checked, aria-label='Mark [habit name] complete'
Chart containers
role='img', aria-label with text summary of data shown
Loading skeletons
aria-busy='true' on parent container
Streak badge
aria-label='Current streak: 14 days'
Tabs navigation
role='tablist', role='tab', aria-selected, aria-controls
Dropdown menus
role='menu', role='menuitem', aria-expanded, aria-haspopup

9.3 Keyboard Navigation
Key
Action
Scope
Tab / Shift+Tab
Move focus between interactive elements
Global
Enter / Space
Activate buttons, checkboxes
Global
Esc
Close modal, drawer, dropdown
Overlays
Arrow keys
Navigate within tab lists, menus, date picker
Components
Q
Open quick add panel (habit or task)
Global shortcut
T
Jump to Today view
Global shortcut
A
Jump to Analytics
Global shortcut
/
Focus search
Global shortcut

10. Performance Guidelines
10.1 Core Web Vitals Targets
Metric
Target
LCP (Largest Contentful Paint)
< 1.5s on fast 4G
FID / INP (Interaction to Next Paint)
< 100ms
CLS (Cumulative Layout Shift)
< 0.05
FCP (First Contentful Paint)
< 0.8s
TTI (Time to Interactive)
< 3.0s
JS Bundle (initial, gzipped)
< 200KB
Route chunk size (gzipped)
< 80KB per lazy route

10.2 Code Splitting
// app/Router.tsx — All routes are lazy loaded
import { lazy, Suspense } from 'react'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

const Dashboard  = lazy(() => import('@/features/dashboard/DashboardPage'))
const Habits     = lazy(() => import('@/features/habits/HabitsPage'))
const Tasks      = lazy(() => import('@/features/tasks/TasksPage'))
const Analytics  = lazy(() => import('@/features/analytics/AnalyticsPage'))
const Settings   = lazy(() => import('@/features/settings/SettingsPage'))

// Wrap all routes in <Suspense fallback={<PageSkeleton />}>

10.3 Rendering Optimization
Technique
When to Apply
React.memo
Only after measuring with Profiler. Not by default.
useMemo
Expensive computations (streak calculations, chart data transforms)
useCallback
Callbacks passed to memoized child components
Virtual list (react-window)
Lists > 50 items (completed tasks archive, habit log)
Web Worker
Heavy analytics calc (year heatmap, correlation matrix)
Debounce
Search inputs (300ms), chart resize handlers (150ms)
Skeleton screens
Every async data boundary — never blank + spinner
Optimistic updates
Habit check-in, task complete — update UI before DB confirms

11. Charts & Data Visualization
11.1 Library Assignment
Chart Type
Library
Heatmap (GitHub-style)
D3.js (custom — no library does this well)
Line / Area chart (trends)
Recharts LineChart
Bar chart (task throughput, streak history)
Recharts BarChart
Radar chart (weekly overview)
Recharts RadarChart
Pie / Donut (category breakdown)
Recharts PieChart
Scatter plot (habit-mood correlation)
Recharts ScatterChart
Progress ring (daily completion)
SVG + CSS animation (no library)
Histogram (time-of-day)
Recharts BarChart with custom tick

11.2 Chart Accessibility
Every chart container must have role='img' and aria-label with a plain text summary.
Provide a data table alternative accessible via a 'View as table' toggle.
Never rely on color alone to convey meaning — use pattern fills or labels.
Tooltip must be keyboard accessible — trigger on focus, not just hover.
Recharts: always set isAnimationActive={!reducedMotion}.

11.3 Recharts Base Config
// Mandatory props on every Recharts chart
<ResponsiveContainer width='100%' height={300}>
  <LineChart
    data={chartData}
    margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
  >
    <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border)' />
    <XAxis
      dataKey='date'
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
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        fontSize: '13px',
      }}
    />
    <Line
      type='monotone'
      dataKey='value'
      stroke='var(--color-brand)'
      strokeWidth={2}
      dot={false}
      isAnimationActive={!reducedMotion}
    />
  </LineChart>
</ResponsiveContainer>

12. Testing Standards
12.1 Testing Pyramid
Layer
Coverage Target
Unit (utils, hooks, stores)
> 90% — logic must be fully tested
Component (RTL render tests)
> 70% — all states + interactions
Integration (user flows)
> 50% — critical paths end-to-end
E2E (Playwright)
Core flows only: check-in, task complete, analytics load

12.2 Component Test Template
// HabitCard.test.tsx
import { render, screen, userEvent } from '@testing-library/react'
import { HabitCard } from './HabitCard'
import { mockHabit } from '@/test/fixtures'

describe('HabitCard', () => {
  it('renders habit name and current streak', () => {
    render(<HabitCard habit={mockHabit} onComplete={vi.fn()} />)
    expect(screen.getByText(mockHabit.name)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /streak/i })).toBeInTheDocument()
  })

  it('calls onComplete with correct value on check', async () => {
    const onComplete = vi.fn()
    render(<HabitCard habit={mockHabit} onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onComplete).toHaveBeenCalledWith(mockHabit.id, 1)
  })

  it('is keyboard operable', async () => {
    render(<HabitCard habit={mockHabit} onComplete={vi.fn()} />)
    await userEvent.tab()
    expect(screen.getByRole('checkbox')).toHaveFocus()
  })
})

13. Naming Conventions & Code Style
Pattern
Convention
Component files
PascalCase — HabitCard.tsx
Hook files
camelCase — useHabitStreak.ts
Utility files
camelCase — formatDate.ts
Constant files
SCREAMING_SNAKE (values), camelCase (file) — appConfig.ts
Type/interface names
PascalCase — Habit, HabitCardProps
Zustand stores
useXxxStore — useHabitStore
Event handlers
handleXxx — handleComplete, handleDelete
Boolean props
isXxx / hasXxx — isLoading, hasError
Enum values
SCREAMING_SNAKE — HabitType.BOOLEAN
CSS class names
Tailwind only — no custom class names except BEM for complex SVG
Test files
Component.test.tsx colocated with component
Barrel files
index.ts per feature — export public API only

13.1 Comment Standards
✅  DO
❌  DON'T
Comment WHY, not WHAT (code shows what)
// increments i by 1 ← obvious
Use TODO: FIXME: HACK: prefixes with context
Leave stale or undated TODOs
Document non-obvious business logic (streak grace)
Comment every line of code
Use JSDoc on shared utility functions
Skip docs on internal helpers

14. Git & Development Workflow
14.1 Branch Naming
Type
Pattern
Feature
feat/habit-heatmap-chart
Bug fix
fix/streak-calculation-off-by-one
UI/Style
ui/dashboard-layout-mobile
Refactor
refactor/habit-service-extract
Docs
docs/update-component-readme
Chore
chore/upgrade-recharts-v3

14.2 Commit Message Format
FORMAT
type(scope): short description [max 72 chars]

Types: feat, fix, ui, refactor, test, docs, chore, perf
Scope: habits, tasks, analytics, shared, db, app

# Good commits:
feat(habits): add grace day toggle per habit
fix(streak): correct weekly schedule off-by-one error
perf(analytics): move heatmap calc to web worker
ui(dashboard): fix completion ring animation on mobile
test(habits): add HabitCard keyboard interaction tests

# Bad commits:
fix stuff
WIP
updated things

14.3 Pre-commit Checklist
All TypeScript errors resolved (tsc --noEmit passes)
ESLint passes with zero errors
Prettier formatted (auto via husky pre-commit hook)
New component has at least one test
No console.log statements committed
No hardcoded hex colors or pixel values outside design tokens
Tested on mobile viewport (375px)

15. Responsive Design
15.1 Breakpoints
Breakpoint
Tailwind Prefix / Width
Mobile (default)
No prefix / 0–767px
Tablet
md: / 768px+
Desktop
lg: / 1024px+
Wide
xl: / 1280px+

15.2 Layout Rules
Mobile-first always. Write base (mobile) styles first, add md: and lg: overrides.
Sidebar: hidden on mobile (bottom tab bar instead), visible at lg: breakpoint.
Cards: full-width on mobile, 2-col grid at md:, 3-col at lg:.
Charts: 250px height mobile, 300px md:, 380px lg:.
Modals: full-screen bottom sheet on mobile, centered dialog at md:.
Touch targets: minimum 44×44px for all interactive elements on mobile.
Typography: base text-sm on mobile, text-base at md:.

TEST RULE
Every component must be tested at 375px (iPhone SE), 768px (iPad), and 1280px (desktop) before merging. Broken mobile = blocked PR.

16. Dark Mode Implementation
// app/providers/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && systemDark)
    root.classList.toggle('dark', isDark)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

RULE
Never use hardcoded dark: classes for colors. Always use CSS variable tokens (text-[var(--color-text)], bg-[var(--color-surface)]). CSS variables flip automatically on .dark class toggle.

17. Error Handling & Edge Cases
17.1 Error Boundary Pattern
// shared/components/ErrorBoundary.tsx
// Wrap every route and every chart in an ErrorBoundary.
// A broken chart must never crash the whole app.

<ErrorBoundary fallback={<ChartError />}>
  <HabitHeatmap habitId={id} />
</ErrorBoundary>

17.2 Empty States
Every data-driven view must have a designed empty state — never a blank screen:
View
Empty State Message
Today / Habit list
'No habits yet — add your first one!' + CTA button
Task inbox
'Your inbox is clear. 🎉 Add a task to get started.'
Analytics — no data
'Check in for at least 7 days to see trends.'
Completed tasks
'Nothing completed yet today. Check off a task above.'
Search results
'No results for "[query]". Try a different search.'
Archived habits
'No archived habits. Archived habits appear here.'

Appendix — Quick Reference
A. ESLint Config Key Rules
// .eslintrc.cjs — key custom rules
{
  "rules": {
    "no-console": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "react/self-closing-comp": "error",
    "react-hooks/exhaustive-deps": "error",
    "import/order": ["error", { "groups": ["builtin","external","internal"] }],
    "no-restricted-imports": ["error", {
      "patterns": ["features/*/!(index)"]  // force barrel imports
    }]
  }
}

B. Vite Config Key Settings
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts':  ['recharts', 'd3'],
          'vendor-motion':  ['framer-motion'],
          'vendor-db':      ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
})

End of Frontend Guidelines — Last updated 2025