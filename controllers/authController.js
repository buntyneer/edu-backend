const { PrismaClient } = require("@prisma/client")
const { signAccessToken, signRefreshToken, verifyToken } = require("../services/tokenService")
const {
  comparePassword,
  createUserWithSchool,
  persistRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyGoogleToken,
  hashPassword,
} = require("../services/authService")

const prisma = new PrismaClient()

async function issueTokens(user) {
  const payload = { userId: user.id, email: user.email, schoolId: user.schoolId, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const decodedRefresh = verifyToken(refreshToken)
  await persistRefreshToken(user.id, refreshToken, new Date(decodedRefresh.exp * 1000))
  return { accessToken, refreshToken }
}

exports.register = async (req, res, next) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: req.validated.email } })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" })
    }

    const { user, school } = await createUserWithSchool(req.validated)
    const tokens = await issueTokens(user)

    res
      .status(201)
      .json({
        success: true,
        message: "Registration successful",
        ...tokens,
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        school: { id: school.id, schoolName: school.schoolName, trialEndsAt: school.trialEndsAt },
      })
  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.validated
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const school = await prisma.school.findUnique({ where: { id: user.schoolId } })
    const tokens = await issueTokens(user)

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...tokens,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      school: { id: school.id, schoolName: school.schoolName, subscriptionStatus: school.subscriptionStatus },
    })
  } catch (error) {
    next(error)
  }
}

exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken, schoolId } = req.body
    const googleProfile = await verifyGoogleToken(idToken)

    if (!googleProfile.emailVerified) {
      return res.status(401).json({ error: "Google email not verified" })
    }

    let user = await prisma.user.findUnique({ where: { email: googleProfile.email } })
    if (!user) {
      if (!schoolId) {
        return res.status(400).json({ error: "schoolId is required for first-time Google login" })
      }
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          password: await hashPassword(googleProfile.sub),
          fullName: googleProfile.fullName || googleProfile.email,
          role: "USER",
          schoolId,
        },
      })
    }

    const school = await prisma.school.findUnique({ where: { id: user.schoolId } })
    const tokens = await issueTokens(user)

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...tokens,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      school: { id: school.id, schoolName: school.schoolName, subscriptionStatus: school.subscriptionStatus },
    })
  } catch (error) {
    next(error)
  }
}

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token missing" })
    }

    const tokens = await rotateRefreshToken(refreshToken)
    res.status(200).json({ success: true, ...tokens })
  } catch (error) {
    error.status = 401
    next(error)
  }
}

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
    }
    res.status(200).json({ success: true, message: "Logged out" })
  } catch (error) {
    next(error)
  }
}

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const school = await prisma.school.findUnique({ where: { id: user.schoolId } })

    res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      school,
    })
  } catch (error) {
    next(error)
  }
}
