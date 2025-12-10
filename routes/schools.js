const express = require("express")
const { PrismaClient } = require("@prisma/client")
const authMiddleware = require("../middleware/auth")
const schoolController = require("../controllers/schoolController")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/info", authMiddleware, schoolController.getSchoolInfo)
router.get("/stats", authMiddleware, schoolController.getSchoolStats)
router.put("/:id", authMiddleware, schoolController.updateSchoolInfo)
router.get("/:id", authMiddleware, schoolController.getSchoolInfo)

module.exports = router
