/** Minimal react-native stub for Node/vitest. */
export const AppState = {
  addEventListener: (_event: string, _handler: (state: string) => void) => ({
    remove: () => {},
  }),
  currentState: 'active',
};

export const InteractionManager = {
  runAfterInteractions: (fn: () => void) => {
    fn();
    return { cancel: () => {} };
  },
};

export const Platform = { OS: 'ios' };

export default { AppState, InteractionManager, Platform };
