# Crypto News Feed - React Native App

A modern, production-ready React Native app built with Expo, implementing a crypto news feed with Following/Explore modes, trending coins, and interactive features.

## Features

### Navigation & Screens
- **Bottom Tab Navigation**: 5-tab navigation (Home, Portfolio, Market, Rewards, Add)
  - Home tab with news feed
  - Market/Explore tab with trending coins
  - Portfolio tab (placeholder)
  - Rewards tab (placeholder)
  - Add tab (hidden, used for FAB positioning)

### Home Screen
- **Following/Explore Toggle**: Animated segment toggle to switch between Following and Explore feed modes
- **Search Bar**: Real-time search functionality for news and coins with clear button
- **News Feed**: Scrollable list of news cards with pull-to-refresh support
- **News Cards**: Interactive cards featuring:
  - Hero images (16:9 aspect ratio)
  - Coin chips showing related cryptocurrencies (up to 3 visible, with "+X more" indicator)
  - Following badge for tracked coins
  - Time-ago formatted timestamps
  - Source attribution
  - Like, Comment, Share, and Save actions with state persistence
  - Like and Save state indicators (filled icons when active)
  - Abbreviated engagement counts (e.g., "1.2K", "500")
  - Touch interactions for opening news details and coin details

### Market/Explore Screen
- **Featured News Carousel**: Horizontal scrolling carousel of featured news articles
- **Category Filters**: Filter pills for Trending, Top, NFT, and DeFi categories
- **Trending Coin Cards**: Display cards showing:
  - Coin symbol, name, and rank
  - Current price with formatted currency
  - 24h price change percentage (color-coded: green for positive, red for negative)
  - Sparkline mini charts showing price trends
  - Touch interactions for coin details

### Floating Action Button (FAB)
- **Quick Actions Menu**: Bottom sheet with three actions:
  - **Add Alert**: Set price alerts for coins
  - **Add to Watchlist**: Track favorite coins
  - **Submit News**: Share crypto news with community
- **Smooth Animations**: Scale and rotate animations on press
- **Gesture Support**: Pan-down-to-close bottom sheet interaction

### State Management
- **Like/Save News**: Persistent state for liked and saved news articles
- **Follow Coins**: Track followed cryptocurrencies
- **Feed Filter**: Toggle between Following and Explore modes
- **Category Filter**: Filter trending coins by category (Trending, Top, NFT, DeFi)
- **Dark Mode**: State management ready (toggle available in store)

### UI Components
- **NewsCard**: Full-featured news article card with all interactions
- **CoinChip**: Compact coin badge/pill component
- **FAB**: Floating action button with bottom sheet menu
- **FeaturedCarousel**: Horizontal scrolling featured news
- **FilterPills**: Category filter buttons with active state
- **SearchBar**: Search input with clear functionality
- **SegmentToggle**: Animated tab switcher for Following/Explore
- **Sparkline**: SVG mini price chart component
- **TrendingCoinCard**: Coin display card with price and chart

### User Experience
- **Pull-to-Refresh**: Refresh news feed by pulling down
- **Smooth Animations**: React Native Reanimated 2 animations throughout
  - FadeInDown entrance animations for news cards
  - Spring animations for segment toggle
  - Scale and rotate animations for FAB
- **Responsive Design**: Optimized for mobile with proper spacing and touch targets
- **Accessibility**: Full accessibility support with:
  - Proper accessibility roles and labels
  - Minimum 44x44px touch targets
  - Screen reader support
  - Proper contrast ratios

### Data Formatting
- **Time Formatting**: Relative time display (e.g., "2h ago", "3d ago")
- **Price Formatting**: Currency formatting with proper decimal places
- **Percentage Formatting**: Formatted percentage changes with +/- indicators
- **Number Abbreviation**: Large numbers abbreviated (e.g., "1.2K", "5.3M")

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
│   │   ├── _layout.tsx       # Tab bar configuration with FAB
│   │   ├── index.tsx         # Home tab (HomeScreen)
│   │   ├── portfolio.tsx     # Portfolio tab (PlaceholderScreen)
│   │   ├── add.tsx           # Add tab (hidden, for FAB positioning)
│   │   ├── market.tsx        # Market/Explore tab (ExploreScreen)
│   │   └── rewards.tsx       # Rewards tab (PlaceholderScreen)
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
│   ├── services/             # API integration
│   │   └── api.ts            # API service functions (ready for integration)
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

The app currently uses mock data from `src/mock/mockData.ts`. To integrate real APIs:

