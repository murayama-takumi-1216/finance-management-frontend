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
  ArrowUpTrayIcon,
  TrashIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
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

  // Local state for notification preferences (for Save button approach)
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

  // Fetch custom sounds
  const fetchCustomSounds = async () => {
    try {
      const { data } = await preferencesAPI.getSounds();
      setCustomSounds(data.custom || []);
    } catch (error) {
      console.error('Failed to fetch custom sounds:', error);
    }
  };

  // Sync local preferences with fetched preferences
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

  // Load preferences and custom sounds when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      if (!preferences) {
        fetchPreferences().catch(console.error);
      }
      fetchCustomSounds();
    }
  }, [activeTab, preferences, fetchPreferences]);

  // Update notification sound manager when preferences change
  useEffect(() => {
    if (preferences) {
      notificationSound.setEnabled(preferences.notificationsEnabled);
      notificationSound.setVolume(preferences.notificationVolume);
    }
  }, [preferences]);

  // Handle local preference change (doesn't save to backend yet)
  const handleLocalPreferenceChange = (key, value) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setPreferencesChanged(true);

    // Update sound manager in real-time for volume
    if (key === 'notificationVolume') {
      notificationSound.setVolume(value);
    }
  };

  // Save all preferences to backend
  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await updatePreferences(localPreferences);
      toast.success('Settings saved successfully');
      setPreferencesChanged(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingPreferences(false);
    }
  };

  const previewSound = (soundId) => {
    // Find the sound URL if it's a custom sound
    const customSound = customSounds.find(s => s.id === soundId);
    // Custom sounds URL should use base URL without /api suffix
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    const customUrl = customSound ? `${baseUrl}${customSound.url}` : null;
    notificationSound.preview(soundId, localPreferences.notificationVolume, customUrl);
  };

  // Handle custom sound upload
  const handleSoundUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid audio file (MP3, WAV, or OGG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingSound(true);
    try {
      const formData = new FormData();
      formData.append('sound', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension for name

      const { data } = await preferencesAPI.uploadSound(formData);
      toast.success('Sound uploaded successfully');

      // Refresh custom sounds list
      await fetchCustomSounds();

      // Select the newly uploaded sound
      handleLocalPreferenceChange('notificationSound', data.sound.id);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload sound');
    } finally {
      setUploadingSound(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle custom sound deletion - show modal
  const handleDeleteSoundClick = (sound) => {
    setSoundToDelete(sound);
    setShowDeleteSoundModal(true);
  };

  // Confirm delete sound
  const handleConfirmDeleteSound = async () => {
    if (!soundToDelete) return;

    const numericId = soundToDelete.id.replace('custom_', '');
    setIsDeletingSound(true);
    try {
      await preferencesAPI.deleteSound(numericId);
      toast.success('Sound deleted');

      // If this was the selected sound, switch to default
      if (localPreferences.notificationSound === soundToDelete.id) {
        handleLocalPreferenceChange('notificationSound', 'default');
      }

      // Refresh custom sounds list
      await fetchCustomSounds();
      setShowDeleteSoundModal(false);
      setSoundToDelete(null);
    } catch (error) {
      toast.error('Failed to delete sound');
    } finally {
      setIsDeletingSound(false);
    }
  };

  // Cancel delete sound
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
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
              {/* Notification Sound Settings */}
              <div className="card">
                <h2 className="card-title mb-6">
                  <SpeakerWaveIcon className="h-5 w-5 inline mr-2" />
                  Sound Settings
                </h2>
                <div className="space-y-6">
                  {/* Built-in Sound Selection */}
                  <div>
                    <label className="label">Built-in Sounds</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {NOTIFICATION_SOUNDS.map((sound) => (
                        <div
                          key={sound.id}
                          className={`relative flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            localPreferences.notificationSound === sound.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleLocalPreferenceChange('notificationSound', sound.id)}
                        >
                          <span className={`font-medium ${
                            localPreferences.notificationSound === sound.id
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

                  {/* Custom Sounds */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">My Custom Sounds</label>
                      <label className="btn-secondary text-sm cursor-pointer">
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                        {uploadingSound ? 'Uploading...' : 'Upload Sound'}
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
                            className={`relative flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              localPreferences.notificationSound === sound.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleLocalPreferenceChange('notificationSound', sound.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <MusicalNoteIcon className="h-4 w-4 flex-shrink-0 text-primary-500" />
                              <span className={`font-medium truncate ${
                                localPreferences.notificationSound === sound.id
                                  ? 'text-primary-700'
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
                                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                                title="Preview sound"
                              >
                                <PlayIcon className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSoundClick(sound);
                                }}
                                className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                                title="Delete sound"
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No custom sounds uploaded yet. Upload your own MP3, WAV, or OGG files.
                      </p>
                    )}
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
                        value={localPreferences.notificationVolume}
                        onChange={(e) => {
                          const volume = parseInt(e.target.value);
                          handleLocalPreferenceChange('notificationVolume', volume);
                        }}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-600 w-10">
                        {localPreferences.notificationVolume}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => previewSound(localPreferences.notificationSound)}
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
                        checked={localPreferences.quietHoursEnabled}
                        onChange={(e) => handleLocalPreferenceChange('quietHoursEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {localPreferences.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="label">Start Time</label>
                        <input
                          type="time"
                          value={localPreferences.quietHoursStart}
                          onChange={(e) => handleLocalPreferenceChange('quietHoursStart', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">End Time</label>
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPreferences || !preferencesChanged}
                  className="btn-primary px-8"
                >
                  {savingPreferences ? 'Saving...' : 'Save'}
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        Delete Sound
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        Are you sure you want to delete this custom sound?
                      </p>
                    </div>
                  </div>

                  {soundToDelete && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <MusicalNoteIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {soundToDelete.name}
                        </p>
                        {soundToDelete.filename && (
                          <p className="text-sm text-gray-500">
                            {soundToDelete.filename}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelDeleteSound}
                      className="btn-secondary"
                      disabled={isDeletingSound}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteSound}
                      className="btn-danger"
                      disabled={isDeletingSound}
                    >
                      {isDeletingSound ? 'Deleting...' : 'Delete'}
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
