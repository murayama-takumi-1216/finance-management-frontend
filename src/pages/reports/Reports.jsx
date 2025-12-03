import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { reportsAPI } from '../../services/api';
import { useAccountsStore } from '../../store/useStore';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const periodOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const tabs = [
  { id: 'overview', label: 'Overview', icon: ChartBarIcon },
  { id: 'categories', label: 'Categories', icon: ChartPieIcon },
  { id: 'trends', label: 'Trends', icon: PresentationChartLineIcon },
  { id: 'providers', label: 'Providers', icon: BuildingStorefrontIcon },
];

function Reports() {
  const { accountId } = useParams();
  const { currentAccount } = useAccountsStore();
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [totals, setTotals] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [incomeByCategory, setIncomeByCategory] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [spendingByProvider, setSpendingByProvider] = useState([]);

  useEffect(() => {
    loadReports();
  }, [accountId, period, customDates]);

  const getDateRange = () => {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'week':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date();
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date();
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
      case 'custom':
        if (customDates.start && customDates.end) {
          return { start: customDates.start, end: customDates.end };
        }
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const loadReports = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      const [
        totalsRes,
        expensesRes,
        incomeRes,
        trendsRes,
        topRes,
        comparisonRes,
        providerRes,
      ] = await Promise.all([
        reportsAPI.getTotals(accountId, { start, end }),
        reportsAPI.getExpensesByCategory(accountId, { start, end }),
        reportsAPI.getIncomeByCategory(accountId, { start, end }),
        reportsAPI.getMonthlyTrends(accountId, { months: 12 }),
        reportsAPI.getTopCategories(accountId, { start, end, limit: 5 }),
        reportsAPI.comparePeriods(accountId, {
          periodo1_inicio: start,
          periodo1_fin: end,
          periodo2_inicio: new Date(new Date(start).setMonth(new Date(start).getMonth() - 1)).toISOString().split('T')[0],
          periodo2_fin: new Date(new Date(end).setMonth(new Date(end).getMonth() - 1)).toISOString().split('T')[0],
        }),
        reportsAPI.getSpendingByProvider(accountId, { start, end, limit: 10 }),
      ]);

      const totalsData = totalsRes.data?.totals?.[0] || totalsRes.data;
      setTotals({
        ingresos: totalsData?.totalIngresos ?? totalsData?.ingresos ?? 0,
        gastos: totalsData?.totalGastos ?? totalsData?.gastos ?? 0,
        balance: totalsData?.saldo ?? totalsData?.balance ?? (totalsData?.totalIngresos ?? 0) - (totalsData?.totalGastos ?? 0),
        numMovimientos: totalsData?.numMovimientos ?? 0
      });

      setExpensesByCategory(expensesRes.data?.categories || expensesRes.data || []);
      setIncomeByCategory(incomeRes.data?.categories || incomeRes.data || []);

      const trendsData = trendsRes.data?.trends || trendsRes.data || [];
      setMonthlyTrends(trendsData.map(t => ({
        mes: t.periodo,
        ingresos: t.ingresos,
        gastos: t.gastos,
        num_movimientos: t.numMovimientos
      })));

      const topCatData = topRes.data?.ranking || topRes.data || [];
      const topCatType = topRes.data?.tipo || 'gasto';
      setTopCategories(topCatData.map(c => ({ ...c, tipo: topCatType })));

      const compData = comparisonRes.data;
      if (compData?.resumen) {
        setComparison({
          periodo1: compData.resumen.periodoA,
          periodo2: compData.resumen.periodoB,
          cambio_ingresos: compData.resumen.variacion?.ingresos,
          cambio_gastos: compData.resumen.variacion?.gastos,
          cambio_balance: compData.resumen.variacion?.saldo
        });
      } else {
        setComparison(null);
      }

      const providersData = providerRes.data?.providers || providerRes.data || [];
      setSpendingByProvider(providersData.map(p => ({
        proveedor: p.proveedor,
        total: p.total,
        cantidad: p.numMovimientos
      })));
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const currency = currentAccount?.moneda || 'USD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const categoryColors = [
    '#6366F1', '#EC4899', '#22C55E', '#F59E0B', '#3B82F6',
    '#8B5CF6', '#06B6D4', '#F97316', '#EF4444', '#84CC16',
  ];

  const expenseChartData = {
    labels: expensesByCategory.map(c => c.categoria),
    datasets: [{
      data: expensesByCategory.map(c => parseFloat(c.total)),
      backgroundColor: categoryColors,
      borderWidth: 0,
      cutout: '65%',
    }],
  };

  const incomeChartData = {
    labels: incomeByCategory.map(c => c.categoria),
    datasets: [{
      data: incomeByCategory.map(c => parseFloat(c.total)),
      backgroundColor: categoryColors,
      borderWidth: 0,
      cutout: '65%',
    }],
  };

  const trendsChartData = {
    labels: monthlyTrends.map(t => t.mes),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map(t => parseFloat(t.ingresos)),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22C55E',
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(t => parseFloat(t.gastos)),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#EF4444',
      },
    ],
  };

  const providerChartData = {
    labels: spendingByProvider.map(p => p.proveedor || 'Unknown'),
    datasets: [{
      label: 'Spending',
      data: spendingByProvider.map(p => parseFloat(p.total)),
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y',
    plugins: { ...chartOptions.plugins, legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="page-title">Reports</h1>
              <p className="page-subtitle">Financial analytics and insights</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="select"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {period === 'custom' && (
            <>
              <input
                type="date"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                className="input"
              />
              <input
                type="date"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                className="input"
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-body">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Net Balance</p>
              <p className={`text-2xl font-bold ${totals?.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totals?.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals?.ingresos)}</p>
              {comparison && (
                <p className={`text-xs mt-0.5 ${comparison.cambio_ingresos >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercent(comparison.cambio_ingresos)} vs last
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totals?.gastos)}</p>
              {comparison && (
                <p className={`text-xs mt-0.5 ${comparison.cambio_gastos <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatPercent(comparison.cambio_gastos)} vs last
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totals?.numMovimientos || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card card-body p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-body">
            <h3 className="card-title mb-6">Monthly Trends</h3>
            <div className="h-80">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card card-body">
            <h3 className="card-title mb-6">Top Expense Categories</h3>
            <div className="space-y-4">
              {topCategories.filter(c => c.tipo === 'gasto').slice(0, 5).map((cat, idx) => (
                <div key={cat.categoria} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[idx] }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-900">{cat.categoria}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(parseFloat(cat.total) / parseFloat(topCategories[0]?.total || 1)) * 100}%`,
                          backgroundColor: categoryColors[idx],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {topCategories.filter(c => c.tipo === 'gasto').length === 0 && (
                <div className="text-center py-8 text-gray-500">No expense data for this period</div>
              )}
            </div>
          </div>

          {comparison && (
            <div className="card card-body lg:col-span-2">
              <h3 className="card-title mb-6">Period Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Previous Period</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(comparison.periodo2?.ingresos - comparison.periodo2?.gastos)}
                  </p>
                  <div className="flex justify-center gap-4 mt-3 text-sm">
                    <span className="text-emerald-600">+{formatCurrency(comparison.periodo2?.ingresos)}</span>
                    <span className="text-red-600">-{formatCurrency(comparison.periodo2?.gastos)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${comparison.cambio_balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPercent(comparison.cambio_balance)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Change</p>
                  </div>
                </div>
                <div className="text-center p-6 bg-indigo-50 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Current Period</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(comparison.periodo1?.ingresos - comparison.periodo1?.gastos)}
                  </p>
                  <div className="flex justify-center gap-4 mt-3 text-sm">
                    <span className="text-emerald-600">+{formatCurrency(comparison.periodo1?.ingresos)}</span>
                    <span className="text-red-600">-{formatCurrency(comparison.periodo1?.gastos)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-body">
            <h3 className="card-title mb-6">Expenses by Category</h3>
            {expensesByCategory.length > 0 ? (
              <div className="h-80">
                <Doughnut data={expenseChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No expense data for this period
              </div>
            )}
          </div>

          <div className="card card-body">
            <h3 className="card-title mb-6">Income by Category</h3>
            {incomeByCategory.length > 0 ? (
              <div className="h-80">
                <Doughnut data={incomeChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No income data for this period
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <div className="card-header px-6 py-4 border-b border-gray-100">
              <h3 className="card-title mb-0">Category Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Transactions</th>
                    <th className="text-right">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expensesByCategory, ...incomeByCategory].map(cat => (
                    <tr key={`${cat.categoria}-${cat.tipo || 'expense'}`}>
                      <td className="font-medium">{cat.categoria}</td>
                      <td>
                        <span className={`badge ${incomeByCategory.includes(cat) ? 'badge-success' : 'badge-danger'}`}>
                          {incomeByCategory.includes(cat) ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className={`text-right font-semibold ${incomeByCategory.includes(cat) ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(cat.total)}
                      </td>
                      <td className="text-right text-gray-500">{cat.cantidad}</td>
                      <td className="text-right text-gray-500">
                        {formatCurrency(parseFloat(cat.total) / (cat.cantidad || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="card card-body">
            <h3 className="card-title mb-6">12-Month Income vs Expenses</h3>
            <div className="h-96">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <div className="card-header px-6 py-4 border-b border-gray-100">
              <h3 className="card-title mb-0">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Income</th>
                    <th className="text-right">Expenses</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.slice().reverse().map(month => (
                    <tr key={month.mes}>
                      <td className="font-medium">{month.mes}</td>
                      <td className="text-right text-emerald-600 font-medium">{formatCurrency(month.ingresos)}</td>
                      <td className="text-right text-red-600 font-medium">{formatCurrency(month.gastos)}</td>
                      <td className={`text-right font-semibold ${
                        parseFloat(month.ingresos) - parseFloat(month.gastos) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(parseFloat(month.ingresos) - parseFloat(month.gastos))}
                      </td>
                      <td className="text-right text-gray-500">{month.num_movimientos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-body">
            <h3 className="card-title mb-6">Top Providers/Vendors</h3>
            {spendingByProvider.length > 0 ? (
              <div className="h-96">
                <Bar data={providerChartData} options={barOptions} />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                No provider data for this period
              </div>
            )}
          </div>

          <div className="card card-body">
            <h3 className="card-title mb-6">Provider Details</h3>
            <div className="space-y-3">
              {spendingByProvider.map((provider, idx) => (
                <div key={provider.proveedor || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{provider.proveedor || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{provider.cantidad} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(provider.total)}</p>
                    <p className="text-sm text-gray-500">
                      Avg: {formatCurrency(parseFloat(provider.total) / (provider.cantidad || 1))}
                    </p>
                  </div>
                </div>
              ))}
              {spendingByProvider.length === 0 && (
                <div className="text-center py-8 text-gray-500">No provider data for this period</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
