'use client'
import { useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  onComplete?: () => void
  length?: number
}

export function OtpBoxes({ value, onChange, disabled, onComplete, length = 6 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const focus = (i: number) => refs.current[i]?.focus()

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1)
    if (!d) return
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, length)
    onChange(next)
    if (i < length - 1) focus(i + 1)
    else if (next.length === length) onComplete?.()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) onChange(value.slice(0, i) + value.slice(i + 1))
      else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focus(i - 1) }
    } else if (e.key === 'ArrowLeft' && i > 0) focus(i - 1)
    else if (e.key === 'ArrowRight' && i < length - 1) focus(i + 1)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    onChange(text)
    focus(Math.min(text.length, length - 1))
    if (text.length === length) onComplete?.()
  }

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={[
            'w-10 h-12 text-center text-xl font-bold border-2 rounded-xl transition-all',
            d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-900',
            'focus:outline-none focus:border-brand-500',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
