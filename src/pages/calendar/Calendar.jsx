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
} from '@heroicons/react/24/outline';
import { useEventsStore, useCategoriesStore, useNotificationsStore } from '../../store/useStore';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

const eventTypeOptions = [
  { value: 'pago_unico', label: 'One-time Payment' },
  { value: 'pago_recurrente', label: 'Recurring Payment' },
  { value: 'recordatorio_generico', label: 'Reminder' },
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
  const [viewMode, setViewMode] = useState('month');
  const [selectedReminderSound, setSelectedReminderSound] = useState('default');

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  const { register: registerReminder, handleSubmit: handleReminderSubmit, reset: resetReminder, watch: watchReminder, formState: { errors: reminderErrors, isSubmitting: isReminderSubmitting } } = useForm({
    defaultValues: {
      mensaje: '',
      minutos_antes: '15',
    },
  });

  // Watch the minutos_antes value for debugging
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

  // Fetch custom sounds for reminder modal
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

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    // Format date as YYYY-MM-DD using local time (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return (events ?? [])
      .filter(Boolean) // remove undefined / null items
      .filter(e => {
        // support different backend field names
        const eventDate =
          e.fecha ||
          e.fechaHoraInicio ||
          e.fecha_hora_inicio;

        if (!eventDate) return false;

        const onlyDate = eventDate.split('T')[0];
        return onlyDate === dateStr;
      });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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

  // Preview reminder sound
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
      // Use watched value to ensure we get the current selection
      const minutosAntesValue = parseInt(watchedMinutosAntes) || parseInt(data.minutos_antes) || 0;

      // Format date preserving local timezone (avoid toISOString which converts to UTC)
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const localDateTimeStr = formatLocalDateTime(reminderDate);

      console.log('Reminder Submit Debug:', {
        formDataMinutosAntes: data.minutos_antes,
        watchedMinutosAntes: watchedMinutosAntes,
        parsedMinutosAntes: minutosAntesValue,
        reminderDateLocal: localDateTimeStr,
        reminderDateISO: reminderDate.toISOString(),
      });

      const payload = {
        mensaje: data.mensaje,
        fecha_recordatorio: localDateTimeStr,
        minutos_antes: minutosAntesValue,
        notification_sound: selectedReminderSound,
      };

      console.log('Payload being sent:', payload);

      await createReminder(accountId, payload);
      toast.success('Reminder created');
      setShowReminderModal(false);

      // Refresh events and reminders to show the new data immediately
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">Track payments and financial events</p>
        </div>
        <div className="flex gap-2">
          {accountId && (
            <button onClick={openReminderModal} className="btn-secondary">
              <BellIcon className="h-5 w-5 mr-2" />
              Add Reminder
            </button>
          )}
          <button onClick={() => openEventModal()} className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 card">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToToday} className="text-sm text-primary-600 hover:text-primary-700">
                Today
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {days.map((day, idx) => {
              const dayEvents = getEventsForDate(day.date);
              return (
                <div
                  key={idx}
                  onClick={() => openViewEventsModal(day.date)}
                  className={`min-h-24 p-2 cursor-pointer transition-colors ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                  <span
                    className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday(day.date)
                      ? 'bg-primary-600 text-white'
                      : day.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                      }`}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventModal(null, event);
                        }}
                        className="text-xs p-1 rounded bg-primary-100 text-primary-700 truncate hover:bg-primary-200"
                      >
                        {event.titulo}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayEvents.length - 2} more
                      </div>
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
            <h3 className="card-title mb-4 pt-2 pl-2">Upcoming Events</h3>
            <div className="space-y-3">
              {(events ?? [])
                .filter(Boolean)
                .filter(e => {
                  const d =
                    e.fecha ||
                    e.fechaHoraInicio ||
                    e.fecha_hora_inicio;

                  if (!d) return false;
                  return new Date(d) >= new Date();
                })
                .sort((a, b) => {
                  const aDate =
                    a.fecha ||
                    a.fechaHoraInicio ||
                    a.fecha_hora_inicio;
                  const bDate =
                    b.fecha ||
                    b.fechaHoraInicio ||
                    b.fecha_hora_inicio;

                  return new Date(aDate) - new Date(bDate);
                })
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{event.titulo}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <CalendarDaysIcon className="h-3 w-3" />
                          {new Date(
                            event.fecha ||
                            event.fechaHoraInicio ||
                            event.fecha_hora_inicio
                          ).toLocaleDateString()}
                        </p>
                        {event.monto && (
                          <p className="text-sm font-medium text-primary-600 mt-1">
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
                        <button
                          onClick={() => openEventModal(null, event)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(event)}
                          className="p-1 hover:bg-danger-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4 text-danger-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {(events ?? [])
                .filter(Boolean)
                .filter(e => {
                  const d = e.fecha || e.fechaHoraInicio || e.fecha_hora_inicio;
                  return d && new Date(d) >= new Date();
                }).length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>

          {/* Reminders - only show when in account context */}
          {accountId && (
            <div className="card">
              <h3 className="card-title mb-4">Reminders</h3>
              <div className="space-y-3">
                {(reminders ?? [])
                  .filter(Boolean)
                  .filter(r => !r.enviado)
                  .sort((a, b) => new Date(a.fechaRecordatorio || 0) - new Date(b.fechaRecordatorio || 0))
                  .slice(0, 5)
                  .map(reminder => (
                    <div key={reminder.id} className="p-3 bg-warning-50 rounded-lg group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{reminder.mensaje}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <ClockIcon className="h-3 w-3" />
                            {new Date(reminder.fechaRecordatorio).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-1 hover:bg-danger-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-4 w-4 text-danger-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                {(reminders ?? []).filter(Boolean).filter(r => !r.enviado).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No active reminders</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <Transition appear show={showEventModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowEventModal(false)}>
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
                      {editingEvent ? 'Edit Event' : 'New Event'}
                    </Dialog.Title>
                    <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmitEvent)} className="space-y-4">
                    <div>
                      <label className="label">Title</label>
                      <input
                        type="text"
                        className={`input ${errors.titulo ? 'input-error' : ''}`}
                        placeholder="Event title"
                        {...register('titulo', { required: 'Title is required' })}
                      />
                      {errors.titulo && (
                        <p className="mt-1 text-sm text-danger-600">{errors.titulo.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Date & Time</label>
                      <DatePicker
                        selected={eventDate}
                        onChange={setEventDate}
                        showTimeSelect
                        dateFormat="Pp"
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="label">Event Type</label>
                      <select className="input" {...register('tipo', { required: true })}>
                        {eventTypeOptions.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Amount (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        placeholder="0.00"
                        {...register('monto')}
                      />
                    </div>

                    <div>
                      <label className="label">Recurrence</label>
                      <select className="input" {...register('recurrencia')}>
                        {recurrenceOptions.map(r => (
                          <option key={r.value || 'none'} value={r.value || ''}>{r.label}</option>
                        ))}
                      </select>
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

                    <div>
                      <label className="label">Description</label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Optional description"
                        {...register('descripcion')}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowEventModal(false)} className="btn-secondary flex-1">
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

      {/* View Events Modal */}
      <Transition appear show={showViewEventsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowViewEventsModal(false)}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <Dialog.Title className="text-xl font-semibold">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Dialog.Title>
                    <button onClick={() => setShowViewEventsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
                    {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map(event => (
                        <div key={event.id} className="p-4 bg-gray-50 rounded-lg group">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{event.titulo}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {eventTypeOptions.find(t => t.value === event.tipo)?.label || event.tipo}
                              </p>
                              {event.monto && (
                                <p className="text-sm font-medium text-primary-600 mt-1">
                                  {formatCurrency(event.monto)}
                                </p>
                              )}
                              {event.descripcion && (
                                <p className="text-sm text-gray-500 mt-2">{event.descripcion}</p>
                              )}
                              {event.recurrencia && event.recurrencia !== 'ninguna' && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                                  <ArrowPathIcon className="h-3 w-3" />
                                  {recurrenceOptions.find(r => r.value === event.recurrencia)?.label}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setShowViewEventsModal(false);
                                  openEventModal(null, event);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <PencilIcon className="h-4 w-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => {
                                  setShowViewEventsModal(false);
                                  setDeleteConfirm(event);
                                }}
                                className="p-1 hover:bg-danger-50 rounded"
                              >
                                <TrashIcon className="h-4 w-4 text-danger-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No events for this day</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowViewEventsModal(false)} className="btn-secondary flex-1">
                      Close
                    </button>
                    <button onClick={openAddEventFromView} className="btn-primary flex-1">
                      <PlusIcon className="h-5 w-5 mr-2" />
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
                    <Dialog.Title className="text-lg font-semibold">New Reminder</Dialog.Title>
                    <button onClick={() => setShowReminderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleReminderSubmit(onSubmitReminder)} className="space-y-4">
                    <div>
                      <label className="label">Message</label>
                      <input
                        type="text"
                        className={`input ${reminderErrors.mensaje ? 'input-error' : ''}`}
                        placeholder="Reminder message"
                        {...registerReminder('mensaje', { required: 'Message is required' })}
                      />
                      {reminderErrors.mensaje && (
                        <p className="mt-1 text-sm text-danger-600">{reminderErrors.mensaje.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Date & Time</label>
                      <DatePicker
                        selected={reminderDate}
                        onChange={setReminderDate}
                        showTimeSelect
                        dateFormat="Pp"
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="label">Remind me</label>
                      <select className="input" {...registerReminder('minutos_antes')}>
                        {reminderOptions.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notification Sound Selection */}
                    <div>
                      <label className="label flex items-center gap-2">
                        <SpeakerWaveIcon className="h-4 w-4" />
                        Notification Sound
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {/* Built-in sounds */}
                        {NOTIFICATION_SOUNDS.map((sound) => (
                          <div
                            key={sound.id}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                              selectedReminderSound === sound.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedReminderSound(sound.id)}
                          >
                            <span className={`text-sm font-medium truncate ${
                              selectedReminderSound === sound.id
                                ? 'text-primary-700'
                                : 'text-gray-700'
                            }`}>
                              {sound.name}
                            </span>
                            {sound.id !== 'none' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewReminderSound(sound.id);
                                }}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                                title="Preview sound"
                              >
                                <PlayIcon className="h-3 w-3 text-gray-600" />
                              </button>
                            )}
                          </div>
                        ))}
                        {/* Custom sounds */}
                        {customSounds.map((sound) => (
                          <div
                            key={sound.id}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                              selectedReminderSound === sound.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedReminderSound(sound.id)}
                          >
                            <span className={`text-sm font-medium truncate ${
                              selectedReminderSound === sound.id
                                ? 'text-primary-700'
                                : 'text-gray-700'
                            }`}>
                              {sound.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                previewReminderSound(sound.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                              title="Preview sound"
                            >
                              <PlayIcon className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowReminderModal(false)} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={isReminderSubmitting} className="btn-primary flex-1">
                        {isReminderSubmitting ? 'Saving...' : 'Save'}
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
                  <Dialog.Title className="text-lg font-semibold mb-4">Delete Event</Dialog.Title>
                  <p className="text-gray-600 mb-6">
                    Delete "{deleteConfirm?.titulo}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button onClick={() => handleDeleteEvent(deleteConfirm.id)} className="btn-danger flex-1">
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

export default Calendar;
