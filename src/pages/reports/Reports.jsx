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

      // Handle wrapped responses from backend
      // getTotals returns { totals: [...], agrupacion }
      // But for simple date range queries, it may return direct totals
      const totalsData = totalsRes.data?.totals?.[0] || totalsRes.data;
      setTotals({
        ingresos: totalsData?.totalIngresos ?? totalsData?.ingresos ?? 0,
        gastos: totalsData?.totalGastos ?? totalsData?.gastos ?? 0,
        balance: totalsData?.saldo ?? totalsData?.balance ?? (totalsData?.totalIngresos ?? 0) - (totalsData?.totalGastos ?? 0),
        numMovimientos: totalsData?.numMovimientos ?? 0
      });

      // getExpensesByCategory returns { categories: [...], totalGastos, periodo }
      setExpensesByCategory(expensesRes.data?.categories || expensesRes.data || []);

      // getIncomeByCategory returns { categories: [...], totalIngresos, periodo }
      setIncomeByCategory(incomeRes.data?.categories || incomeRes.data || []);

      // getMonthlyTrends returns { trends: [...], promedios, numMeses }
      const trendsData = trendsRes.data?.trends || trendsRes.data || [];
      setMonthlyTrends(trendsData.map(t => ({
        mes: t.periodo,
        ingresos: t.ingresos,
        gastos: t.gastos,
        num_movimientos: t.numMovimientos
      })));

      // getTopCategories returns { ranking: [...], tipo, periodo }
      // Add tipo field from the API response type to each category
      const topCatData = topRes.data?.ranking || topRes.data || [];
      const topCatType = topRes.data?.tipo || 'gasto';
      setTopCategories(topCatData.map(c => ({
        ...c,
        tipo: topCatType
      })));

      // comparePeriods returns { comparison: [...], resumen: { periodoA, periodoB, variacion } }
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

      // getSpendingByProvider returns { providers: [...], periodo }
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const categoryColors = [
    '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
  ];

  const expenseChartData = {
    labels: expensesByCategory.map(c => c.categoria),
    datasets: [{
      data: expensesByCategory.map(c => parseFloat(c.total)),
      backgroundColor: categoryColors,
      borderWidth: 0,
    }],
  };

  const incomeChartData = {
    labels: incomeByCategory.map(c => c.categoria),
    datasets: [{
      data: incomeByCategory.map(c => parseFloat(c.total)),
      backgroundColor: categoryColors,
      borderWidth: 0,
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
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(t => parseFloat(t.gastos)),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const providerChartData = {
    labels: spendingByProvider.map(p => p.proveedor || 'Unknown'),
    datasets: [{
      label: 'Spending',
      data: spendingByProvider.map(p => parseFloat(p.total)),
      backgroundColor: '#3B82F6',
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y',
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Financial analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {period === 'custom' && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100">
            <BanknotesIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="stat-label">Net Balance</p>
            <p className={`stat-value ${totals?.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(totals?.balance)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-50">
            <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <p className="stat-label">Total Income</p>
            <p className="stat-value text-success-600">{formatCurrency(totals?.ingresos)}</p>
            {comparison && (
              <p className={`text-xs mt-1 ${comparison.cambio_ingresos >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatPercent(comparison.cambio_ingresos)} vs last period
              </p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-danger-50">
            <ArrowTrendingDownIcon className="h-6 w-6 text-danger-600" />
          </div>
          <div>
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value text-danger-600">{formatCurrency(totals?.gastos)}</p>
            {comparison && (
              <p className={`text-xs mt-1 ${comparison.cambio_gastos <= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatPercent(comparison.cambio_gastos)} vs last period
              </p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-primary-100">
            <CalendarDaysIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="stat-label">Transactions</p>
            <p className="stat-value">{totals?.numMovimientos || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {['overview', 'categories', 'trends', 'providers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="card-title mb-4">Monthly Trends</h3>
            <div className="h-80">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Top Expense Categories</h3>
            <div className="space-y-4">
              {topCategories.filter(c => c.tipo === 'gasto').slice(0, 5).map((cat, idx) => (
                <div key={cat.categoria} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[idx] }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.categoria}</span>
                      <span className="text-sm text-gray-500">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
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
                <p className="text-gray-500 text-center py-8">No expense data for this period</p>
              )}
            </div>
          </div>

          {/* Period Comparison */}
          {comparison && (
            <div className="card lg:col-span-2">
              <h3 className="card-title mb-4">Period Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Previous Period</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(comparison.periodo2?.ingresos - comparison.periodo2?.gastos)}
                  </p>
                  <div className="flex justify-center gap-4 mt-2 text-sm">
                    <span className="text-success-600">+{formatCurrency(comparison.periodo2?.ingresos)}</span>
                    <span className="text-danger-600">-{formatCurrency(comparison.periodo2?.gastos)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600">
                      {formatPercent(comparison.cambio_balance)}
                    </p>
                    <p className="text-sm text-gray-500">Change</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Current Period</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(comparison.periodo1?.ingresos - comparison.periodo1?.gastos)}
                  </p>
                  <div className="flex justify-center gap-4 mt-2 text-sm">
                    <span className="text-success-600">+{formatCurrency(comparison.periodo1?.ingresos)}</span>
                    <span className="text-danger-600">-{formatCurrency(comparison.periodo1?.gastos)}</span>
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
          <div className="card">
            <h3 className="card-title mb-4">Expenses by Category</h3>
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

          <div className="card">
            <h3 className="card-title mb-4">Income by Category</h3>
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
            <h3 className="card-title mb-4">Category Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Transactions</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expensesByCategory, ...incomeByCategory].map(cat => (
                    <tr key={`${cat.categoria}-${cat.tipo || 'expense'}`} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{cat.categoria}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${incomeByCategory.includes(cat) ? 'badge-success' : 'badge-danger'}`}>
                          {incomeByCategory.includes(cat) ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${incomeByCategory.includes(cat) ? 'text-success-600' : 'text-danger-600'}`}>
                        {formatCurrency(cat.total)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">{cat.cantidad}</td>
                      <td className="py-3 px-4 text-right text-gray-500">
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
          <div className="card">
            <h3 className="card-title mb-4">12-Month Income vs Expenses</h3>
            <div className="h-96">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Month</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Income</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Expenses</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Balance</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.slice().reverse().map(month => (
                    <tr key={month.mes} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{month.mes}</td>
                      <td className="py-3 px-4 text-right text-success-600">
                        {formatCurrency(month.ingresos)}
                      </td>
                      <td className="py-3 px-4 text-right text-danger-600">
                        {formatCurrency(month.gastos)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        parseFloat(month.ingresos) - parseFloat(month.gastos) >= 0
                          ? 'text-success-600'
                          : 'text-danger-600'
                      }`}>
                        {formatCurrency(parseFloat(month.ingresos) - parseFloat(month.gastos))}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {month.num_movimientos}
                      </td>
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
          <div className="card">
            <h3 className="card-title mb-4">Top Providers/Vendors</h3>
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

          <div className="card">
            <h3 className="card-title mb-4">Provider Details</h3>
            <div className="space-y-3">
              {spendingByProvider.map((provider, idx) => (
                <div key={provider.proveedor || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{provider.proveedor || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{provider.cantidad} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-danger-600">{formatCurrency(provider.total)}</p>
                    <p className="text-sm text-gray-500">
                      Avg: {formatCurrency(parseFloat(provider.total) / (provider.cantidad || 1))}
                    </p>
                  </div>
                </div>
              ))}
              {spendingByProvider.length === 0 && (
                <p className="text-gray-500 text-center py-8">No provider data for this period</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
