const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")
const { sendFCM } = require("../utils/notifications")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { conversationId, limit = 100, offset = 0 } = req.query

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: { sender: true },
        take: Number.parseInt(limit),
        skip: Number.parseInt(offset),
        orderBy: { createdAt: "asc" },
      }),
      prisma.message.count({ where: { conversationId } }),
    ])

    res.status(200).json({ success: true, messages, total })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, validate(schemas.message), async (req, res, next) => {
  try {
    const message = await prisma.message.create({
      data: req.validated,
    })

    const conversation = await prisma.conversation.update({
      where: { id: req.validated.conversationId },
      data: {
        lastMessage: req.validated.messageText,
        lastMessageTime: new Date(),
        lastMessageSender: req.validated.senderType,
        parentUnreadCount: { increment: 1 },
      },
    })

    res.status(201).json({ success: true, message })
  } catch (error) {
    next(error)
  }
})

router.put("/:id/read", authMiddleware, async (req, res, next) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { isReadByParent: true, isReadByTeacher: true },
    })

    res.status(200).json({ success: true, message })
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } })
    res.status(200).json({ success: true, message: "Message deleted" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
