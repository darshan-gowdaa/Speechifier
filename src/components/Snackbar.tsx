"use client";

import { useEffect, useRef } from 'react';

export interface SnackbarItem {
  id: number;
  message: string;
  type: 'default' | 'error' | 'success';
}

interface SnackbarProps {
  item: SnackbarItem;
  stackOffset: number; // 0 = front, higher = further back
  onDismiss: (id: number) => void;
  actionLabel?: string;
  onAction?: () => void;
}

const AUTO_DISMISS_MS = 5000;

export function Snackbar({ item, stackOffset, onDismiss, actionLabel, onAction }: SnackbarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, onDismiss]);

  const bg =
    item.type === 'error'
      ? 'var(--md-sys-color-error-container)'
      : item.type === 'success'
      ? 'var(--md-sys-color-tertiary-container)'
      : '#1A2B3C';

  const fg =
    item.type === 'error'
      ? 'var(--md-sys-color-on-error-container)'
      : item.type === 'success'
      ? 'var(--md-sys-color-on-tertiary)'
      : '#E0EEF8';

  const icon =
    item.type === 'error' ? (
      // Error circle icon
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ) : item.type === 'success' ? (
      // Checkmark icon
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      // Info icon
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: `${24 + stackOffset * 64}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'min(calc(100vw - 32px), 480px)',
        animation: 'snackbar-in var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-expressive) both',
      }}
    >
      <div
        style={{
          backgroundColor: bg,
          color: fg,
          borderRadius: '24px 8px 24px 8px', // Expressive shape
          padding: '16px 20px', // slightly more padding for expressive feel
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.12), 0px 2px 6px rgba(0,0,0,0.08)',
          minHeight: '60px',
        }}
      >
        <span style={{ flexShrink: 0 }}>{icon}</span>

        <span
          style={{
            flex: 1,
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            fontWeight: 400,
            letterSpacing: '0.015625rem',
          }}
        >
          {item.message}
        </span>

        {actionLabel && (
          <button
            onClick={() => {
              onAction?.();
              onDismiss(item.id);
            }}
            style={{
              flexShrink: 0,
              color: 'var(--md-sys-color-primary)',
              fontWeight: 500,
              fontSize: '0.875rem',
              letterSpacing: '0.00625rem',
              padding: '4px 8px',
              borderRadius: '50px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </button>
        )}

        {/* Dismiss X */}
        <button
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.7,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
