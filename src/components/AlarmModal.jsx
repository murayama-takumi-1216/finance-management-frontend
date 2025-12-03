import { Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import notificationSound from '../utils/notificationSound';

function AlarmModal({ isOpen, onClose, onSnooze, reminder }) {
  const audioIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && reminder) {
      // Play sound immediately and repeat every 3 seconds
      notificationSound.play();
      audioIntervalRef.current = setInterval(() => {
        notificationSound.play();
      }, 3000);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    };
  }, [isOpen, reminder]);

  const handleOk = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    onClose();
  };

  const handleSnooze = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    onSnooze();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl transition-all">
                {/* Shaking Alarm Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
                    <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 animate-alarm-shake">
                      <BellAlertIcon className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <Dialog.Title className="text-2xl font-bold text-gray-900 mb-2">
                  Recordatorio
                </Dialog.Title>

                {/* Message */}
                <p className="text-lg text-gray-600 mb-2">
                  {reminder?.mensaje || 'Tienes un recordatorio'}
                </p>

                {/* Event info if available */}
                {reminder?.evento && (
                  <p className="text-sm text-indigo-600 font-medium mb-6">
                    {reminder.evento.titulo}
                  </p>
                )}

                {/* Time */}
                <p className="text-sm text-gray-500 mb-8">
                  {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSnooze}
                    className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Repetir en 5 minutos
                  </button>
                  <button
                    onClick={handleOk}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/25"
                  >
                    OK
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default AlarmModal;
