'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 text-black dark:text-white rounded-lg shadow-lg p-6 w-full max-w-md"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            aria-label="Close modal"
          >
            ×
          </button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}