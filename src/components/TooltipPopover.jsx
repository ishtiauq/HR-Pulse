import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const GAP = 12
const DELAY = 150

export default function TooltipPopover({ label, isCollapsed, isDarkMode, children }) {
  const [pos, setPos] = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const show = useCallback(() => {
    const { x, y } = mouseRef.current
    const tooltipW = 180
    let left = x + GAP
    let top = y

    if (left + tooltipW > window.innerWidth - 16) {
      left = x - tooltipW - GAP
    }
    if (top < 12) top = 12
    if (top > window.innerHeight - 32) top = window.innerHeight - 32

    setPos({ left: `${left}px`, top: `${top}px`, transform: 'translateY(-50%)' })
    setVisible(true)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isCollapsed) return
    mouseRef.current = { x: e.clientX, y: e.clientY }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(show, DELAY)
  }, [isCollapsed, show])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  useEffect(() => {
    if (!visible) return
    const onScrollOrResize = () => {
      const { x, y } = mouseRef.current
      const tooltipW = 180
      let left = x + GAP
      let top = y
      if (left + tooltipW > window.innerWidth - 16) left = x - tooltipW - GAP
      if (top < 12) top = 12
      if (top > window.innerHeight - 32) top = window.innerHeight - 32
      setPos({ left: `${left}px`, top: `${top}px`, transform: 'translateY(-50%)' })
    }
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [visible])

  useEffect(() => {
    if (!isCollapsed) setVisible(false)
  }, [isCollapsed])

  const bgColor = isDarkMode
    ? 'rgba(30, 30, 35, 0.92)'
    : 'rgba(255, 255, 255, 0.92)'

  const textColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.92)'
    : 'rgba(0, 0, 0, 0.85)'

  const borderColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.55)'

  const shadow = isDarkMode
    ? '0 8px 24px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
    : '0 8px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'

  return (
    <>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
      {visible && pos && createPortal(
        <div style={{
          position: 'fixed',
          ...pos,
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'hrp-tooltip-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        }}>
          <div style={{
            background: bgColor,
            backdropFilter: 'blur(40px) saturate(250%)',
            WebkitBackdropFilter: 'blur(40px) saturate(250%)',
            border: `1px solid ${borderColor}`,
            borderRadius: '10px',
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            fontWeight: 500,
            lineHeight: '18px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
            letterSpacing: '-0.01em',
            color: textColor,
            boxShadow: shadow,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: `6px solid ${bgColor}`,
              filter: 'drop-shadow(-1px 0 1px rgba(0,0,0,0.04))',
            }} />
            {label}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
