/**
 * HTML template for TradingView Lightweight Charts in WebView.
 * Loads library from CDN and sets up chart with candlestick, volume, indicators.
 */

const LWC_CDN =
  'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';

export function getChartHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    #chart-container { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="chart-container"></div>
  <script src="${LWC_CDN}"></script>
  <script>
    (function() {
      const isRN = typeof window.ReactNativeWebView !== 'undefined';
      const post = (type, payload) => {
        if (isRN) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
        }
      };

      let chart = null;
      let candlestickSeries = null;
      let lineSeries = null;
      let volumeSeries = null;
      let volumeChart = null;
      let rsiSeries = null;
      let indicatorSeries = {};
      let candleData = [];
      let volumeData = [];
      let viewMode = 'candlestick';
      let theme = 'light';
      let indicators = {};
      function applyTheme() {
        const isDark = theme === 'dark';
        const bg = 'rgba(0,0,0,0)';
        const text = isDark ? '#e5e5e5' : '#171717';
        const grid = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
        if (chart) {
          chart.applyOptions({
            layout: { background: { type: 'solid', color: bg }, textColor: text },
            grid: { vertLines: { color: grid }, horzLines: { color: grid } }
          });
        }
        if (volumeChart && volumeChart !== chart) {
          volumeChart.applyOptions({
            layout: { background: { type: 'solid', color: bg }, textColor: text },
            grid: { vertLines: { color: grid }, horzLines: { color: grid } }
          });
        }
      }

      function sma(arr, period) {
        const out = [];
        for (let i = 0; i < arr.length; i++) {
          if (i < period - 1) out.push(null);
          else {
            let s = 0;
            for (let j = 0; j < period; j++) s += arr[i - j];
            out.push(s / period);
          }
        }
        return out;
      }

      function ema(arr, period) {
        const k = 2 / (period + 1);
        const out = [];
        let prev = null;
        for (let i = 0; i < arr.length; i++) {
          if (i < period - 1) out.push(null);
          else {
            if (prev === null) {
              let s = 0;
              for (let j = 0; j < period; j++) s += arr[j];
              prev = s / period;
            } else prev = arr[i] * k + prev * (1 - k);
            out.push(prev);
          }
        }
        return out;
      }

      function vwap(data) {
        let cumVol = 0, cumPV = 0;
        return data.map(d => {
          const typical = (d.high + d.low + d.close) / 3;
          cumPV += typical * d.volume;
          cumVol += d.volume;
          return cumVol === 0 ? d.close : cumPV / cumVol;
        });
      }

      function rsi(closes, period) {
        const out = [];
        for (let i = 0; i < closes.length; i++) {
          if (i < period) out.push(null);
          else {
            let g = 0, l = 0;
            for (let j = 1; j <= period; j++) {
              const d = closes[i - j + 1] - closes[i - j];
              if (d > 0) g += d; else l -= d;
            }
            const avgL = l / period;
            out.push(avgL === 0 ? 100 : 100 - 100 / (1 + (g / period) / avgL));
          }
        }
        return out;
      }

      function updateIndicators() {
        if (!chart || !candleData.length) return;
        const closes = candleData.map(d => d.close);
        const volumes = candleData.map(d => d.value);

        Object.keys(indicatorSeries).forEach(k => indicatorSeries[k].setData([]));

        if (indicators.ema) {
          const vals = ema(closes, indicators.ema.period || 20);
          const data = candleData.map((d, i) => ({ time: d.time, value: vals[i] })).filter(x => x.value != null);
          if (!indicatorSeries.ema) {
            indicatorSeries.ema = chart.addLineSeries({ color: '#a855f7', lineWidth: 2, title: 'EMA' });
          }
          indicatorSeries.ema.setData(data);
        }
        if (indicators.sma) {
          const vals = sma(closes, indicators.sma.period || 20);
          const data = candleData.map((d, i) => ({ time: d.time, value: vals[i] })).filter(x => x.value != null);
          if (!indicatorSeries.sma) {
            indicatorSeries.sma = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, title: 'SMA' });
          }
          indicatorSeries.sma.setData(data);
        }
        if (indicators.vwap && candleData[0]) {
          const ohlcv = candleData.map(d => ({
            open: d.open, high: d.high, low: d.low, close: d.close,
            volume: d.value || 1
          }));
          const vals = vwap(ohlcv);
          const data = candleData.map((d, i) => ({ time: d.time, value: vals[i] }));
          if (!indicatorSeries.vwap) {
            indicatorSeries.vwap = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, title: 'VWAP' });
          }
          indicatorSeries.vwap.setData(data);
        }
        if (indicators.volumeMA && volumeSeries && volumeData.length) {
          const vols = volumeData.map(d => d.value);
          const vals = sma(vols, indicators.volumeMA.period || 20);
          const data = volumeData.map((d, i) => ({ time: d.time, value: vals[i] })).filter(x => x.value != null);
          if (!indicatorSeries.volumeMA) {
            indicatorSeries.volumeMA = volumeChart.addLineSeries({
              color: '#6366f1',
              lineWidth: 2,
              priceScaleId: 'volume',
              title: 'Vol MA'
            });
          }
          indicatorSeries.volumeMA.setData(data);
        }
      }

      function initChart(opts) {
        const { candlestick = [], volume = [], isDark = false, showVolume = true } = opts;
        theme = isDark ? 'dark' : 'light';
        candleData = candlestick.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          value: (volume.find(v => v.time === c.time) || {}).value || 0
        }));
        volumeData = volume;

        if (chart) {
          chart.remove();
          chart = null;
          volumeChart = null;
          volumeSeries = null;
        }

        const container = document.getElementById('chart-container');
        if (!container) return;

        const bg = 'rgba(0,0,0,0)';
        const text = theme === 'dark' ? '#e5e5e5' : '#171717';
        const grid = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

        chart = LightweightCharts.createChart(container, {
          layout: { background: { type: 'solid', color: bg }, textColor: text },
          grid: { vertLines: { color: grid }, horzLines: { color: grid } },
          crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
          rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.05 } },
          timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false }
        });

        candlestickSeries = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444'
        });
        candlestickSeries.setData(candlestick);

        lineSeries = chart.addLineSeries({
          color: '#a855f7',
          lineWidth: 2,
          visible: false,
          lastValueVisible: false,
          priceLineVisible: false
        });
        lineSeries.setData(candlestick.map(c => ({ time: c.time, value: c.close })));

        if (showVolume && volume.length) {
          volumeChart = chart;
          volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume'
          });
          volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 }, borderVisible: false });
          volumeSeries.setData(volume);
        }

        chart.timeScale().fitContent();

        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range && range.from < 5) {
            const firstCandle = candlestick[0];
            if (firstCandle) {
              const t = typeof firstCandle.time === 'string'
                ? new Date(firstCandle.time).getTime()
                : firstCandle.time;
              const to = new Date(t);
              const from = new Date(t - 7 * 24 * 60 * 60 * 1000);
              post('LOAD_HISTORICAL', { from: from.toISOString(), to: to.toISOString() });
            }
          }
        });

        chart.subscribeCrosshairMove((param) => {
          if (param.time && param.seriesData) {
            const candle = param.seriesData.get(candlestickSeries);
            if (candle) {
              post('CROSSHAIR', {
                price: candle.close,
                time: param.time,
                o: candle.open,
                h: candle.high,
                l: candle.low,
                c: candle.close
              });
            }
          }
        });

        updateIndicators();
        post('READY', {});
      }

      function updateData(payload) {
        const { prepend = [], append = [], updateLast } = payload;
        if (prepend.length) {
          const existing = new Set(candleData.map(d => d.time));
          const newCandles = prepend.filter(c => !existing.has(c.time));
          if (newCandles.length) {
            candleData = [...newCandles, ...candleData].sort((a, b) => {
              const ta = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time;
              const tb = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time;
              return ta - tb;
            });
            candlestickSeries.setData(candleData.map(c => ({
              time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
            })));
            lineSeries.setData(candleData.map(c => ({ time: c.time, value: c.close })));
            if (volumeSeries && payload.volumePrepend) {
              volumeData = [...payload.volumePrepend, ...volumeData];
              volumeSeries.setData(volumeData);
            }
            updateIndicators();
          }
        }
        if (append.length) {
          candleData = [...candleData, ...append];
          candlestickSeries.setData(candleData.map(c => ({
            time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
          })));
          lineSeries.setData(candleData.map(c => ({ time: c.time, value: c.close })));
          if (volumeSeries && payload.volumeAppend) {
            volumeData = [...volumeData, ...payload.volumeAppend];
            volumeSeries.setData(volumeData);
          }
          updateIndicators();
        }
        if (updateLast && candleData.length) {
          const last = candleData[candleData.length - 1];
          const u = { ...last, ...updateLast };
          candlestickSeries.update(u);
          lineSeries.update({ time: u.time, value: u.close });
          candleData[candleData.length - 1] = u;
          updateIndicators();
        }
      }

      function setView(mode) {
        viewMode = mode;
        if (candlestickSeries) candlestickSeries.applyOptions({ visible: mode === 'candlestick' });
        if (lineSeries) lineSeries.applyOptions({ visible: mode === 'line' });
      }

      function setIndicators(ind) {
        indicators = ind || {};
        updateIndicators();
      }

      function setTheme(t) {
        theme = t;
        applyTheme();
      }

      function fitContent() {
        if (chart) chart.timeScale().fitContent();
        if (volumeChart) volumeChart.timeScale().fitContent();
      }

      window.chartBridge = {
        init: initChart,
        updateData,
        setView,
        setIndicators,
        setTheme,
        fitContent,
      };

      post('READY', {});
    })();
  </script>
</body>
</html>
`;
}
