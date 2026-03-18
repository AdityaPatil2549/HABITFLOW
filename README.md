# HabitFlow

A comprehensive habit tracking and task management application built with React, TypeScript, and modern web technologies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State Management**: Zustand + React Query
- **Database**: Dexie.js (IndexedDB)
- **Charts**: Recharts + D3.js
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## 📁 Project Structure

```
src/
├── app/                    # App shell: Router, providers, global layout
│   ├── App.tsx
│   ├── Router.tsx
│   └── providers/          # ThemeProvider, QueryProvider, etc.
├── features/               # Feature modules (main code lives here)
│   ├── habits/
│   ├── tasks/
│   ├── analytics/
│   ├── gamification/
│   └── settings/
├── shared/                 # Shared across ALL features
│   ├── components/         # Button, Modal, Badge, Input, etc.
│   ├── hooks/              # useLocalStorage, useDebounce, etc.
│   ├── utils/              # formatDate, cn(), etc.
│   └── types/              # Global TS types & Zod schemas
├── styles/
│   ├── globals.css         # Tailwind base + CSS variables
│   └── animations.css      # Keyframe definitions
├── db/
│   ├── db.ts               # Dexie instance + schema
│   └── migrations/         # Version upgrade handlers
└── test/                   # Global test setup & mocks
```

## 🎨 Design System

The app follows a comprehensive design system with:

- **Color Palette**: Brand colors with semantic variants
- **Typography**: Inter font with consistent scale
- **Spacing**: 4px base grid system
- **Components**: Reusable UI components with variants
- **Dark Mode**: Full dark mode support with CSS variables

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI

### Code Style

- ESLint with Airbnb TypeScript config
- Prettier with Tailwind plugin
- Strict TypeScript configuration
- Feature-first architecture

## 📊 Features

### Core Features
- ✅ **Habit Tracking** - Create, track, and manage daily habits with multiple types
- ✅ **Task Management** - Organize tasks with priorities, due dates, and dependencies
- ✅ **Analytics Dashboard** - Visualize progress with charts, trends, and insights
- ✅ **Gamification** - Points, levels, achievements, streaks, and leaderboards
- ✅ **Dark Mode** - Full theme support with CSS variables
- ✅ **Offline First** - All data stored locally in IndexedDB

### Advanced Features
- 🆕 **Habit Templates** - Pre-built templates for quick habit creation
- 🆕 **Habit Chains** - Visual chain of consecutive completions
- 🆕 **Habit Reminders** - Push notifications at scheduled times
- 🆕 **Habit Notes** - Daily journaling for each habit entry
- 🆕 **Goal Tracking** - Set and track long-term goals
- 🆕 **Weekly/Monthly Reports** - PDF export of progress reports
- 🆕 **Habit Correlations** - Analyze relationships between habits
- 🆕 **Productivity Insights** - Best performing times and days
- 🆕 **Task Templates** - Reusable task templates
- 🆕 **Task Dependencies** - Create task relationships and sequences
- 🆕 **Pomodoro Timer** - Built-in focus timer for tasks
- 🆕 **Daily Challenges** - New challenges every day
- 🆕 **Seasonal Events** - Limited-time achievements
- 🆕 **Onboarding Tutorial** - Guided tour for new users
- 🆕 **Keyboard Shortcuts** - Quick actions and navigation
- 🆕 **Data Import/Export** - CSV/JSON backup and restore
- 🆕 **Custom Themes** - Personalized color schemes
- 🆕 **Notification Preferences** - Granular notification controls
- 🆕 **PWA Support** - Install as mobile app
- 🆕 **Voice Commands** - Add habits/tasks via voice
- 🆕 **Friend System** - Connect with friends for accountability
- 🆕 **Group Challenges** - Community challenges

## 🧪 Testing

The project uses a testing pyramid approach:

- **Unit Tests**: >90% coverage for utils, hooks, stores
- **Component Tests**: >70% coverage with RTL
- **Integration Tests**: Critical user flows
- **E2E Tests**: Core functionality with Playwright

## 📱 Responsive Design

- **Mobile**: 375px+ (iPhone SE)
- **Tablet**: 768px+ (iPad)
- **Desktop**: 1024px+
- **Wide**: 1280px+

## 🌈 Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation
- Screen reader support
- Semantic HTML5
- ARIA labels and roles

## 🚀 Performance

- Core Web Vitals targets met
- Bundle size optimization
- Lazy loading routes
- Optimistic updates
- Skeleton loading states

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or support, please open an issue on GitHub.
