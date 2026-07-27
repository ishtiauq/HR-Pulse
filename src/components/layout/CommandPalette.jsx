import { Search } from 'lucide-react'

export default function CommandPalette({ showCommandPalette, setShowCommandPalette, commandSearch, setCommandSearch, paletteIndex, setPaletteIndex, filteredItems, selectPaletteItem, getCategoryIcon }) {
  return (
    <>
      {showCommandPalette && (
        <div className="command-palette-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCommandPalette(false) }}>
          <div className="command-palette">
            <div className="command-palette-search-wrapper">
              <Search size={18} style={{ color: 'var(--color-md-sys-on-surface-variant)' }} />
              <input
                autoFocus
                className="command-palette-input"
                type="text"
                placeholder="Type a command or search..."
                value={commandSearch}
                onChange={(e) => {
                  setCommandSearch(e.target.value)
                  setPaletteIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    e.stopPropagation()
                    setPaletteIndex(prev => (prev + 1) % filteredItems.length)
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    e.stopPropagation()
                    setPaletteIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    selectPaletteItem(paletteIndex)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCommandPalette(false)
                    setCommandSearch('')
                    setPaletteIndex(0)
                  }
                }}
              />
            </div>
            <div className="command-palette-list">
              {filteredItems.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-md-sys-on-surface-variant)', fontSize: '0.9rem' }}>
                  No results found.
                </div>
              ) : (
                (() => {
                  let lastCategory = null
                  return filteredItems.map((item, index) => {
                    const showHeader = item.category !== lastCategory
                    lastCategory = item.category
                    return (
                      <div key={item.id}>
                        {showHeader && (
                          <div className="command-palette-section-header">
                            {item.category}
                          </div>
                        )}
                        <div
                          className={`command-palette-item ${paletteIndex === index ? 'active' : ''}`}
                          onClick={() => selectPaletteItem(index)}
                          onMouseEnter={() => setPaletteIndex(index)}
                        >
                          <div className="command-palette-item-left">
                            <span className="command-palette-item-icon">
                              {getCategoryIcon(item.category, item.id)}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          <span className="command-palette-item-shortcut">
                            {item.category === 'Pages' ? '\u23CE' : (item.category === 'Employees' ? 'View' : 'Action')}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
