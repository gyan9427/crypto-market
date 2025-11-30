# Quick Start Guide

## 🚀 Get Running in 3 Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Scan QR code with Expo Go app
```

## 📱 Common Tasks

### Adding Your Screenshots

```bash
# 1. Add images to assets/screenshots/
assets/screenshots/
  ├── news-1.jpg
  ├── news-2.jpg
  └── coin-btc.png

# 2. Update src/mock/mockData.ts
imageUrl: 'https://your-cdn.com/image.jpg'
# or for local:
imageUrl: require('@/assets/screenshots/news-1.jpg')
```

### Connecting Your API

```typescript
// src/services/api.ts
export const fetchNews = async () => {
  const response = await fetch('https://api.yourapp.com/news');
  return response.json();
};

// src/screens/HomeScreen.tsx
import { fetchNews } from '@/src/services/api';

useEffect(() => {
  fetchNews().then(data => {
    // Update state with real data
  });
}, []);
```

### Adding a New Screen

```bash
# 1. Create screen file
touch src/screens/ProfileScreen.tsx

# 2. Add to navigation
touch app/(tabs)/profile.tsx

# 3. Import and use
import { ProfileScreen } from '@/src/screens/ProfileScreen';
export default ProfileScreen;
```

### Adding a New Component

```bash
# 1. Create component
touch src/components/MyComponent.tsx

# 2. Use in screen
import { MyComponent } from '@/src/components/MyComponent';
```

### Styling Quick Reference

```typescript
// Using NativeWind classes
<View className="p-4 bg-white rounded-lg">
  <Text className="text-lg font-bold text-neutral-900">
    Title
  </Text>
</View>

// Using StyleSheet for complex styles
const styles = StyleSheet.create({
  container: {
    ...shadows.md,
    borderRadius: borderRadius.card,
  },
});
```

### State Management

```typescript
// Read state
const likedNews = useAppStore(state => state.likedNews);

// Update state
const toggleLike = useAppStore(state => state.toggleLike);
toggleLike('news-id');
```

## 🔧 Available Commands

```bash
npm run dev          # Start dev server
npm test             # Run tests
npm run typecheck    # TypeScript check
npm run lint         # Lint code
npm run build:web    # Build for web
```

## 📦 Project Structure at a Glance

```
app/(tabs)/         → Navigation (what you see)
src/components/     → Reusable UI
src/screens/        → Full screens
src/state/          → Global state (Zustand)
src/mock/           → Fake data (replace with API)
src/theme/          → Colors, spacing, etc.
```

## 🎨 Theme Colors

```typescript
// Primary (Purple)
colors.primary[500]  // #a855f7

// Accent (Pink)
colors.accent[500]   // #d946ef

// Success/Danger
colors.success[500]  // #22c55e
colors.danger[500]   // #ef4444

// Neutrals
colors.neutral[50]   // Background
colors.neutral[900]  // Text
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Port already in use
```bash
npx expo start --port 8082
```

### Clear cache
```bash
npx expo start -c
```

### Module not found
```bash
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
npm run typecheck
```

## 📱 Platform-Specific

### iOS Simulator (macOS only)
Press `i` in terminal after `npm run dev`

### Android Emulator
Press `a` in terminal after `npm run dev`

### Web Browser
Press `w` in terminal after `npm run dev`

## 🎯 Key Files to Edit

| Task | File |
|------|------|
| Add news | `src/mock/mockData.ts` |
| Change colors | `src/theme/theme.ts` |
| Update home screen | `src/screens/HomeScreen.tsx` |
| Modify news card | `src/components/NewsCard.tsx` |
| Add API calls | `src/services/api.ts` |
| Update navigation | `app/(tabs)/_layout.tsx` |

## 💡 Pro Tips

1. **Hot Reload**: Save any file and see changes instantly
2. **Shake Device**: Opens developer menu on physical device
3. **Console Logs**: Appear in terminal where you ran `npm run dev`
4. **React DevTools**: Works with Chrome DevTools
5. **Type Safety**: Let TypeScript guide you (check autocomplete)

## 🆘 Need Help?

Check these files:
- `README.md` - Full documentation
- `ARCHITECTURE.md` - System design
- `UI-KIT.md` - Style reference
- `PROJECT-SUMMARY.md` - What's included

## 🚢 Deploy to Production

### Web
```bash
npm run build:web
# Upload dist/ folder to hosting
```

### Mobile (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

---

**Happy coding! 🎉** Start by running `npm run dev` and scan the QR code.
