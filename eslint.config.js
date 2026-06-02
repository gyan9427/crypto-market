// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const deadImports = {
  paths: [
    {
      name: '@/src/theme/colors',
      message: 'Removed — use @/src/design-system/tokens/colors',
    },
    {
      name: '@/src/theme/spacing',
      message: 'Removed — use @/src/design-system/tokens/spacing',
    },
    {
      name: '@/src/theme/styles',
      message: 'Removed — use design-system primitives',
    },
  ],
};

const noRnAnimated = {
  name: 'react-native',
  importNames: ['Animated'],
  message: 'Use react-native-reanimated — see design-system/motion',
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'scripts/*'],
  },
  {
    rules: {
      'no-restricted-imports': ['error', deadImports],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [...deadImports.paths, noRnAnimated],
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            ...deadImports.paths,
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Use AppText from @/src/design-system/primitives',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['src/design-system/tokens/**'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Use design-system tokens instead of hardcoded hex colors',
        },
      ],
    },
  },
]);
