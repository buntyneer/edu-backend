const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const { OAuth2Client } = require("google-auth-library")
const { signAccessToken, signRefreshToken, verifyToken } = require("./tokenService")

const prisma = new PrismaClient()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

async function createUserWithSchool(data) {
  return prisma.$transaction(async (tx) => {
    const {
      schoolName,
      instituteType,
      schoolAddress,
      principalName,
      principalEmail,
      principalPhone,
      email,
      password,
      fullName,
    } = data

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const school = await tx.school.create({
      data: {
        schoolName,
        displayName: schoolName,
        instituteType: instituteType.toUpperCase(),
        schoolAddress,
        zipcode: "",
        schoolType: "PRIVATE",
        establishmentYear: new Date().getFullYear(),
        principalName,
        principalEmail,
        principalPhone,
        schoolStartTime: "08:00",
        schoolEndTime: "16:00",
        trialEndsAt,
        createdBy: email,
      },
    })

    const hashedPassword = await hashPassword(password)

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: "ADMIN",
        schoolId: school.id,
      },
    })

    return { user, school }
  })
}

async function persistRefreshToken(userId, token, expiresAt) {
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  })
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

async function rotateRefreshToken(token) {
  const decoded = verifyToken(token)
  const existing = await prisma.refreshToken.findUnique({ where: { token } })
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new Error("Invalid refresh token")
  }

  await revokeRefreshToken(token)

  const payload = { userId: decoded.userId, email: decoded.email, schoolId: decoded.schoolId }
  const newRefresh = signRefreshToken(payload)
  const decodedNew = verifyToken(newRefresh)

  await persistRefreshToken(payload.userId, newRefresh, new Date(decodedNew.exp * 1000))

  return {
    accessToken: signAccessToken(payload),
    refreshToken: newRefresh,
  }
}

async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  return {
    email: payload.email,
    fullName: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
    sub: payload.sub,
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  createUserWithSchool,
  persistRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyGoogleToken,
}

