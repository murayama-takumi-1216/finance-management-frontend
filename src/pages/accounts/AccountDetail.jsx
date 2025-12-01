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
} from '@heroicons/react/24/outline';
import { useAccountsStore } from '../../store/useStore';
import { accountsAPI, reportsAPI } from '../../services/api';

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
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Account not found</p>
      </div>
    );
  }

  const isOwner = currentAccount.rol === 'propietario';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentAccount.nombre}</h1>
          <p className="text-gray-500 mt-1">
            {currentAccount.tipo} account ({currentAccount.moneda})
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/accounts/${accountId}/movements`}
            className="btn-secondary"
          >
            <DocumentChartBarIcon className="h-5 w-5 mr-2" />
            View Movements
          </Link>
          <Link
            to={`/accounts/${accountId}/reports`}
            className="btn-primary"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100">
            <BanknotesIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="stat-label">Total Balance</p>
            <p className="stat-value">
              {formatCurrency(currentAccount.balance?.saldo || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-50">
            <ArrowTrendingUpIcon className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <p className="stat-label">Total Income</p>
            <p className="stat-value text-success-600">
              {formatCurrency(currentAccount.balance?.totalIngresos || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-danger-50">
            <ArrowTrendingDownIcon className="h-6 w-6 text-danger-600" />
          </div>
          <div>
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value text-danger-600">
              {formatCurrency(currentAccount.balance?.totalGastos || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {dashboardData && (
        <div className="card">
          <h3 className="card-title mb-4">This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-xl font-bold text-success-600">
                {formatCurrency(dashboardData.mesActual.ingresos)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-danger-600">
                {formatCurrency(dashboardData.mesActual.gastos)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className={`text-xl font-bold ${
                dashboardData.mesActual.balance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(dashboardData.mesActual.balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {dashboardData.mesActual.numMovimientos}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Members */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Members</h3>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-secondary text-sm"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {currentAccount.miembros?.map((member) => (
            <div
              key={member.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {member.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.nombre}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && member.rol !== 'propietario' ? (
                  <>
                    <select
                      value={member.rol}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="input text-sm py-1 w-32"
                    >
                      <option value="editor">Editor</option>
                      <option value="solo_lectura">Read Only</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.nombre)}
                      className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <UserMinusIcon className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <span
                    className={`badge ${
                      member.rol === 'propietario'
                        ? 'badge-primary'
                        : member.rol === 'editor'
                        ? 'badge-success'
                        : 'badge-gray'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={`/accounts/${accountId}/movements`}
          className="card hover:shadow-md transition-shadow text-center py-8"
        >
          <DocumentChartBarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-gray-900">Movements</p>
          <p className="text-sm text-gray-500">View all transactions</p>
        </Link>
        <Link
          to={`/accounts/${accountId}/categories`}
          className="card hover:shadow-md transition-shadow text-center py-8"
        >
          <DocumentChartBarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-gray-900">Categories</p>
          <p className="text-sm text-gray-500">Manage categories</p>
        </Link>
        <Link
          to={`/accounts/${accountId}/reports`}
          className="card hover:shadow-md transition-shadow text-center py-8"
        >
          <ChartBarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-gray-900">Reports</p>
          <p className="text-sm text-gray-500">View analytics</p>
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Invite Member
                    </Dialog.Title>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                    <div>
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
                        <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="rol" className="label">
                        Role
                      </label>
                      <select id="rol" className="input" {...register('rol_en_cuenta')}>
                        <option value="editor">Editor - Can create and edit</option>
                        <option value="solo_lectura">Read Only - Can only view</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting ? 'Inviting...' : 'Send Invite'}
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
