import React, { memo } from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { IllustrationMarket } from '../components/IllustrationMarket';
import { ONBOARDING_SLIDES } from '../constants/onboardingData';

const copy = ONBOARDING_SLIDES[1];

export interface SlideTwoProps {
  illustrationWidth: number;
}

function SlideTwoInner({ illustrationWidth }: SlideTwoProps) {
  return (
    <OnboardingSlide
      title={copy.title}
      description={copy.description}
      illustration={
        <IllustrationMarket width={illustrationWidth} height={180} />
      }
    />
  );
}

export const SlideTwo = memo(SlideTwoInner);
