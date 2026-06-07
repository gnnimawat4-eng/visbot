import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { company_id: string; role: string }
    res.locals.company_id = payload.company_id
    res.locals.role       = payload.role
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
