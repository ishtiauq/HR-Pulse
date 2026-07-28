import { X, Bell } from 'lucide-react'

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:left-auto z-[100] flex max-h-screen w-full flex-col p-4 sm:max-w-[420px] gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div key={toast.id}
          className="pointer-events-auto group relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border border-border bg-background p-4 pr-6 text-foreground shadow-lg transition-all"
          role="alert"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex items-start gap-3 flex-1 w-full">
            <Bell size={18} className="shrink-0 mt-0.5 text-muted-foreground" />
            <p className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              {toast.action && (
                <button onClick={() => { toast.action.onClick(); removeToast(toast.id) }}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive pointer-events-auto">
                  {toast.action.label}
                </button>
              )}
              <button onClick={() => removeToast(toast.id)}
                className="absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 pointer-events-auto cursor-pointer border-none bg-transparent">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-muted" aria-hidden="true">
            <div className="h-full bg-primary/50"
              style={{ animation: 'shrink 4s linear' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
