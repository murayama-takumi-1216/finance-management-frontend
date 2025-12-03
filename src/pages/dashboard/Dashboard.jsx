import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  PlusIcon,
  ChartBarIcon,
  FolderIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  SparklesIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  ChartPieIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  WalletIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { useAccountsStore, useTasksStore, useEventsStore, useAuthStore } from '../../store/useStore';
import { reportsAPI } from '../../services/api';
import {
  IncomeExpensesBarChart,
  MonthlyTrendsChart,
  ExpensesByCategoryChart,
  IncomeByCategoryChart,
  TopCategoriesChart,
  TasksStatusChart,
  SpendingByProviderChart,
  COLORS,
} from '../../components/charts';

// Modern Stat Card Component
function StatCard({ icon: Icon, label, value, change, changeType, gradient, iconBg }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} group hover:shadow-lg transition-all duration-300`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" />
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== null && change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${
              changeType === 'positive'
                ? 'bg-white/20 text-white'
                : changeType === 'negative'
                ? 'bg-white/20 text-white'
                : 'bg-white/20 text-white'
            }`}>
              {changeType === 'positive' && <ArrowTrendingUpIcon className="h-4 w-4" />}
              {changeType === 'negative' && <ArrowTrendingDownIcon className="h-4 w-4" />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
        <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// Modern Account Card Component
function AccountCard({ account, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(account.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          isSelected ? 'bg-indigo-500' : 'bg-gray-100'
        }`}>
          <WalletIcon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
            {account.nombre}
          </p>
          <p className="text-xs text-gray-500 capitalize">{account.tipo} • {account.moneda}</p>
        </div>
        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
        )}
      </div>
    </button>
  );
}

// Modern Chart Card Component
function ChartCard({ title, subtitle, children, action, actionLink, loading, className = '', headerRight }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      <div className="flex items-center justify-between p-5 pb-0">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {action && actionLink && (
            <Link
              to={actionLink}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {action}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, action, actionLink }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 text-center mb-4 max-w-[200px]">{description}</p>
      {action && actionLink && (
        <Link
          to={actionLink}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {action} <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// Helper to fill in missing months with zero values
function fillMissingMonths(trends, numMonths = 12) {
  if (!trends || !Array.isArray(trends)) return [];

  const dataMap = new Map(trends.map(t => [t.periodo, t]));
  const filledData = [];
  const now = new Date();

  for (let i = numMonths - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodo = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const existing = dataMap.get(periodo);
    if (existing) {
      filledData.push(existing);
    } else {
      filledData.push({
        periodo,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        ingresos: 0,
        gastos: 0,
        balance: 0,
        numMovimientos: 0
      });
    }
  }

  return filledData;
}

function Dashboard() {
  const { user } = useAuthStore();
  const { accounts, fetchAccounts, isLoading: accountsLoading } = useAccountsStore();
  const { tasks, summary, fetchTasks, fetchSummary } = useTasksStore();
  const { upcomingEvents, fetchUpcomingEvents } = useEventsStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Chart data states
  const [monthlyTrendsData, setMonthlyTrendsData] = useState(null);
  const [incomeVsExpensesData, setIncomeVsExpensesData] = useState(null);
  const [expensesByCategoryData, setExpensesByCategoryData] = useState(null);
  const [incomeByCategoryData, setIncomeByCategoryData] = useState(null);
  const [topCategoriesData, setTopCategoriesData] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchSummary().catch(() => {});
    fetchUpcomingEvents(5).catch(() => {});
    fetchTasks({}).catch(() => {});
  }, [fetchAccounts, fetchSummary, fetchUpcomingEvents, fetchTasks]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId) {
      setIsLoadingDashboard(true);
      reportsAPI.getDashboard(selectedAccountId)
        .then(({ data }) => setDashboardData(data))
        .catch(() => setDashboardData(null))
        .finally(() => setIsLoadingDashboard(false));

      setIsLoadingCharts(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const dateParams = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      };

      Promise.all([
        reportsAPI.getMonthlyTrends(selectedAccountId, { months: 12 }).catch(() => ({ data: null })),
        reportsAPI.getIncomeVsExpenses(selectedAccountId, { agrupacion: 'mes', ...dateParams }).catch(() => ({ data: null })),
        reportsAPI.getExpensesByCategory(selectedAccountId, dateParams).catch(() => ({ data: null })),
        reportsAPI.getIncomeByCategory(selectedAccountId, dateParams).catch(() => ({ data: null })),
        reportsAPI.getTopCategories(selectedAccountId, { tipo: 'gasto', limit: 5, ...dateParams }).catch(() => ({ data: null })),
        reportsAPI.getSpendingByProvider(selectedAccountId, { limit: 5, ...dateParams }).catch(() => ({ data: null })),
      ]).then(([trends, incomeVsExpenses, expensesByCategory, incomeByCategory, topCategories, providers]) => {
        // Fill missing months for monthly trends chart
        if (trends.data?.trends) {
          const filledTrends = fillMissingMonths(trends.data.trends, 12);
          setMonthlyTrendsData({ ...trends.data, trends: filledTrends });
        } else {
          setMonthlyTrendsData(trends.data);
        }
        setIncomeVsExpensesData(incomeVsExpenses.data);
        setExpensesByCategoryData(expensesByCategory.data);
        setIncomeByCategoryData(incomeByCategory.data);
        setTopCategoriesData(topCategories.data);
        setProviderData(providers.data);
      }).finally(() => setIsLoadingCharts(false));
    }
  }, [selectedAccountId]);

  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Calculate task stats
  const pendingTasks = tasks?.filter(t => t.estado === 'pendiente') || [];
  const inProgressTasks = tasks?.filter(t => t.estado === 'en_progreso') || [];
  const completedTasks = tasks?.filter(t => t.estado === 'completada') || [];
  const overdueTasks = tasks?.filter(t => {
    if (!t.fechaVencimiento || t.estado === 'completada') return false;
    return new Date(t.fechaVencimiento) < new Date();
  }) || [];

  const taskSummaryData = {
    pendientes: summary?.pendientes || pendingTasks.length,
    enProgreso: summary?.enProgreso || inProgressTasks.length,
    completadas: summary?.completadas || completedTasks.length,
    vencidas: summary?.vencidas || overdueTasks.length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/5" />
          <div className="absolute right-1/4 top-1/2 w-40 h-40 rounded-full bg-white/5" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-indigo-200 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-3xl font-bold text-white mt-1">
              {user?.nombre?.split(' ')[0] || 'Bienvenido'}!
            </h1>
            <p className="text-indigo-200 mt-2 max-w-md">
              {accounts.length > 0
                ? `Tienes ${accounts.length} cuenta${accounts.length > 1 ? 's' : ''} para administrar. Aquí está tu resumen financiero.`
                : 'Comienza creando tu primera cuenta para rastrear tus finanzas.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors backdrop-blur-sm border border-white/10"
            >
              <Squares2X2Icon className="h-5 w-5" />
              Todas las Cuentas
            </Link>
            <Link
              to="/accounts"
              state={{ openCreate: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-medium text-sm transition-colors shadow-lg shadow-indigo-900/20"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        /* No Accounts Empty State */
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <SparklesIcon className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Bienvenido a Finance Manager!</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Comienza creando tu primera cuenta. Rastrea tus ingresos, gastos y alcanza tus metas financieras.
          </p>
          <Link
            to="/accounts"
            state={{ openCreate: true }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-200"
          >
            <PlusIcon className="h-5 w-5" />
            Crear Tu Primera Cuenta
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-10 border-t border-gray-100">
            {[
              { icon: ArrowTrendingUpIcon, color: 'emerald', title: 'Rastrea Ingresos', desc: 'Monitorea todas tus fuentes de ingreso' },
              { icon: ArrowTrendingDownIcon, color: 'rose', title: 'Administra Gastos', desc: 'Categoriza y controla tus gastos' },
              { icon: ChartBarIcon, color: 'indigo', title: 'Ver Reportes', desc: 'Obtén información sobre tus finanzas' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className={`w-14 h-14 bg-${item.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-7 w-7 text-${item.color}-600`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Account Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Tus Cuentas</h3>
                <p className="text-xs text-gray-500 mt-0.5">Selecciona una cuenta para ver detalles</p>
              </div>
              <Link to="/accounts" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                Administrar <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {accounts.slice(0, 4).map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isSelected={selectedAccountId === account.id}
                  onSelect={setSelectedAccountId}
                />
              ))}
              {accounts.length > 4 && (
                <Link
                  to="/accounts"
                  className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-500 font-medium">+{accounts.length - 4} cuentas más</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {isLoadingDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl p-6 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="w-12 h-12 bg-gray-300 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : dashboardData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={BanknotesIcon}
                label="Saldo Total"
                value={formatCurrency(dashboardData.saldoTotal)}
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                iconBg="bg-indigo-400"
              />
              <StatCard
                icon={ArrowTrendingUpIcon}
                label="Ingresos del Mes"
                value={formatCurrency(dashboardData.mesActual?.ingresos)}
                change={dashboardData.comparacionMesAnterior?.ingresos !== 0 ? Math.round(dashboardData.comparacionMesAnterior?.ingresos) : null}
                changeType={dashboardData.comparacionMesAnterior?.ingresos >= 0 ? 'positive' : 'negative'}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                iconBg="bg-emerald-400"
              />
              <StatCard
                icon={ArrowTrendingDownIcon}
                label="Gastos del Mes"
                value={formatCurrency(dashboardData.mesActual?.gastos)}
                change={dashboardData.comparacionMesAnterior?.gastos !== 0 ? Math.round(dashboardData.comparacionMesAnterior?.gastos) : null}
                changeType={dashboardData.comparacionMesAnterior?.gastos <= 0 ? 'positive' : 'negative'}
                gradient="bg-gradient-to-br from-rose-500 to-rose-600 text-white"
                iconBg="bg-rose-400"
              />
              <StatCard
                icon={ScaleIcon}
                label="Balance Mensual"
                value={formatCurrency(dashboardData.mesActual?.balance)}
                gradient="bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                iconBg="bg-violet-400"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BanknotesIcon} label="Saldo Total" value="$0.00" gradient="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white" iconBg="bg-indigo-400" />
              <StatCard icon={ArrowTrendingUpIcon} label="Ingresos del Mes" value="$0.00" gradient="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" iconBg="bg-emerald-400" />
              <StatCard icon={ArrowTrendingDownIcon} label="Gastos del Mes" value="$0.00" gradient="bg-gradient-to-br from-rose-500 to-rose-600 text-white" iconBg="bg-rose-400" />
              <StatCard icon={ScaleIcon} label="Balance Mensual" value="$0.00" gradient="bg-gradient-to-br from-violet-500 to-violet-600 text-white" iconBg="bg-violet-400" />
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Tendencias Mensuales"
              subtitle="Ingresos, gastos y balance en el tiempo"
              action="Ver Reportes"
              actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/reports` : '/accounts'}
              loading={isLoadingCharts}
            >
              <MonthlyTrendsChart data={monthlyTrendsData} height={300} />
            </ChartCard>

            <ChartCard
              title="Ingresos vs Gastos"
              subtitle="Comparación últimos 6 meses"
              action="Detalles"
              actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/reports` : '/accounts'}
              loading={isLoadingCharts}
            >
              <IncomeExpensesBarChart data={incomeVsExpensesData} height={300} />
            </ChartCard>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title="Desglose de Gastos"
              subtitle="Por categoría"
              action="Categorías"
              actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/categories` : '/accounts'}
              loading={isLoadingCharts}
            >
              <ExpensesByCategoryChart data={expensesByCategoryData} height={280} />
            </ChartCard>

            <ChartCard
              title="Fuentes de Ingresos"
              subtitle="Por categoría"
              loading={isLoadingCharts}
            >
              <IncomeByCategoryChart data={incomeByCategoryData} height={280} />
            </ChartCard>

            <ChartCard
              title="Resumen de Tareas"
              subtitle="Estado actual"
              action="Ver Todo"
              actionLink="/tasks"
            >
              {(taskSummaryData.pendientes > 0 || taskSummaryData.enProgreso > 0 || taskSummaryData.completadas > 0) ? (
                <div className="h-[280px] flex flex-col">
                  <div className="flex-1">
                    <TasksStatusChart data={taskSummaryData} height={200} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">
                        {taskSummaryData.pendientes + taskSummaryData.enProgreso}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Tareas Activas</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                      <p className="text-2xl font-bold text-emerald-600">
                        {taskSummaryData.completadas}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Completadas</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardDocumentListIcon}
                  title="Sin tareas aún"
                  description="Crea tareas para rastrear tus pendientes financieros"
                  action="Crear Tarea"
                  actionLink="/tasks"
                />
              )}
            </ChartCard>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Categorías de Gasto Principales"
              subtitle="A dónde va tu dinero"
              action="Administrar"
              actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/categories` : '/accounts'}
              loading={isLoadingCharts}
            >
              <TopCategoriesChart data={topCategoriesData} type="gasto" height={260} />
            </ChartCard>

            <ChartCard
              title="Proveedores Principales"
              subtitle="Vendedores más frecuentes"
              loading={isLoadingCharts}
            >
              <SpendingByProviderChart data={providerData} height={260} />
            </ChartCard>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Movements */}
            <ChartCard
              title="Recent Transactions"
              subtitle="Latest activity"
              action="View All"
              actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
            >
              {dashboardData?.movimientosRecientes?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.movimientosRecientes.map((mov) => (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          mov.tipo === 'ingreso'
                            ? 'bg-emerald-100 group-hover:bg-emerald-200'
                            : 'bg-rose-100 group-hover:bg-rose-200'
                        } transition-colors`}>
                          {mov.tipo === 'ingreso'
                            ? <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                            : <ArrowTrendingDownIcon className="h-5 w-5 text-rose-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {mov.categoria || mov.proveedor || 'Transaction'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(mov.fechaOperacion)}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.importe)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={DocumentTextIcon}
                  title="No transactions yet"
                  description="Record your first income or expense"
                  action="Add Transaction"
                  actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                />
              )}
            </ChartCard>

            {/* Upcoming Events */}
            <ChartCard
              title="Upcoming Events"
              subtitle="Scheduled payments & reminders"
              action="Calendar"
              actionLink="/calendar"
            >
              {upcomingEvents?.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-11 h-11 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                        <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{event.titulo}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(event.fechaHoraInicio || event.fecha)}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        event.tipo === 'pago_recurrente'
                          ? 'bg-amber-100 text-amber-700'
                          : event.tipo === 'pago_unico'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {event.tipo?.replace('_', ' ') || 'Event'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No upcoming events"
                  description="Schedule payments and reminders"
                  action="Add Event"
                  actionLink="/calendar"
                />
              )}
            </ChartCard>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-xs text-gray-500">Common tasks you can perform</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">Add Income</span>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform duration-300">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-rose-700">Add Expense</span>
                <div className="absolute inset-0 bg-gradient-to-t from-rose-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to="/tasks"
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-700">New Task</span>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to="/calendar"
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-indigo-700">Schedule</span>
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/categories` : '/accounts'}
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform duration-300">
                  <FolderIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-violet-700">Categories</span>
                <div className="absolute inset-0 bg-gradient-to-t from-violet-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/reports` : '/accounts'}
                className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-100 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-100 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:scale-110 transition-transform duration-300">
                  <ChartPieIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-cyan-700">Reports</span>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
