import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  PlayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import { usersAPI, preferencesAPI } from '../../services/api';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

function Settings() {
  const { user, checkAuth } = useAuthStore();
  const { preferences, fetchPreferences, updatePreferences } = useNotificationsStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [localPreferences, setLocalPreferences] = useState({
    notificationsEnabled: true,
    browserNotifications: true,
    emailNotifications: true,
    notificationSound: 'default',
    notificationVolume: 80,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [preferencesChanged, setPreferencesChanged] = useState(false);
  const [customSounds, setCustomSounds] = useState([]);
  const [uploadingSound, setUploadingSound] = useState(false);
  const fileInputRef = useState(null);
  const [showDeleteSoundModal, setShowDeleteSoundModal] = useState(false);
  const [soundToDelete, setSoundToDelete] = useState(null);
  const [isDeletingSound, setIsDeletingSound] = useState(false);

  const fetchCustomSounds = async () => {
    try {
      const { data } = await preferencesAPI.getSounds();
      setCustomSounds(data.custom || []);
    } catch (error) {
      console.error('Failed to fetch custom sounds:', error);
    }
  };

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        notificationsEnabled: preferences.notificationsEnabled ?? true,
        browserNotifications: preferences.browserNotifications ?? true,
        emailNotifications: preferences.emailNotifications ?? true,
        notificationSound: preferences.notificationSound || 'default',
        notificationVolume: preferences.notificationVolume ?? 80,
        quietHoursEnabled: preferences.quietHoursEnabled ?? false,
        quietHoursStart: preferences.quietHoursStart || '22:00',
        quietHoursEnd: preferences.quietHoursEnd || '08:00',
      });
      setPreferencesChanged(false);
    }
  }, [preferences]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      if (!preferences) {
        fetchPreferences().catch(console.error);
      }
      fetchCustomSounds();
    }
  }, [activeTab, preferences, fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      notificationSound.setEnabled(preferences.notificationsEnabled);
      notificationSound.setVolume(preferences.notificationVolume);
    }
  }, [preferences]);

  const handleLocalPreferenceChange = (key, value) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setPreferencesChanged(true);

    if (key === 'notificationVolume') {
      notificationSound.setVolume(value);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await updatePreferences(localPreferences);
      toast.success('Configuración guardada exitosamente');
      setPreferencesChanged(false);
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingPreferences(false);
    }
  };

  const previewSound = (soundId) => {
    const customSound = customSounds.find(s => s.id === soundId);
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    const customUrl = customSound ? `${baseUrl}${customSound.url}` : null;
    notificationSound.preview(soundId, localPreferences.notificationVolume, customUrl);
  };

  const handleSoundUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor sube un archivo de audio válido (MP3, WAV o OGG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El tamaño del archivo debe ser menor a 5MB');
      return;
    }

    setUploadingSound(true);
    try {
      const formData = new FormData();
      formData.append('sound', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

      const { data } = await preferencesAPI.uploadSound(formData);
      toast.success('Sonido subido exitosamente');
      await fetchCustomSounds();
      handleLocalPreferenceChange('notificationSound', data.sound.id);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al subir el sonido');
    } finally {
      setUploadingSound(false);
      event.target.value = '';
    }
  };

  const handleDeleteSoundClick = (sound) => {
    setSoundToDelete(sound);
    setShowDeleteSoundModal(true);
  };

  const handleConfirmDeleteSound = async () => {
    if (!soundToDelete) return;

    const numericId = soundToDelete.id.replace('custom_', '');
    setIsDeletingSound(true);
    try {
      await preferencesAPI.deleteSound(numericId);
      toast.success('Sonido eliminado');

      if (localPreferences.notificationSound === soundToDelete.id) {
        handleLocalPreferenceChange('notificationSound', 'default');
      }

      await fetchCustomSounds();
      setShowDeleteSoundModal(false);
      setSoundToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar el sonido');
    } finally {
      setIsDeletingSound(false);
    }
  };

  const handleCancelDeleteSound = () => {
    setShowDeleteSoundModal(false);
    setSoundToDelete(null);
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, watch, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting } } = useForm();

  const onProfileSubmit = async (data) => {
    try {
      await usersAPI.updateProfile(data);
      toast.success('Perfil actualizado');
      checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error en la actualización');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await usersAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: UserCircleIcon, description: 'Administra tu información personal' },
    { id: 'security', label: 'Seguridad', icon: ShieldCheckIcon, description: 'Contraseña y seguridad de la cuenta' },
    { id: 'notifications', label: 'Notificaciones', icon: BellIcon, description: 'Configura alertas y sonidos' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <Cog6ToothIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Administra las preferencias de tu cuenta</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="card card-body p-3 sticky top-4">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                  <div>
                    <span className="font-medium block">{tab.label}</span>
                    <span className={`text-xs ${activeTab === tab.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {tab.description}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header mb-6">
                <div>
                  <h2 className="card-title">Información del Perfil</h2>
                  <p className="card-subtitle">Actualiza tus datos personales</p>
                </div>
              </div>
              <div className="card-body pt-0">
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5 max-w-md">
                  <div className="form-group">
                    <label className="label">Nombre Completo</label>
                    <input
                      type="text"
                      className={`input ${errors.nombre ? 'input-error' : ''}`}
                      {...register('nombre', { required: 'El nombre es requerido' })}
                    />
                    {errors.nombre && (
                      <p className="error-text">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label">Correo Electrónico</label>
                    <input
                      type="email"
                      className={`input ${errors.email ? 'input-error' : ''}`}
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Correo electrónico inválido',
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="error-text">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="form-actions mt-6 pt-0 border-0">
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                      {isSubmitting ? (
                        <>
                          <span className="spinner" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card card-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <KeyIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="card-title mb-1">Contraseña</h2>
                    <p className="text-gray-500 text-sm mb-4">
                      Cambia tu contraseña para mantener tu cuenta segura.
                    </p>
                    <button onClick={() => setShowPasswordModal(true)} className="btn-secondary">
                      <KeyIcon className="h-5 w-5" />
                      Cambiar Contraseña
                    </button>
                  </div>
                </div>
              </div>

              <div className="card card-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="card-title mb-1">Estado de la Cuenta</h2>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`badge ${user?.activo ? 'badge-success' : 'badge-danger'}`}>
                        {user?.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Miembro desde {new Date(user?.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-body border-red-200 bg-red-50/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="card-title text-red-700 mb-1">Zona de Peligro</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
                    </p>
                    <button
                      onClick={() => toast.error('La eliminación de cuenta requiere aprobación del administrador')}
                      className="btn-danger"
                    >
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Sound Settings */}
              <div className="card card-body">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <SpeakerWaveIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="card-title mb-0">Configuración de Sonido</h2>
                    <p className="card-subtitle">Elige tu sonido de notificación</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Built-in Sounds */}
                  <div>
                    <label className="label">Sonidos Integrados</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {NOTIFICATION_SOUNDS.map((sound) => (
                        <div
                          key={sound.id}
                          className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            localPreferences.notificationSound === sound.id
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleLocalPreferenceChange('notificationSound', sound.id)}
                        >
                          <span className={`font-medium ${
                            localPreferences.notificationSound === sound.id
                              ? 'text-indigo-700'
                              : 'text-gray-700'
                          }`}>
                            {sound.name}
                          </span>
                          {sound.id !== 'none' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                previewSound(sound.id);
                              }}
                              className="btn-icon-sm hover:bg-white/50"
                              title="Vista previa del sonido"
                            >
                              <PlayIcon className="h-4 w-4 text-gray-600" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Sounds */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">Mis Sonidos Personalizados</label>
                      <label className="btn-secondary btn-sm cursor-pointer">
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        {uploadingSound ? 'Subiendo...' : 'Subir Sonido'}
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                          onChange={handleSoundUpload}
                          disabled={uploadingSound}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {customSounds.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {customSounds.map((sound) => (
                          <div
                            key={sound.id}
                            className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              localPreferences.notificationSound === sound.id
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleLocalPreferenceChange('notificationSound', sound.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <MusicalNoteIcon className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                              <span className={`font-medium truncate ${
                                localPreferences.notificationSound === sound.id
                                  ? 'text-indigo-700'
                                  : 'text-gray-700'
                              }`}>
                                {sound.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewSound(sound.id);
                                }}
                                className="btn-icon-sm hover:bg-white/50"
                                title="Vista previa del sonido"
                              >
                                <PlayIcon className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSoundClick(sound);
                                }}
                                className="btn-icon-sm hover:bg-red-100"
                                title="Eliminar sonido"
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <MusicalNoteIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No hay sonidos personalizados subidos aún.<br />Sube tus propios archivos MP3, WAV o OGG.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Volume Control */}
                  <div>
                    <label className="label">Volumen</label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localPreferences.notificationVolume}
                        onChange={(e) => {
                          const volume = parseInt(e.target.value);
                          handleLocalPreferenceChange('notificationVolume', volume);
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                        {localPreferences.notificationVolume}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => previewSound(localPreferences.notificationSound)}
                      className="mt-3 btn-secondary btn-sm"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Probar Sonido
                    </button>
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="card card-body">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BellIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="card-title mb-0">Horas de Silencio</h2>
                    <p className="card-subtitle">Silenciar notificaciones durante horas específicas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Activar Horas de Silencio</p>
                      <p className="text-sm text-gray-500">Pausar todos los sonidos de notificación</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.quietHoursEnabled}
                        onChange={(e) => handleLocalPreferenceChange('quietHoursEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {localPreferences.quietHoursEnabled && (
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Hora de Inicio</label>
                        <input
                          type="time"
                          value={localPreferences.quietHoursStart}
                          onChange={(e) => handleLocalPreferenceChange('quietHoursStart', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Hora de Fin</label>
                        <input
                          type="time"
                          value={localPreferences.quietHoursEnd}
                          onChange={(e) => handleLocalPreferenceChange('quietHoursEnd', e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                {preferencesChanged && (
                  <span className="text-sm text-amber-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Cambios sin guardar
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPreferences || !preferencesChanged}
                  className="btn-primary px-8"
                >
                  {savingPreferences ? (
                    <>
                      <span className="spinner" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <Transition appear show={showPasswordModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPasswordModal(false)}>
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
                    <Dialog.Title className="modal-title">Cambiar Contraseña</Dialog.Title>
                    <button onClick={() => setShowPasswordModal(false)} className="btn-icon-sm hover:bg-gray-100">
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                    <div className="modal-body space-y-5">
                      <div className="form-group">
                        <label className="label">Contraseña Actual</label>
                        <input
                          type="password"
                          className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                          {...registerPassword('currentPassword', { required: 'La contraseña actual es requerida' })}
                        />
                        {passwordErrors.currentPassword && (
                          <p className="error-text">{passwordErrors.currentPassword.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="label">Nueva Contraseña</label>
                        <input
                          type="password"
                          className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                          {...registerPassword('newPassword', {
                            required: 'La nueva contraseña es requerida',
                            minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                          })}
                        />
                        {passwordErrors.newPassword && (
                          <p className="error-text">{passwordErrors.newPassword.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="label">Confirmar Nueva Contraseña</label>
                        <input
                          type="password"
                          className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                          {...registerPassword('confirmPassword', {
                            required: 'Por favor confirma tu contraseña',
                            validate: value => value === watch('newPassword') || 'Las contraseñas no coinciden',
                          })}
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="error-text">{passwordErrors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                        Cancelar
                      </button>
                      <button type="submit" disabled={isPasswordSubmitting} className="btn-primary">
                        {isPasswordSubmitting ? (
                          <>
                            <span className="spinner" />
                            Cambiando...
                          </>
                        ) : (
                          'Cambiar Contraseña'
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

      {/* Delete Sound Confirmation Modal */}
      <Transition appear show={showDeleteSoundModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCancelDeleteSound}>
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
                      Eliminar Sonido
                    </Dialog.Title>
                    <p className="text-gray-600 mb-4">
                      ¿Estás seguro de que deseas eliminar este sonido personalizado?
                    </p>

                    {soundToDelete && (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <MusicalNoteIcon className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{soundToDelete.name}</p>
                          {soundToDelete.filename && (
                            <p className="text-sm text-gray-500">{soundToDelete.filename}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer justify-center">
                    <button
                      type="button"
                      onClick={handleCancelDeleteSound}
                      className="btn-secondary"
                      disabled={isDeletingSound}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteSound}
                      className="btn-danger"
                      disabled={isDeletingSound}
                    >
                      {isDeletingSound ? (
                        <>
                          <span className="spinner" />
                          Eliminando...
                        </>
                      ) : (
                        'Eliminar'
                      )}
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

export default Settings;
