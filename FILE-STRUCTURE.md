# Complete File Structure

```
project/
│
├── 📄 Configuration Files
│   ├── app.json                    # Expo configuration
│   ├── package.json                # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript config
│   ├── babel.config.js             # Babel with Reanimated
│   ├── tailwind.config.js          # Tailwind/NativeWind setup
│   ├── jest.config.js              # Jest configuration
│   ├── jest.setup.js               # Test setup & mocks
│   ├── nativewind-env.d.ts         # NativeWind types
│   └── .prettierrc                 # Code formatting rules
│
├── 📚 Documentation (6 files)
│   ├── README.md                   # Main guide (installation, usage)
│   ├── ARCHITECTURE.md             # System design & patterns
│   ├── UI-KIT.md                   # Style reference guide
│   ├── PROJECT-SUMMARY.md          # What was built
│   ├── QUICK-START.md              # Quick reference
│   ├── CHECKLIST.md                # Implementation status
│   └── FILE-STRUCTURE.md           # This file
│
├── 🧪 Tests
│   └── __tests__/
│       └── NewsCard.test.tsx       # Example unit test
│
├── 🗂️ Navigation (app/)
│   ├── _layout.tsx                 # Root layout (GestureHandler)
│   ├── +not-found.tsx              # 404 screen
│   └── (tabs)/                     # Tab navigation
│       ├── _layout.tsx             # Tab bar configuration
│       ├── index.tsx               # Home tab → HomeScreen
│       ├── market.tsx              # Market tab → ExploreScreen
│       ├── portfolio.tsx           # Portfolio (placeholder)
│       ├── rewards.tsx             # Rewards (placeholder)
│       └── add.tsx                 # Empty (for FAB)
│
├── 💎 Source Code (src/)
│   │
│   ├── components/                 # UI Components (9 files)
│   │   ├── CoinChip.tsx            # Coin badge/pill
│   │   ├── FAB.tsx                 # Floating action button
│   │   ├── FeaturedCarousel.tsx    # Horizontal news scroll
│   │   ├── FilterPills.tsx         # Category filters
│   │   ├── NewsCard.tsx            # Article card (main component)
│   │   ├── SearchBar.tsx           # Search input
│   │   ├── SegmentToggle.tsx       # Animated tab switcher
│   │   ├── Sparkline.tsx           # SVG mini chart
│   │   └── TrendingCoinCard.tsx    # Coin price card
│   │
│   ├── screens/                    # Screen Components (4 files)
│   │   ├── HomeScreen.tsx          # Feed with toggle & search
│   │   ├── ExploreScreen.tsx       # Trending coins & featured
│   │   ├── NewsDetailModal.tsx     # Full article view
│   │   └── PlaceholderScreen.tsx   # Generic placeholder
│   │
│   ├── state/                      # State Management
│   │   └── useAppStore.ts          # Zustand store (global state)
│   │
│   ├── theme/                      # Design System
│   │   └── theme.ts                # Colors, spacing, typography
│   │
│   ├── types/                      # TypeScript Types
│   │   └── index.ts                # User, Coin, NewsItem, etc.
│   │
│   ├── utils/                      # Utility Functions
│   │   └── format.ts               # Date, price, number formatters
│   │
│   ├── mock/                       # Mock Data
│   │   └── mockData.ts             # Sample news & coins
│   │
│   └── services/                   # API Integration
│       └── api.ts                  # API functions (TODOs)
│
├── 🎨 Assets
│   ├── images/                     # App icons
│   │   ├── favicon.png
│   │   └── icon.png
│   └── screenshots/                # Your custom screenshots
│       └── README.md               # Image specs guide
│
└── 🔧 Other
    └── hooks/
        └── useFrameworkReady.ts    # Framework initialization
```

## File Count by Category

| Category | Count | Purpose |
|----------|-------|---------|
| Components | 9 | Reusable UI elements |
| Screens | 4 | Full screen layouts |
| Navigation | 7 | Routing & tabs |
| State | 1 | Global state management |
| Types | 1 | TypeScript interfaces |
| Utils | 1 | Helper functions |
| Mock Data | 1 | Sample data |
| Services | 1 | API integration (future) |
| Tests | 1 | Unit tests |
| Documentation | 7 | Guides & references |
| Config | 9 | Project configuration |

