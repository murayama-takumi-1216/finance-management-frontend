import { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { movementsAPI, categoriesAPI } from '../../services/api';
import { useAccountsStore, useCategoriesStore, useTagsStore } from '../../store/useStore';

function Movements() {
  const { accountId } = useParams();
  const { currentAccount } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { tags, fetchTags } = useTagsStore();

  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    categoria: '',
    fecha_desde: null,
    fecha_hasta: null,
    search: '',
    page: 1,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchTipo = watch('tipo');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchCategories(accountId);
    fetchTags(accountId);
  }, [accountId, fetchCategories, fetchTags]);

  useEffect(() => {
    loadMovements();
  }, [accountId, filters.page, filters.tipo, filters.estado, filters.categoria]);

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 20,
        ...(filters.tipo && { tipo: filters.tipo }),
        ...(filters.estado && { estado: filters.estado }),
        ...(filters.categoria && { categoria: filters.categoria }),
        ...(filters.fecha_desde && { fecha_desde: formatDateForAPI(filters.fecha_desde) }),
        ...(filters.fecha_hasta && { fecha_hasta: formatDateForAPI(filters.fecha_hasta) }),
        ...(filters.search && { search: filters.search }),
      };

      const { data } = await movementsAPI.getAll(accountId, params);
      setMovements(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load movements');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    return date?.toISOString().split('T')[0];
  };

  const formatCurrency = (amount) => {
    const currency = currentAccount?.moneda || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openCreateModal = () => {
    setEditingMovement(null);
    setSelectedDate(new Date());
    setSelectedTags([]);
    reset({
      tipo: 'gasto',
      fecha_operacion: new Date(),
      importe: '',
      id_categoria: '',
      proveedor: '',
      descripcion: '',
      notas: '',
    });
    setShowModal(true);
  };

  const openEditModal = async (movementId) => {
    try {
      const { data } = await movementsAPI.getById(accountId, movementId);
      setEditingMovement(data);
      setSelectedDate(new Date(data.fechaOperacion));
      setSelectedTags(data.etiquetas?.map((t) => t.id) || []);
      setValue('tipo', data.tipo);
      setValue('importe', data.importe);
      setValue('id_categoria', data.categoria.id);
      setValue('proveedor', data.proveedor || '');
      setValue('descripcion', data.descripcion || '');
      setValue('notas', data.notas || '');
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load movement');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovement(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        fecha_operacion: formatDateForAPI(selectedDate),
        etiquetas: selectedTags,
      };

      if (editingMovement) {
        await movementsAPI.update(accountId, editingMovement.id, payload);
        toast.success('Movement updated successfully');
      } else {
        await movementsAPI.create(accountId, payload);
        toast.success('Movement created successfully');
      }

      closeModal();
      loadMovements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (movementId) => {
    try {
      await movementsAPI.delete(accountId, movementId);
      toast.success('Movement deleted successfully');
      setDeleteConfirm(null);
      loadMovements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete movement');
    }
  };

  const handleConfirm = async (movementId) => {
    try {
      await movementsAPI.confirm(accountId, movementId);
      toast.success('Movement confirmed');
      loadMovements();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to confirm movement');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadMovements();
  };

  const resetFilters = () => {
    setFilters({
      tipo: '',
      estado: '',
      categoria: '',
      fecha_desde: null,
      fecha_hasta: null,
      search: '',
      page: 1,
    });
  };

  const filteredCategories = categories.filter(
    (c) => !watchTipo || c.tipo === watchTipo || c.tipo === 'ambos'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movements</h1>
          <p className="text-gray-500 mt-1">Track your income and expenses</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Movement
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, provider..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </form>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              >
                <option value="">All</option>
                <option value="ingreso">Income</option>
                <option value="gasto">Expense</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              >
                <option value="">All</option>
                <option value="confirmado">Confirmed</option>
                <option value="pendiente_revision">Pending</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={filters.categoria}
                onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From Date</label>
              <DatePicker
                selected={filters.fecha_desde}
                onChange={(date) => setFilters({ ...filters, fecha_desde: date })}
                className="input"
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <DatePicker
                selected={filters.fecha_hasta}
                onChange={(date) => setFilters({ ...filters, fecha_hasta: date })}
                className="input"
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <button onClick={resetFilters} className="btn-secondary text-sm">
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movements Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        ) : movements.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((mov) => (
                    <tr key={mov.id}>
                      <td>{formatDate(mov.fechaOperacion)}</td>
                      <td>
                        <span
                          className={`badge ${
                            mov.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {mov.tipo === 'ingreso' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td>{mov.categoria?.nombre || '-'}</td>
                      <td>
                        <div className="max-w-xs truncate">
                          {mov.proveedor || mov.descripcion || '-'}
                        </div>
                        {mov.etiquetas?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {mov.etiquetas.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                }}
                              >
                                {tag.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`font-medium ${
                            mov.tipo === 'ingreso' ? 'text-success-600' : 'text-danger-600'
                          }`}
                        >
                          {mov.tipo === 'ingreso' ? '+' : '-'}
                          {formatCurrency(mov.importe)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            mov.estado === 'confirmado' ? 'badge-success' : 'badge-warning'
                          }`}
                        >
                          {mov.estado === 'confirmado' ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Menu as="div" className="relative">
                          <Menu.Button className="p-1 rounded-lg hover:bg-gray-100">
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
                                      onClick={() => openEditModal(mov.id)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700`}
                                    >
                                      <PencilIcon className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                  )}
                                </Menu.Item>
                                {mov.estado === 'pendiente_revision' && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleConfirm(mov.id)}
                                        className={`${
                                          active ? 'bg-gray-100' : ''
                                        } flex w-full items-center rounded-md px-3 py-2 text-sm text-success-600`}
                                      >
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        Confirm
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => setDeleteConfirm(mov)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } flex w-full items-center rounded-md px-3 py-2 text-sm text-danger-600`}
                                    >
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={!pagination.hasPreviousPage}
                    className="btn-secondary text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={!pagination.hasNextPage}
                    className="btn-secondary text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No movements yet</h3>
            <p className="text-gray-500 mb-4">Start tracking your income and expenses</p>
            <button onClick={openCreateModal} className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Movement
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Transition appear show={showModal} as={Fragment}>
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {editingMovement ? 'Edit Movement' : 'New Movement'}
                    </Dialog.Title>
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Type</label>
                        <select className="input" {...register('tipo', { required: true })}>
                          <option value="gasto">Expense</option>
                          <option value="ingreso">Income</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Date</label>
                        <DatePicker
                          selected={selectedDate}
                          onChange={setSelectedDate}
                          className="input w-full"
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className={`input ${errors.importe ? 'input-error' : ''}`}
                          placeholder="0.00"
                          {...register('importe', {
                            required: 'Amount is required',
                            min: { value: 0.01, message: 'Amount must be greater than 0' },
                          })}
                        />
                        {errors.importe && (
                          <p className="mt-1 text-sm text-danger-600">{errors.importe.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="label">Category</label>
                        <select
                          className={`input ${errors.id_categoria ? 'input-error' : ''}`}
                          {...register('id_categoria', { required: 'Category is required' })}
                        >
                          <option value="">Select category</option>
                          {filteredCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </option>
                          ))}
                        </select>
                        {errors.id_categoria && (
                          <p className="mt-1 text-sm text-danger-600">
                            {errors.id_categoria.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label">Provider/Merchant</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Amazon, Uber..."
                        {...register('proveedor')}
                      />
                    </div>

                    <div>
                      <label className="label">Description</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Brief description"
                        {...register('descripcion')}
                      />
                    </div>

                    {tags.length > 0 && (
                      <div>
                        <label className="label">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                setSelectedTags((prev) =>
                                  prev.includes(tag.id)
                                    ? prev.filter((id) => id !== tag.id)
                                    : [...prev, tag.id]
                                );
                              }}
                              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                selectedTags.includes(tag.id)
                                  ? 'border-transparent'
                                  : 'border-gray-300 bg-white'
                              }`}
                              style={
                                selectedTags.includes(tag.id)
                                  ? { backgroundColor: tag.color, color: '#fff' }
                                  : {}
                              }
                            >
                              {tag.nombre}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        className="input"
                        rows="2"
                        placeholder="Additional notes..."
                        {...register('notas')}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                        {isSubmitting ? 'Saving...' : editingMovement ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation */}
      <Transition appear show={!!deleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteConfirm(null)}>
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
                    Delete Movement
                  </Dialog.Title>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this movement? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm.id)}
                      className="btn-danger flex-1"
                    >
                      Delete
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

export default Movements;
