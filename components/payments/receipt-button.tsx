'use client'

import { useRef, useState } from 'react'
import { Paperclip, Loader2, CheckCircle, X } from 'lucide-react'

interface Props {
  paymentId: string
  receiptUrl: string | null
  receiptName: string | null
  onUpdated: (url: string | null, name: string | null) => void
}

export function ReceiptButton({ paymentId, receiptUrl, receiptName, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (file: File) => {
    setLoading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('paymentId', paymentId)
      const res = await fetch('/api/receipts/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onUpdated(data.url, data.name)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await fetch('/api/receipts/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })
      onUpdated(null, null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />

  if (receiptUrl) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={receiptName ?? 'Ver justificante'}
          className="text-green-600 hover:text-green-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
        </a>
        <button
          onClick={handleRemove}
          title="Eliminar justificante"
          className="text-gray-300 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        title={error || 'Subir justificante'}
        className={`transition-colors ${error ? 'text-red-400' : 'text-gray-300 hover:text-blue-500'}`}
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </>
  )
}
