# Crypto News Feed - React Native App

A modern, production-ready React Native app built with Expo, implementing a crypto news feed with Following/Explore modes, trending coins, and interactive features.

## Features

- **Home Feed**: Toggle between Following and Explore modes
- **News Cards**: Interactive cards with like, comment, share, and save actions
- **Trending Coins**: Explore trending cryptocurrencies with sparklines
- **Search**: Search news and coins
- **FAB Actions**: Quick actions via floating action button with bottom sheet
- **Responsive Design**: Optimized for mobile with smooth animations

## Tech Stack

- **React Native** with **Expo SDK 54+**
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **Zustand** for lightweight state management
- **NativeWind/Tailwind** for styling
- **React Native Reanimated 2** for animations
- **@gorhom/bottom-sheet** for modal interactions
- **date-fns** for date formatting
- **Jest + React Native Testing Library** for unit tests

## Installation

1. **Clone the repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Run on your device**:
   - Scan the QR code with Expo Go (iOS/Android)
   - Press `w` to open in web browser
   - Press `i` for iOS simulator (macOS only)
   - Press `a` for Android emulator

## Project Structure

```
├── app/
│   ├── (tabs)/               # Tab-based navigation
│   │   ├── _layout.tsx       # Tab bar configuration
│   │   ├── index.tsx         # Home tab
│   │   ├── portfolio.tsx     # Portfolio tab (placeholder)
│   │   ├── market.tsx        # Market/Explore tab
│   │   └── rewards.tsx       # Rewards tab (placeholder)
│   └── _layout.tsx           # Root layout with gesture handler
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── CoinChip.tsx
│   │   ├── FAB.tsx
│   │   ├── FeaturedCarousel.tsx
│   │   ├── FilterPills.tsx
│   │   ├── NewsCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SegmentToggle.tsx
│   │   ├── Sparkline.tsx
│   │   └── TrendingCoinCard.tsx
│   ├── screens/              # Screen components
│   │   ├── ExploreScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── NewsDetailModal.tsx
│   │   └── PlaceholderScreen.tsx
│   ├── state/                # State management
│   │   └── useAppStore.ts    # Zustand store
│   ├── theme/                # Theme configuration
│   │   └── theme.ts          # Colors, spacing, typography
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   └── format.ts         # Date, price, number formatting
│   └── mock/                 # Mock data
│       └── mockData.ts       # Sample news and coins
├── __tests__/                # Unit tests
│   └── NewsCard.test.tsx
├── assets/
│   └── screenshots/          # Place screenshot images here
└── README.md
```

## Adding Screenshots

This app uses placeholder images from Pexels. To replace them with your own screenshots:

1. **Place screenshots** in `assets/screenshots/` directory
2. **Update image references** in `src/mock/mockData.ts`:
   ```typescript
   imageUrl: require('@/assets/screenshots/news-1.png')
   ```
3. **For coins**, update logo references in `mockData.ts`

### Screenshot Mapping

- News hero images: 16:9 aspect ratio (recommended 1200x675px)
- Coin avatars: Square (recommended 200x200px)
- Featured carousel images: 16:9 aspect ratio

## Replacing Mock Data with Real APIs

The app currently uses mock data. To integrate real APIs:

1. **Create API service file**:
   ```typescript
   // src/services/api.ts
   export const fetchNews = async () => {
     const response = await fetch('YOUR_API_ENDPOINT');
     return response.json();
   };
   ```

2. **Update screens** to use API:
   ```typescript
   // In HomeScreen.tsx or ExploreScreen.tsx
   import { fetchNews } from '@/src/services/api';

   useEffect(() => {
     const loadNews = async () => {
       const data = await fetchNews();
       // Update state with real data
     };
     loadNews();
   }, []);
   ```

3. **Replace mock data imports** in:
   - `src/screens/HomeScreen.tsx`
   - `src/screens/ExploreScreen.tsx`

## Available Scripts

- `npm run dev` - Start Expo development server
- `npm run build:web` - Build web version
- `npm test` - Run Jest unit tests
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Running Tests

```bash
npm test
```

Tests are written with Jest and React Native Testing Library. Example test file is provided in `__tests__/NewsCard.test.tsx`.

## Styling

The app uses **NativeWind** (Tailwind for React Native) for class-based styling with fallback StyleSheet for complex styles.

### Common Tailwind Classes Used

- **Spacing**: `p-4`, `px-4`, `py-2`, `m-2`, `mx-4`, `my-2`, `gap-2`
- **Colors**: `bg-neutral-50`, `text-neutral-900`, `text-primary-500`
- **Typography**: `text-sm`, `text-base`, `text-lg`, `font-medium`, `font-semibold`, `font-bold`
- **Border Radius**: `rounded`, `rounded-lg`, `rounded-full`, `rounded-card`
- **Shadows**: Applied via StyleSheet shadows object

### Theme Tokens

All theme values are defined in `src/theme/theme.ts`:

- **Colors**: Primary, Accent, Success, Danger, Neutral (50-950)
- **Spacing**: xs (4px), sm (8px), md (16px), lg (24px), xl (32px)
- **Border Radius**: xs, sm, md, card (12px), button (8px), fab (24px)
- **Typography**: Font sizes (12-28px), weights (400-700)

## Animations

The app uses **React Native Reanimated 2** for smooth animations:

- **NewsCard entrance**: FadeInDown animation with staggered delay
- **SegmentToggle**: Animated indicator with spring animation
- **FAB**: Scale and rotate animations on press
- **Bottom Sheet**: Smooth gesture-based sheet interactions

## Accessibility

All interactive elements include:
- `accessibilityRole` for proper screen reader support
- `accessibilityLabel` for descriptive labels
- Minimum touch target size of 44x44 points
- Proper contrast ratios for text and backgrounds

## Dark Mode Support

Dark mode tokens are defined in `theme.ts`. To enable dark mode:

```typescript
import { useAppStore } from '@/src/state/useAppStore';

const isDarkMode = useAppStore((state) => state.isDarkMode);
const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
```

## UI Component Style Mapping

### NewsCard

- **Hero image**: 16:9 aspect ratio, full width
- **Title**: 16px semibold, line-height 22px, max 3 lines
- **Snippet**: 13px regular, line-height 18px, max 2 lines
- **Metadata**: 12px, muted neutral-500
- **Action icons**: 20px, neutral-500
- **Card padding**: 16px
- **Border radius**: 12px
- **Shadow**: Medium elevation

### CoinChip

- **Container**: 12px padding, 8px border radius
- **Avatar**: 20px circle
- **Symbol**: 13px semibold

### FAB

- **Size**: 56x56 px
- **Border radius**: 28px (perfect circle)
- **Position**: Bottom 80px (above tab bar)
- **Icon size**: 28px
- **Animation**: Scale 0.9 on press, rotate 45deg when active

## Troubleshooting

### Images not loading
- Ensure image URLs are valid
- Check network connectivity
- Replace with local assets if needed

### Animations not working
- Run `npx expo install react-native-reanimated`
- Clear cache: `npx expo start -c`

### Bottom sheet not appearing
- Ensure GestureHandlerRootView wraps the app
- Check that @gorhom/bottom-sheet is properly installed

## License

MIT

---

**After generation:** Replace placeholder images with your screenshots in `src/assets/screenshots/*` — keep image import paths obvious and centralized in `src/mock/mockData.ts`.
