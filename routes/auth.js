const express = require("express");
const { validate, schemas } = require("../utils/validation");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Normal auth
router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.getMe);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT token compatible with auth middleware & /me endpoint
    const payload = {
      userId: req.user.id,
      email: req.user.email,
      schoolId: req.user.schoolId,
      role: req.user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
  }
);

module.exports = router;
