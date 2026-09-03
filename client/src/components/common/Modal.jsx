import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-6xl',
  }[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/60 backdrop-blur-xs">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container Card */}
      <div
        className={`relative w-full ${sizeClasses} max-h-[92vh] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-surface-container-high animate-in fade-in zoom-in-95 duration-150 z-10`}
      >
        {/* Modal Header */}
        <div className="px-space-xl py-space-md bg-primary-container text-on-primary flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">sensor_door</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline-md text-headline-md font-bold leading-tight text-on-primary">
                {title || 'Sridevi Residency'}
              </h3>
              <span className="font-label-md text-label-md text-on-primary-container">
                {subtitle || 'Lodge Management • 24-Hour Cycle'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-on-primary-container hover:text-on-primary p-space-xs rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-space-xl overflow-y-auto flex-1 text-on-surface">
          {children}
        </div>
      </div>
    </div>
  );
}
