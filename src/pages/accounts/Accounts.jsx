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
  BanknotesIcon,
  BuildingStorefrontIcon,
  WalletIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAccountsStore } from '../../store/useStore';
import { Menu } from '@headlessui/react';

const accountTypes = [
  { value: 'personal', label: 'Personal', icon: WalletIcon, color: 'from-blue-500 to-blue-600' },
  { value: 'negocio', label: 'Negocio', icon: BuildingStorefrontIcon, color: 'from-purple-500 to-purple-600' },
  { value: 'ahorro', label: 'Ahorro', icon: BanknotesIcon, color: 'from-emerald-500 to-emerald-600' },
  { value: 'compartida', label: 'Compartida', icon: UsersIcon, color: 'from-amber-500 to-amber-600' },
];

const currencies = [
  { value: 'USD', label: 'USD - Dólar Estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Libra Esterlina' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
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
        const currencyChanging = data.moneda !== editingAccount.moneda;

        if (currencyChanging) {
          const confirmed = window.confirm(
            `Estás cambiando la moneda de ${editingAccount.moneda} a ${data.moneda}.\n\n` +
            `Todos los montos de las transacciones se convertirán automáticamente a la nueva moneda.\n\n` +
            `¿Deseas continuar?`
          );

          if (!confirmed) {
            return;
          }
        }

        const response = await updateAccount(editingAccount.id, data);

        if (response?.currencyConverted) {
          toast.success(`Cuenta actualizada y montos convertidos a ${data.moneda}`);
        } else {
          toast.success('Cuenta actualizada exitosamente');
        }
      } else {
        await createAccount(data);
        toast.success('Cuenta creada exitosamente');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operación fallida');
    }
  };

  const handleDelete = async (accountId) => {
    try {
      await deleteAccount(accountId);
      toast.success('Cuenta archivada exitosamente');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al archivar cuenta');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getAccountType = (type) => {
    return accountTypes.find((t) => t.value === type) || accountTypes[0];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Cuentas</h1>
          <p className="page-subtitle">Administra tus cuentas financieras</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Nueva Cuenta
        </button>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card card-body">
              <div className="flex items-center gap-4 mb-6">
                <div className="skeleton w-14 h-14 rounded-2xl" />
                <div className="flex-1">
                  <div className="skeleton h-5 w-3/4 mb-2" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
              <div className="skeleton h-8 w-1/2" />
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const accountType = getAccountType(account.tipo);
            const IconComponent = accountType.icon;

            return (
              <div
                key={account.id}
                className="card card-hover group relative"
              >
                {/* Gradient decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accountType.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

                {/* Actions Menu */}
                <Menu as="div" className="absolute top-4 right-4 z-20">
                  <Menu.Button className="btn-icon-sm bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
                    <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
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
                    <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none py-2 z-50">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openEditModal(account)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 ${active ? 'bg-gray-50' : ''}`}
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400" />
                            Editar
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setDeleteConfirm(account)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 ${active ? 'bg-red-50' : ''}`}
                          >
                            <TrashIcon className="h-4 w-4" />
                            Archivar
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>

                <Link to={`/accounts/${account.id}`} className="block p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accountType.color} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-lg">{account.nombre}</h3>
                      <p className="text-sm text-gray-500">{accountType.label}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Saldo</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {account.balance
                          ? formatCurrency(account.balance.saldo, account.moneda)
                          : formatCurrency(0, account.moneda)}
                      </p>
                    </div>
                    <span className="badge-primary">{account.rol}</span>
                  </div>

                  {account.estado === 'archivada' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="badge-gray">Archivada</span>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <CreditCardIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="empty-state-title">Sin cuentas aún</h3>
            <p className="empty-state-description">
              Crea tu primera cuenta para comenzar a rastrear tus finanzas y administrar tu dinero efectivamente.
            </p>
            <button onClick={openCreateModal} className="btn-primary">
              <PlusIcon className="h-5 w-5" />
              Crear Cuenta
            </button>
          </div>
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
                      {editingAccount ? 'Editar Cuenta' : 'Crear Cuenta'}
                    </Dialog.Title>
                    <button
                      onClick={closeModal}
                      className="btn-icon-sm hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="modal-body space-y-5">
                      <div className="form-group">
                        <label htmlFor="nombre" className="label">
                          Nombre de la Cuenta
                        </label>
                        <input
                          id="nombre"
                          type="text"
                          className={`input ${errors.nombre ? 'input-error' : ''}`}
                          placeholder="ej., Cuenta Personal"
                          {...register('nombre', { required: 'El nombre de la cuenta es requerido' })}
                        />
                        {errors.nombre && (
                          <p className="error-text">{errors.nombre.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="tipo" className="label">
                          Tipo de Cuenta
                        </label>
                        <select
                          id="tipo"
                          className="select"
                          {...register('tipo', { required: 'El tipo de cuenta es requerido' })}
                        >
                          {accountTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="moneda" className="label">
                          Moneda
                        </label>
                        <select
                          id="moneda"
                          className="select"
                          {...register('moneda')}
                        >
                          {currencies.map((currency) => (
                            <option key={currency.value} value={currency.value}>
                              {currency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner" />
                            Guardando...
                          </>
                        ) : editingAccount ? (
                          'Actualizar'
                        ) : (
                          'Crear'
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
                <Dialog.Panel className="modal-panel max-w-sm">
                  <div className="modal-body text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <TrashIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                      Archivar Cuenta
                    </Dialog.Title>
                    <p className="text-gray-600">
                      ¿Estás seguro de que deseas archivar <strong>"{deleteConfirm?.nombre}"</strong>? Podrás seguir viéndola pero no podrás agregar nuevas transacciones.
                    </p>
                  </div>
                  <div className="modal-footer justify-center">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm.id)}
                      className="btn-danger"
                    >
                      Archivar
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
