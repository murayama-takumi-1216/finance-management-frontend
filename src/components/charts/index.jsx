import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Modern color palette
const COLORS = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139, 92, 246, 0.15)',
  cyan: '#06b6d4',
  cyanLight: 'rgba(6, 182, 212, 0.15)',
  orange: '#f97316',
  orangeLight: 'rgba(249, 115, 22, 0.15)',
  pink: '#ec4899',
  pinkLight: 'rgba(236, 72, 153, 0.15)',
  blue: '#3b82f6',
  blueLight: 'rgba(59, 130, 246, 0.15)',
  teal: '#14b8a6',
  tealLight: 'rgba(20, 184, 166, 0.15)',
};

// Gradient colors for pie/doughnut charts
const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#8b5cf6' },   // indigo to purple
  { start: '#10b981', end: '#34d399' },   // emerald
  { start: '#f59e0b', end: '#fbbf24' },   // amber
  { start: '#ef4444', end: '#f87171' },   // red
  { start: '#06b6d4', end: '#22d3ee' },   // cyan
  { start: '#ec4899', end: '#f472b6' },   // pink
  { start: '#3b82f6', end: '#60a5fa' },   // blue
  { start: '#f97316', end: '#fb923c' },   // orange
  { start: '#8b5cf6', end: '#a78bfa' },   // violet
  { start: '#14b8a6', end: '#2dd4bf' },   // teal
];

const PIE_COLORS = GRADIENT_COLORS.map(c => c.start);
const PIE_COLORS_LIGHT = GRADIENT_COLORS.map(c => `${c.start}cc`);

// Common chart options with modern styling
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          size: 12,
          family: "'Inter', sans-serif",
          weight: '500',
        },
        color: '#64748b',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: {
        size: 13,
        family: "'Inter', sans-serif",
        weight: '600',
      },
      bodyFont: {
        size: 12,
        family: "'Inter', sans-serif",
      },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      boxPadding: 6,
    },
  },
};

// Create gradient for line charts
function createGradient(ctx, chartArea, colorStart, colorEnd) {
  if (!chartArea) return colorStart;
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, `${colorStart}40`);
  return gradient;
}

/**
 * Income vs Expenses Bar Chart - Modern Style
 */
export function IncomeExpensesBarChart({ data, height = 300 }) {
  const chartRef = useRef(null);

  if (!data || !data.series || data.series.length === 0) {
    return <EmptyChart message="No data available" subMessage="Add transactions to see comparison" height={height} icon="bar" />;
  }

  const chartData = {
    labels: data.series.map(item => formatPeriodLabel(item.periodo)),
    datasets: [
      {
        label: 'Income',
        data: data.series.map(item => item.ingresos),
        backgroundColor: COLORS.success,
        hoverBackgroundColor: '#059669',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 32,
      },
      {
        label: 'Expenses',
        data: data.series.map(item => item.gastos),
        backgroundColor: COLORS.danger,
        hoverBackgroundColor: '#dc2626',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 11, family: "'Inter', sans-serif" },
          padding: 8,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, family: "'Inter', sans-serif" },
          padding: 4,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}

/**
 * Monthly Trends Line Chart - Modern Style with Gradients
 */
export function MonthlyTrendsChart({ data, height = 300 }) {
  const chartRef = useRef(null);

  if (!data || !data.trends || data.trends.length === 0) {
    return <EmptyChart message="No trend data available" subMessage="Add transactions to see monthly trends" height={height} icon="line" />;
  }

  const chartData = {
    labels: data.trends.map(item => formatPeriodLabel(item.periodo)),
    datasets: [
      {
        label: 'Income',
        data: data.trends.map(item => item.ingresos),
        borderColor: COLORS.success,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea, COLORS.success, COLORS.success);
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLORS.success,
        pointHoverBorderWidth: 3,
        borderWidth: 3,
      },
      {
        label: 'Expenses',
        data: data.trends.map(item => item.gastos),
        borderColor: COLORS.danger,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea, COLORS.danger, COLORS.danger);
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLORS.danger,
        pointHoverBorderWidth: 3,
        borderWidth: 3,
      },
      {
        label: 'Balance',
        data: data.trends.map(item => item.balance),
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLORS.primary,
        pointHoverBorderWidth: 3,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 11, family: "'Inter', sans-serif" },
          padding: 8,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, family: "'Inter', sans-serif" },
          padding: 4,
          maxRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}

/**
 * Balance Trend Line Chart - Simple Modern Style
 */
