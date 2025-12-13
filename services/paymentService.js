const Razorpay = require("razorpay")
const crypto = require("crypto")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// Initialize Razorpay only if keys are present
let razorpay = null
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  } catch (error) {
    console.warn("Razorpay initialization failed:", error.message)
  }
}

function verifySignature(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay key secret not configured")
  }
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")
  return expected === signature
}

async function createOrder({ amount, currency = "INR", receipt, notes }) {
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
  }
  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  })
}

async function recordTransaction(payload) {
  const { schoolId, userId, orderId, paymentId, signature, amount, currency, status, plan, notes, rawPayload } = payload
  return prisma.paymentTransaction.upsert({
    where: { orderId },
    update: { paymentId, signature, amount, currency, status, plan, notes, rawPayload },
    create: { schoolId, userId, orderId, paymentId, signature, amount, currency, status, plan, notes, rawPayload },
  })
}

async function handleWebhook(body, razorpaySignature) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay webhook secret not configured")
  }
  const payload = JSON.stringify(body)
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex")

  if (expectedSignature !== razorpaySignature) {
    throw new Error("Invalid webhook signature")
  }

  const { entity } = body

  if (entity === "event" && body.event === "payment.captured") {
    const payment = body.payload.payment.entity
    await recordTransaction({
      schoolId: payment.notes?.schoolId,
      userId: payment.notes?.userId || null,
      orderId: payment.order_id,
      paymentId: payment.id,
      signature: razorpaySignature,
      amount: payment.amount,
      currency: payment.currency,
      status: "SUCCESS",
      plan: payment.notes?.plan,
      notes: payment.notes,
      rawPayload: body,
    })
  }

  return true
}

module.exports = {
  verifySignature,
  createOrder,
  recordTransaction,
  handleWebhook,
}



