import { useEffect, useState } from 'react';
import { AppStatus } from '../types';
import { STATUS_LABEL } from '../utils';

/* ── Spinner ──────────────────────────────────────────────── */
export function Spinner({ size = '1em' }: { size?: string }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Memuat"
    />
  );
}

/* ── Skeleton block ───────────────────────────────────────── */
export function Skeleton({
  width = '100%',
  height = '1rem',
  style,
}: {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{ display: 'block', width, height, ...style }}
    />
  );
}

/* ── Skeleton card for job list ───────────────────────────── */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="1.1rem" width="70%" style={{ marginBottom: '0.6rem' }} />
      <Skeleton height="0.85rem" width="45%" style={{ marginBottom: '0.5rem' }} />
      <Skeleton height="0.85rem" width="60%" style={{ marginBottom: '1rem' }} />
      <Skeleton height="0.85rem" width="35%" />
    </div>
  );
}

/* ── Loading button ───────────────────────────────────────── */
export function LoadingButton({
  loading,
  loadingLabel,
  children,
  className = 'btn',
  disabled,
  type = 'submit',
  onClick,
  style,
}: {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'submit' | 'button' | 'reset';
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={loading || disabled}
      aria-busy={loading}
      onClick={onClick}
      style={style}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ── Status Badge ─────────────────────────────────────────── */
export const StatusBadge = ({ status }: { status: AppStatus }) => (
  <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>
);

/* ── Error Box ────────────────────────────────────────────── */
export const ErrorBox = ({ message }: { message: string }) =>
  message ? (
    <div className="alert" role="alert" aria-live="assertive">
      <svg className="alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
      {message}
    </div>
  ) : null;

/* ── Toast / success feedback ─────────────────────────────── */
interface ToastMsg { id: number; text: string; variant?: 'success' | 'default' }

let _setToasts: React.Dispatch<React.SetStateAction<ToastMsg[]>> | null = null;

export function showToast(text: string, variant: 'success' | 'default' = 'success') {
  if (_setToasts) {
    const id = Date.now();
    _setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      _setToasts?.((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);
  if (toasts.length === 0) return null;
  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.variant === 'success' ? ' toast-success' : ''}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
