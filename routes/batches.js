const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, status } = req.query
    const where = { schoolId: schoolId || req.schoolId }
    if (status) where.status = status.toUpperCase()

    const batches = await prisma.batch.findMany({ where })
    res.status(200).json({ success: true, batches })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, validate(schemas.batch), async (req, res, next) => {
  try {
    const batch = await prisma.batch.create({
      data: {
        ...req.validated,
        schoolId: req.validated.schoolId || req.schoolId,
        startDate: new Date(req.validated.startDate),
        endDate: new Date(req.validated.endDate),
      },
    })

    res.status(201).json({ success: true, batch })
  } catch (error) {
    next(error)
  }
})

router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const batch = await prisma.batch.update({
      where: { id: req.params.id },
      data: req.body,
    })

    res.status(200).json({ success: true, batch })
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } })
    res.status(200).json({ success: true, message: "Batch deleted" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
