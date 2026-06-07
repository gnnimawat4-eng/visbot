import axios from 'axios'

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const message = `Your VisBot OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`

  // Fast2SMS (India)
  if (process.env.FAST2SMS_API_KEY) {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      { route: 'q', message, flash: 0, numbers: phone.replace('+91', '') },
      { headers: { authorization: process.env.FAST2SMS_API_KEY } }
    )
    return
  }

  // Twilio fallback
  if (process.env.TWILIO_ACCOUNT_SID) {
    const { Twilio } = await import('twilio')
    const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER!, to: phone })
    return
  }

  throw new Error('No SMS provider configured')
}
