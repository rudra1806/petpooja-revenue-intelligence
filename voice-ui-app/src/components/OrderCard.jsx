const FOOD_EMOJI = {
    burger: '🍔', pizza: '🍕', fries: '🍟', coke: '🥤', coffee: '☕',
    chai: '🫖', lassi: '🥛', brownie: '🍫', cheesecake: '🍰', mousse: '🧁',
    wrap: '🌮', sandwich: '🥪', nuggets: '🍗', pasta: '🍝', bread: '🥐',
    rings: '🧅', sticks: '🧀', ice: '🍦', lemonade: '🍋', milkshake: '🥤',
    mojito: '🍹', gulab: '🍩', paneer: '🫓',
}

function getEmoji(name) {
    const lower = (name || '').toLowerCase()
    for (const [key, emoji] of Object.entries(FOOD_EMOJI)) {
        if (lower.includes(key)) return emoji
    }
    return '🍽️'
}

export default function OrderCard({ item, index }) {
    return (
        <div
            className="order-card"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="card-icon">{getEmoji(item.name)}</div>
            <div className="card-info">
                <div className="card-name">{item.name}</div>
                <div className="card-detail">Qty: {item.quantity}</div>
            </div>
            <div className="card-price">₹{item.base_price * item.quantity}</div>
        </div>
    )
}

export { getEmoji }
