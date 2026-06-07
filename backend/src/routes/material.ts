import { Router } from 'express'
import { MaterialController } from '../controllers/material.controller'

export const materialRouter = Router()
materialRouter.post('/',              MaterialController.log)
materialRouter.get('/active',         MaterialController.active)
materialRouter.patch('/:id/returned', MaterialController.markReturned)
