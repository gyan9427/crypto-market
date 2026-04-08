import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

const DEFAULT_BAR_TINT = '#171717';

export type OpenInAppBrowserChrome = {
  barTintColor?: string;
  controlTintColor?: string;
  secondaryToolbarColor?: string;
};

export async function openInAppBrowser(url: string, chrome?: OpenInAppBrowserChrome) {
  const barTint = chrome?.barTintColor ?? DEFAULT_BAR_TINT;
  const secondaryToolbar = chrome?.secondaryToolbarColor ?? '#ffffff';
  try {
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: 'close',
      readerMode: false,
      enableBarCollapsing: true,
      showTitle: true,
      toolbarColor: barTint,
      secondaryToolbarColor: secondaryToolbar,
      enableDefaultShareMenuItem: true,
    });
  } catch {
    Linking.openURL(url);
  }
}
