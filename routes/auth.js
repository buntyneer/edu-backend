const express = require("express");
const { validate, schemas } = require("../utils/validation");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const router = express.Router();

// Normal auth
router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.getMe);

// Google OAuth routes (Passport-based)
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
    const payload = {
      userId: req.user.id,
      email: req.user.email,
      schoolId: req.user.schoolId,
      role: req.user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
  }
);

// ✅ Firebase Google Login (env se secret)
router.post("/google/firebase", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture } = decodedToken;

    // Check if user exists or create new
    let user = null;
    let isNewUser = false;

    if (typeof authController.findUserByEmail === "function") {
      user = await authController.findUserByEmail(email);
    }

    if (!user && typeof authController.createUser === "function") {
      user = await authController.createUser({
        full_name: name,
        email,
        photo_url: picture,
        role: "admin",
      });
      isNewUser = true;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token: jwtToken, user, isNewUser });
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ error: "Invalid Firebase token" });
  }
});

module.exports = router;