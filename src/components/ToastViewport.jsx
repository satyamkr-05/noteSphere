export default function ToastViewport({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          style={toast.leaving ? { opacity: 0, transform: "translateY(12px)" } : undefined}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
