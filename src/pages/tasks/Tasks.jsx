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
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useTasksStore, useCategoriesStore } from '../../store/useStore';

const statusOptions = [
  { value: 'pendiente', label: 'Pending', color: 'badge-warning', icon: ClockIcon },
  { value: 'en_progreso', label: 'In Progress', color: 'badge-primary', icon: ExclamationCircleIcon },
  { value: 'completada', label: 'Completed', color: 'badge-success', icon: CheckCircleIcon },
  { value: 'cancelada', label: 'Cancelled', color: 'badge-gray', icon: XMarkIcon },
];

const priorityOptions = [
  { value: 'baja', label: 'Low', color: 'text-gray-500' },
  { value: 'media', label: 'Medium', color: 'text-warning-500' },
  { value: 'alta', label: 'High', color: 'text-danger-500' },
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
    // Only fetch categories if we have an account context
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
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { estado: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const toggleComplete = async (task) => {
    // Status flow: pendiente → en_progreso → completada → pendiente
    let newStatus;
    switch (task.estado) {
      case 'pendiente':
        newStatus = 'en_progreso';
        break;
      case 'en_progreso':
        newStatus = 'completada';
        break;
      case 'completada':
        newStatus = 'pendiente';
        break;
      case 'cancelada':
        newStatus = 'pendiente'; // Reactivate cancelled task
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

  const TaskCard = ({ task }) => (
    <div className={`p-4 bg-white rounded-lg border ${isOverdue(task) ? 'border-danger-300 bg-danger-50' : 'border-gray-200'} group overflow-visible`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleComplete(task)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            task.estado === 'completada'
              ? 'text-success-500'
              : task.estado === 'en_progreso'
                ? 'text-primary-500 hover:text-success-500'
                : 'text-gray-300 hover:text-primary-500'
          }`}
          title={
            task.estado === 'pendiente'
              ? 'Click to start (In Progress)'
              : task.estado === 'en_progreso'
                ? 'Click to complete'
                : 'Click to reopen'
          }
        >
          {task.estado === 'completada' ? (
            <CheckCircleSolidIcon className="h-6 w-6" />
          ) : task.estado === 'en_progreso' ? (
            <ClockIcon className="h-6 w-6" />
          ) : (
            <CheckCircleIcon className="h-6 w-6" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${task.estado === 'completada' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.titulo}
            </h4>
            <Menu as="div" className="relative">
              <Menu.Button className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {task.estado !== 'completada' && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => openEditModal(task)}
                          className={`${active ? 'bg-gray-50' : ''} flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700`}
                        >
                          <PencilIcon className="h-4 w-4" /> Edit
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setDeleteConfirm(task)}
                        className={`${active ? 'bg-gray-50' : ''} flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600`}
                      >
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          {task.descripcion && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.descripcion}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`text-xs font-medium flex items-center gap-1 ${priorityOptions.find(p => p.value === task.prioridad)?.color}`}>
              <FlagIcon className="h-3 w-3" />
              {priorityOptions.find(p => p.value === task.prioridad)?.label}
            </span>
            {task.fechaVencimiento && (
              <span className={`text-xs flex items-center gap-1 ${isOverdue(task) ? 'text-danger-600' : 'text-gray-500'}`}>
                <CalendarIcon className="h-3 w-3" />
                {new Date(task.fechaVencimiento).toLocaleDateString()}
              </span>
            )}
            {task.categoria && (
              <span className="badge-gray text-xs">{task.categoria.nombre}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage your financial to-dos</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({tasks.length})
        </button>
        {statusOptions.map(status => (
          <button
            key={status.value}
            onClick={() => setFilterStatus(status.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === status.value ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.label} ({tasks.filter(t => t.estado === status.value).length})
          </button>
        ))}
      </div>

      {/* Task Lists */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
      ) : filterStatus === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-warning-500" />
              <h3 className="font-semibold text-gray-900">Pending ({pendingTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {pendingTasks.length === 0 && (
                <p className="text-center text-gray-400 py-8 bg-gray-50 rounded-lg">No pending tasks</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ExclamationCircleIcon className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">In Progress ({inProgressTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {inProgressTasks.length === 0 && (
                <p className="text-center text-gray-400 py-8 bg-gray-50 rounded-lg">No tasks in progress</p>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-success-500" />
              <h3 className="font-semibold text-gray-900">Completed ({completedTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
              {completedTasks.length === 0 && (
                <p className="text-center text-gray-400 py-8 bg-gray-50 rounded-lg">No completed tasks</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
          {filteredTasks.length === 0 && (
            <p className="text-center text-gray-500 py-12">No tasks found</p>
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
                    <Dialog.Title className="text-lg font-semibold">
                      {editingTask ? 'Edit Task' : 'New Task'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Title</label>
                      <input
                        type="text"
                        className={`input ${errors.titulo ? 'input-error' : ''}`}
                        placeholder="Task title"
                        {...register('titulo', { required: 'Title is required' })}
                      />
                      {errors.titulo && (
                        <p className="mt-1 text-sm text-danger-600">{errors.titulo.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Description</label>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="Optional description"
                        {...register('descripcion')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Priority</label>
                        <select className="input" {...register('prioridad')}>
                          {priorityOptions.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Status</label>
                        <select className="input" {...register('estado')}>
                          {statusOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Due Date</label>
                      <DatePicker
                        selected={selectedDate}
                        onChange={setSelectedDate}
                        className="input w-full"
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select due date"
                        isClearable
                      />
                    </div>

                    {accountId && categories.length > 0 && (
                      <div>
                        <label className="label">Category (optional)</label>
                        <select className="input" {...register('categoria_id')}>
                          <option value="">No category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                        {isSubmitting ? 'Saving...' : 'Save'}
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
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold mb-4">Delete Task</Dialog.Title>
                  <p className="text-gray-600 mb-6">
                    Delete "{deleteConfirm?.titulo}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger flex-1">
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

export default Tasks;
