import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useCategoriesStore } from '../../store/useStore';

const categoryTypes = [
  { value: 'ingreso', label: 'Income', icon: ArrowTrendingUpIcon, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { value: 'gasto', label: 'Expense', icon: ArrowTrendingDownIcon, color: 'from-red-500 to-red-600', bgColor: 'bg-red-100', textColor: 'text-red-600' },
  { value: 'ambos', label: 'Both', icon: ArrowsRightLeftIcon, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
];

function Categories() {
  const { accountId } = useParams();
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, isLoading } = useCategoriesStore();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchCategories(accountId);
  }, [accountId, fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ nombre: '', tipo: 'gasto', orden_visual: 0 });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setValue('nombre', category.nombre);
    setValue('tipo', category.tipo);
    setValue('orden_visual', category.ordenVisual || 0);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await updateCategory(accountId, editingCategory.id, data);
        toast.success('Category updated');
      } else {
        await createCategory(accountId, data);
        toast.success('Category created');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      await deleteCategory(accountId, categoryId);
      toast.success('Category deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cannot delete category in use');
    }
  };

  const getCategoryType = (tipo) => {
    return categoryTypes.find(t => t.value === tipo) || categoryTypes[1];
  };

  const globalCategories = categories.filter(c => c.esGlobal);
  const accountCategories = categories.filter(c => !c.esGlobal);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/25">
              <Squares2X2Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="page-title">Categories</h1>
              <p className="page-subtitle">Organize your transactions</p>
            </div>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          New Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categoryTypes.map(type => {
          const TypeIcon = type.icon;
          const count = categories.filter(c => c.tipo === type.value).length;
          return (
            <div key={type.value} className="card card-body flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg`}>
                <TypeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{type.label} Categories</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Categories */}
      <div className="card">
        <div className="card-header px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FolderIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="card-title mb-0">Custom Categories</h2>
              <p className="card-subtitle">{accountCategories.length} categories</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : accountCategories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {accountCategories.map(cat => {
              const typeInfo = getCategoryType(cat.tipo);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={cat.id} className="px-6 py-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-sm`}>
                      <TypeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.nombre}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${typeInfo.textColor}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="btn-icon-sm hover:bg-gray-100"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat)}
                      className="btn-icon-sm hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <FolderIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="empty-state-title">No custom categories</h3>
            <p className="empty-state-description">Create categories to organize your transactions</p>
            <button onClick={openCreateModal} className="btn-primary">
              <PlusIcon className="h-5 w-5" />
              Create Category
            </button>
          </div>
        )}
      </div>

      {/* Global Categories */}
      {globalCategories.length > 0 && (
        <div className="card">
          <div className="card-header px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FolderIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <h2 className="card-title mb-0">Default Categories</h2>
                <p className="card-subtitle">System-provided categories</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {globalCategories.map(cat => {
              const typeInfo = getCategoryType(cat.tipo);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={cat.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.nombre}</p>
                      <span className="text-xs text-gray-500">{typeInfo.label}</span>
                    </div>
                  </div>
                  <span className="badge-gray">Default</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="modal-overlay" />
          </Transition.Child>
          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="modal-panel">
                  <div className="modal-header">
                    <Dialog.Title className="modal-title">
                      {editingCategory ? 'Edit Category' : 'New Category'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="modal-body space-y-5">
                      <div className="form-group">
                        <label className="label">Category Name</label>
                        <input
                          type="text"
                          className={`input ${errors.nombre ? 'input-error' : ''}`}
                          placeholder="e.g., Groceries"
                          {...register('nombre', { required: 'Name is required' })}
                        />
                        {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
                      </div>

                      <div className="form-group">
                        <label className="label">Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          {categoryTypes.map(type => {
                            const TypeIcon = type.icon;
                            return (
                              <label
                                key={type.value}
                                className="relative cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  value={type.value}
                                  className="peer sr-only"
                                  {...register('tipo')}
                                />
                                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 hover:border-gray-300 transition-all">
                                  <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center`}>
                                    <TypeIcon className={`h-5 w-5 ${type.textColor}`} />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" onClick={closeModal} className="btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? (
                          <>
                            <span className="spinner" />
                            Saving...
                          </>
                        ) : (
                          'Save'
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

      {/* Delete Confirmation */}
      <Transition appear show={!!deleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteConfirm(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="modal-overlay" />
          </Transition.Child>
          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="modal-panel max-w-sm">
                  <div className="modal-body text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <TrashIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                      Delete Category
                    </Dialog.Title>
                    <p className="text-gray-600">
                      Delete <strong>"{deleteConfirm?.nombre}"</strong>? This cannot be undone.
                    </p>
                  </div>
                  <div className="modal-footer justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger">Delete</button>
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

export default Categories;
