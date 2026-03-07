import { useState, useRef, useEffect } from 'react'
import BillView from './BillView'

const VOICE_API = 'http://localhost:3002'

export default function ChatOrder({ sessionId }) {
  const INITIAL_MSG = { role: 'bot', text: 'Hi! I\'m your ordering assistant. Tell me what you\'d like to order, ask about the menu, or say "confirm" when you\'re done!' }
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState(null)
  const [confirmedTotal, setConfirmedTotal] = useState(null)
  const [showBill, setShowBill] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`${VOICE_API}/parse-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, text }),
      })
      const data = await res.json()

      // Build response messages
      const botMessages = []

      if (data.clarification) {
        botMessages.push({ role: 'bot', text: data.clarification })
      } else if (data.message) {
        botMessages.push({ role: 'bot', text: data.message })
      }

      if (data.upsell) {
        botMessages.push({ role: 'bot', text: data.upsell })
      }

      if (data.order && !data.clarification) {
        const items = (data.order.items || []).map(i => `${i.quantity}x ${i.name}`)
        const combos = (data.order.combos || []).map(c => `${c.quantity}x ${c.combo_name}`)
        const all = [...items, ...combos]
        if (all.length > 0 && !data.message) {
          botMessages.push({ role: 'bot', text: `Current order: ${all.join(', ')}` })
        }
      }

      if (data.completed) {
        botMessages.push({ role: 'system', text: `Order confirmed! Order ID: ${data.order_id || 'N/A'} — Total: ₹${data.total || data.order?.final_price || ''}` })
        setOrderDone(true)
        setConfirmedOrder(data.order || null)
        setConfirmedOrderId(data.order_id || null)
        setConfirmedTotal(data.total || data.order?.final_price || null)
        setShowBill(true)
      }

      if (botMessages.length === 0) {
        botMessages.push({ role: 'bot', text: 'I got that. What else would you like?' })
      }

      setMessages(prev => [...prev, ...botMessages])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }])
    }

    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetOrder = () => {
    setMessages([INITIAL_MSG])
    setOrderDone(false)
    setConfirmedOrder(null)
    setConfirmedOrderId(null)
    setConfirmedTotal(null)
    setShowBill(false)
  }

  return (
    <>
      <div className="page-header">
        <h2>AI Chat Ordering</h2>
        <p>Order food by chatting with our AI assistant</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-bar">
          {orderDone ? (
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <button onClick={() => setShowBill(true)} style={{ flex: 1 }}>
                🧾 View Bill
              </button>
              <button onClick={resetOrder} style={{ flex: 1 }}>
                New Order
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your order... (e.g. 'give me 2 burgers' or 'what combos do you have?')"
                disabled={sending}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}>
                {sending ? '...' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>

      {showBill && (
        <BillView
          order={confirmedOrder}
          orderId={confirmedOrderId}
          total={confirmedTotal}
          onClose={() => setShowBill(false)}
        />
      )}
    </>
  )
}
