import { useState, useRef, useEffect, useCallback } from 'react'
import FloatingBackground from './components/FloatingBackground'
import OrderCard from './components/OrderCard'
import OrderSummary from './components/OrderSummary'
import BillPreview from './components/BillPreview'

const API = 'http://localhost:3001'

/* ── Session ID ───────────────────────────────────── */
function getSessionId() {
    let id = sessionStorage.getItem('voiceSessionId')
    if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem('voiceSessionId', id)
    }
    return id
}

/* ── Speech Recognition setup ─────────────────────── */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function App() {
    const [status, setStatus] = useState('idle')
    const [transcript, setTranscript] = useState('')
    const [order, setOrder] = useState({ items: [], combos: [] })
    const [newCards, setNewCards] = useState([])
    const [upsell, setUpsell] = useState(null)
    const [message, setMessage] = useState(null)
    const [billData, setBillData] = useState(null)
    const [prompt, setPrompt] = useState('What would you like to order?')

    // === REFS for stable access inside callbacks (no stale closures) ===
    const recognitionRef = useRef(null)
    const isListeningRef = useRef(false)
    const sessionIdRef = useRef(getSessionId())
    const orderRef = useRef(order)
    const statusRef = useRef(status)
    const billDoneRef = useRef(false)

    // Keep refs in sync with state
    useEffect(() => { orderRef.current = order }, [order])
    useEffect(() => { statusRef.current = status }, [status])

    /* ──────────────────────────────────────────────────
       SPEAK — text-to-speech, then auto-restart mic
       ────────────────────────────────────────────────── */
    const speakText = useCallback((text) => {
        setStatus('speaking')
        setPrompt(text)

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-IN'
        utterance.rate = 1.0

        utterance.onend = () => {
            setStatus('idle')
            // Don't auto-restart if bill was just shown
            if (!billDoneRef.current) {
                setTimeout(() => doStartListening(), 400)
            }
        }

        speechSynthesis.cancel()
        // Small delay after cancel to fix Chrome bug
        setTimeout(() => speechSynthesis.speak(utterance), 120)
    }, [])   // NO deps — uses refs and doStartListening (hoisted)

    /* ──────────────────────────────────────────────────
       START LISTENING — create recognition + begin
       ────────────────────────────────────────────────── */
    function doStartListening() {
        if (!SpeechRecognition) {
            setMessage('Speech Recognition not supported. Use Chrome.')
            return
        }
        if (isListeningRef.current) return

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-IN'
        recognitionRef.current = recognition

        recognition.onstart = () => {
            isListeningRef.current = true
            setStatus('listening')
            setPrompt("I'm listening...")
            setUpsell(null)
        }

        recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript
            setTranscript(text)
            setStatus('processing')
            setPrompt('Processing...')
            isListeningRef.current = false

            try {
                const res = await fetch(`${API}/parse-order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, sessionId: sessionIdRef.current })
                })
                const data = await res.json()

                // ── Order completed ──
                if (data.completed) {
                    billDoneRef.current = true
                    setBillData({
                        items: data.order?.items || [],
                        combos: data.order?.combos || [],
                        orderId: data.order_id || ''
                    })
                    setOrder({ items: [], combos: [] })
                    speakText(data.message || 'Order confirmed!')
                    setPrompt('Order complete!')
                    sessionStorage.removeItem('voiceSessionId')
                    sessionIdRef.current = getSessionId()
                    return
                }

                // ── Clarification ──
                if (data.clarification) {
                    speakText(data.clarification)
                    setPrompt(data.clarification)
                    return
                }

                // ── Normal order update ──
                if (data.order) {
                    const prevCount = orderRef.current.items.length
                    setOrder(data.order)

                    // Animate newly added items
                    if (data.order.items.length > prevCount) {
                        const added = data.order.items.slice(prevCount)
                        setNewCards(prev => [...prev, ...added])
                        setTimeout(() => {
                            setNewCards(prev => prev.filter(p => !added.includes(p)))
                        }, 4000)
                    }
                }

                // ── Upsell ──
                if (data.upsell) {
                    setUpsell(data.upsell)
                    setTimeout(() => setUpsell(null), 8000)
                }

                // ── Speak ──
                speakText(data.message || 'Added to your order.')
                setPrompt('What else would you like?')

            } catch (err) {
                console.error('API error:', err)
                speakText("Sorry, couldn't process that. Try again.")
                setPrompt('What would you like to order?')
            }
        }

        recognition.onerror = (e) => {
            console.warn('Speech error:', e.error)
            isListeningRef.current = false

            if (e.error === 'no-speech') {
                setStatus('idle')
                setPrompt('What would you like to order?')
                setTimeout(() => doStartListening(), 500)
            } else if (e.error === 'network') {
                setStatus('idle')
                setMessage('⚠️ Speech API error: network. Use Chrome on localhost.')
            } else if (e.error === 'aborted' || e.error === 'not-allowed') {
                setStatus('idle')
            } else {
                setStatus('idle')
                setTimeout(() => doStartListening(), 1000)
            }
        }

        recognition.onend = () => {
            isListeningRef.current = false
            // Only reset to idle if we're still in "listening" state
            // (not if we moved to processing/speaking already)
            if (statusRef.current === 'listening') {
                setStatus('idle')
            }
        }

        try {
            recognition.start()
        } catch (e) {
            console.warn('Recognition start failed:', e)
            isListeningRef.current = false
        }
    }

    /* ── Stop listening ───────────────────────────────── */
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort()
        }
        isListeningRef.current = false
        setStatus('idle')
        setPrompt('What would you like to order?')
    }, [])

    /* ── Clear order ──────────────────────────────────── */
    const clearOrder = useCallback(() => {
        setOrder({ items: [], combos: [] })
        setNewCards([])
        setUpsell(null)
        setTranscript('')
        setBillData(null)
        billDoneRef.current = false
        setPrompt('What would you like to order?')
        sessionStorage.removeItem('voiceSessionId')
        sessionIdRef.current = getSessionId()
        speakText('Order cleared. What would you like?')
    }, [speakText])

    /* ── Finish order (manual button) ─────────────────── */
    const finishOrder = useCallback(async () => {
        setStatus('processing')
        try {
            const res = await fetch(`${API}/parse-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: 'confirm order', sessionId: sessionIdRef.current })
            })
            const data = await res.json()

            if (data.completed) {
                billDoneRef.current = true
                setBillData({
                    items: data.order?.items || orderRef.current.items,
                    combos: data.order?.combos || orderRef.current.combos,
                    orderId: data.order_id || ''
                })
                speakText(data.message || 'Order confirmed!')
                setOrder({ items: [], combos: [] })
                sessionStorage.removeItem('voiceSessionId')
                sessionIdRef.current = getSessionId()
            } else if (data.message) {
                speakText(data.message)
            }
        } catch (err) {
            speakText('Failed to place order. Please try again.')
        }
    }, [speakText])

    /* ── New order after bill ─────────────────────────── */
    const handleNewOrder = useCallback(() => {
        setBillData(null)
        billDoneRef.current = false
        setOrder({ items: [], combos: [] })
        setNewCards([])
        setTranscript('')
        setPrompt('What would you like to order?')
        setStatus('idle')
        sessionStorage.removeItem('voiceSessionId')
        sessionIdRef.current = getSessionId()
    }, [])

    /* ── Auto-dismiss message ─────────────────────────── */
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 5000)
            return () => clearTimeout(t)
        }
    }, [message])

    const hasItems = order.items.length > 0 || (order.combos && order.combos.length > 0)

    return (
        <>
            <FloatingBackground />

            <div className={`app-container ${billData ? 'bill-open' : ''}`}>
                {/* ── LEFT: Voice interaction area ── */}
                <div className="voice-area">
                    <div className={`status-badge ${status}`}>
                        <span className="status-dot" />
                        {status === 'listening' && 'Listening'}
                        {status === 'processing' && 'Processing'}
                        {status === 'speaking' && 'Speaking'}
                        {status === 'idle' && 'Ready'}
                    </div>

                    <div className="prompt-text">{prompt}</div>
                    <div className="prompt-sub">
                        {status === 'idle' && !hasItems && 'Press the mic button or say your order'}
                        {status === 'idle' && hasItems && 'Say "finish order" when done'}
                        {status === 'listening' && 'Speak now...'}
                    </div>

                    <div className="order-cards-area">
                        {newCards.map((item, i) => (
                            <OrderCard key={`${item.name}-${i}`} item={item} index={i} />
                        ))}
                    </div>

                    {transcript && (
                        <div className="transcript">
                            You said: <em>"{transcript}"</em>
                        </div>
                    )}

                    <div className="control-panel">
                        {status === 'listening' ? (
                            <button className="ctrl-btn mic-off" onClick={stopListening}>
                                ⏹ Stop
                            </button>
                        ) : (
                            <button className="ctrl-btn mic-on" onClick={() => doStartListening()} disabled={status === 'processing' || status === 'speaking'}>
                                🎙️ Start Mic
                            </button>
                        )}

                        <button className="ctrl-btn clear" onClick={clearOrder} disabled={!hasItems}>
                            🗑️ Clear
                        </button>

                        <button className="ctrl-btn finish" onClick={finishOrder} disabled={!hasItems || status === 'processing'}>
                            ✅ Finish Order
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Order summary ── */}
                {!billData && (
                    <OrderSummary items={order.items} combos={order.combos} />
                )}
            </div>

            {upsell && <div className="upsell-toast">{upsell}</div>}
            {message && <div className="msg-toast">{message}</div>}

            {billData && (
                <BillPreview
                    items={billData.items}
                    combos={billData.combos}
                    orderId={billData.orderId}
                    onClose={() => setBillData(null)}
                    onNewOrder={handleNewOrder}
                />
            )}
        </>
    )
}
