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
  TagIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  SparklesIcon,
  InboxIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAccountsStore, useTasksStore, useEventsStore, useAuthStore } from '../../store/useStore';
import { reportsAPI } from '../../services/api';

// Empty State Component
function EmptyState({ icon: Icon, title, description, action, actionLink }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 text-center mb-3">{description}</p>
      {action && actionLink && (
        <Link to={actionLink} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          {action} <ArrowRightIcon className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtext, subtextColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {subtext && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${subtextColor}`}>
            {subtext}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

// Account Card Component
function AccountCard({ account, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(account.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-primary-500' : 'bg-gray-100'
        }`}>
          <CreditCardIcon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
            {account.nombre}
          </p>
          <p className="text-xs text-gray-500">{account.tipo} • {account.moneda}</p>
        </div>
      </div>
    </button>
  );
}

function Dashboard() {
  const { user } = useAuthStore();
  const { accounts, fetchAccounts, isLoading: accountsLoading } = useAccountsStore();
  const { tasks, summary, fetchTasks, fetchSummary } = useTasksStore();
  const { upcomingEvents, fetchUpcomingEvents } = useEventsStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

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
        .then(({ data }) => {
          setDashboardData(data);
        })
        .catch(() => {
          setDashboardData(null);
        })
        .finally(() => {
          setIsLoadingDashboard(false);
        });
    }
  }, [selectedAccountId]);

  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate task stats
  const pendingTasks = tasks?.filter(t => t.estado === 'pendiente') || [];
  const inProgressTasks = tasks?.filter(t => t.estado === 'en_progreso') || [];
  const completedTasks = tasks?.filter(t => t.estado === 'completada') || [];
  const overdueTasks = tasks?.filter(t => {
    if (!t.fechaVencimiento || t.estado === 'completada') return false;
    return new Date(t.fechaVencimiento) < new Date();
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm">{getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-1">
              {user?.nombre?.split(' ')[0] || 'Welcome'}!
            </h1>
            <p className="text-primary-100 mt-2">
              {accounts.length > 0
                ? `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''} to manage`
                : 'Start by creating your first account'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/accounts" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
              <Squares2X2Icon className="h-5 w-5" />
              All Accounts
            </Link>
            <Link to="/accounts" state={{ openCreate: true }} className="bg-white text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              New Account
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        /* No Accounts Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Finance Manager!</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Get started by creating your first account. Track your income, expenses, and achieve your financial goals.
          </p>
          <Link to="/accounts" state={{ openCreate: true }} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Create Your First Account
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Track Income</h4>
              <p className="text-sm text-gray-500">Monitor all your income sources</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowTrendingDownIcon className="h-6 w-6 text-danger-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Manage Expenses</h4>
              <p className="text-sm text-gray-500">Categorize and control spending</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">View Reports</h4>
              <p className="text-sm text-gray-500">Get insights into your finances</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Account Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Accounts</h3>
              <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Manage
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
                  className="p-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <span className="text-sm text-gray-500">+{accounts.length - 4} more</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {isLoadingDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : dashboardData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={BanknotesIcon}
                iconBg="bg-primary-100"
                iconColor="text-primary-600"
                label="Total Balance"
                value={formatCurrency(dashboardData.saldoTotal)}
              />
              <StatCard
                icon={ArrowTrendingUpIcon}
                iconBg="bg-success-100"
                iconColor="text-success-600"
                label="Income This Month"
                value={formatCurrency(dashboardData.mesActual?.ingresos)}
                subtext={dashboardData.comparacionMesAnterior?.ingresos > 0
                  ? `+${dashboardData.comparacionMesAnterior.ingresos.toFixed(0)}%`
                  : dashboardData.comparacionMesAnterior?.ingresos < 0
                    ? `${dashboardData.comparacionMesAnterior.ingresos.toFixed(0)}%`
                    : null}
                subtextColor={dashboardData.comparacionMesAnterior?.ingresos >= 0
                  ? 'bg-success-100 text-success-700'
                  : 'bg-danger-100 text-danger-700'}
              />
              <StatCard
                icon={ArrowTrendingDownIcon}
                iconBg="bg-danger-100"
                iconColor="text-danger-600"
                label="Expenses This Month"
                value={formatCurrency(dashboardData.mesActual?.gastos)}
                subtext={dashboardData.comparacionMesAnterior?.gastos !== 0
                  ? `${dashboardData.comparacionMesAnterior.gastos > 0 ? '+' : ''}${dashboardData.comparacionMesAnterior.gastos.toFixed(0)}%`
                  : null}
                subtextColor={dashboardData.comparacionMesAnterior?.gastos <= 0
                  ? 'bg-success-100 text-success-700'
                  : 'bg-danger-100 text-danger-700'}
              />
              <StatCard
                icon={ClipboardDocumentListIcon}
                iconBg="bg-warning-100"
                iconColor="text-warning-600"
                label="Pending Review"
                value={dashboardData.pendientesRevision || 0}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BanknotesIcon} iconBg="bg-primary-100" iconColor="text-primary-600" label="Total Balance" value="$0.00" />
              <StatCard icon={ArrowTrendingUpIcon} iconBg="bg-success-100" iconColor="text-success-600" label="Income This Month" value="$0.00" />
              <StatCard icon={ArrowTrendingDownIcon} iconBg="bg-danger-100" iconColor="text-danger-600" label="Expenses This Month" value="$0.00" />
              <StatCard icon={ClipboardDocumentListIcon} iconBg="bg-warning-100" iconColor="text-warning-600" label="Pending Review" value="0" />
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Expense Categories */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Top Expense Categories</h3>
                {selectedAccountId && (
                  <Link
                    to={`/accounts/${selectedAccountId}/reports`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Reports
                  </Link>
                )}
              </div>

              {dashboardData?.topCategoriasGasto?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.topCategoriasGasto.map((cat, index) => {
                    const percentage = dashboardData.mesActual?.gastos > 0
                      ? (cat.total / dashboardData.mesActual.gastos) * 100
                      : 0;
                    const colors = [
                      'bg-primary-500',
                      'bg-success-500',
                      'bg-warning-500',
                      'bg-danger-500',
                      'bg-purple-500',
                    ];
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="text-sm font-medium text-gray-700">{cat.categoria}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.total)}</span>
                            <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={ChartBarIcon}
                  title="No expense data"
                  description="Add some expenses to see category breakdown"
                  action="Add Movement"
                  actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                />
              )}
            </div>

            {/* Tasks Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Tasks Overview</h3>
                <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View All
                </Link>
              </div>

              {(summary && (summary.pendientes > 0 || summary.enProgreso > 0 || summary.completadas > 0)) || tasks?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-warning-600" />
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="text-lg font-bold text-warning-600">{summary?.pendientes || pendingTasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ListBulletIcon className="h-5 w-5 text-primary-600" />
                      <span className="text-sm font-medium text-gray-700">In Progress</span>
                    </div>
                    <span className="text-lg font-bold text-primary-600">{summary?.enProgreso || inProgressTasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-success-600" />
                      <span className="text-sm font-medium text-gray-700">Completed</span>
                    </div>
                    <span className="text-lg font-bold text-success-600">{summary?.completadas || completedTasks.length}</span>
                  </div>
                  {(summary?.vencidas > 0 || overdueTasks.length > 0) && (
                    <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
                        <span className="text-sm font-medium text-gray-700">Overdue</span>
                      </div>
                      <span className="text-lg font-bold text-danger-600">{summary?.vencidas || overdueTasks.length}</span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardDocumentListIcon}
                  title="No tasks yet"
                  description="Create tasks to track your financial to-dos"
                  action="Create Task"
                  actionLink="/tasks"
                />
              )}
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Movements */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Recent Movements</h3>
                {selectedAccountId && (
                  <Link
                    to={`/accounts/${selectedAccountId}/movements`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All
                  </Link>
                )}
              </div>

              {dashboardData?.movimientosRecientes?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.movimientosRecientes.map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          mov.tipo === 'ingreso' ? 'bg-success-100' : 'bg-danger-100'
                        }`}>
                          {mov.tipo === 'ingreso'
                            ? <ArrowTrendingUpIcon className="h-5 w-5 text-success-600" />
                            : <ArrowTrendingDownIcon className="h-5 w-5 text-danger-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {mov.categoria || mov.proveedor || 'Movement'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(mov.fechaOperacion)}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        mov.tipo === 'ingreso' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.importe)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={DocumentTextIcon}
                  title="No movements yet"
                  description="Record your first income or expense"
                  action="Add Movement"
                  actionLink={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                />
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View Calendar
                </Link>
              </div>

              {upcomingEvents?.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.titulo}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(event.fechaHoraInicio || event.fecha)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        event.tipo === 'pago_recurrente'
                          ? 'bg-warning-100 text-warning-700'
                          : event.tipo === 'pago_unico'
                          ? 'bg-primary-100 text-primary-700'
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
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-success-50 hover:bg-success-100 transition-colors"
              >
                <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
                <span className="text-sm font-medium text-success-700">Add Income</span>
              </Link>
              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/movements` : '/accounts'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-danger-50 hover:bg-danger-100 transition-colors"
              >
                <ArrowTrendingDownIcon className="h-6 w-6 text-danger-600" />
                <span className="text-sm font-medium text-danger-700">Add Expense</span>
              </Link>
              <Link
                to="/tasks"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warning-50 hover:bg-warning-100 transition-colors"
              >
                <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
                <span className="text-sm font-medium text-warning-700">New Task</span>
              </Link>
              <Link
                to="/calendar"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <CalendarIcon className="h-6 w-6 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Schedule Event</span>
              </Link>
              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/categories` : '/accounts'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <FolderIcon className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Categories</span>
              </Link>
              <Link
                to={selectedAccountId ? `/accounts/${selectedAccountId}/reports` : '/accounts'}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">View Reports</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
