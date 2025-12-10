const express = require("express")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")
const paymentController = require("../controllers/paymentController")

const router = express.Router()

router.post("/create-order", authMiddleware, validate(schemas.paymentOrder), paymentController.createPaymentOrder)
router.post("/verify", authMiddleware, validate(schemas.paymentVerify), paymentController.verifyPayment)
router.post("/webhook", paymentController.webhook)
router.get("/history", authMiddleware, paymentController.getPaymentHistory)

module.exports = router
