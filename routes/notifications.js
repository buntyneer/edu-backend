const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { sendFCM, sendWebPush } = require("../utils/notifications")
const authMiddleware = require("../middleware/auth")

const prisma = new PrismaClient()
const router = express.Router()

router.post("/send-fcm", authMiddleware, async (req, res, next) => {
  try {
    const { fcmToken, title, body, data } = req.body

    const result = await sendFCM(fcmToken, title, body, data)

    res.status(200).json({ success: result.success, ...result })
  } catch (error) {
    next(error)
  }
})

router.post("/send-push", authMiddleware, async (req, res, next) => {
  try {
    const { subscription, title, body } = req.body

    const result = await sendWebPush(subscription, title, body)

    res.status(200).json({ success: result.success, ...result })
  } catch (error) {
    next(error)
  }
})

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { userEmail, isRead } = req.query

    const where = { userEmail }
    if (isRead !== undefined) where.isRead = isRead === "true"

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json({ success: true, notifications })
  } catch (error) {
    next(error)
  }
})

router.put("/:id/read", authMiddleware, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    })

    res.status(200).json({ success: true, notification })
  } catch (error) {
    next(error)
  }
})

module.exports = router
