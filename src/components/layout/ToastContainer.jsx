export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="global-toast-container gap-2 sm:gap-3" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div key={toast.id} className={`global-toast ${toast.type}`} role="alert">
          <div className="global-toast-content p-3 sm:p-4">
            <span className="global-toast-type-dot" />
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button className="global-toast-action"
                onClick={() => { toast.action.onClick(); removeToast(toast.id); }}>
                {toast.action.label}
              </button>
            )}
          </div>
          <div className="toast-progress" aria-hidden="true">
            <div className="toast-progress-bar" />
          </div>
        </div>
      ))}
    </div>
  )
}
