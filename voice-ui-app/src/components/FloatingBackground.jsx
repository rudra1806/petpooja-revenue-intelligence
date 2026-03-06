import { useMemo } from 'react'

const FOOD_ICONS = [
    '🍔', '🍕', '🍟', '🌮', '🥤', '🍩', '☕',
    '🧁', '🥪', '🌭', '🍗', '🥗', '🧃', '🍰',
    '🍝', '🥐', '🍿', '🫖', '🧇', '🥞'
]

export default function FloatingBackground() {
    const items = useMemo(() => {
        return Array.from({ length: 18 }, (_, i) => ({
            id: i,
            icon: FOOD_ICONS[i % FOOD_ICONS.length],
            left: Math.random() * 100,
            size: 1.8 + Math.random() * 2,
            duration: 18 + Math.random() * 25,
            delay: -(Math.random() * 30),
            opacity: 0.04 + Math.random() * 0.06,
        }))
    }, [])

    return (
        <div className="floating-bg">
            {items.map(item => (
                <span
                    key={item.id}
                    className="float-item"
                    style={{
                        left: `${item.left}%`,
                        fontSize: `${item.size}rem`,
                        animationDuration: `${item.duration}s`,
                        animationDelay: `${item.delay}s`,
                        opacity: item.opacity,
                    }}
                >
                    {item.icon}
                </span>
            ))}
        </div>
    )
}
