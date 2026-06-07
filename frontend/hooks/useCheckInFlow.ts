import { useState } from 'react'

type Step = 'form' | 'photo' | 'otp' | 'done'

export interface VisitorFormData {
  name: string
  phone: string
  purpose: 'meeting' | 'delivery' | 'interview' | 'other'
  host: string
  returning?: boolean
  photoUrl?: string
}

export function useCheckInFlow() {
  const [step, setStep]               = useState<Step>('form')
  const [visitorData, setVisitorData] = useState<Partial<VisitorFormData>>({})

  const reset = () => { setStep('form'); setVisitorData({}) }

  return { step, setStep, visitorData, setVisitorData, reset }
}
