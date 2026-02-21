# Release Notes

---

## v1.1.0

**Release Date:** February 21, 2026

### What's New

#### Reactions
- **ReactionPicker** – LinkedIn-style stacked emoji chips showing reaction types used on each article
- **Tooltip Popup** – Floating bubble with 6 reaction icons (no labels) on tap
- **Total Count** – Displays total reactions with optimistic updates
- **Replaces** – Previous client-only like button; reactions now persist to backend

### Breaking Changes

None. Fully backward compatible with v1.0.0.

---

## v1.0.0

**Release Date:** February 14, 2026

## Overview

Crypto Market v1.0.0 is a React Native (Expo) app for crypto news, market data, and coin profiles. This release delivers a full news feed, market watch, coin profile screens, and backend integration.

---

## Features

### Navigation
- **Bottom Tab Bar** – Home, Portfolio, Market, Rewards, Profile
- **Floating Action Button (FAB)** – Quick actions (Add Alert, Watchlist, Submit News)
- **Auth Flow** – Login/Register with protected routes
- **Coin Profile Route** – `/coin/:coinId` with persistent tab bar

### Home Screen
- **Following / Explore Toggle** – Switch between personalized and general news feeds
- **Search** – Real-time search for news and coins
- **Featured Carousel** – Horizontal scroll of featured articles
- **News Feed** – Scrollable list with pull-to-refresh
- **News Cards** – Hero images, coin chips, like/save/share actions, expand/collapse
- **News Detail Modal** – Full article view

### Market / Explore Screen
- **Category Filters** – Trending, Top, NFT, DeFi
- **Trending Coins** – Cards with price, 24h change, sparklines
- **Table View** – AG Grid table for market data
- **Skeleton Loaders** – Non-blocking loading states

### Coin Profile Screen
- **Coin Header** – Avatar (logo or fallback), name, `@symbol`
- **Related News** – 2-column grid of news for the selected coin
- **Navigation** – Accessible from Home (coin chips) and Market (coin cards/table)
- **Tab Bar** – Bottom tray visible on coin profile

### Components
- **NewsCard** – Full and grid variants
- **CoinChip** – Compact coin badge
- **TrendingCoinCard** – Price, change, sparkline
- **FeaturedCarousel** – Horizontal news carousel
- **SegmentToggle** – Animated Following/Explore switch
- **SearchBar** – Search with clear button
- **FilterPills** – Category filters
- **Sparkline** – Mini price chart

### State Management (Zustand)
- Feed filter (Following/Explore)
- Explore category
- Liked/saved news
- Following coins
- Auth state

### API Integration
- News (explore, following, detail)
- Trending coins
- Coin details (with logo)
- Coin news
- Search
- Wishlist
- Auth (login, signup, me)

---

## Tech Stack

- **React Native** + **Expo SDK 54+**
- **TypeScript**
- **Expo Router** – File-based navigation
- **Zustand** – State management
- **React Native Reanimated** – Animations
- **@gorhom/bottom-sheet** – Modals
- **AG Grid** – Market table
- **date-fns** – Date formatting

---

## Installation

```bash
npm install
npm run dev
```

Configure `EXPO_PUBLIC_API_BASE_URL` to point to the backend (default: `http://localhost:4001/api`).

---

## Breaking Changes

None. This is the initial v1.0 release.

---

## Known Limitations

- Portfolio and Rewards tabs are placeholders
- Dark mode state is prepared but not fully implemented
