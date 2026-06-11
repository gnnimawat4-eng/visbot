'use client'
import { CheckInForm }        from '@/components/kiosk/CheckInForm'
import { PhotoCapture }       from '@/components/kiosk/PhotoCapture'
import { OtpVerify }          from '@/components/kiosk/OtpVerify'
import { useCheckInFlow }     from '@/hooks/useCheckInFlow'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'
import { ConfigProvider }     from '@/components/config/ConfigProvider'
import { useState } from 'react'
import { Maximize2 } from 'lucide-react'

function KioskPageInner() {
  const { step, visitorData, setStep, setVisitorData } = useCheckInFlow()
  const [fullscreen, setFullscreen] = useState(false)
  const branding = useCompanyBranding()
  const companyName = branding?.legal_name || branding?.name || 'VisBot'
  const logoUrl     = branding?.logo_url

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  const STEP_LABELS = ['Details', 'Photo', 'OTP']
  const STEP_INDEX: Record<string, number> = { form: 0, photo: 1, otp: 2, done: 2 }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
        title="Toggle fullscreen"
      >
        <Maximize2 size={18} />
      </button>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-8 pt-8 pb-6">
          <div className="text-center mb-6">
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={companyName} className="mx-auto rounded-2xl object-contain mb-3"
                  style={{ width: 64, height: 64 }} />
                <h1 className="text-xl font-bold text-white">{companyName}</h1>
              </>
            ) : (
              <h1 className="text-3xl font-bold text-white">
                Vis<span className="text-brand-400">Bot</span>
              </h1>
            )}
            <p className="text-gray-400 text-sm mt-1">Visitor Check-In</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-3">
            {STEP_LABELS.map((label, i) => {
              const current = STEP_INDEX[step] === i
              const done    = STEP_INDEX[step] > i
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all',
                    done    ? 'bg-brand-500 text-white' :
                    current ? 'bg-white text-gray-900' :
                              'bg-gray-700 text-gray-400',
                  ].join(' ')}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${current ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px ${done ? 'bg-brand-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form content */}
        <div className="px-6 sm:px-8 py-8">
          {step === 'form'  && <CheckInForm  onNext={(d) => { setVisitorData(d); setStep('photo') }} />}
          {step === 'photo' && <PhotoCapture onNext={(url) => { if (url) setVisitorData(d => ({ ...d, photo_url: url })); setStep('otp') }} />}
          {step === 'otp'   && <OtpVerify    visitorData={visitorData as Record<string, unknown>} />}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-600">Touch-friendly kiosk mode · VisBot</p>
    </main>
  )
}

export default function KioskPage() {
  return (
    <ConfigProvider>
      <KioskPageInner />
    </ConfigProvider>
  )
}
