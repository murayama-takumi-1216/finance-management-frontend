import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import { usersAPI, integrationsAPI } from '../../services/api';
import notificationSound, { NOTIFICATION_SOUNDS } from '../../utils/notificationSound';

function Settings() {
  const { user, checkAuth } = useAuthStore();
  const { preferences, fetchPreferences, updatePreferences } = useNotificationsStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [localVolume, setLocalVolume] = useState(80);

  // Sync local volume with preferences
  useEffect(() => {
    if (preferences?.notificationVolume !== undefined) {
      setLocalVolume(preferences.notificationVolume);
    }
  }, [preferences?.notificationVolume]);

  // Load preferences when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && !preferences) {
      fetchPreferences().catch(console.error);
    }
  }, [activeTab, preferences, fetchPreferences]);

  // Update notification sound manager when preferences change
  useEffect(() => {
    if (preferences) {
      notificationSound.setEnabled(preferences.notificationsEnabled);
      notificationSound.setVolume(preferences.notificationVolume);
    }
  }, [preferences]);

  const handlePreferenceChange = async (key, value) => {
    setSavingPreferences(true);
    try {
      await updatePreferences({ [key]: value });
      toast.success('Preference saved');
    } catch (error) {
      toast.error('Failed to save preference');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSoundChange = async (soundId) => {
    await handlePreferenceChange('notificationSound', soundId);
  };

  const handleVolumeChange = async (volume) => {
    notificationSound.setVolume(volume);
    await handlePreferenceChange('notificationVolume', volume);
  };

  const previewSound = (soundId) => {
    notificationSound.preview(soundId, localVolume);
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
      toast.success('Profile updated');
      checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await usersAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password change failed');
    }
  };

  const loadIntegrations = async () => {
    if (integrations.length > 0) return;
    setLoadingIntegrations(true);
    try {
      const { data } = await integrationsAPI.getAll();
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations');
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    try {
      toast.loading('Connecting to Google Calendar...');
      // This would typically redirect to OAuth flow
      // For now, show a placeholder
      toast.dismiss();
      toast.success('Google Calendar integration coming soon!');
      setShowCalendarModal(false);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to connect');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'integrations', label: 'Integrations', icon: DevicePhoneMobileIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'integrations') loadIntegrations();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="card-title mb-6">Profile Information</h2>
              <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className={`input ${errors.nombre ? 'input-error' : ''}`}
                    {...register('nombre', { required: 'Name is required' })}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-danger-600">{errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="card-title mb-6">Password</h2>
                <p className="text-gray-600 mb-4">
                  Change your password to keep your account secure.
                </p>
                <button onClick={() => setShowPasswordModal(true)} className="btn-secondary">
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Change Password
                </button>
              </div>

              <div className="card">
                <h2 className="card-title mb-6">Account Status</h2>
                <div className="flex items-center gap-3">
                  <span className={`badge ${user?.activo ? 'badge-success' : 'badge-danger'}`}>
                    {user?.activo ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-gray-500">
                    Member since {new Date(user?.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="card border-danger-200">
                <h2 className="card-title text-danger-600 mb-4">Danger Zone</h2>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => toast.error('Account deletion requires admin approval')}
                  className="btn-danger"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* General Notification Settings */}
              <div className="card">
                <h2 className="card-title mb-6">General Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Enable Notifications</p>
                      <p className="text-sm text-gray-500">Receive in-app notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.notificationsEnabled ?? true}
                        onChange={(e) => handlePreferenceChange('notificationsEnabled', e.target.checked)}
                        disabled={savingPreferences}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Browser Notifications</p>
                      <p className="text-sm text-gray-500">Show desktop notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.browserNotifications ?? true}
                        onChange={(e) => handlePreferenceChange('browserNotifications', e.target.checked)}
                        disabled={savingPreferences}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates about your account activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.emailNotifications ?? true}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        disabled={savingPreferences}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification Sound Settings */}
              <div className="card">
                <h2 className="card-title mb-6">
                  <SpeakerWaveIcon className="h-5 w-5 inline mr-2" />
                  Sound Settings
                </h2>
                <div className="space-y-6">
                  {/* Sound Selection */}
                  <div>
                    <label className="label">Notification Sound</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {NOTIFICATION_SOUNDS.map((sound) => (
                        <div
                          key={sound.id}
                          className={`relative flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            preferences?.notificationSound === sound.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSoundChange(sound.id)}
                        >
                          <span className={`font-medium ${
                            preferences?.notificationSound === sound.id
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
                                previewSound(sound.id);
                              }}
                              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                              title="Preview sound"
                            >
                              <PlayIcon className="h-4 w-4 text-gray-600" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div>
                    <label className="label">Volume</label>
                    <div className="flex items-center gap-4">
                      <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localVolume}
                        onChange={(e) => {
                          const volume = parseInt(e.target.value);
                          setLocalVolume(volume);
                          notificationSound.setVolume(volume);
                        }}
                        onMouseUp={(e) => handleVolumeChange(parseInt(e.target.value))}
                        onTouchEnd={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-600 w-10">
                        {localVolume}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => previewSound(preferences?.notificationSound || 'default')}
                      className="mt-3 btn-secondary text-sm"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Test Sound
                    </button>
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="card">
                <h2 className="card-title mb-6">Quiet Hours</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Enable Quiet Hours</p>
                      <p className="text-sm text-gray-500">Mute notifications during specified hours</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.quietHoursEnabled ?? false}
                        onChange={(e) => handlePreferenceChange('quietHoursEnabled', e.target.checked)}
                        disabled={savingPreferences}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {preferences?.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="label">Start Time</label>
                        <input
                          type="time"
                          value={preferences?.quietHoursStart || '22:00'}
                          onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">End Time</label>
                        <input
                          type="time"
                          value={preferences?.quietHoursEnd || '08:00'}
                          onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="card-title mb-6">Calendar Integration</h2>
                <p className="text-gray-600 mb-4">
                  Sync your financial events and payment reminders with your calendar.
                </p>
                <button onClick={() => setShowCalendarModal(true)} className="btn-secondary">
                  <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                  Connect Calendar
                </button>
              </div>

              <div className="card">
                <h2 className="card-title mb-6">Connected Services</h2>
                {loadingIntegrations ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-16 bg-gray-200 rounded" />
                    <div className="h-16 bg-gray-200 rounded" />
                  </div>
                ) : integrations.length > 0 ? (
                  <div className="space-y-3">
                    {integrations.map(integration => (
                      <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{integration.proveedor}</p>
                            <p className="text-sm text-gray-500">
                              {integration.activo ? 'Connected' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${integration.activo ? 'badge-success' : 'badge-gray'}`}>
                          {integration.activo ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No integrations connected yet</p>
                )}
              </div>

              <div className="card">
                <h2 className="card-title mb-4">Available Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">G</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Google Calendar</p>
                        <p className="text-xs text-gray-500">Sync events</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCalendarModal(true)}
                      className="w-full btn-secondary text-sm"
                    >
                      Connect
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">O</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Outlook Calendar</p>
                        <p className="text-xs text-gray-500">Sync events</p>
                      </div>
                    </div>
                    <button className="w-full btn-secondary text-sm" disabled>
                      Coming Soon
                    </button>
                  </div>
                </div>
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
                    <Dialog.Title className="text-lg font-semibold">Change Password</Dialog.Title>
                    <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="label">Current Password</label>
                      <input
                        type="password"
                        className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                        {...registerPassword('currentPassword', { required: 'Current password is required' })}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-danger-600">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">New Password</label>
                      <input
                        type="password"
                        className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                        {...registerPassword('newPassword', {
                          required: 'New password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        })}
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-danger-600">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Confirm New Password</label>
                      <input
                        type="password"
                        className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                        {...registerPassword('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: value => value === watch('newPassword') || 'Passwords do not match',
                        })}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-danger-600">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" disabled={isPasswordSubmitting} className="btn-primary flex-1">
                        {isPasswordSubmitting ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Calendar Integration Modal */}
      <Transition appear show={showCalendarModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCalendarModal(false)}>
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
                    <Dialog.Title className="text-lg font-semibold">Connect Calendar</Dialog.Title>
                    <button onClick={() => setShowCalendarModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">
                    Connect your calendar to sync financial events and payment reminders automatically.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleGoogleCalendarConnect}
                      className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 font-bold">G</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Google Calendar</p>
                        <p className="text-sm text-gray-500">Connect with Google</p>
                      </div>
                    </button>

                    <button
                      disabled
                      className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">O</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Outlook Calendar</p>
                        <p className="text-sm text-gray-500">Coming soon</p>
                      </div>
                    </button>

                    <button
                      disabled
                      className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 font-bold">A</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Apple Calendar</p>
                        <p className="text-sm text-gray-500">Coming soon</p>
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <button onClick={() => setShowCalendarModal(false)} className="w-full btn-secondary">
                      Cancel
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
