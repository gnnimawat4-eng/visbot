'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { onNext: (photoUrl: string) => void }

type Phase = 'idle' | 'streaming' | 'captured' | 'uploading'

export function PhotoCapture({ onNext }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase]     = useState<Phase>('idle')
  const [preview, setPreview] = useState<string>('')

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => { stopStream() }, [stopStream])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
      setPhase('streaming')
    } catch {
      toast.error('Camera access denied')
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 720
    canvas.height = video.videoHeight || 540
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    setPreview(canvas.toDataURL('image/jpeg', 0.85))
    stopStream()
    setPhase('captured')
  }, [stopStream])

  const retake = useCallback(() => { setPreview(''); setPhase('idle') }, [])

  const upload = useCallback(async () => {
    if (!preview) return
    setPhase('uploading')
    try {
      const blob = await fetch(preview).then(r => r.blob())
      const form = new FormData()
      form.append('photo', blob, `kiosk-${Date.now()}.jpg`)
      const res  = await fetch('/api/upload/photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Upload failed')
      onNext(json.url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('captured')
    }
  }, [preview, onNext])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">
        We&apos;ll take a quick photo for security records.
      </p>

      {phase === 'idle' && (
        <div className="space-y-3">
          <button onClick={startCamera}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-2 text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors">
            <Camera size={32} />
            <span className="text-sm">Tap to open camera</span>
          </button>
          <button onClick={() => onNext('')} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
            Skip photo →
          </button>
        </div>
      )}

      {phase === 'streaming' && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline muted
            className="w-full rounded-xl bg-black"
            style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
          <button onClick={capture}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-8 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-brand-600 transition-colors">
            <Camera size={16} className="inline mr-2" />Capture
          </button>
        </div>
      )}

      {phase === 'captured' && preview && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: 320 }} />
          <div className="flex gap-3">
            <button onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} /> Retake
            </button>
            <button onClick={upload}
              className="flex-1 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
              Use this photo →
            </button>
          </div>
          <button onClick={() => onNext('')} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
            Skip photo
          </button>
        </div>
      )}

      {phase === 'uploading' && (
        <div className="py-12 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Uploading photo…</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
