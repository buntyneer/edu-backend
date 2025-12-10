const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")
const { sendBulkFCM } = require("../utils/notifications")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId } = req.query

    const messages = await prisma.broadcastMessage.findMany({
      where: { schoolId: schoolId || req.schoolId },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json({ success: true, messages })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, messageTitle, messageText, targetAudience, targetClass, targetStudentIds, priority } = req.body

    const broadcastMessage = await prisma.broadcastMessage.create({
      data: {
        schoolId: schoolId || req.schoolId,
        senderUserId: req.userId,
        senderType: "PRINCIPAL",
        messageTitle,
        messageText,
        targetAudience,
        targetClass,
        targetStudentIds,
        priority: priority || "NORMAL",
      },
    })

    // Get students based on target audience
    let studentIds = []
    if (targetAudience === "ALL_PARENTS") {
      const students = await prisma.student.findMany({
        where: { schoolId: schoolId || req.schoolId, status: "ACTIVE" },
        select: { fcmToken: true },
      })
      studentIds = students.filter((s) => s.fcmToken).map((s) => s.fcmToken)
    } else if (targetAudience === "SPECIFIC_CLASS") {
      const students = await prisma.student.findMany({
        where: { schoolId: schoolId || req.schoolId, class: targetClass, status: "ACTIVE" },
        select: { fcmToken: true },
      })
      studentIds = students.filter((s) => s.fcmToken).map((s) => s.fcmToken)
    } else if (targetAudience === "SPECIFIC_STUDENTS") {
      const students = await prisma.student.findMany({
        where: { id: { in: targetStudentIds }, status: "ACTIVE" },
        select: { fcmToken: true },
      })
      studentIds = students.filter((s) => s.fcmToken).map((s) => s.fcmToken)
    }

    // Send bulk FCM notifications asynchronously
    if (studentIds.length > 0) {
      sendBulkFCM(studentIds, messageTitle, messageText, {
        type: "broadcast",
        click_action: "/messages",
      }).catch((err) => console.error("Bulk FCM error:", err))
    }

    res.status(201).json({ success: true, broadcastMessage })
  } catch (error) {
    next(error)
  }
})

module.exports = router
