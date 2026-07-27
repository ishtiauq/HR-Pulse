export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="global-toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`global-toast ${toast.type}`}>
          <div className="global-toast-content">
            <span className="global-toast-type-dot" />
            <span style={{ flex: 1 }}>{toast.message}</span>
            {toast.action && (
              <button className="global-toast-action"
                onClick={() => { toast.action.onClick(); removeToast(toast.id); }}>
                {toast.action.label}
              </button>
            )}
          </div>
          <div className="toast-progress">
            <div className="toast-progress-bar" />
          </div>
        </div>
      ))}
    </div>
  )
}
