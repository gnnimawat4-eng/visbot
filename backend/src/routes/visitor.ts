import { Router } from 'express'
import { VisitorController } from '../controllers/visitor.controller'

export const visitorRouter = Router()
visitorRouter.get('/',          VisitorController.list)
visitorRouter.get('/search',    VisitorController.search)
visitorRouter.get('/:id',       VisitorController.get)
visitorRouter.get('/:id/history', VisitorController.history)
