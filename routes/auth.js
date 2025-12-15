const express = require("express")
const { validate, schemas } = require("../utils/validation")
const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/auth")
const passport = require("passport") // ← Google OAuth

const router = express.Router()

// Normal auth
router.post("/register", validate(schemas.register), authController.register)
router.post("/login", validate(schemas.login), authController.login)
router.post("/google", validate(schemas.googleLogin), authController.googleLogin) // token-based login
router.post("/refresh", authController.refresh)
router.post("/logout", authController.logout)
router.get("/me", authMiddleware, authController.getMe)

// ✅ Google OAuth popup routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.send("Google login success")
  }
)

module.exports = router
