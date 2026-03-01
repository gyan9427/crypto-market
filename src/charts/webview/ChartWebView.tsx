import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getChartHtml } from './chartTemplate';
import type { ChartTheme } from '../hooks/useChartTheme';

export interface ChartWebViewProps {
  candlestickData: { time: string; open: number; high: number; low: number; close: number }[];
  volumeData: { time: string; value: number; color: string }[];
  theme?: ChartTheme;
  viewMode?: 'candlestick' | 'line';
  indicators?: Record<string, { period?: number }>;
  showVolume?: boolean;
  onLoadHistorical?: (from: string, to: string) => void;
  /** Live update for the last candle (close, high, low) */
  liveCandleUpdate?: { close: number; high?: number; low?: number };
  style?: object;
}

const CHART_HTML = getChartHtml();

export const ChartWebView: React.FC<ChartWebViewProps> = ({
  candlestickData,
  volumeData,
  theme = 'light',
  viewMode = 'candlestick',
  indicators = {},
  showVolume = true,
  onLoadHistorical,
  liveCandleUpdate,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);

  const inject = useCallback((script: string) => {
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const initChart = useCallback(() => {
    if (candlestickData.length === 0) return;
    const payload = {
      candlestick: candlestickData,
      volume: showVolume ? volumeData : [],
      isDark: theme === 'dark',
      showVolume,
    };
    inject(`
      (function() {
        if (window.chartBridge) {
          window.chartBridge.init(${JSON.stringify(payload)});
        }
      })();
      true;
    `);
  }, [candlestickData, volumeData, theme, showVolume, inject]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'READY') {
          isReadyRef.current = true;
          initChart();
        } else if (msg.type === 'LOAD_HISTORICAL' && msg.from && msg.to && onLoadHistorical) {
          onLoadHistorical(msg.from, msg.to);
        }
      } catch {}
    },
    [initChart, onLoadHistorical]
  );

  useEffect(() => {
    if (candlestickData.length > 0 && isReadyRef.current) {
      initChart();
    }
  }, [candlestickData, volumeData, theme, showVolume, initChart]);

  useEffect(() => {
    if (!isReadyRef.current) return;
    inject(`
      (function() {
        if (window.chartBridge) window.chartBridge.setView('${viewMode}');
      })();
      true;
    `);
  }, [viewMode, inject]);

  useEffect(() => {
    if (!isReadyRef.current) return;
    inject(`
      (function() {
        if (window.chartBridge) window.chartBridge.setIndicators(${JSON.stringify(indicators)});
      })();
      true;
    `);
  }, [indicators, inject]);

  useEffect(() => {
    if (!isReadyRef.current) return;
    inject(`
      (function() {
        if (window.chartBridge) window.chartBridge.setTheme('${theme}');
      })();
      true;
    `);
  }, [theme, inject]);

  useEffect(() => {
    if (!isReadyRef.current || !liveCandleUpdate || candlestickData.length === 0) return;
    const last = candlestickData[candlestickData.length - 1];
    const payload = {
      updateLast: {
        time: last.time,
        open: last.open,
        high: liveCandleUpdate.high ?? Math.max(last.high, liveCandleUpdate.close),
        low: liveCandleUpdate.low ?? Math.min(last.low, liveCandleUpdate.close),
        close: liveCandleUpdate.close,
      },
    };
    inject(`
      (function() {
        if (window.chartBridge) window.chartBridge.updateData(${JSON.stringify(payload)});
      })();
      true;
    `);
  }, [liveCandleUpdate, candlestickData, inject]);


  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: CHART_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={Platform.OS === 'android'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
