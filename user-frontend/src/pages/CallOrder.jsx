export default function CallOrder() {
  const RESTAURANT_PHONE = '+14302491367'
  const DISPLAY_NUMBER = '+1 (430) 249-1367'

  return (
    <>
      <div className="page-header">
        <h2>Call to Order</h2>
        <p>Speak directly with our AI assistant over the phone</p>
      </div>

      <div className="voice-container">
        {/* Phone icon */}
        <a
          href={`tel:${RESTAURANT_PHONE}`}
          className="voice-btn"
          style={{ textDecoration: 'none', background: 'var(--positive-subtle)', borderColor: 'var(--positive)' }}
        >
          📞
        </a>

        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
          {DISPLAY_NUMBER}
        </p>

        <a
          href={`tel:${RESTAURANT_PHONE}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 32px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--positive)',
            background: 'var(--positive)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background 150ms ease',
          }}
        >
          Call Now
        </a>

        {/* Info cards */}
        <div style={{ width: '100%', maxWidth: 500, marginTop: 12 }}>
          <div className="card">
            <div className="card-header">
              <h3>How it works</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>1</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Call the number</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tap "Call Now" or dial the number above</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>2</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Speak your order</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Our AI assistant will take your order, suggest combos, and confirm</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>3</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Order placed!</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Your order will appear in "My Orders" once confirmed</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            Powered by AI voice assistant with Sarvam TTS
          </div>
        </div>
      </div>
    </>
  )
}
