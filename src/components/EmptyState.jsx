import { FileText } from 'lucide-react'

export default function EmptyState({ icon: Icon = FileText, title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && action}
    </div>
  )
}
