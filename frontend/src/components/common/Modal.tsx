import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  id,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <dialog
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm open:block"
      aria-labelledby="modal-title"
      onClose={onClose}
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${maxWidthClass} bg-slate-900 border-2 border-cyan-700/80 rounded-sm shadow-2xl shadow-cyan-950/40 z-10 my-8 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Mechanicus Terminal Top Bar (Inspired by pause menu / Mechanicus modal) */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border-b border-cyan-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-3.5 bg-cyan-400 inline-block" />
              <h2
                id="modal-title"
                className="font-serif text-lg font-bold uppercase tracking-wider text-cyan-200"
              >
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 font-mono mt-0.5 ml-4">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded border border-transparent hover:border-cyan-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {children}
        </div>
      </div>
    </dialog>
  );
};
