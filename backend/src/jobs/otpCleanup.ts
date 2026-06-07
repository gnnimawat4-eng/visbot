import Bull from 'bull'
// Redis handles OTP TTL automatically — this queue is for other scheduled tasks
export const alertQueue = new Bull('visbot-alerts', { redis: process.env.REDIS_URL })

alertQueue.process('material-overdue', async (job) => {
  const { material_id, item_name } = job.data
  console.log(`[ALERT] Material overdue: ${item_name} (ID: ${material_id})`)
  // TODO: send SMS/email to security
})
