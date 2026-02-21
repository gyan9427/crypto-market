import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { colors } from '../theme/theme';

export async function openInAppBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      // iOS options
      dismissButtonStyle: 'close',
      preferredBarTintColor: colors.neutral[900],
      preferredControlTintColor: '#ffffff',
      readerMode: false,
      enableBarCollapsing: true,
      // Android options
      showTitle: true,
      toolbarColor: colors.neutral[900],
      secondaryToolbarColor: '#ffffff',
      enableDefaultShareMenuItem: true,
    });
  } catch {
    Linking.openURL(url);
  }
}
