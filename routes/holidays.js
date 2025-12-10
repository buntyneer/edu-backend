const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, startDate, endDate } = req.query

    const where = { schoolId: schoolId || req.schoolId }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) }
      where.endDate = { lte: new Date(endDate) }
    }

    const holidays = await prisma.holiday.findMany({ where })
    res.status(200).json({ success: true, holidays })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, holidayName, startDate, endDate, holidayType, description } = req.body

    const holiday = await prisma.holiday.create({
      data: {
        schoolId: schoolId || req.schoolId,
        holidayName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        holidayType: holidayType.toUpperCase(),
        description,
      },
    })

    res.status(201).json({ success: true, holiday })
  } catch (error) {
    next(error)
  }
})

router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const holiday = await prisma.holiday.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.status(200).json({ success: true, holiday })
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } })
    res.status(200).json({ success: true, message: "Holiday deleted" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
