import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${danger ? 'bg-red-100' : 'bg-gold-100'}`}>
                <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-gold-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-surface-900">{title}</h3>
                <p className="text-sm text-surface-500 mt-1">{message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg ${
                  danger
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
                    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/25'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
