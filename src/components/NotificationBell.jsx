import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition, Dialog } from '@headlessui/react';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotificationsStore } from '../store/useStore';
import notificationSound from '../utils/notificationSound';

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    fetchPreferences,
  } = useNotificationsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount().catch(console.error);
    fetchPreferences().catch(console.error);
  }, [fetchUnreadCount, fetchPreferences]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount().catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Update sound manager when preferences load
  useEffect(() => {
    if (preferences) {
      notificationSound.setEnabled(preferences.notificationsEnabled);
      notificationSound.setVolume(preferences.notificationVolume);
    }
  }, [preferences]);

  const handleOpen = async () => {
    if (notifications.length === 0) {
      setIsLoading(true);
      try {
        await fetchNotifications({ limit: 10 });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteClick = (e, notification) => {
    e.stopPropagation();
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;
    setIsDeleting(true);
    try {
      await deleteNotification(notificationToDelete.id);
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'reminder':
        return <CalendarIcon className="h-5 w-5 text-primary-500" />;
      case 'task':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-warning-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-primary-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-danger-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.slice(0, 10).map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          active ? 'bg-gray-50' : ''
                        } ${!notification.leido ? 'bg-primary-50' : ''}`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getNotificationIcon(notification.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.leido ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                            {notification.titulo}
                          </p>
                          {notification.mensaje && (
                            <p className="text-sm text-gray-500 truncate">
                              {notification.mensaje}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex items-start gap-1">
                          {!notification.leido && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-4 w-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteClick(e, notification)}
                            className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-3">
              <Link
                to="/settings"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Notification settings
              </Link>
            </div>
          )}
        </Menu.Items>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleCancelDelete}>
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
                        Delete Notification
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        Are you sure you want to delete this notification?
                      </p>
                    </div>
                  </div>

                  {notificationToDelete && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm">
                        {notificationToDelete.titulo}
                      </p>
                      {notificationToDelete.mensaje && (
                        <p className="text-sm text-gray-500 mt-1">
                          {notificationToDelete.mensaje}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="btn-secondary"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="btn-danger"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Menu>
  );
}

export default NotificationBell;
