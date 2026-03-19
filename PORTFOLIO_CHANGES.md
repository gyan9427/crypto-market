# Portfolio Section Updates

## Summary
Implemented requested changes to the portfolio section to improve user experience and navigation flow.

## Changes Made

### 1. Holdings Segment - Always Expanded
**File:** `src/components/HoldingsSegment.tsx`

**Changes:**
- Removed the `expanded` state variable and click-to-expand functionality
- Holdings card is now always expanded by default
- Removed the expand/collapse indicator (▶/▼)
- Made individual holding items clickable instead
- Added `onHoldingPress` callback prop to handle clicks on individual holdings
- Each holding item now triggers navigation to the activity screen

**Key Updates:**
```typescript
- Removed: useState for expanded state
- Removed: LayoutAnimation for expand/collapse
- Removed: TouchableOpacity wrapper on summary card
- Added: TouchableOpacity on each position row
- Added: onHoldingPress callback prop
```

### 2. Activity Screen - New Separate Component
**File:** `src/screens/ActivityScreen.tsx` (NEW)

**Features:**
- Standalone screen that shows wallet activity/transactions
- Filters events by selected symbol (e.g., BNB, USDT, etc.)
- Header with close button (✕) to return to portfolio
- Shows transaction count for the filtered symbol
- Reuses the EventRow component for consistent UI
- Empty state handling when no transactions found

**Key Features:**
```typescript
- Symbol-based filtering using regex pattern matching
- Event summaries and activity asset matching
- Clean header with symbol name display
- Cross/close button for easy navigation back
- Responsive layout with FlatList
```

### 3. Portfolio Screen - Simplified Layout
**File:** `src/screens/PortfolioScreen.tsx`

**Changes:**
- Removed Activity section from the main portfolio view
- Removed EventRow component (moved to ActivityScreen)
- Removed FlatList (replaced with ScrollView)
- Added state management for activity screen navigation
- Added callbacks for handling holding item clicks
- Conditional rendering to show ActivityScreen when needed

**Navigation Flow:**
1. User sees portfolio with account info and expanded holdings
2. User taps on a holding item (e.g., BNB)
3. Activity screen slides in showing only BNB transactions
4. User taps the ✕ button to return to portfolio

**Key Updates:**
```typescript
- Added: selectedSymbol and showActivity state
- Added: handleHoldingPress callback
- Added: handleCloseActivity callback
- Removed: Events list and related UI
- Simplified: Layout to Account + Holdings only
```

## User Flow

### Before:
1. Portfolio screen showed: Account → Holdings (collapsed) → Activity list
2. Click holdings card to expand/collapse
3. Activity always visible at bottom
4. No way to filter activity by asset

### After:
1. Portfolio screen shows: Account → Holdings (always expanded)
2. No click on holdings card header
3. Click individual holding item (e.g., BNB) → Navigate to Activity screen
4. Activity screen shows: Filtered transactions for that symbol
5. Click ✕ button → Return to portfolio
6. Activity section completely removed from main portfolio view

## Benefits

1. **Cleaner Portfolio View**: Main screen focuses on holdings without activity clutter
2. **Better Context**: Activity is shown in dedicated screen with proper filtering
3. **Improved UX**: Users can see their holdings without extra clicks
4. **Logical Navigation**: Tap holding → See its transactions → Return easily
5. **Performance**: Main screen is lighter without rendering all events

## Files Modified

1. `src/components/HoldingsSegment.tsx` - Always expanded, clickable items
2. `src/screens/PortfolioScreen.tsx` - Simplified layout, navigation logic
3. `src/screens/ActivityScreen.tsx` - New dedicated activity view

## Testing Recommendations

1. Verify holdings are always visible without clicking
2. Test clicking on different holding items (BNB, USDT, POL, etc.)
3. Verify activity screen shows correct filtered transactions
4. Test close button returns to portfolio correctly
5. Verify empty state when symbol has no transactions
6. Test scroll behavior in both screens
7. Verify refresh control still works in portfolio
