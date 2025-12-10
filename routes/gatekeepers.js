const express = require("express")
const { PrismaClient } = require("@prisma/client")
const upload = require("../middleware/upload")
const authMiddleware = require("../middleware/auth")
const { v4: uuidv4 } = require("uuid")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { schoolId, status } = req.query
    const where = { schoolId: schoolId || req.schoolId }
    if (status) where.status = status.toUpperCase()

    const gatekeepers = await prisma.gatekeeper.findMany({ where })
    res.status(200).json({ success: true, gatekeepers })
  } catch (error) {
    next(error)
  }
})

router.post("/", authMiddleware, upload.single("gatekeeperPhoto"), async (req, res, next) => {
  try {
    const { schoolId, fullName, address, phoneNumber, email, gateNumber, shiftStart, shiftEnd } = req.body

    const gatekeeperId = `GK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    const accessLink = uuidv4()

    const gatekeeper = await prisma.gatekeeper.create({
      data: {
        schoolId: schoolId || req.schoolId,
        fullName,
        gatekeeperId,
        gatekeeperPhoto: req.file?.path || null,
        address,
        phoneNumber,
        email,
        gateNumber,
        shiftStart,
        shiftEnd,
        accessLink,
        createdBy: req.userEmail,
      },
    })

    res.status(201).json({ success: true, gatekeeper })
  } catch (error) {
    next(error)
  }
})

router.put("/:id", authMiddleware, upload.single("gatekeeperPhoto"), async (req, res, next) => {
  try {
    const data = req.body
    if (req.file) data.gatekeeperPhoto = req.file.path

    const gatekeeper = await prisma.gatekeeper.update({
      where: { id: req.params.id },
      data,
    })

    res.status(200).json({ success: true, gatekeeper })
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    await prisma.gatekeeper.delete({ where: { id: req.params.id } })
    res.status(200).json({ success: true, message: "Gatekeeper deleted" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
