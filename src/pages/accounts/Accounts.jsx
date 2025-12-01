import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  CreditCardIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAccountsStore } from '../../store/useStore';
import { Menu } from '@headlessui/react';

const accountTypes = [
  { value: 'personal', label: 'Personal' },
  { value: 'negocio', label: 'Business' },
  { value: 'ahorro', label: 'Savings' },
  { value: 'compartida', label: 'Shared' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'ARS', label: 'ARS - Argentine Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'COP', label: 'COP - Colombian Peso' },
];

function Accounts() {
  const location = useLocation();
  const { accounts, fetchAccounts, createAccount, updateAccount, deleteAccount, isLoading } =
    useAccountsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const openCreateModal = () => {
    setEditingAccount(null);
    reset({ nombre: '', tipo: 'personal', moneda: 'USD' });
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setValue('nombre', account.nombre);
    setValue('tipo', account.tipo);
    setValue('moneda', account.moneda);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        toast.success('Account updated successfully');
      } else {
        await createAccount(data);
        toast.success('Account created successfully');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (accountId) => {
    try {
      await deleteAccount(accountId);
      toast.success('Account archived successfully');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to archive account');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getAccountTypeLabel = (type) => {
    return accountTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your financial accounts</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Account
        </button>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="card hover:shadow-md transition-shadow group relative"
            >
              {/* Actions Menu */}
              <Menu as="div" className="absolute top-4 right-4">
                <Menu.Button className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="p-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openEditModal(account)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700`}
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setDeleteConfirm(account)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full items-center rounded-md px-3 py-2 text-sm text-danger-600`}
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Archive
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              <Link to={`/accounts/${account.id}`} className="block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <CreditCardIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{account.nombre}</h3>
                    <p className="text-sm text-gray-500">{getAccountTypeLabel(account.tipo)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Balance</p>
                    <p className="text-lg font-bold text-gray-900">
                      {account.balance
                        ? formatCurrency(account.balance.saldo, account.moneda)
                        : formatCurrency(0, account.moneda)}
                    </p>
                  </div>
                  <span className="badge-primary">{account.rol}</span>
                </div>

                {account.estado === 'archivada' && (
                  <span className="mt-3 inline-block badge-gray">Archived</span>
                )}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first account to start tracking your finances.
          </p>
          <button onClick={openCreateModal} className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Account
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
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
                      {editingAccount ? 'Edit Account' : 'Create Account'}
                    </Dialog.Title>
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="nombre" className="label">
                        Account Name
                      </label>
                      <input
                        id="nombre"
                        type="text"
                        className={`input ${errors.nombre ? 'input-error' : ''}`}
                        placeholder="e.g., Personal Checking"
                        {...register('nombre', { required: 'Account name is required' })}
                      />
                      {errors.nombre && (
                        <p className="mt-1 text-sm text-danger-600">{errors.nombre.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="tipo" className="label">
                        Account Type
                      </label>
                      <select
                        id="tipo"
                        className="input"
                        {...register('tipo', { required: 'Account type is required' })}
                      >
                        {accountTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="moneda" className="label">
                        Currency
                      </label>
                      <select
                        id="moneda"
                        className="input"
                        {...register('moneda')}
                        disabled={!!editingAccount}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                      {editingAccount && (
                        <p className="mt-1 text-xs text-gray-500">
                          Currency cannot be changed after account creation
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting
                          ? 'Saving...'
                          : editingAccount
                          ? 'Update'
                          : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={!!deleteConfirm} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteConfirm(null)}
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
                  <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                    Archive Account
                  </Dialog.Title>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to archive "{deleteConfirm?.nombre}"? You can still view
                    it but won't be able to add new transactions.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm.id)}
                      className="btn-danger flex-1"
                    >
                      Archive
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default Accounts;
