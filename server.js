const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const rateLimit = require("./middleware/rateLimit")
const errorHandler = require("./middleware/errorHandler")
const { PrismaClient } = require("@prisma/client")

dotenv.config()

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"]
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Warning: Missing required environment variables: ${missingEnvVars.join(", ")}`)
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot start in production without required environment variables")
    process.exit(1)
  }
}

// Log optional environment variables status
const optionalEnvVars = {
  RAZORPAY_KEY_ID: "Razorpay payments",
  RAZORPAY_KEY_SECRET: "Razorpay payments",
  GOOGLE_CLIENT_ID: "Google OAuth",
  GOOGLE_CLIENT_SECRET: "Google OAuth",
  CLOUDINARY_CLOUD_NAME: "Cloudinary file uploads",
  FIREBASE_SERVICE_ACCOUNT: "Firebase notifications",
}

Object.entries(optionalEnvVars).forEach(([key, feature]) => {
  if (!process.env[key]) {
    console.log(`ℹ️  ${feature} disabled (${key} not set)`)
  }
})

const app = express()
const prisma = new PrismaClient()

app.set("trust proxy", 1)
app.use(helmet())
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"]

app.use(
  cors({
    origin: frontendUrls,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use("/api", rateLimit)

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() })
})

app.use("/api/auth", require("./routes/auth"))
app.use("/api/schools", require("./routes/schools"))
app.use("/api/students", require("./routes/students"))
app.use("/api/attendance", require("./routes/attendance"))
app.use("/api/gatekeepers", require("./routes/gatekeepers"))
app.use("/api/batches", require("./routes/batches"))
app.use("/api/conversations", require("./routes/conversations"))
app.use("/api/messages", require("./routes/messages"))
app.use("/api/broadcast-messages", require("./routes/broadcastMessages"))
app.use("/api/payments", require("./routes/payments"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/holidays", require("./routes/holidays"))
app.use("/api/license-keys", require("./routes/licenseKeys"))
app.use("/api/teachers", require("./routes/teachers"))
app.use("/api/subscriptions", require("./routes/subscriptions"))

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`)
  console.log(`✅ CORS enabled for: ${frontendUrls.join(", ")}`)
  if (process.env.DATABASE_URL) {
    console.log(`✅ Database connected`)
  }
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...")
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...")
  await prisma.$disconnect()
  process.exit(0)
})
