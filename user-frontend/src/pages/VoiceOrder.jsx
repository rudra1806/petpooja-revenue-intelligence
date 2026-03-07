import { useState, useRef, useCallback } from 'react'

const VOICE_API = 'http://localhost:3002'

export default function VoiceOrder({ sessionId }) {
  const [status, setStatus] = useState('idle') // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderCompleted, setOrderCompleted] = useState(false)

  const recognitionRef = useRef(null)
  const audioRef = useRef(null)

  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return null
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognitionRef.current = recognition
    return recognition
  }, [])

  const speak = useCallback(async (text) => {
    setStatus('speaking')
    try {
      const res = await fetch(`${VOICE_API}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.audio) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`)
        audioRef.current = audio
        audio.play()
        audio.onended = () => {
          setStatus('idle')
          if (!orderCompleted) {
            startListening()
          }
        }
        return
      }
    } catch {
      // TTS failed — fall back to browser speech synthesis
    }

    // Fallback: browser TTS
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.onend = () => {
      setStatus('idle')
      if (!orderCompleted) {
        startListening()
      }
    }
    window.speechSynthesis.speak(utterance)
  }, [orderCompleted])

  const processResponse = useCallback(async (text) => {
    setStatus('processing')
    setTranscript(prev => [...prev, { role: 'user', text }])

    try {
      const res = await fetch(`${VOICE_API}/parse-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text }),
      })
      const data = await res.json()

      let responseText = ''

      if (data.clarification) {
        responseText = data.clarification
      } else if (data.message) {
        responseText = data.message
      } else if (data.order) {
        const items = (data.order.items || []).map(i => `${i.quantity} ${i.name}`)
        responseText = `You ordered ${items.join(', ')}.`
        setCurrentOrder(data.order)
      }

      if (data.upsell) {
        responseText += ' ' + data.upsell
      }

      if (data.completed) {
        setOrderCompleted(true)
        responseText = data.message || `Order confirmed! Your order ID is ${data.order_id}. Total: rupees ${data.total}. Thank you!`
      }

      if (!responseText) {
        responseText = 'I got that. What else would you like?'
      }

      setTranscript(prev => [...prev, { role: 'bot', text: responseText }])
      speak(responseText)
    } catch {
      const errMsg = 'Sorry, something went wrong. Please try again.'
      setTranscript(prev => [...prev, { role: 'bot', text: errMsg }])
      speak(errMsg)
    }
  }, [sessionId, speak])

  const startListening = useCallback(() => {
    if (orderCompleted) return
    const recognition = getRecognition()
    if (!recognition) {
      setTranscript(prev => [...prev, { role: 'bot', text: 'Speech recognition is not supported in this browser. Please use Chrome.' }])
      return
    }

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      processResponse(text)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech error:', e.error)
      }
      setStatus('idle')
    }

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle')
      }
    }

    try {
      recognition.start()
      setStatus('listening')
    } catch {
      // Already started
    }
  }, [getRecognition, processResponse, orderCompleted, status])

  const handleMicClick = () => {
    if (status === 'listening') {
      recognitionRef.current?.stop()
      setStatus('idle')
    } else if (status === 'idle') {
      startListening()
    }
  }

  const resetOrder = () => {
    setTranscript([])
    setCurrentOrder(null)
    setOrderCompleted(false)
    setStatus('idle')
  }

  const statusLabels = {
    idle: 'Tap the mic to start ordering',
    listening: 'Listening... speak now',
    processing: 'Processing your order...',
    speaking: 'AI is responding...',
  }

  return (
    <>
      <div className="page-header">
        <h2>Voice Ordering</h2>
        <p>Speak to place your order hands-free</p>
      </div>

      <div className="voice-container">
        <button
          className={`voice-btn ${status}`}
          onClick={handleMicClick}
          disabled={status === 'processing' || status === 'speaking'}
        >
          {status === 'listening' ? '🔴' : status === 'speaking' ? '🔊' : status === 'processing' ? '⏳' : '🎤'}
        </button>

        <p className="voice-status">{statusLabels[status]}</p>

        {orderCompleted && (
          <button
            onClick={resetOrder}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            New Order
          </button>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="voice-transcript">
            {transcript.map((t, i) => (
              <div key={i} className={`transcript-item ${t.role}`}>
                <strong>{t.role === 'user' ? 'You' : 'AI'}:</strong> {t.text}
              </div>
            ))}
          </div>
        )}

        {/* Current order summary */}
        {currentOrder && (currentOrder.items?.length > 0 || currentOrder.combos?.length > 0) && (
          <div className="voice-order-summary">
            <div className="card">
              <div className="card-header">
                <h3>Current Order</h3>
                {orderCompleted && <span className="badge" style={{ background: 'var(--positive-subtle)', color: 'var(--positive)' }}>Confirmed</span>}
              </div>
              {(currentOrder.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{item.quantity}x</span> {item.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{'\u20B9'}{item.base_price * item.quantity}</span>
                </div>
              ))}
              {(currentOrder.combos || []).map((c, i) => (
                <div key={`c-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{c.quantity}x</span> {c.combo_name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{'\u20B9'}{c.combo_price * c.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
