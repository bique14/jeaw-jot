import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getStoredPinHash, hashPin, markSessionVerified } from '@/lib/pin'

export default function PinPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError('')

    if (newPin.length === 4) {
      const storedHash = getStoredPinHash()
      const inputHash = await hashPin(newPin)
      if (inputHash === storedHash) {
        markSessionVerified()
        navigate('/dashboard', { replace: true })
      } else {
        setShake(true)
        setTimeout(() => {
          setPin('')
          setError(t('pin.wrong'))
          setShake(false)
        }, 400)
      }
    }
  }

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between bg-white px-6 py-12">
      {/* Top */}
      <div className="flex flex-col items-center gap-2 pt-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
          <span className="text-white text-xl font-bold">J</span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-gray-900">{t('pin.title')}</h1>
        <p className="text-sm text-gray-500">{t('pin.subtitle')}</p>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < pin.length
                ? 'bg-blue-600 border-blue-600 scale-110'
                : 'bg-transparent border-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      <div className="h-5">
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Numpad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3">
        {digits.map((d, idx) => {
          if (d === '') return <div key={idx} />
          if (d === 'del') {
            return (
              <button
                key="del"
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center h-16 rounded-2xl text-gray-600 text-lg active:bg-gray-100 transition-colors"
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="flex items-center justify-center h-16 rounded-2xl bg-gray-100 text-gray-900 text-xl font-semibold active:bg-gray-200 active:scale-95 transition-all"
            >
              {d}
            </button>
          )
        })}
      </div>

      <div className="h-4" />
    </div>
  )
}
