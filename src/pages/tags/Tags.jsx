import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTagsStore } from '../../store/useStore';

const colorOptions = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16'
];

function Tags() {
  const { accountId } = useParams();
  const { tags, fetchTags, createTag, updateTag, deleteTag, isLoading } = useTagsStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => { fetchTags(accountId); }, [accountId, fetchTags]);

  const openCreateModal = () => {
    setEditingTag(null);
    setSelectedColor(colorOptions[0]);
    reset({ nombre: '' });
    setShowModal(true);
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setSelectedColor(tag.color);
    setValue('nombre', tag.nombre);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, color: selectedColor };
      if (editingTag) {
        await updateTag(accountId, editingTag.id, payload);
        toast.success('Tag updated');
      } else {
        await createTag(accountId, payload);
        toast.success('Tag created');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (tagId) => {
    try {
      await deleteTag(accountId, tagId);
      toast.success('Tag deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
          <p className="text-gray-500 mt-1">Label your transactions</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />New Tag
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}
          </div>
        ) : tags.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {tags.map(tag => (
              <div key={tag.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `${tag.color}20` }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <TagIcon className="h-4 w-4" style={{ color: tag.color }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tag.nombre}</p>
                    <p className="text-xs text-gray-500">{tag.usoCount} uses</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(tag)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => setDeleteConfirm(tag)} className="p-2 hover:bg-danger-50 rounded-lg">
                    <TrashIcon className="h-4 w-4 text-danger-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tags yet. Create one to label your transactions.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-semibold">{editingTag ? 'Edit Tag' : 'New Tag'}</Dialog.Title>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Name</label>
                      <input type="text" className={`input ${errors.nombre ? 'input-error' : ''}`} placeholder="e.g., Vacation" {...register('nombre', { required: 'Name is required' })} />
                      {errors.nombre && <p className="mt-1 text-sm text-danger-600">{errors.nombre.message}</p>}
                    </div>
                    <div>
                      <label className="label">Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map(color => (
                          <button key={color} type="button" onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }} />
                        ))}
                      </div>
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
                  <Dialog.Title className="text-lg font-semibold mb-4">Delete Tag</Dialog.Title>
                  <p className="text-gray-600 mb-6">Delete "{deleteConfirm?.nombre}"? This will remove it from all movements.</p>
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

export default Tags;
