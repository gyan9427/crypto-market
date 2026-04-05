import React, { memo } from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { IllustrationNewsFlow } from '../components/IllustrationNewsFlow';
import { ONBOARDING_SLIDES } from '../constants/onboardingData';

const copy = ONBOARDING_SLIDES[0];

export interface SlideOneProps {
  illustrationWidth: number;
}

function SlideOneInner({ illustrationWidth }: SlideOneProps) {
  return (
    <OnboardingSlide
      title={copy.title}
      description={copy.description}
      illustration={
        <IllustrationNewsFlow width={illustrationWidth} height={180} />
      }
    />
  );
}

export const SlideOne = memo(SlideOneInner);
