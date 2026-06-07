'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const schema = z.object({
  name:    z.string().min(2, 'Enter full name'),
  phone:   z.string().min(10, 'Enter valid phone number'),
  purpose: z.enum(['meeting', 'delivery', 'interview', 'other']),
  host:    z.string().min(2, 'Enter host name'),
})
type FormData = z.infer<typeof schema>

interface Props { onNext: (data: FormData & { returning: boolean }) => void }

export function CheckInForm({ onNext }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    const res  = await fetch('/api/otp/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: values.phone }),
    })
    const json = await res.json()
    if (json.otpSent) {
      if (json.returning) toast.success('Welcome back! OTP sent to your number.')
      onNext({ ...values, returning: !!json.returning })
    } else {
      toast.error('Could not send OTP. Try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm text-gray-600">Full Name</label>
        <input {...register('name')} className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Your name" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-sm text-gray-600">Mobile Number</label>
        <input {...register('phone')} className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="+91..." />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="text-sm text-gray-600">Purpose of Visit</label>
        <select {...register('purpose')} className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="meeting">Meeting</option>
          <option value="delivery">Delivery</option>
          <option value="interview">Interview</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Who are you meeting?</label>
        <input {...register('host')} className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Host employee name" />
        {errors.host && <p className="text-red-500 text-xs mt-1">{errors.host.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60">
        {isSubmitting ? 'Sending OTP...' : 'Continue →'}
      </button>
    </form>
  )
}
