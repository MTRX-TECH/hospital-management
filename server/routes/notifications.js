import { Router } from 'express'
import { Notification } from '../models/Notification.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// GET /api/notifications - List notifications for logged-in user
router.get('/', authenticateToken, async (request, response) => {
  try {
    const notifications = await Notification.find({ user: request.user.id }).sort({ createdAt: -1 })
    const unreadCount = await Notification.countDocuments({ user: request.user.id, isRead: false })

    const formatted = notifications.map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }))

    response.json({
      notifications: formatted,
      unreadCount,
    })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    response.status(500).json({ message: 'Notifications could not be loaded.' })
  }
})

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', authenticateToken, async (request, response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: request.params.id, user: request.user.id },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return response.status(404).json({ message: 'Notification not found.' })
    }

    response.json({ message: 'Notification marked as read.' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    response.status(500).json({ message: 'Notification could not be updated.' })
  }
})

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', authenticateToken, async (request, response) => {
  try {
    await Notification.updateMany({ user: request.user.id, isRead: false }, { isRead: true })
    response.json({ message: 'All notifications marked as read.' })
  } catch (error) {
    console.error('Mark all read error:', error)
    response.status(500).json({ message: 'Could not mark notifications as read.' })
  }
})

export default router