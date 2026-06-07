import { Router } from 'express'
import { StatsController } from '../controllers/stats.controller'

export const statsRouter = Router()
statsRouter.get('/daily',   StatsController.daily)
statsRouter.get('/weekly',  StatsController.weekly)
statsRouter.get('/summary', StatsController.summary)
