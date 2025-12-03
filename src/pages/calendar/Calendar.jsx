import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  SpeakerWaveIcon,
  PlayIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useEventsStore, useCategoriesStore, useNotificationsStore } from '../../store/useStore';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

const eventTypeOptions = [
  { value: 'pago_unico', label: 'One-time Payment', color: 'from-blue-500 to-blue-600' },
  { value: 'pago_recurrente', label: 'Recurring Payment', color: 'from-purple-500 to-purple-600' },
  { value: 'recordatorio_generico', label: 'Reminder', color: 'from-amber-500 to-amber-600' },
];

const recurrenceOptions = [
  { value: null, label: 'No repeat' },
  { value: 'diaria', label: 'Daily' },
  { value: 'semanal', label: 'Weekly' },
  { value: 'mensual', label: 'Monthly' },
  { value: 'anual', label: 'Yearly' },
];

const reminderOptions = [
  { value: '0', label: 'At time of event' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
  { value: '10080', label: '1 week before' },
];

function Calendar() {
  const { accountId } = useParams();
  const { events, reminders, fetchEvents, fetchReminders, createEvent, updateEvent, deleteEvent, createReminder, deleteReminder, isLoading } = useEventsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { customSounds, fetchCustomSounds, getCustomSoundUrl } = useNotificationsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showViewEventsModal, setShowViewEventsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventDate, setEventDate] = useState(new Date());
  const [reminderDate, setReminderDate] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedReminderSound, setSelectedReminderSound] = useState('default');

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  const { register: registerReminder, handleSubmit: handleReminderSubmit, reset: resetReminder, watch: watchReminder, formState: { errors: reminderErrors, isSubmitting: isReminderSubmitting } } = useForm({
    defaultValues: { mensaje: '', minutos_antes: '15' },
  });

  const watchedMinutosAntes = watchReminder('minutos_antes');

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];

    fetchEvents(accountId, { start, end });
    if (accountId) {
      fetchReminders(accountId);
      fetchCategories(accountId);
    }
  }, [accountId, currentDate, fetchEvents, fetchReminders, fetchCategories]);

  useEffect(() => {
    fetchCustomSounds().catch(console.error);
  }, [fetchCustomSounds]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    const prevMonth = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const getEventsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return (events ?? []).filter(Boolean).filter(e => {
      const eventDate = e.fecha || e.fechaHoraInicio || e.fecha_hora_inicio;
      if (!eventDate) return false;
      return eventDate.split('T')[0] === dateStr;
    });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const navigateMonth = (direction) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  const goToToday = () => setCurrentDate(new Date());

  const openEventModal = (date = null, event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventDate(new Date(event.fecha || event.fechaHoraInicio));
      setValue('titulo', event.titulo);
      setValue('descripcion', event.descripcion || '');
      setValue('tipo', event.tipo || 'pago_unico');
      setValue('monto', event.monto || '');
      setValue('recurrencia', event.recurrencia || '');
      setValue('categoria_id', event.categoriaId || '');
    } else {
      setEditingEvent(null);
      setEventDate(date || new Date());
      reset({ titulo: '', descripcion: '', tipo: 'pago_unico', monto: '', recurrencia: '', categoria_id: '' });
    }
    setShowEventModal(true);
  };

  const openViewEventsModal = (date) => {
    setSelectedDate(date);
    setShowViewEventsModal(true);
  };

  const openAddEventFromView = () => {
    setShowViewEventsModal(false);
    openEventModal(selectedDate);
  };

  const openReminderModal = () => {
    setReminderDate(new Date());
    resetReminder({ mensaje: '', minutos_antes: '15' });
    setSelectedReminderSound('default');
    setShowReminderModal(true);
  };

  const previewReminderSound = (soundId) => {
    const customUrl = soundId.startsWith('custom_') ? getCustomSoundUrl(soundId) : null;
    notificationSound.preview(soundId, 80, customUrl);
  };

  const onSubmitEvent = async (data) => {
    try {
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha_hora_inicio: eventDate.toISOString(),
        tipo: data.tipo || 'pago_unico',
        monto: data.monto ? parseFloat(data.monto) : null,
        recurrencia: data.recurrencia || null,
        categoria_id: data.categoria_id || null,
        id_cuenta: accountId || null,
      };

      if (editingEvent) {
        await updateEvent(accountId, editingEvent.id, payload);
        toast.success('Event updated');
      } else {
        await createEvent(accountId, payload);
        toast.success('Event created');
      }
      setShowEventModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const onSubmitReminder = async (data) => {
    try {
      const minutosAntesValue = parseInt(watchedMinutosAntes) || parseInt(data.minutos_antes) || 0;
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const payload = {
        mensaje: data.mensaje,
        fecha_recordatorio: formatLocalDateTime(reminderDate),
        minutos_antes: minutosAntesValue,
        notification_sound: selectedReminderSound,
      };

      await createReminder(accountId, payload);
      toast.success('Reminder created');
      setShowReminderModal(false);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      fetchEvents(accountId, { start, end });
      fetchReminders(accountId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(accountId, eventId);
      toast.success('Event deleted');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteReminder(accountId, reminderId);
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const upcomingEvents = (events ?? [])
    .filter(Boolean)
    .filter(e => {
      const d = e.fecha || e.fechaHoraInicio || e.fecha_hora_inicio;
      return d && new Date(d) >= new Date();
    })
    .sort((a, b) => {
      const aDate = a.fecha || a.fechaHoraInicio || a.fecha_hora_inicio;
      const bDate = b.fecha || b.fechaHoraInicio || b.fecha_hora_inicio;
      return new Date(aDate) - new Date(bDate);
    })
    .slice(0, 5);

  const activeReminders = (reminders ?? []).filter(Boolean).filter(r => !r.enviado).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="page-title">Calendar</h1>
              <p className="page-subtitle">Track payments and events</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {accountId && (
            <button onClick={openReminderModal} className="btn-secondary">
              <BellIcon className="h-5 w-5" />
              Add Reminder
            </button>
          )}
          <button onClick={() => openEventModal()} className="btn-primary">
            <PlusIcon className="h-5 w-5" />
            New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 card card-body">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToToday} className="btn-ghost text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                Today
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigateMonth(-1)} className="btn-icon-sm hover:bg-gray-100">
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button onClick={() => navigateMonth(1)} className="btn-icon-sm hover:bg-gray-100">
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-500 py-3">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDate(day.date);
              return (
                <div
                  key={idx}
                  onClick={() => openViewEventsModal(day.date)}
                  className={`min-h-28 p-2 cursor-pointer transition-colors ${
                    day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-sm font-semibold inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    isToday(day.date)
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md'
                      : day.isCurrentMonth
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEventModal(null, event); }}
                        className="text-xs px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 truncate hover:bg-indigo-200 font-medium cursor-pointer"
                      >
                        {event.titulo}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1 font-medium">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <div className="card-header px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Upcoming</h3>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{event.titulo}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <CalendarDaysIcon className="h-3 w-3" />
                        {new Date(event.fecha || event.fechaHoraInicio || event.fecha_hora_inicio).toLocaleDateString()}
                      </p>
                      {event.monto && (
                        <p className="text-sm font-semibold text-indigo-600 mt-1 flex items-center gap-1">
                          <CurrencyDollarIcon className="h-3.5 w-3.5" />
                          {formatCurrency(event.monto)}
                        </p>
                      )}
                      {event.recurrencia && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <ArrowPathIcon className="h-3 w-3" />
                          {recurrenceOptions.find(r => r.value === event.recurrencia)?.label}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEventModal(null, event)} className="btn-icon-sm hover:bg-white">
                        <PencilIcon className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button onClick={() => setDeleteConfirm(event)} className="btn-icon-sm hover:bg-red-100">
                        <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">No upcoming events</div>
              )}
            </div>
          </div>

          {/* Reminders */}
          {accountId && (
            <div className="card">
              <div className="card-header px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Reminders</h3>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {activeReminders.map(reminder => (
                  <div key={reminder.id} className="p-3 bg-amber-50 rounded-xl group hover:bg-amber-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{reminder.mensaje}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(reminder.fechaRecordatorio).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="btn-icon-sm hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {activeReminders.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">No active reminders</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <Transition appear show={showEventModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowEventModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="modal-overlay" />
          </Transition.Child>
          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="modal-panel">
                  <div className="modal-header">
                    <Dialog.Title className="modal-title">{editingEvent ? 'Edit Event' : 'New Event'}</Dialog.Title>
                    <button onClick={() => setShowEventModal(false)} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmitEvent)}>
                    <div className="modal-body space-y-4">
                      <div className="form-group">
                        <label className="label">Title</label>
                        <input type="text" className={`input ${errors.titulo ? 'input-error' : ''}`} placeholder="Event title" {...register('titulo', { required: 'Title is required' })} />
                        {errors.titulo && <p className="error-text">{errors.titulo.message}</p>}
                      </div>

                      <div className="form-group">
                        <label className="label">Date & Time</label>
                        <DatePicker selected={eventDate} onChange={setEventDate} showTimeSelect dateFormat="Pp" className="input w-full" />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="label">Type</label>
                          <select className="select" {...register('tipo', { required: true })}>
                            {eventTypeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="label">Amount</label>
                          <input type="number" step="0.01" className="input" placeholder="0.00" {...register('monto')} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">Recurrence</label>
                        <select className="select" {...register('recurrencia')}>
                          {recurrenceOptions.map(r => <option key={r.value || 'none'} value={r.value || ''}>{r.label}</option>)}
                        </select>
                      </div>

                      {accountId && categories.length > 0 && (
                        <div className="form-group">
                          <label className="label">Category</label>
                          <select className="select" {...register('categoria_id')}>
                            <option value="">No category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="form-group">
                        <label className="label">Description</label>
                        <textarea className="textarea" rows={2} placeholder="Optional description" {...register('descripcion')} />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" onClick={() => setShowEventModal(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting ? <><span className="spinner" />Saving...</> : 'Save'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Events Modal */}
      <Transition appear show={showViewEventsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowViewEventsModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="modal-overlay" />
          </Transition.Child>
          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="modal-panel max-w-2xl">
                  <div className="modal-header">
                    <Dialog.Title className="modal-title">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Dialog.Title>
                    <button onClick={() => setShowViewEventsModal(false)} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="modal-body space-y-3 max-h-96 overflow-y-auto">
                    {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map(event => (
                        <div key={event.id} className="p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{event.titulo}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {eventTypeOptions.find(t => t.value === event.tipo)?.label || event.tipo}
                              </p>
                              {event.monto && <p className="text-sm font-semibold text-indigo-600 mt-1">{formatCurrency(event.monto)}</p>}
                              {event.descripcion && <p className="text-sm text-gray-500 mt-2">{event.descripcion}</p>}
                              {event.recurrencia && event.recurrencia !== 'ninguna' && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                                  <ArrowPathIcon className="h-3 w-3" />
                                  {recurrenceOptions.find(r => r.value === event.recurrencia)?.label}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setShowViewEventsModal(false); openEventModal(null, event); }} className="btn-icon-sm hover:bg-white">
                                <PencilIcon className="h-4 w-4 text-gray-500" />
                              </button>
                              <button onClick={() => { setShowViewEventsModal(false); setDeleteConfirm(event); }} className="btn-icon-sm hover:bg-red-100">
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state py-8">
                        <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No events for this day</p>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button onClick={() => setShowViewEventsModal(false)} className="btn-secondary">Close</button>
                    <button onClick={openAddEventFromView} className="btn-primary">
                      <PlusIcon className="h-5 w-5" />
                      Add Event
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Reminder Modal */}
      <Transition appear show={showReminderModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowReminderModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="modal-overlay" />
          </Transition.Child>
          <div className="modal-container">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="modal-panel">
                  <div className="modal-header">
                    <Dialog.Title className="modal-title">New Reminder</Dialog.Title>
                    <button onClick={() => setShowReminderModal(false)} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleReminderSubmit(onSubmitReminder)}>
                    <div className="modal-body space-y-4">
                      <div className="form-group">
                        <label className="label">Message</label>
                        <input type="text" className={`input ${reminderErrors.mensaje ? 'input-error' : ''}`} placeholder="Reminder message" {...registerReminder('mensaje', { required: 'Message is required' })} />
                        {reminderErrors.mensaje && <p className="error-text">{reminderErrors.mensaje.message}</p>}
                      </div>

                      <div className="form-group">
                        <label className="label">Date & Time</label>
                        <DatePicker selected={reminderDate} onChange={setReminderDate} showTimeSelect dateFormat="Pp" className="input w-full" />
                      </div>

                      <div className="form-group">
                        <label className="label">Remind me</label>
                        <select className="select" {...registerReminder('minutos_antes')}>
                          {reminderOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="label flex items-center gap-2">
                          <SpeakerWaveIcon className="h-4 w-4" />
                          Notification Sound
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                          {NOTIFICATION_SOUNDS.map((sound) => (
                            <div
                              key={sound.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedReminderSound === sound.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedReminderSound(sound.id)}
                            >
                              <span className={`text-sm font-medium truncate ${selectedReminderSound === sound.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {sound.name}
                              </span>
                              {sound.id !== 'none' && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); previewReminderSound(sound.id); }} className="btn-icon-sm hover:bg-gray-200">
                                  <PlayIcon className="h-3 w-3 text-gray-600" />
                                </button>
                              )}
                            </div>
                          ))}
                          {customSounds.map((sound) => (
                            <div
                              key={sound.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedReminderSound === sound.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedReminderSound(sound.id)}
                            >
                              <span className={`text-sm font-medium truncate ${selectedReminderSound === sound.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {sound.name}
                              </span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); previewReminderSound(sound.id); }} className="btn-icon-sm hover:bg-gray-200">
                                <PlayIcon className="h-3 w-3 text-gray-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" onClick={() => setShowReminderModal(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={isReminderSubmitting} className="btn-primary">
                        {isReminderSubmitting ? <><span className="spinner" />Saving...</> : 'Save'}
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
                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">Delete Event</Dialog.Title>
                    <p className="text-gray-600">Delete "{deleteConfirm?.titulo}"? This action cannot be undone.</p>
                  </div>
                  <div className="modal-footer justify-center">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                    <button onClick={() => handleDeleteEvent(deleteConfirm.id)} className="btn-danger">Delete</button>
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

export default Calendar;
