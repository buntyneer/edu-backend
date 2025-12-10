const { PrismaClient } = require("@prisma/client")
const { createOrder, verifySignature, recordTransaction, handleWebhook } = require("../services/paymentService")

const prisma = new PrismaClient()

exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { plan, amount, schoolId, notes } = req.validated

    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) {
      return res.status(404).json({ error: "School not found" })
    }

    const order = await createOrder({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_${schoolId}_${Date.now()}`,
      notes: { ...notes, schoolId, plan },
    })

    await recordTransaction({
      schoolId,
      userId: req.userId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "PENDING",
      plan,
      notes,
    })

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    next(error)
  }
}

exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, schoolId, plan } = req.validated
    const isValid = verifySignature(orderId, paymentId, signature)

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid signature" })
    }

    const expiresAt = new Date()
    const months = plan === "12months" ? 12 : 6
    expiresAt.setMonth(expiresAt.getMonth() + months)

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: "REGULAR",
        subscriptionExpiresAt: expiresAt,
      },
    })

    await recordTransaction({
      schoolId,
      userId: req.userId,
      orderId,
      paymentId,
      signature,
      amount: req.validated.amount ? Math.round(req.validated.amount * 100) : 0,
      currency: "INR",
      status: "SUCCESS",
      plan,
    })

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      expiresAt,
      school,
    })
  } catch (error) {
    next(error)
  }
}

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await prisma.paymentTransaction.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { createdAt: "desc" },
    })
    res.status(200).json({ success: true, payments })
  } catch (error) {
    next(error)
  }
}

exports.webhook = async (req, res, next) => {
  try {
    await handleWebhook(req.body, req.headers["x-razorpay-signature"])
    res.status(200).json({ success: true })
  } catch (error) {
    error.status = 400
    next(error)
  }
}
