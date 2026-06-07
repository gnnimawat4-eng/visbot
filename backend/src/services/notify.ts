// Notify host when their visitor arrives (extend with email/Slack/WhatsApp)
interface NotifyOptions { host_name: string; visitor_name: string; purpose: string }

export async function notifyHost({ host_name, visitor_name, purpose }: NotifyOptions) {
  // TODO: integrate with email (Resend) or internal chat (Slack webhook)
  console.log(`[NOTIFY] ${visitor_name} has arrived for ${host_name} — Purpose: ${purpose}`)
}
