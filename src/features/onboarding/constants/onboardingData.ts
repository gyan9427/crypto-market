export type OnboardingSlideId = 'news' | 'market' | 'personalization';

export interface OnboardingSlideConfig {
  id: OnboardingSlideId;
  title: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideConfig[] = [
  {
    id: 'news',
    title: 'Stay Ahead of Crypto',
    description:
      'Real-time news, curated signals, and market insights in one place.',
  },
  {
    id: 'market',
    title: 'Track the Market Live',
    description: 'Live prices, trends, and movements that actually matter.',
  },
  {
    id: 'personalization',
    title: 'Built For You',
    description: 'Follow coins, customize feeds, and get smarter with every scroll.',
  },
];

export const ILLUSTRATION_SLOT_HEIGHT = 220;
