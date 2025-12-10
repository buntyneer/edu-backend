const express = require("express")
const authMiddleware = require("../middleware/auth")
const attendanceController = require("../controllers/attendanceController")

const router = express.Router()

router.post("/mark", authMiddleware, attendanceController.markAttendance)
router.get("/", authMiddleware, attendanceController.getAttendance)
router.get("/reports/monthly", authMiddleware, attendanceController.getAttendanceReports)
router.get("/today", authMiddleware, attendanceController.getTodayAttendance)

module.exports = router
