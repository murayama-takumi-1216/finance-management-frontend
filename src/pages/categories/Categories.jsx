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
} from '@heroicons/react/24/outline';
import { useCategoriesStore } from '../../store/useStore';

const categoryTypes = [
  { value: 'ingreso', label: 'Income' },
  { value: 'gasto', label: 'Expense' },
  { value: 'ambos', label: 'Both' },
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

  const globalCategories = categories.filter(c => c.esGlobal);
  const accountCategories = categories.filter(c => !c.esGlobal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Organize your transactions</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Category
        </button>
      </div>

      {/* Account Categories */}
      <div className="card">
        <h3 className="card-title mb-4">Account Categories</h3>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}
          </div>
        ) : accountCategories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {accountCategories.map(cat => (
              <div key={cat.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cat.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {categoryTypes.find(t => t.value === cat.tipo)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(cat)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat)} className="p-2 hover:bg-danger-50 rounded-lg">
                    <TrashIcon className="h-4 w-4 text-danger-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No custom categories yet</p>
        )}
      </div>

      {/* Global Categories */}
      {globalCategories.length > 0 && (
        <div className="card">
          <h3 className="card-title mb-4">Default Categories</h3>
          <div className="divide-y divide-gray-100">
            {globalCategories.map(cat => (
              <div key={cat.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cat.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {categoryTypes.find(t => t.value === cat.tipo)?.label}
                    </p>
                  </div>
                </div>
                <span className="badge-gray">Default</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-semibold">{editingCategory ? 'Edit Category' : 'New Category'}</Dialog.Title>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Name</label>
                      <input type="text" className={`input ${errors.nombre ? 'input-error' : ''}`} {...register('nombre', { required: 'Name is required' })} />
                      {errors.nombre && <p className="mt-1 text-sm text-danger-600">{errors.nombre.message}</p>}
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="input" {...register('tipo')}>
                        {categoryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">{isSubmitting ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirm */}
      <Transition appear show={!!deleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setDeleteConfirm(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold mb-4">Delete Category</Dialog.Title>
                  <p className="text-gray-600 mb-6">Delete "{deleteConfirm?.nombre}"? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger flex-1">Delete</button>
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
