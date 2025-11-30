# UI Kit Reference

Common Tailwind classes and style patterns used throughout the app.

## Spacing Scale (8px baseline)

```
xs: 4px   (gap-1, p-1)
sm: 8px   (gap-2, p-2)
md: 16px  (gap-4, p-4)
lg: 24px  (gap-6, p-6)
xl: 32px  (gap-8, p-8)
```

## Typography Scale

### Font Sizes

```
xs: 12px   (text-xs)   - Captions, metadata
sm: 13px   (text-sm)   - Body small, snippets
base: 14px (text-base) - Body text, labels
md: 16px   (text-md)   - Headings, titles
lg: 18px   (text-lg)   - Section headers
xl: 20px   (text-xl)   - Large titles
xxl: 24px  (text-2xl)  - Page titles
```

### Font Weights

```
regular: 400  (font-normal)
medium: 500   (font-medium)
semibold: 600 (font-semibold)
bold: 700     (font-bold)
```

### Line Heights

```
tight: 1.2    - Headings
normal: 1.5   - Body text
relaxed: 1.75 - Long-form content
```

## Color System

### Primary (Purple)

```
primary-50  #faf5ff
primary-100 #f3e8ff
primary-500 #a855f7 ← Main brand color
primary-700 #7e22ce
```

### Accent (Pink)

```
accent-50  #fdf4ff
accent-500 #d946ef
accent-700 #a21caf
```

### Neutral (Grays)

```
neutral-50  #fafafa ← Backgrounds
neutral-100 #f5f5f5 ← Light backgrounds
neutral-400 #a3a3a3 ← Disabled text
neutral-500 #737373 ← Secondary text
neutral-600 #525252 ← Body text
neutral-800 #262626 ← Primary text
neutral-900 #171717 ← Headings
```

### Semantic Colors

```
success-500 #22c55e ← Positive changes
danger-500  #ef4444 ← Negative changes
```

## Border Radius

```
rounded-sm     4px  - Small elements
rounded        8px  - Buttons, inputs
rounded-card   12px - Cards
rounded-md     12px - Medium containers
rounded-lg     16px - Large cards
rounded-full   50%  - Avatars, pills
```

## Shadows

### Small

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
}
```

### Medium

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
}
```

### Large

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
}
```

## Component Patterns

### NewsCard

```
Container:
- bg: white
- rounded: 12px
- padding: 16px
- shadow: medium
- margin-bottom: 16px

Title:
- font-size: 16px
- font-weight: 600
- line-height: 22px
- color: neutral-900
- max-lines: 3

Snippet:
- font-size: 13px
- font-weight: 400
- line-height: 18px
- color: neutral-600
- max-lines: 2

Metadata:
- font-size: 12px
- color: neutral-500
```

### CoinChip

```
Container:
- padding: 12px horizontal, 6px vertical
- bg: neutral-100
- rounded: 8px
- flex-direction: row
- min-height: 44px

Avatar:
- size: 20x20
- rounded: 10px (perfect circle)
- bg: primary-500

Symbol:
- font-size: 13px
- font-weight: 600
- color: neutral-800
```

### FAB

```
Size: 56x56px
Rounded: 28px (perfect circle)
Background: primary-500 (purple)
Icon size: 28px
Shadow: large
Position: bottom 80px (above tab bar)

Animation:
- Press: scale(0.9)
- Active: rotate(45deg)
```

### TrendingCoinCard

```
Container:
- padding: 16px
- bg: white
- rounded: 12px
- shadow: small
- min-height: 120px

Price:
- font-size: 18px
- font-weight: 700
- color: neutral-900

Change:
- font-size: 14px
- font-weight: 600
- color: success-500 (positive) or danger-500 (negative)
```

## Touch Target Sizes

Minimum touch target size: **44x44 points**

All interactive elements (buttons, links, chips) should meet this requirement for accessibility.

## Gradient Usage

Avoid purple gradients unless explicitly requested. Use:

- Single solid colors for most UI elements
- Neutral tones for backgrounds
- Brand color (primary-500) for accents
- Blues, greens, or context-appropriate colors

## Responsive Breakpoints

```
mobile: < 640px
tablet: 640px - 1024px
desktop: > 1024px
```

## Animation Durations

```
fast: 150ms   - Micro-interactions
normal: 200ms - Standard transitions
slow: 300ms   - Complex animations
```

## Common Class Combinations

### Card Container

```
bg-white rounded-card p-4 shadow-md mb-4
```

### Button Primary

```
bg-primary-500 px-4 py-2 rounded-button
```

### Text Input

```
bg-neutral-100 px-3 py-2 rounded-button text-base
```

### Section Heading

```
text-lg font-bold text-neutral-900 mb-2
```

### Body Text

```
text-base font-normal text-neutral-600 leading-normal
```

### Metadata Text

```
text-xs text-neutral-500
```
