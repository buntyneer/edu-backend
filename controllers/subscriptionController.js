const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

exports.getSubscription = async (req, res, next) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.schoolId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        studentLimit: true,
        licenseKey: true,
      },
    })

    res.status(200).json({ success: true, subscription: school })
  } catch (error) {
    next(error)
  }
}

exports.updateSubscription = async (req, res, next) => {
  try {
    const data = { ...req.validated }
    const subscription = await prisma.school.update({
      where: { id: req.schoolId },
      data,
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        studentLimit: true,
        licenseKey: true,
      },
    })

    res.status(200).json({ success: true, subscription })
  } catch (error) {
    next(error)
  }
}



