import { useEffect } from 'react';

export interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  visible: boolean;
  type?: 'default' | 'error' | 'success';
}

export function Snackbar({ message, actionLabel, onAction, onDismiss, visible, type = 'default' }: SnackbarProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const isError = type === 'error';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 md:px-0 w-full md:w-auto animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
      <div 
        className={`md3-shape-xs md3-elevation-3 flex items-center justify-between min-h-[48px] px-4 py-3 min-w-min md:min-w-[344px] max-w-[600px] transition-colors
          ${isError ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]' : 'bg-[#322F35] text-[#E6E0E9]'}
        `}
      >
        <div className="flex items-center gap-3">
          {type === 'error' && (
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {type === 'success' && (
            <svg className="w-5 h-5 shrink-0 text-[var(--md-sys-color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="md3-body-medium">{message}</span>
        </div>
        
        {actionLabel && (
          <button 
            onClick={onAction}
            className={`md3-label-large shrink-0 ml-4 hover:bg-white/10 px-2 py-1 rounded transition-colors
              ${isError ? 'text-[var(--md-sys-color-on-error-container)]' : 'text-[var(--md-sys-color-primary)]'}
            `}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
