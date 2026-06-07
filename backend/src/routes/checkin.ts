import { Router } from 'express'
import { CheckinController } from '../controllers/checkin.controller'

export const checkinRouter = Router()
checkinRouter.post  ('/',          CheckinController.create)
checkinRouter.patch ('/:id/out',   CheckinController.checkout)
checkinRouter.get   ('/today',     CheckinController.today)
