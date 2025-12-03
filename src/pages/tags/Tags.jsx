import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, TagIcon, HashtagIcon } from '@heroicons/react/24/outline';
import { useTagsStore } from '../../store/useStore';

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#F59E0B', label: 'Ámbar' },
  { value: '#8B5CF6', label: 'Púrpura' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cian' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#84CC16', label: 'Lima' },
];

function Tags() {
  const { accountId } = useParams();
  const { tags, fetchTags, createTag, updateTag, deleteTag, isLoading } = useTagsStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchTags(accountId);
  }, [accountId, fetchTags]);

  const openCreateModal = () => {
    setEditingTag(null);
    setSelectedColor(colorOptions[0].value);
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
        toast.success('Etiqueta actualizada');
      } else {
        await createTag(accountId, payload);
        toast.success('Etiqueta creada');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operación fallida');
    }
  };

  const handleDelete = async (tagId) => {
    try {
      await deleteTag(accountId, tagId);
      toast.success('Etiqueta eliminada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const totalUses = tags.reduce((sum, tag) => sum + (tag.usoCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/25">
              <HashtagIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="page-title">Etiquetas</h1>
              <p className="page-subtitle">Etiqueta tus transacciones</p>
            </div>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Nueva Etiqueta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card card-body flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tags.length}</p>
            <p className="text-sm text-gray-500">Total de Etiquetas</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <HashtagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
            <p className="text-sm text-gray-500">Total de Usos</p>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="card">
        <div className="card-header px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <TagIcon className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h2 className="card-title mb-0">Tus Etiquetas</h2>
              <p className="card-subtitle">{tags.length} etiquetas creadas</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : tags.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {tags.map(tag => (
              <div key={tag.id} className="px-6 py-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${tag.color}15` }}
                  >
                    <TagIcon className="h-6 w-6" style={{ color: tag.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{tag.nombre}</p>
                      <span
                        className="w-3 h-3 rounded-full shadow-inner"
                        style={{ backgroundColor: tag.color }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {tag.usoCount || 0} {tag.usoCount === 1 ? 'uso' : 'usos'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(tag)}
                    className="btn-icon-sm hover:bg-gray-100"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(tag)}
                    className="btn-icon-sm hover:bg-red-50"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <TagIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="empty-state-title">Sin etiquetas aún</h3>
            <p className="empty-state-description">Crea etiquetas para etiquetar y organizar tus transacciones</p>
            <button onClick={openCreateModal} className="btn-primary">
              <PlusIcon className="h-5 w-5" />
              Crear Etiqueta
            </button>
          </div>
        )}
      </div>

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
                      {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="modal-body space-y-5">
                      {/* Preview */}
                      <div className="flex items-center justify-center py-4">
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium"
                          style={{ backgroundColor: selectedColor }}
                        >
                          <TagIcon className="h-4 w-4" />
                          <span>{editingTag?.nombre || 'Vista Previa'}</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">Nombre de la Etiqueta</label>
                        <input
                          type="text"
                          className={`input ${errors.nombre ? 'input-error' : ''}`}
                          placeholder="ej., Vacaciones, Trabajo"
                          {...register('nombre', { required: 'El nombre es requerido' })}
                        />
                        {errors.nombre && <p className="error-text">{errors.nombre.message}</p>}
                      </div>

                      <div className="form-group">
                        <label className="label">Color</label>
                        <div className="grid grid-cols-5 gap-3">
                          {colorOptions.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setSelectedColor(color.value)}
                              className={`w-full aspect-square rounded-xl transition-all flex items-center justify-center ${
                                selectedColor === color.value
                                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            >
                              {selectedColor === color.value && (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" onClick={closeModal} className="btn-secondary">
                        Cancelar
                      </button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? (
                          <>
                            <span className="spinner" />
                            Guardando...
                          </>
                        ) : (
                          'Guardar'
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
                      Eliminar Etiqueta
                    </Dialog.Title>
                    <p className="text-gray-600">
                      ¿Eliminar <strong>"{deleteConfirm?.nombre}"</strong>? Se eliminará de todas las transacciones.
                    </p>
                  </div>
                  <div className="modal-footer justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancelar</button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger">Eliminar</button>
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
