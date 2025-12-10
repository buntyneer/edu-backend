const express = require("express")
const { validate, schemas } = require("../utils/validation")
const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

router.post("/register", validate(schemas.register), authController.register)
router.post("/login", validate(schemas.login), authController.login)
router.post("/google", validate(schemas.googleLogin), authController.googleLogin)
router.post("/refresh", authController.refresh)
router.post("/logout", authController.logout)
router.get("/me", authMiddleware, authController.getMe)

module.exports = router
