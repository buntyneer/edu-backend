const express = require("express")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")
const teacherController = require("../controllers/teacherController")

const router = express.Router()

router.get("/", authMiddleware, teacherController.listTeachers)
router.post("/", authMiddleware, validate(schemas.teacher), teacherController.createTeacher)
router.put("/:id", authMiddleware, validate(schemas.teacher), teacherController.updateTeacher)
router.delete("/:id", authMiddleware, teacherController.deleteTeacher)

module.exports = router