1. **Update API service file** (`src/services/api.ts`):
   ```typescript
   // src/services/api.ts
   export const fetchNews = async () => {
     const response = await fetch('YOUR_API_ENDPOINT');
     return response.json();
   };

   export const fetchTrendingCoins = async () => {
     const response = await fetch('YOUR_COINS_API_ENDPOINT');
     return response.json();
   };
   ```

2. **Update screens** to use API instead of mock data:
   ```typescript
   // In HomeScreen.tsx or ExploreScreen.tsx
   import { fetchNews } from '@/src/services/api';
   import { useAppStore } from '@/src/state/useAppStore';

   const [news, setNews] = useState([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
     const loadNews = async () => {
       setLoading(true);
       const data = await fetchNews();
       setNews(data);
       setLoading(false);
     };
     loadNews();
   }, []);
   ```

3. **Replace mock data imports** in:
   - `src/screens/HomeScreen.tsx` - Replace `mockNews` import
   - `src/screens/ExploreScreen.tsx` - Replace `mockTrendingCoins` and `mockFeaturedNews` imports

4. **Update state management** if needed to handle API responses and errors

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

## State Management

The app uses **Zustand** for lightweight, performant state management. The global store (`useAppStore`) manages:

### State Properties
- `feedFilter`: Current feed mode ('following' | 'explore')
- `exploreCategory`: Active category filter ('trending' | 'top' | 'nft' | 'defi')
- `isDarkMode`: Dark mode toggle state
- `likedNews`: Array of liked news article IDs
- `savedNews`: Array of saved news article IDs
- `followingCoins`: Array of followed coin IDs

### State Actions
- `setFeedFilter(filter)`: Switch between Following/Explore modes
- `setExploreCategory(category)`: Change category filter
- `toggleDarkMode()`: Toggle dark mode on/off
- `toggleLike(newsId)`: Add/remove news from liked list
- `toggleSave(newsId)`: Add/remove news from saved list
- `toggleFollowCoin(coinId)`: Add/remove coin from following list

### Usage Example

```typescript
import { useAppStore } from '@/src/state/useAppStore';

// Read state
const likedNews = useAppStore((state) => state.likedNews);
const feedFilter = useAppStore((state) => state.feedFilter);

// Update state
const toggleLike = useAppStore((state) => state.toggleLike);
const setFeedFilter = useAppStore((state) => state.setFeedFilter);

// Use in component
toggleLike('news-id-123');
setFeedFilter('explore');
```

## Dark Mode Support

Dark mode tokens are defined in `theme.ts`. The state management is ready, but full UI implementation is pending. To enable dark mode:

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
- **Following badge**: Primary color background with rounded corners

### CoinChip

- **Container**: 12px padding, 8px border radius
- **Avatar**: 20px circle with coin symbol initial
- **Symbol**: 13px semibold
- **Background**: Neutral-100

### FAB

- **Size**: 56x56 px
- **Border radius**: 28px (perfect circle)
- **Position**: Bottom 80px (above tab bar), centered
- **Icon size**: 28px
- **Background**: Primary-500
- **Animation**: Scale 0.9 on press, rotate 45deg when active
- **Bottom Sheet**: 35% snap point, pan-down-to-close enabled

### TrendingCoinCard

- **Container**: Card with medium shadow, 12px border radius
- **Price**: 18px bold, neutral-900
- **Change**: 14px semibold, color-coded (success/danger)
- **Sparkline**: 100x30px SVG chart
- **Rank**: 14px semibold, neutral-400

### FeaturedCarousel

- **Card width**: 280px
- **Image height**: 140px
- **Title**: 15px semibold, max 2 lines
- **Meta**: 12px, neutral-500
- **Horizontal scroll**: Smooth scrolling with no indicators

### FilterPills

- **Pill**: 16px horizontal padding, 8px vertical, 8px border radius
- **Active state**: Primary-500 background, white text
- **Inactive state**: Neutral-100 background, neutral-600 text
- **Minimum height**: 44px for accessibility

### SegmentToggle

- **Options**: Following, Explore
- **Animated indicator**: Spring animation with primary color
- **Text**: 16px semibold

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

## CI/CD

Android releases use **GitHub Actions + EAS Build + Fastlane**.

| Command | Purpose |
|---------|---------|
| `npm run ci:validate` | Local PR checks (typecheck, lint, test, colors) |
| `npm run build:android` | EAS staging AAB |
| `npm run build:android:prod` | EAS production AAB |

See `docs/CI_CD_RUNBOOK.md`, `docs/GITHUB_SECRETS_SETUP.md`, and `BUILD_ANDROID.md`.

## License

MIT

---

**After generation:** Replace placeholder images with your screenshots in `src/assets/screenshots/*` — keep image import paths obvious and centralized in `src/mock/mockData.ts`.
