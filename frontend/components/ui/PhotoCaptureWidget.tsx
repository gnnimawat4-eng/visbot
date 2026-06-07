'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, FlipHorizontal, RefreshCw, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onCapture:   (url: string) => void
  currentUrl?: string
  compact?:    boolean
  label?:      string
  mode?:       'face' | 'id' | 'item'  // face → front cam, id/item → rear
}

type Phase = 'idle' | 'streaming' | 'captured' | 'uploading'

// Compress canvas → JPEG blob, max dimension 800px, 80% quality
function compressCanvas(canvas: HTMLCanvasElement, maxDim = 800, quality = 0.8): Blob {
  const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1)
  const w = Math.round(canvas.width * ratio)
  const h = Math.round(canvas.height * ratio)
  const tmp = document.createElement('canvas')
  tmp.width  = w
  tmp.height = h
  tmp.getContext('2d')!.drawImage(canvas, 0, 0, w, h)
  // dataURL → blob
  const dataUrl = tmp.toDataURL('image/jpeg', quality)
  const [, b64] = dataUrl.split(',')
  const bytes   = atob(b64)
  const arr     = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: 'image/jpeg' })
}

export function PhotoCaptureWidget({
  onCapture,
  currentUrl,
  compact,
  label = 'Photo',
  mode  = 'face',
}: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  const defaultFacing: 'user' | 'environment' = mode === 'face' ? 'user' : 'environment'
  const [facing,  setFacing]  = useState<'user' | 'environment'>(defaultFacing)
  const [phase,   setPhase]   = useState<Phase>(currentUrl ? 'captured' : 'idle')
  const [preview, setPreview] = useState<string>(currentUrl ?? '')
  const [camError,setCamError]= useState<string | null>(null)
  const [hasMulti,setHasMulti]= useState(false)  // ≥2 cameras available

  // Detect if device has multiple cameras (for flip button)
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      const cams = devs.filter(d => d.kind === 'videoinput')
      setHasMulti(cams.length > 1)
    }).catch(() => {})
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = facing) => {
    stopStream()
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 720  },
        },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        await video.play().catch(() => {})
      }
      setPhase('streaming')
    } catch {
      setCamError('Camera unavailable — check permissions or use file upload')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, stopStream])

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream])

  const flipCamera = useCallback(() => {
    const next: 'user' | 'environment' = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    startCamera(next)
  }, [facing, startCamera])

  const capture = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const w = video.videoWidth  || 640
    const h = video.videoHeight || 480
    canvas.width  = w
    canvas.height = h

    const ctx = canvas.getContext('2d')!
    // Mirror the snapshot for front camera to match what the user sees
    if (facing === 'user') {
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)

    // Show compressed preview (for display only)
    setPreview(canvas.toDataURL('image/jpeg', 0.8))
    stopStream()
    setPhase('captured')
  }, [facing, stopStream])

  const retake = useCallback(() => {
    setPreview('')
    setCamError(null)
    startCamera(facing)
  }, [facing, startCamera])

  const cancel = useCallback(() => {
    stopStream()
    setPreview('')
    setCamError(null)
    setPhase('idle')
  }, [stopStream])

  const uploadPhoto = useCallback(async (blob: Blob) => {
    setPhase('uploading')
    try {
      const form = new FormData()
      form.append('photo', blob, `photo-${Date.now()}.jpg`)
      const res  = await fetch('/api/upload/photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Upload failed')
      onCapture(json.url)
      setPreview(json.url)
      setPhase('captured')
      toast.success('Photo saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPhase('captured')  // stay in captured so user can retry
    }
  }, [onCapture])

  const confirmCapture = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = compressCanvas(canvas)
    await uploadPhoto(blob)
  }, [uploadPhoto])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const img = new Image()
      img.onload = async () => {
        const c   = document.createElement('canvas')
        c.width   = img.width
        c.height  = img.height
        c.getContext('2d')!.drawImage(img, 0, 0)
        setPreview(c.toDataURL('image/jpeg', 0.8))
        setPhase('captured')
        // canvasRef won't have this data — keep a temp canvas ref for upload
        const blob = compressCanvas(c)
        setPhase('uploading')
        await uploadPhoto(blob)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }, [uploadPhoto])

  // ── Heights ────────────────────────────────────────────────────────────
  const containerH = compact ? 'h-40' : 'h-56'

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-xs font-medium" style={{ color: 'var(--vb-text-2)' }}>{label}</p>

      {/* ── IDLE ─────────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <div
          className={`${containerH} rounded-lg border border-dashed flex flex-col items-center justify-center gap-3`}
          style={{ borderColor: 'var(--vb-border)', background: 'var(--vb-bg-hover)' }}
        >
          {camError ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <AlertCircle size={18} style={{ color: 'var(--vb-text-3)' }} />
              <p className="text-xs" style={{ color: 'var(--vb-text-3)' }}>{camError}</p>
            </div>
          ) : (
            <Camera size={20} style={{ color: 'var(--vb-text-3)' }} />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startCamera(facing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ background: 'var(--vb-text)', color: 'var(--vb-bg)' }}
            >
              <Camera size={12} /> Open camera
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border"
              style={{ borderColor: 'var(--vb-border)', color: 'var(--vb-text-2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Upload size={12} /> Upload
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* ── STREAMING ────────────────────────────────────────────────── */}
      {phase === 'streaming' && (
        <div className={`relative ${containerH} rounded-lg overflow-hidden`} style={{ background: '#000' }}>
          <video
            ref={videoRef}
            playsInline autoPlay muted
            className="w-full h-full object-cover"
            // Mirror front camera so it feels like a mirror
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Guide overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-white/30" />
          </div>

          {/* Controls */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
            {/* Cancel */}
            <button
              type="button"
              onClick={cancel}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X size={15} />
            </button>

            {/* Capture shutter */}
            <button
              type="button"
              onClick={capture}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg transition-opacity hover:opacity-90 active:scale-95"
            >
              <div className="w-12 h-12 rounded-full border-2 border-zinc-300" />
            </button>

            {/* Flip camera (only if multiple cameras) */}
            {hasMulti ? (
              <button
                type="button"
                onClick={flipCamera}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                title="Flip camera"
              >
                <FlipHorizontal size={15} />
              </button>
            ) : (
              <div className="w-9 h-9" />  /* placeholder to keep centering */
            )}
          </div>
        </div>
      )}

      {/* ── CAPTURED / UPLOADING ─────────────────────────────────────── */}
      {(phase === 'captured' || phase === 'uploading') && preview && (
        <div className={`relative ${containerH} rounded-lg overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured photo" className="w-full h-full object-cover" />

          {/* Upload overlay */}
          {phase === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
              <div className="flex items-center gap-2 text-white text-xs font-medium">
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </div>
            </div>
          )}

          {/* Actions when captured */}
          {phase === 'captured' && (
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={retake}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <RefreshCw size={12} /> Retake
              </button>
              <button
                type="button"
                onClick={confirmCapture}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <Check size={12} /> Use photo
              </button>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
