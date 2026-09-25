import jwt from 'jsonwebtoken'
import 'dotenv/config'

export function authenticateToken(request, response, next) {
  const authHeader = request.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return response.status(401).json({ message: 'Authentication required. Please log in.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'northstar_hospital_secret_key_2026_college_project')
    request.user = decoded
    next()
  } catch (error) {
    return response.status(401).json({ message: 'Invalid or expired session. Please log in again.' })
  }
}

export function authorizeRoles(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'You are not authorized to perform this action.' })
    }
    next()
  }
}