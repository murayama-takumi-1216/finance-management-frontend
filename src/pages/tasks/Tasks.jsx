import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  FlagIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useTasksStore, useCategoriesStore } from '../../store/useStore';

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente', color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-700', icon: ClockIcon },
  { value: 'en_progreso', label: 'En Progreso', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', icon: ExclamationCircleIcon },
  { value: 'completada', label: 'Completada', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', icon: CheckCircleIcon },
  { value: 'cancelada', label: 'Cancelada', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', icon: XMarkIcon },
];

const priorityOptions = [
  { value: 'baja', label: 'Baja', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  { value: 'media', label: 'Media', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { value: 'alta', label: 'Alta', color: 'text-red-600', bgColor: 'bg-red-100' },
];

function Tasks() {
  const { accountId } = useParams();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, isLoading } = useTasksStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchTasks(accountId ? { accountId } : {});
    if (accountId) {
      fetchCategories(accountId);
    }
  }, [accountId, fetchTasks, fetchCategories]);

  const openCreateModal = () => {
    setEditingTask(null);
    setSelectedDate(null);
    reset({ titulo: '', descripcion: '', prioridad: 'media', estado: 'pendiente', categoria_id: '' });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setSelectedDate(task.fechaVencimiento ? new Date(task.fechaVencimiento) : null);
    setValue('titulo', task.titulo);
    setValue('descripcion', task.descripcion || '');
    setValue('prioridad', task.prioridad);
    setValue('estado', task.estado);
    setValue('categoria_id', task.categoriaId || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        fecha_vencimiento: selectedDate?.toISOString().split('T')[0] || null,
        categoria_id: data.categoria_id || null,
        id_cuenta: accountId || null,
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
        toast.success('Tarea actualizada');
      } else {
        await createTask(payload);
        toast.success('Tarea creada');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operación fallida');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { estado: newStatus });
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('Tarea eliminada');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const toggleComplete = async (task) => {
    // Only allow status changes for non-completed tasks
    if (task.estado === 'completada') return;

    let newStatus;
    switch (task.estado) {
      case 'pendiente':
        newStatus = 'en_progreso';
        break;
      case 'en_progreso':
        newStatus = 'completada';
        break;
      case 'cancelada':
        newStatus = 'pendiente';
        break;
      default:
        newStatus = 'pendiente';
    }
    await handleStatusChange(task.id, newStatus);
  };

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.estado === filterStatus);

  const pendingTasks = filteredTasks.filter(t => t.estado === 'pendiente');
  const inProgressTasks = filteredTasks.filter(t => t.estado === 'en_progreso');
  const completedTasks = filteredTasks.filter(t => t.estado === 'completada');

  const isOverdue = (task) => {
    if (!task.fechaVencimiento || task.estado === 'completada') return false;
    return new Date(task.fechaVencimiento) < new Date();
  };

  const TaskCard = ({ task }) => {
    const priority = priorityOptions.find(p => p.value === task.prioridad);

    return (
      <div className={`card card-hover p-5 group overflow-visible ${isOverdue(task) ? 'border-red-200 bg-red-50/30' : ''}`}>
        <div className="flex items-start gap-4">
          {task.estado === 'completada' ? (
            <div className="mt-0.5 flex-shrink-0 text-emerald-500">
              <CheckCircleSolidIcon className="h-6 w-6" />
            </div>
          ) : (
            <button
              onClick={() => toggleComplete(task)}
              className={`mt-0.5 flex-shrink-0 transition-all ${
                task.estado === 'en_progreso'
                  ? 'text-indigo-500 hover:text-emerald-500'
                  : 'text-gray-300 hover:text-indigo-500'
              }`}
              title={
                task.estado === 'pendiente'
                  ? 'Clic para iniciar (En Progreso)'
                  : 'Clic para completar'
              }
            >
              {task.estado === 'en_progreso' ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-25" />
                  <ClockIcon className="h-6 w-6 relative" />
                </div>
              ) : (
                <CheckCircleIcon className="h-6 w-6" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-semibold ${task.estado === 'completada' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.titulo}
              </h4>
              <Menu as="div" className="relative">
                <Menu.Button className="btn-icon-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
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
                  <Menu.Items className="dropdown-menu">
                    {task.estado !== 'completada' && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openEditModal(task)}
                            className={`dropdown-item ${active ? 'bg-gray-100' : ''}`}
                          >
                            <PencilIcon className="h-4 w-4" /> Editar
                          </button>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setDeleteConfirm(task)}
                          className={`dropdown-item-danger ${active ? 'bg-red-50' : ''}`}
                        >
                          <TrashIcon className="h-4 w-4" /> Eliminar
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            {task.descripcion && (
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{task.descripcion}</p>
            )}

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${priority?.bgColor} ${priority?.color}`}>
                <FlagIcon className="h-3 w-3" />
                {priority?.label}
              </span>
              {task.fechaVencimiento && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isOverdue(task) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  <CalendarIcon className="h-3 w-3" />
                  {new Date(task.fechaVencimiento).toLocaleDateString()}
                </span>
              )}
              {task.categoria && (
                <span className="badge-purple text-xs">{task.categoria.nombre}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ColumnHeader = ({ status, count }) => {
    const StatusIcon = status.icon;
    return (
      <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${status.bgColor}`}>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${status.color} flex items-center justify-center shadow-sm`}>
          <StatusIcon className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className={`font-semibold ${status.textColor}`}>{status.label}</h3>
          <p className="text-xs text-gray-500">{count} tarea{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Tareas</h1>
          <p className="page-subtitle">Administra tus pendientes financieros</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5" />
          Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="card card-body p-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas las Tareas ({tasks.length})
          </button>
          {statusOptions.map(status => {
            const StatusIcon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filterStatus === status.value
                    ? `bg-gradient-to-r ${status.color} text-white shadow-lg`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label} ({tasks.filter(t => t.estado === status.value).length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Lists */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <div className="skeleton h-16 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filterStatus === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div>
            <ColumnHeader status={statusOptions[0]} count={pendingTasks.length} />
            <div className="space-y-3">
              {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {pendingTasks.length === 0 && (
                <div className="card card-body text-center py-12">
                  <ClockIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Sin tareas pendientes</p>
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <ColumnHeader status={statusOptions[1]} count={inProgressTasks.length} />
            <div className="space-y-3">
              {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {inProgressTasks.length === 0 && (
                <div className="card card-body text-center py-12">
                  <ExclamationCircleIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Sin tareas en progreso</p>
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div>
            <ColumnHeader status={statusOptions[2]} count={completedTasks.length} />
            <div className="space-y-3">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {completedTasks.length === 0 && (
                <div className="card card-body text-center py-12">
                  <CheckCircleIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Sin tareas completadas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
          {filteredTasks.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <ListBulletIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="empty-state-title">Sin tareas encontradas</h3>
                <p className="empty-state-description">
                  No hay tareas que coincidan con el filtro seleccionado.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
                      {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="modal-body space-y-5">
                      <div className="form-group">
                        <label className="label">Título</label>
                        <input
                          type="text"
                          className={`input ${errors.titulo ? 'input-error' : ''}`}
                          placeholder="Título de la tarea"
                          {...register('titulo', { required: 'El título es requerido' })}
                        />
                        {errors.titulo && (
                          <p className="error-text">{errors.titulo.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="label">Descripción</label>
                        <textarea
                          className="textarea"
                          rows={3}
                          placeholder="Descripción opcional"
                          {...register('descripcion')}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="label">Prioridad</label>
                          <select className="select" {...register('prioridad')}>
                            {priorityOptions.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="label">Estado</label>
                          <select className="select" {...register('estado')}>
                            {statusOptions.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">Fecha de Vencimiento</label>
                        <DatePicker
                          selected={selectedDate}
                          onChange={setSelectedDate}
                          className="input w-full"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Seleccionar fecha"
                          isClearable
                        />
                      </div>

                      {accountId && categories.length > 0 && (
                        <div className="form-group">
                          <label className="label">Categoría (opcional)</label>
                          <select className="select" {...register('categoria_id')}>
                            <option value="">Sin categoría</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}
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
                      Eliminar Tarea
                    </Dialog.Title>
                    <p className="text-gray-600">
                      ¿Eliminar <strong>"{deleteConfirm?.titulo}"</strong>? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="modal-footer justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                      Cancelar
                    </button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger">
                      Eliminar
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

export default Tasks;