**Total TypeScript/JavaScript Files**: 34

## Key File Purposes

### Core App Files

- **`app/_layout.tsx`** - Root layout wrapping everything with GestureHandlerRootView
- **`app/(tabs)/_layout.tsx`** - Tab bar with 5 tabs + FAB
- **`src/state/useAppStore.ts`** - Central state (likes, saves, filters)

### Main Components

- **`NewsCard.tsx`** (450+ LOC) - Most complex, handles all news interactions
- **`FAB.tsx`** (350+ LOC) - Floating button with bottom sheet
- **`HomeScreen.tsx`** (200+ LOC) - Main feed screen
- **`ExploreScreen.tsx`** (150+ LOC) - Trending coins screen

### Essential Config

- **`tailwind.config.js`** - Design tokens mapping
- **`babel.config.js`** - Reanimated plugin (MUST be last)
- **`tsconfig.json`** - Path aliases (@/ = root)

### Mock Data

- **`src/mock/mockData.ts`** - 5 news items, 5 coins (replace with API)

### Documentation Priority

1. **README.md** - Start here (installation & overview)
2. **QUICK-START.md** - Fast reference
3. **UI-KIT.md** - Styling reference
4. **ARCHITECTURE.md** - Deep dive into system design

## Import Patterns

### Absolute Imports (via `@/`)
```typescript
import { HomeScreen } from '@/src/screens/HomeScreen';
import { colors } from '@/src/theme/theme';
import { useAppStore } from '@/src/state/useAppStore';
```

### Relative Imports
```typescript
import { NewsCard } from '../components/NewsCard';
import { formatPrice } from '../utils/format';
```

## Critical Files (Do Not Delete)

- `hooks/useFrameworkReady.ts` - Required by Expo Router
- `app/_layout.tsx` - App entry point
- `babel.config.js` - Must include reanimated plugin
- `nativewind-env.d.ts` - TypeScript types for NativeWind

## Files to Modify First

### 1. Customize Appearance
- `src/mock/mockData.ts` - Update news & coins
- `src/theme/theme.ts` - Change colors

### 2. Add Features
- `src/services/api.ts` - Implement real APIs
- `src/screens/HomeScreen.tsx` - Modify home logic
- `src/components/NewsCard.tsx` - Adjust card layout

### 3. Add Screens
- Create in `src/screens/YourScreen.tsx`
- Add route in `app/(tabs)/yourroute.tsx`
- Update `app/(tabs)/_layout.tsx` for navigation

## File Naming Conventions

- **PascalCase**: Components, Screens (`NewsCard.tsx`)
- **camelCase**: Utilities, hooks (`formatPrice`, `useAppStore`)
- **kebab-case**: Routes (`+not-found.tsx`)
- **lowercase**: Config files (`babel.config.js`)

## Dependencies Map

```
Key Dependencies:
├── expo (~54.0.10)
├── react-native (0.81.4)
├── expo-router (~6.0.8)
├── typescript (~5.9.2)
├── zustand (^5.0.9)
├── nativewind (^4.2.1)
├── react-native-reanimated (~4.1.1)
├── @gorhom/bottom-sheet (^5.2.7)
└── date-fns (^4.1.0)

Dev Dependencies:
├── @testing-library/react-native (^13.3.3)
├── jest (^30.2.0)
└── @types/jest (latest)
```

## Build Artifacts (Ignored)

These are generated and should NOT be committed:
- `node_modules/` - Dependencies
- `.expo/` - Expo cache
- `dist/` - Build output
- `.DS_Store` - macOS metadata

## Environment Files

- `.env` - Environment variables (create if needed)
- `.env.local` - Local overrides (gitignored)

Example `.env`:
```
EXPO_PUBLIC_API_URL=https://api.yourapp.com
EXPO_PUBLIC_API_KEY=your_key_here
```

## Code Organization Strategy

1. **Atomic Design**: Small → Large (atoms → molecules → organisms)
2. **Separation of Concerns**: UI / State / Logic separated
3. **Single Responsibility**: One component, one job
4. **Composition**: Build complex UI from simple parts
5. **Type Safety**: Everything strongly typed

---

Need to find something? Use this file as your map!
