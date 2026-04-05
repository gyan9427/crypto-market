import React, { memo } from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { IllustrationPersonalization } from '../components/IllustrationPersonalization';
import { ONBOARDING_SLIDES } from '../constants/onboardingData';

const copy = ONBOARDING_SLIDES[2];

export interface SlideThreeProps {
  illustrationWidth: number;
}

function SlideThreeInner({ illustrationWidth }: SlideThreeProps) {
  return (
    <OnboardingSlide
      title={copy.title}
      description={copy.description}
      illustration={
        <IllustrationPersonalization width={illustrationWidth} height={180} />
      }
    />
  );
}

export const SlideThree = memo(SlideThreeInner);
