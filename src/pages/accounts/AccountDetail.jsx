import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  CalendarDaysIcon,
  WalletIcon,
  BuildingStorefrontIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAccountsStore } from '../../store/useStore';
import { accountsAPI, reportsAPI } from '../../services/api';

const accountTypeIcons = {
  personal: WalletIcon,
  negocio: BuildingStorefrontIcon,
  ahorro: BanknotesIcon,
  compartida: UsersIcon,
};

const accountTypeColors = {
  personal: 'from-blue-500 to-blue-600',
  negocio: 'from-purple-500 to-purple-600',
  ahorro: 'from-emerald-500 to-emerald-600',
  compartida: 'from-amber-500 to-amber-600',
};

function AccountDetail() {
  const { accountId } = useParams();
  const { currentAccount, fetchAccountById, isLoading } = useAccountsStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchAccountById(accountId);
    reportsAPI.getDashboard(accountId).then(({ data }) => {
      setDashboardData(data);
    });
  }, [accountId, fetchAccountById]);

  const formatCurrency = (amount) => {
    const currency = currentAccount?.moneda || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const onInviteSubmit = async (data) => {
    try {
      await accountsAPI.inviteUser(accountId, data);
      toast.success('User invited successfully');
      setShowInviteModal(false);
      reset();
      fetchAccountById(accountId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to invite user');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this account?`)) {
      return;
    }

    try {
      await accountsAPI.removeMember(accountId, userId);
      toast.success('Member removed successfully');
      fetchAccountById(accountId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await accountsAPI.updateMemberRole(accountId, userId, { rol_en_cuenta: newRole });
      toast.success('Role updated successfully');
      fetchAccountById(accountId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  if (!currentAccount) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <WalletIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="empty-state-title">Account not found</h3>
          <p className="empty-state-description">
            The account you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to="/accounts" className="btn-primary">
            Back to Accounts
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentAccount.rol === 'propietario';
  const AccountIcon = accountTypeIcons[currentAccount.tipo] || WalletIcon;
  const accountColor = accountTypeColors[currentAccount.tipo] || 'from-indigo-500 to-indigo-600';

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${accountColor} p-6 sm:p-8 shadow-xl`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AccountIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{currentAccount.nombre}</h1>
              <p className="text-white/80 mt-1 flex items-center gap-2">
                <span className="capitalize">{currentAccount.tipo}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span>{currentAccount.moneda}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/accounts/${accountId}/movements`}
              className="btn bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 px-4 py-2.5"
            >
              <ArrowsRightLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Movements</span>
            </Link>
            <Link
              to={`/accounts/${accountId}/reports`}
              className="btn bg-white text-gray-900 hover:bg-gray-100 px-4 py-2.5 shadow-lg"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Reports</span>
            </Link>
          </div>
        </div>

        {/* Balance Overview in Header */}
        <div className="relative mt-8 grid grid-cols-3 gap-4 sm:gap-8">
          <div className="text-center sm:text-left">
            <p className="text-white/70 text-sm font-medium">Total Income</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatCurrency(currentAccount.balance?.totalIngresos || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm font-medium">Total Expenses</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatCurrency(currentAccount.balance?.totalGastos || 0)}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-white/70 text-sm font-medium">Current Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatCurrency(currentAccount.balance?.saldo || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {dashboardData && (
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="card-title mb-0">This Month</h2>
              <p className="card-subtitle">Current month overview</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">Income</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(dashboardData.mesActual.ingresos)}
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-700">Expenses</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboardData.mesActual.gastos)}
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${
              dashboardData.mesActual.balance >= 0
                ? 'bg-blue-50 border-blue-100'
                : 'bg-orange-50 border-orange-100'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BanknotesIcon className={`h-4 w-4 ${
                  dashboardData.mesActual.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
                <p className={`text-sm font-medium ${
                  dashboardData.mesActual.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>Balance</p>
              </div>
              <p className={`text-2xl font-bold ${
                dashboardData.mesActual.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(dashboardData.mesActual.balance)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <DocumentChartBarIcon className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {dashboardData.mesActual.numMovimientos}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Members */}
      <div className="card">
        <div className="card-header px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="card-title mb-0">Account Members</h2>
              <p className="card-subtitle">{currentAccount.miembros?.length || 0} members</p>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary"
            >
              <UserPlusIcon className="h-5 w-5" />
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {currentAccount.miembros?.map((member) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accountColor} flex items-center justify-center shadow-sm`}>
                  <span className="text-white font-semibold text-lg">
                    {member.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.nombre}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && member.rol !== 'propietario' ? (
                  <>
                    <select
                      value={member.rol}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="select text-sm py-2 w-36"
                    >
                      <option value="editor">Editor</option>
                      <option value="solo_lectura">Read Only</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.nombre)}
                      className="btn-icon-sm text-red-600 hover:bg-red-50"
                      title="Remove member"
                    >
                      <UserMinusIcon className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      member.rol === 'propietario'
                        ? 'bg-indigo-100 text-indigo-700'
                        : member.rol === 'editor'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.rol === 'propietario'
                      ? 'Owner'
                      : member.rol === 'editor'
                      ? 'Editor'
                      : 'Read Only'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to={`/accounts/${accountId}/movements`}
          className="card card-hover p-6 group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 group-hover:scale-110 transition-transform">
              <ArrowsRightLeftIcon className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Movements</h3>
            <p className="text-sm text-gray-500 mt-1">View all transactions</p>
          </div>
        </Link>

        <Link
          to={`/accounts/${accountId}/categories`}
          className="card card-hover p-6 group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4 group-hover:scale-110 transition-transform">
              <TagIcon className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Categories</h3>
            <p className="text-sm text-gray-500 mt-1">Manage categories</p>
          </div>
        </Link>

        <Link
          to={`/accounts/${accountId}/reports`}
          className="card card-hover p-6 group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 group-hover:scale-110 transition-transform">
              <ChartBarIcon className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Reports</h3>
            <p className="text-sm text-gray-500 mt-1">View analytics</p>
          </div>
        </Link>
      </div>

      {/* Invite Modal */}
      <Transition appear show={showInviteModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowInviteModal(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="modal-overlay" />
          </Transition.Child>

          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="modal-panel">
                  <div className="modal-header">
                    <Dialog.Title className="modal-title">
                      Invite Member
                    </Dialog.Title>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="btn-icon-sm hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onInviteSubmit)}>
                    <div className="modal-body space-y-5">
                      <div className="form-group">
                        <label htmlFor="email" className="label">
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          className={`input ${errors.email ? 'input-error' : ''}`}
                          placeholder="user@example.com"
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Invalid email address',
                            },
                          })}
                        />
                        {errors.email && (
                          <p className="error-text">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="rol" className="label">
                          Role
                        </label>
                        <select id="rol" className="select" {...register('rol_en_cuenta')}>
                          <option value="editor">Editor - Can create and edit</option>
                          <option value="solo_lectura">Read Only - Can only view</option>
                        </select>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner" />
                            Inviting...
                          </>
                        ) : (
                          'Send Invite'
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default AccountDetail;
