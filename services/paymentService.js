const Razorpay = require("razorpay")
const crypto = require("crypto")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

function verifySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex")
  return expected === signature
}

async function createOrder({ amount, currency = "INR", receipt, notes }) {
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

