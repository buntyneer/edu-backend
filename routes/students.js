const express = require("express")
const upload = require("../middleware/upload")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")
const studentController = require("../controllers/studentController")

const router = express.Router()

router.get("/", authMiddleware, studentController.getStudents)
router.post(
  "/",
  authMiddleware,
  upload.single("studentPhoto"),
  validate(schemas.student),
  studentController.createStudent,
)
router.put("/:id", authMiddleware, upload.single("studentPhoto"), studentController.updateStudent)
router.delete("/:id", authMiddleware, studentController.deleteStudent)
router.get("/:id/qr-code", authMiddleware, studentController.generateQRCode)

module.exports = router
