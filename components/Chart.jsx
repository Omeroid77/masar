'use client';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { fmt } from '@/lib/data';

Chart.defaults.font.family = '"Noto Sans Arabic",system-ui,sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#575d59';
Chart.defaults.borderColor = '#e3e8e6';

const tipOpts = { rtl: true, textDirection: 'rtl', backgroundColor: '#1c211e', padding: 9, cornerRadius: 4, titleFont: { weight: '600' }, bodyFont: { size: 12 } };

export function lineConfig(labels, series, { y = '', fmtv = fmt, legend } = {}) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: series.map(s => ({
        label: s.label, data: s.data, borderColor: s.color,
        backgroundColor: series.length === 1 ? s.color + '1f' : s.color,
        fill: series.length === 1 ? 'origin' : false, borderWidth: 2.2, pointRadius: 0, pointHoverRadius: 5,
        pointHoverBorderWidth: 2, pointHoverBorderColor: '#fcfcfb', tension: .25, borderDash: s.dash || [],
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: legend ?? series.length > 1, rtl: true, position: 'top', align: 'start', labels: { boxWidth: 12, boxHeight: 12, usePointStyle: false } },
        tooltip: { ...tipOpts, callbacks: { label: c => ` ${c.dataset.label}: ${fmtv(c.parsed.y)}` } },
      },
      scales: {
        x: { reverse: true, grid: { display: false } },
        y: { position: 'right', beginAtZero: true, title: { display: !!y, text: y }, grid: { color: '#edf1ef' }, ticks: { callback: v => fmtv(v) } },
      },
    },
  };
}

export function barConfig(labels, series, { horizontal = true, y = '', fmtv = fmt, stacked = false, colors } = {}) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: series.map(s => ({
        label: s.label, data: s.data, backgroundColor: colors || s.color, borderRadius: 4, borderSkipped: false,
        maxBarThickness: 16, barPercentage: .72, categoryPercentage: .8,
        borderWidth: { top: 0, bottom: 0, left: stacked ? 2 : 0, right: stacked ? 2 : 0 }, borderColor: '#fcfcfb',
      })),
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: series.length > 1, rtl: true, position: 'top', align: 'start', labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: { ...tipOpts, callbacks: { label: c => ` ${c.dataset.label}: ${fmtv(horizontal ? c.parsed.x : c.parsed.y)}` } },
      },
      scales: horizontal
        ? {
          x: { reverse: true, stacked, beginAtZero: true, grid: { color: '#edf1ef' }, title: { display: !!y, text: y }, ticks: { callback: v => fmtv(v) } },
          y: { position: 'right', stacked, grid: { display: false }, ticks: { autoSkip: false } },
        }
        : {
          x: { reverse: true, stacked, grid: { display: false } },
          y: { position: 'right', stacked, beginAtZero: true, title: { display: !!y, text: y }, grid: { color: '#edf1ef' }, ticks: { callback: v => fmtv(v) } },
        },
    },
  };
}

/* size: '' | 'short' | 'tall' (heights from the .ch classes) */
export function ChartBox({ config, size = '' }) {
  const ref = useRef(null);
  const chart = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chart.current) {
      // update in place: no flash when filters or the scenario slider change
      chart.current.data = config.data;
      chart.current.options = config.options;
      chart.current.update();
    } else {
      chart.current = new Chart(ref.current, config);
    }
  });
  useEffect(() => () => { chart.current?.destroy(); chart.current = null; }, []);
  return <div className={`ch ${size}`.trim()}><canvas ref={ref} /></div>;
}

export const LineChart = ({ labels, series, size, ...opts }) => <ChartBox size={size} config={lineConfig(labels, series, opts)} />;
export const BarChart = ({ labels, series, size, ...opts }) => <ChartBox size={size} config={barConfig(labels, series, opts)} />;
