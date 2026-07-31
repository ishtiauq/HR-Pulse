export default function MobileTabButton({ active, label, onClick, children, badge, className = "" }) {
  return (
    <button
      role="tab"
      aria-label={label}
      title={label}
      aria-selected={active}
      onClick={onClick}
      className={`relative flex items-center justify-center border-0 cursor-pointer size-11 sm:size-12 rounded-full transition-all bg-transparent outline-none select-none tap-highlight-transparent ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'} ${className}`}
    >
      {children}
      {badge}
    </button>
  )
}
