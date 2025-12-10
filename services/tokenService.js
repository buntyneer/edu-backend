const jwt = require("jsonwebtoken")

const ACCESS_TOKEN_TTL = "15m"
const REFRESH_TOKEN_TTL = "30d"

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL })
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
}

