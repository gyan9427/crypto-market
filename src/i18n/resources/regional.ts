import { en } from '@/src/i18n/resources/en';

function mergeProfile(overrides: Partial<typeof en.profile>): typeof en {
  return {
    ...en,
    profile: { ...en.profile, ...overrides },
  };
}

/** Profile UI strings per locale; other keys fall back via i18next to `en`. */
export const hi = mergeProfile({
  languageSection: 'भाषा',
  languageHint: 'ऐप की भाषा चुनें। साइन इन पर सेटिंग सिंक होती है।',
  languagePickerTitle: 'भाषा चुनें',
});

export const ta = mergeProfile({
  languageSection: 'மொழி',
  languageHint: 'பயன்பாட்டு மொழியைத் தேர்ந்தெடுக்கவும். உள்நுழையும்போது ஒத்திசைக்கப்படும்.',
  languagePickerTitle: 'மொழியைத் தேர்ந்தெடு',
});

export const te = mergeProfile({
  languageSection: 'భాష',
  languageHint: 'యాప్ ఇంటర్‌ఫేస్ భాషను ఎంచుకోండి. సైన్ ఇన్ చేసినప్పుడు సమకాలీకరించబడుతుంది.',
  languagePickerTitle: 'భాషను ఎంచుకోండి',
});

export const kn = mergeProfile({
  languageSection: 'ಭಾಷೆ',
  languageHint: 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆಯನ್ನು ಆರಿಸಿ. ಸೈನ್ ಇನ್ ಮಾಡಿದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.',
  languagePickerTitle: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
});

export const ml = mergeProfile({
  languageSection: 'ഭാഷ',
  languageHint: 'ആപ്പ് ഭാഷ തിരഞ്ഞെടുക്കുക. സൈൻ ഇൻ ചെയ്യുമ്പോൾ സമന്വയിപ്പിക്കും.',
  languagePickerTitle: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
});

export const bn = mergeProfile({
  languageSection: 'ভাষা',
  languageHint: 'অ্যাপের ভাষা বেছে নিন। সাইন ইন থাকলে সিঙ্ক হবে।',
  languagePickerTitle: 'ভাষা বেছে নিন',
});

export const mr = mergeProfile({
  languageSection: 'भाषा',
  languageHint: 'अॅपची भाषा निवडा. साइन इन केल्यावर सिंक होते.',
  languagePickerTitle: 'भाषा निवडा',
});
