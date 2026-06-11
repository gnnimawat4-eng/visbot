import { useState } from 'react'

type Step = 'form' | 'photo' | 'otp' | 'done'

export interface VisitorFormData {
  name:         string
  phone:        string
  purpose:      string
  host:         string
  returning?:   boolean
  skipOtp?:     boolean
  photoUrl?:    string
  photo_url?:   string
  email?:       string
  company?:     string
  vehicle?:     string
  meeting_room?: string
}

export function useCheckInFlow() {
  const [step, setStep]               = useState<Step>('form')
  const [visitorData, setVisitorData] = useState<Partial<VisitorFormData>>({})

  const reset = () => { setStep('form'); setVisitorData({}) }

  return { step, setStep, visitorData, setVisitorData, reset }
}
