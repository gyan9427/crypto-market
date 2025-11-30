# Architecture Overview

## Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Small, reusable components built into complex UIs
3. **Type Safety**: Full TypeScript coverage with strict typing
4. **Separation of Concerns**: Clear boundaries between UI, state, and data
5. **Accessibility First**: All interactive elements properly labeled

## State Management

### Zustand Store (`src/state/useAppStore.ts`)

Centralized, lightweight state management for:
- Feed filter (Following/Explore)
- Explore category (Trending/Top/NFT/DeFi)
- Dark mode toggle
- Liked news items
- Saved news items
- Following coins

**Why Zustand?**
- Minimal boilerplate
- React hooks-based
- No providers needed
- TypeScript-friendly
- Small bundle size

### Local State

Component-specific state (search queries, loading states) uses `useState`.

## Component Architecture

### Atomic Design Pattern

**Atoms** (smallest components):
- `CoinChip.tsx` - Individual coin badge
- `Sparkline.tsx` - Mini chart visualization
- `SearchBar.tsx` - Search input component

**Molecules** (combinations of atoms):
- `NewsCard.tsx` - News article card with actions
- `TrendingCoinCard.tsx` - Coin display with price/chart
- `SegmentToggle.tsx` - Tab switcher
- `FilterPills.tsx` - Category filters

**Organisms** (complex UI sections):
- `FeaturedCarousel.tsx` - Horizontal scrolling featured news
- `FAB.tsx` - Floating action button with bottom sheet

**Templates** (screen layouts):
- `HomeScreen.tsx` - Feed with toggle and search
- `ExploreScreen.tsx` - Trending coins with filters

## Data Flow

```
Mock Data (mockData.ts)
    ↓
Zustand Store (useAppStore.ts)
    ↓
Screen Components (HomeScreen, ExploreScreen)
    ↓
UI Components (NewsCard, TrendingCoinCard)
    ↓
User Actions → Store Updates → Re-render
```

### Migration to Real APIs

1. Replace mock data in screens with API calls
2. Add loading/error states
3. Implement data caching if needed
4. Use React Query or SWR for advanced data fetching (optional)

## Navigation Structure

```
RootLayout (_layout.tsx)
└── GestureHandlerRootView
    └── Stack
        └── (tabs)/_layout.tsx
            ├── index (Home)
            ├── portfolio (Placeholder)
            ├── market (Explore)
            └── rewards (Placeholder)
```

**FAB** rendered outside tab navigator for global access.

## Styling Strategy

### Hybrid Approach

1. **NativeWind/Tailwind** for rapid development:
   - Spacing, colors, typography
   - Layout (flex, position)
   - Quick prototyping

2. **StyleSheet** for complex styling:
   - Shadows (platform-specific)
   - Precise measurements
   - Performance-critical animations

### Theme System

Centralized in `src/theme/theme.ts`:
- Color palettes with semantic names
- Spacing scale (4px baseline)
- Typography scale
- Border radius tokens
- Shadow definitions

## Animation Strategy

### React Native Reanimated 2

Used for:
- **List entrance**: FadeInDown with stagger
- **FAB interactions**: Scale and rotate transforms
- **Segment toggle**: Smooth indicator slide
- **Bottom sheet**: Gesture-based sheet

**Why Reanimated?**
- Runs on native thread (60fps+)
- Gesture-driven animations
- Spring physics
- Layout animations

## Performance Considerations

### Optimizations

1. **FlatList** for long lists (virtualization)
2. **Memoization** candidates: NewsCard, TrendingCoinCard
3. **Image optimization**: Use appropriate sizes, lazy loading
4. **Reanimated** for animations (native thread)

### Future Optimizations

- Add `React.memo()` to pure components
- Implement pagination for infinite scroll
- Add image caching
- Use `useMemo` for expensive computations

## Testing Strategy

### Unit Tests

**What to test:**
- Component rendering
- User interactions (press, input)
- State updates
- Conditional rendering

**Example:** `__tests__/NewsCard.test.tsx`

### Integration Tests (Future)

- Navigation flows
- State persistence
- API integration

### E2E Tests (Future)

- Complete user journeys
- Cross-platform testing

## File Organization

```
/app              → Expo Router navigation (file-based)
/src
  /components     → Reusable UI components
  /screens        → Screen-level components
  /state          → Zustand stores
  /theme          → Design tokens
  /types          → TypeScript interfaces
  /utils          → Helper functions
  /mock           → Mock data (replace with API)
  /services       → API integration (future)
/__tests__        → Jest unit tests
/assets           → Images, fonts
```

## Type System

### Core Types

- `User` - User profile data
- `Coin` - Cryptocurrency data
- `NewsItem` - News article data
- `TrendingCoin` - Extended coin with ranking
- `FeedCardProps` - NewsCard component props
- `AppState` - Zustand store shape

### Type Safety Benefits

- Catch errors at compile-time
- Autocomplete in IDE
- Refactoring confidence
- Self-documenting code

## Accessibility

### WCAG Compliance

- **Touch targets**: Min 44x44 points
- **Color contrast**: WCAG AA (4.5:1 for text)
- **Screen reader**: All interactive elements labeled
- **Keyboard navigation**: Focusable elements

### Implementation

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Like article"
  accessibilityHint="Double tap to like this article"
>
```

## Error Handling

### Current

- Graceful fallbacks (empty states)
- Console logging for debugging

### Production Recommendations

1. Add error boundaries
2. Implement Sentry or similar
3. User-friendly error messages
4. Retry mechanisms for API calls

## Security Considerations

### API Keys

- Never commit to version control
- Use environment variables
- Proxy through backend when possible

### User Data

- No sensitive data in local state
- Use secure storage for tokens
- Implement auth properly (future)

## Deployment

### Web

```bash
npm run build:web
```

Output: Static site in `dist/`

### Mobile

1. Configure `app.json` for EAS Build
2. Run `eas build --platform ios/android`
3. Submit to App Store / Play Store

## Future Enhancements

### Recommended

1. **Persistent storage**: AsyncStorage for saved items
2. **Push notifications**: For price alerts
3. **Real-time updates**: WebSocket for live prices
4. **Offline support**: Cache news for offline reading
5. **Analytics**: Track user engagement
6. **A/B testing**: Optimize UI/UX

### Nice to Have

1. Share to social media
2. Deep linking to articles
3. Biometric authentication
4. Widget support (iOS/Android)
5. Watch app integration
