const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.userEmail = decoded.email
    req.schoolId = decoded.schoolId
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}
