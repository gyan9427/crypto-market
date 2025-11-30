# Screenshots Directory

Place your UI screenshot images here to replace the placeholder images from Pexels.

## Recommended Specifications

### News Images
- **Aspect Ratio**: 16:9
- **Recommended Size**: 1200x675px
- **Format**: PNG or JPG

### Coin Logos
- **Aspect Ratio**: 1:1 (Square)
- **Recommended Size**: 200x200px
- **Format**: PNG with transparency

### Featured Carousel Images
- **Aspect Ratio**: 16:9
- **Recommended Size**: 800x450px
- **Format**: PNG or JPG

## How to Use

After adding images to this directory, update the references in:

- `src/mock/mockData.ts` - Update `imageUrl` properties for news items
- For coin logos, update the `logo` property in coin objects

Example:
```typescript
imageUrl: require('@/assets/screenshots/news-hero-1.png')
```