export function BalanceTrendChart({ data, height = 200 }) {
  if (!data || !data.trends || data.trends.length === 0) {
    return <EmptyChart message="No balance data" height={height} icon="line" />;
  }

  let cumulative = 0;
  const cumulativeData = data.trends.map(item => {
    cumulative += item.balance;
    return cumulative;
  });

  const chartData = {
    labels: data.trends.map(item => formatPeriodLabel(item.periodo)),
    datasets: [
      {
        label: 'Cumulative Balance',
        data: cumulativeData,
        borderColor: COLORS.primary,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return createGradient(ctx, chartArea, COLORS.primary, COLORS.primary);
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => `Balance: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 10 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

/**
 * Expenses by Category Doughnut Chart - Modern Style
 */
export function ExpensesByCategoryChart({ data, height = 300, showLegend = true }) {
  if (!data || !data.categories || data.categories.length === 0) {
    return <EmptyChart message="No expense data" subMessage="Add expenses to see breakdown" height={height} icon="pie" />;
  }

  const chartData = {
    labels: data.categories.map(item => item.categoria),
    datasets: [
      {
        data: data.categories.map(item => item.total),
        backgroundColor: PIE_COLORS.slice(0, data.categories.length),
        hoverBackgroundColor: PIE_COLORS_LIGHT.slice(0, data.categories.length),
        borderWidth: 0,
        hoverBorderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    cutout: '70%',
    plugins: {
      ...commonOptions.plugins,
      legend: showLegend ? {
        ...commonOptions.plugins.legend,
        position: 'right',
        align: 'center',
        labels: {
          ...commonOptions.plugins.legend.labels,
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => ({
              text: truncateLabel(label, 12),
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].backgroundColor[i],
              hidden: false,
              index: i,
              pointStyle: 'circle',
            }));
          },
        },
      } : { display: false },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = data.categories[context.dataIndex]?.porcentaje || 0;
            return `${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const totalExpenses = data.categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingRight: showLegend ? '35%' : 0 }}>
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrencyShort(totalExpenses)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Income by Category Pie Chart - Modern Style
 */
export function IncomeByCategoryChart({ data, height = 300, showLegend = true }) {
  if (!data || !data.categories || data.categories.length === 0) {
    return <EmptyChart message="No income data" subMessage="Add income to see breakdown" height={height} icon="pie" />;
  }

  const chartData = {
    labels: data.categories.map(item => item.categoria),
    datasets: [
      {
        data: data.categories.map(item => item.total),
        backgroundColor: PIE_COLORS.slice(0, data.categories.length),
        hoverBackgroundColor: PIE_COLORS_LIGHT.slice(0, data.categories.length),
        borderWidth: 0,
        hoverBorderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    cutout: '70%',
    plugins: {
      ...commonOptions.plugins,
      legend: showLegend ? {
        ...commonOptions.plugins.legend,
        position: 'right',
        align: 'center',
        labels: {
          ...commonOptions.plugins.legend.labels,
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label, i) => ({
              text: truncateLabel(label, 12),
              fillStyle: datasets[0].backgroundColor[i],
              strokeStyle: datasets[0].backgroundColor[i],
              hidden: false,
              index: i,
              pointStyle: 'circle',
            }));
          },
        },
      } : { display: false },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = data.categories[context.dataIndex]?.porcentaje || 0;
            return `${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const totalIncome = data.categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingRight: showLegend ? '35%' : 0 }}>
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Total</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrencyShort(totalIncome)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Top Categories Horizontal Bar Chart - Modern Style
 */
export function TopCategoriesChart({ data, type = 'gasto', height = 300 }) {
  if (!data || !data.ranking || data.ranking.length === 0) {
    return <EmptyChart message="No category data" subMessage="Add transactions to see top categories" height={height} icon="bar" />;
  }

  const color = type === 'gasto' ? COLORS.danger : COLORS.success;
  const hoverColor = type === 'gasto' ? '#dc2626' : '#059669';

  const chartData = {
    labels: data.ranking.map(item => truncateLabel(item.categoria, 15)),
    datasets: [
      {
        label: type === 'gasto' ? 'Expenses' : 'Income',
        data: data.ranking.map(item => item.total),
        backgroundColor: color,
        hoverBackgroundColor: hoverColor,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 24,
      },
    ],
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y',
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      y: {
        border: { display: false },
        ticks: {
          color: '#475569',
          font: { size: 12, weight: '500' },
          padding: 8,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

/**
 * Spending by Provider Bar Chart - Modern Style
 */
export function SpendingByProviderChart({ data, height = 300 }) {
  if (!data || !data.providers || data.providers.length === 0) {
    return <EmptyChart message="No provider data" subMessage="Add transactions with providers" height={height} icon="bar" />;
  }

  const chartData = {
    labels: data.providers.map(item => truncateLabel(item.proveedor, 15)),
    datasets: [
      {
        label: 'Spending',
        data: data.providers.map(item => item.total),
        backgroundColor: PIE_COLORS.slice(0, data.providers.length),
        hoverBackgroundColor: PIE_COLORS_LIGHT.slice(0, data.providers.length),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 24,
      },
    ],
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y',
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          title: (context) => data.providers[context[0].dataIndex]?.proveedor,
          label: (context) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      y: {
        border: { display: false },
        ticks: {
          color: '#475569',
          font: { size: 12, weight: '500' },
          padding: 8,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

/**
 * Period Comparison Bar Chart - Modern Style
 */
export function PeriodComparisonChart({ data, height = 300 }) {
  if (!data || !data.resumen) {
    return <EmptyChart message="No comparison data" height={height} icon="bar" />;
  }

  const { periodoA, periodoB } = data.resumen;

  const chartData = {
    labels: ['Income', 'Expenses', 'Balance'],
    datasets: [
      {
        label: 'Period 1',
        data: [periodoA.ingresos, periodoA.gastos, periodoA.saldo],
        backgroundColor: COLORS.primary,
        hoverBackgroundColor: '#4f46e5',
        borderRadius: 6,
        barThickness: 32,
      },
      {
        label: 'Period 2',
        data: [periodoB.ingresos, periodoB.gastos, periodoB.saldo],
        backgroundColor: COLORS.cyan,
        hoverBackgroundColor: '#0891b2',
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        border: { display: false },
        ticks: {
          callback: (value) => formatCurrencyShort(value),
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        border: { display: false },
        ticks: { color: '#475569', font: { size: 12, weight: '500' } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

/**
 * Tasks Status Doughnut Chart - Modern Style
 */
export function TasksStatusChart({ data, height = 200 }) {
  if (!data) {
    return <EmptyChart message="No task data" height={height} icon="pie" />;
  }

  const { pendientes = 0, enProgreso = 0, completadas = 0, vencidas = 0 } = data;
  const total = pendientes + enProgreso + completadas + vencidas;

  if (total === 0) {
    return <EmptyChart message="No tasks yet" subMessage="Create tasks to track progress" height={height} icon="pie" />;
  }

  const statusColors = {
    pending: '#f59e0b',
    inProgress: '#6366f1',
    completed: '#10b981',
    overdue: '#ef4444',
  };

  const activeData = [];
  const activeColors = [];
  const activeLabels = [];

  if (pendientes > 0) { activeData.push(pendientes); activeColors.push(statusColors.pending); activeLabels.push('Pending'); }
  if (enProgreso > 0) { activeData.push(enProgreso); activeColors.push(statusColors.inProgress); activeLabels.push('In Progress'); }
  if (completadas > 0) { activeData.push(completadas); activeColors.push(statusColors.completed); activeLabels.push('Completed'); }
  if (vencidas > 0) { activeData.push(vencidas); activeColors.push(statusColors.overdue); activeLabels.push('Overdue'); }

  const chartData = {
    labels: activeLabels,
    datasets: [
      {
        data: activeData,
        backgroundColor: activeColors,
        hoverBackgroundColor: activeColors.map(c => `${c}cc`),
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    cutout: '75%',
    plugins: {
      ...commonOptions.plugins,
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 11, weight: '500' },
          color: '#64748b',
        },
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw} tasks`,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingRight: '35%' }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Sparkline Chart
 */
export function SparklineChart({ data, color = COLORS.primary, height = 60 }) {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="bg-gray-50 rounded animate-pulse" />;
  }

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

/**
 * Modern Empty Chart Placeholder
 */
function EmptyChart({ message, subMessage, height, icon = 'bar' }) {
  const icons = {
    bar: (
      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3v-8zm6-4h2v12H9V9zm6-4h2v16h-2V5zm6 8h2v8h-2v-8z" />
      </svg>
    ),
    line: (
      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    pie: (
      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  };

  return (
    <div
      style={{ height }}
      className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100"
    >
      <div className="text-gray-300 mb-3">
        {icons[icon]}
      </div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
      {subMessage && <p className="text-xs text-gray-400 mt-1">{subMessage}</p>}
    </div>
  );
}

// Helper functions
function formatCurrency(value) {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyShort(value) {
  if (value === null || value === undefined) return '$0';
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${Math.round(value)}`;
}

function formatPeriodLabel(periodo) {
  if (!periodo) return '';
  if (periodo.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = periodo.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
  }
  if (periodo.match(/^\d{4}-W\d{2}$/)) {
    return `W${periodo.split('W')[1]}`;
  }
  if (periodo.match(/^\d{4}$/)) {
    return periodo;
  }
  if (periodo.match(/^\d{4}-Q\d$/)) {
    return `Q${periodo.split('Q')[1]} '${periodo.split('-')[0].slice(2)}`;
  }
  return periodo;
}

function truncateLabel(label, maxLength) {
  if (!label) return '';
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 2) + '..';
}

// Export constants and helpers
export {
  COLORS,
  PIE_COLORS,
  GRADIENT_COLORS,
  formatCurrency,
  formatCurrencyShort,
  formatPeriodLabel,
};
