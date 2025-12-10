const { PrismaClient } = require("@prisma/client")
const { v4: uuidv4 } = require("uuid")
const prisma = new PrismaClient()

exports.generateLicenseKey = async (req, res, next) => {
  try {
    const { schoolName, principalEmail, principalName, duration, planType, maxStudents = 200 } = req.body

    const licenseKey = `EDUMANEGE-${uuidv4().substring(0, 12).toUpperCase()}`
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + Number.parseInt(duration))

    const license = await prisma.licenseKey.create({
      data: {
        licenseKey,
        schoolName,
        principalEmail,
        principalName,
        duration,
        planType,
        expiresAt,
      },
    })

    res.status(201).json({ success: true, message: "License key generated", license })
  } catch (error) {
    next(error)
  }
}

exports.validateLicenseKey = async (req, res, next) => {
  try {
    const { licenseKey } = req.body

    const license = await prisma.licenseKey.findUnique({
      where: { licenseKey },
    })

    if (!license) {
      return res.status(404).json({ success: false, error: "License key not found" })
    }

    const isValid = new Date() < license.expiresAt && license.isActivated
    res.status(200).json({ success: true, isValid, license })
  } catch (error) {
    next(error)
  }
}

exports.activateLicenseKey = async (req, res, next) => {
  try {
    const { licenseKey, schoolId } = req.body

    const license = await prisma.licenseKey.update({
      where: { licenseKey },
      data: {
        isActivated: true,
        activatedAt: new Date(),
        schoolId,
      },
    })

    res.status(200).json({ success: true, message: "License key activated", license })
  } catch (error) {
    next(error)
  }
}
