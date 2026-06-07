import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'
import morgan  from 'morgan'
import { checkinRouter }  from './routes/checkin'
import { visitorRouter }  from './routes/visitor'
import { materialRouter } from './routes/material'
import { statsRouter }    from './routes/stats'
import { authMiddleware } from './middleware/auth'

const app  = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())
app.use(morgan('dev'))

// Public
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'visbot-api' }))

// Protected
app.use('/api', authMiddleware)
app.use('/api/checkin',  checkinRouter)
app.use('/api/visitor',  visitorRouter)
app.use('/api/material', materialRouter)
app.use('/api/stats',    statsRouter)

app.listen(PORT, () => console.log(`VisBot API running on :${PORT}`))
