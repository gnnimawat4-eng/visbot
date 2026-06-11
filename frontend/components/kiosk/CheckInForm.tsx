'use client'
import { useState } from 'react'
import { useConfig, useField } from '@/lib/config'
import toast from 'react-hot-toast'

interface FormValues {
  name:         string
  phone:        string
  purpose:      string
  host:         string
  email:        string
  company:      string
  vehicle:      string
  meeting_room: string
}

interface NextData {
  name: string; phone: string; purpose: string; host: string
  email?: string; company?: string; vehicle?: string; meeting_room?: string
  returning: boolean; skipOtp: boolean
}

interface Props { onNext: (data: NextData) => void }

const INPUT = 'mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
const LABEL = 'text-sm text-gray-600'
const ERR   = 'text-red-500 text-xs mt-1'

export function CheckInForm({ onNext }: Props) {
  const config = useConfig()
  const fName    = useField('visitor_name')
  const fPhone   = useField('visitor_phone')
  const fEmail   = useField('visitor_email')
  const fCompany = useField('visitor_company')
  const fPurpose = useField('visitor_purpose')
  const fHost    = useField('visitor_host')
  const fVehicle = useField('visitor_vehicle')
  const fRoom    = useField('visitor_meeting_room')

  const purposes = config.purposes.length ? config.purposes : ['Meeting', 'Delivery', 'Interview', 'Other']

  const [form, setForm] = useState<FormValues>({
    name: '', phone: '', purpose: purposes[0] ?? 'Meeting',
    host: '', email: '', company: '', vehicle: '', meeting_room: '',
  })
  const [errors,     setErrors]     = useState<Partial<Record<keyof FormValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (k: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const validate = (): Partial<Record<keyof FormValues, string>> => {
    const e: Partial<Record<keyof FormValues, string>> = {}
    if (fName !== 'hidden' && form.name.trim().length < 2)
      e.name = 'Enter full name'
    if (fPhone !== 'hidden' && form.phone.trim().length < 10)
      e.phone = 'Enter valid phone number'
    if (fEmail === 'required' && !form.email.trim())
      e.email = 'Email is required'
    if (fCompany === 'required' && !form.company.trim())
      e.company = `${config.label_company} is required`
    if (fHost === 'required' && form.host.trim().length < 2)
      e.host = 'Enter host name'
    if (fVehicle === 'required' && !form.vehicle.trim())
      e.vehicle = 'Vehicle number required'
    if (fRoom === 'required' && !form.meeting_room.trim())
      e.meeting_room = 'Meeting room required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const base: NextData = {
      name:    form.name.trim(),
      phone:   form.phone.trim(),
      purpose: form.purpose,
      host:    form.host.trim(),
      returning: false,
      skipOtp:   false,
      ...(fEmail   !== 'hidden' && form.email        ? { email:        form.email.trim()        } : {}),
      ...(fCompany !== 'hidden' && form.company      ? { company:      form.company.trim()      } : {}),
      ...(fVehicle !== 'hidden' && form.vehicle      ? { vehicle:      form.vehicle.trim()      } : {}),
      ...(fRoom    !== 'hidden' && form.meeting_room ? { meeting_room: form.meeting_room.trim() } : {}),
    }

    // Skip OTP entirely if not required
    if (!config.otp_required_on_entry) {
      setSubmitting(false)
      onNext({ ...base, returning: false, skipOtp: true })
      return
    }

    // Send OTP
    try {
      const res  = await fetch('/api/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone.trim() }),
      })
      const json = await res.json()
      setSubmitting(false)

      if (json.otpSent) {
        const returning = !!json.returning
        const skipOtp   = !!(config.otp_skip_for_returning && returning)
        if (returning && !skipOtp) toast.success('Welcome back! OTP sent to your number.')
        onNext({ ...base, returning, skipOtp })
      } else {
        toast.error('Could not send OTP. Try again.')
      }
    } catch {
      setSubmitting(false)
      toast.error('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fName !== 'hidden' && (
        <div>
          <label className={LABEL}>{config.label_visitor} Name{fName === 'required' ? ' *' : ''}</label>
          <input value={form.name} onChange={set('name')} className={INPUT} placeholder="Your name" />
          {errors.name && <p className={ERR}>{errors.name}</p>}
        </div>
      )}

      {fPhone !== 'hidden' && (
        <div>
          <label className={LABEL}>Mobile Number{fPhone === 'required' ? ' *' : ''}</label>
          <input value={form.phone} onChange={set('phone')} className={INPUT} placeholder="+91 98765 43210" inputMode="tel" />
          {errors.phone && <p className={ERR}>{errors.phone}</p>}
        </div>
      )}

      {fEmail !== 'hidden' && (
        <div>
          <label className={LABEL}>Email{fEmail === 'required' ? ' *' : ''}</label>
          <input type="email" value={form.email} onChange={set('email')} className={INPUT} placeholder="you@example.com" />
          {errors.email && <p className={ERR}>{errors.email}</p>}
        </div>
      )}

      {fCompany !== 'hidden' && (
        <div>
          <label className={LABEL}>{config.label_company}{fCompany === 'required' ? ' *' : ''}</label>
          <input value={form.company} onChange={set('company')} className={INPUT} placeholder="Your company" />
          {errors.company && <p className={ERR}>{errors.company}</p>}
        </div>
      )}

      {fPurpose !== 'hidden' && (
        <div>
          <label className={LABEL}>{config.label_purpose}{fPurpose === 'required' ? ' *' : ''}</label>
          <select value={form.purpose} onChange={set('purpose')} className={INPUT}>
            {purposes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      {fHost !== 'hidden' && (
        <div>
          <label className={LABEL}>Who are you meeting?{fHost === 'required' ? ' *' : ''}</label>
          <input value={form.host} onChange={set('host')} className={INPUT} placeholder={`${config.label_host} name`} />
          {errors.host && <p className={ERR}>{errors.host}</p>}
        </div>
      )}

      {fVehicle !== 'hidden' && (
        <div>
          <label className={LABEL}>Vehicle Number{fVehicle === 'required' ? ' *' : ''}</label>
          <input value={form.vehicle} onChange={set('vehicle')} className={INPUT} placeholder="DL 01 AB 1234" />
          {errors.vehicle && <p className={ERR}>{errors.vehicle}</p>}
        </div>
      )}

      {fRoom !== 'hidden' && (
        <div>
          <label className={LABEL}>Meeting Room{fRoom === 'required' ? ' *' : ''}</label>
          <input value={form.meeting_room} onChange={set('meeting_room')} className={INPUT} placeholder="Conference Room A" />
          {errors.meeting_room && <p className={ERR}>{errors.meeting_room}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {submitting
          ? (config.otp_required_on_entry ? 'Sending OTP…' : 'Processing…')
          : 'Continue →'
        }
      </button>
    </form>
  )
}
