import { useEffect } from 'react'

export default function AdSlot({ type = 'horizontal', style = {} }) {
  useEffect(() => {
    // If in production, you can trigger Google Adsense push:
    // try {
    //   (window.adsbygoogle = window.adsbygoogle || []).push({});
    // } catch (e) {
    //   console.error("AdSense trigger failed:", e);
    // }
  }, [])

  // Dynamic layout styling depending on the ad type
  const isHorizontal = type === 'horizontal'
  const isCard = type === 'card'

  const containerStyle = {
    background: 'var(--bg-secondary)',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '20px',
    minHeight: isHorizontal ? '90px' : isCard ? '160px' : '250px',
    width: '100%',
    ...style
  }

  return (
    <div style={containerStyle}>
      {/* Label */}
      <span style={{
        position: 'absolute',
        top: '6px',
        left: '12px',
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 600
      }}>
        Advertisement
      </span>

      {/* Simulated/Mock Ad Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* AdSense Logo Emblem */}
          <span style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.6rem',
            fontWeight: 700,
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            AdSense
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Google Sponsor Banner
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          (Keeps HR Pulse 100% Free)
        </span>
      </div>

      {/* Real AdSense Element Placeholder */}
      {/* 
        To enable real ads, uncomment the script in index.html, 
        and configure the fields below with your actual data-ad-client and data-ad-slot:
      */}
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', height: '100%' }}
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="XXXXXXXXXX"
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    </div>
  )
}
