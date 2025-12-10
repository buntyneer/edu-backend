const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, userId } = req.query

    const conversations = await prisma.conversation.findMany({
      where: {
        schoolId: schoolId || req.schoolId,
        OR: [{ parentUserId: userId || req.userId }, { teacherUserId: userId || req.userId }],
      },
      include: { student: true },
      orderBy: { lastMessageTime: "desc" },
    })

    res.status(200).json({ success: true, conversations })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, studentId, parentUserId, teacherUserId } = req.body

    let conversation = await prisma.conversation.findFirst({
      where: {
        schoolId: schoolId || req.schoolId,
        studentId,
        parentUserId: parentUserId || req.userId,
        teacherUserId: teacherUserId || null,
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          schoolId: schoolId || req.schoolId,
          studentId,
          parentUserId: parentUserId || req.userId,
          teacherUserId,
          conversationType: "PARENT_TEACHER",
        },
      })
    }

    res.status(201).json({ success: true, conversation })
  } catch (error) {
    next(error)
  }
})

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { student: true, messages: true },
    })

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" })
    }

    res.status(200).json({ success: true, conversation })
  } catch (error) {
    next(error)
  }
})

module.exports = router
