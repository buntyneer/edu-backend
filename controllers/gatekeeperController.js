const { PrismaClient } = require("@prisma/client")
const { v4: uuidv4 } = require("uuid")
const prisma = new PrismaClient()

exports.getGatekeepers = async (req, res, next) => {
  try {
    const gatekeepers = await prisma.gatekeeper.findMany({
      where: { schoolId: req.schoolId },
    })
    res.status(200).json({ success: true, gatekeepers })
  } catch (error) {
    next(error)
  }
}

exports.createGatekeeper = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, fatherName, address, gateNumber, shiftStart, shiftEnd } = req.body

    const gatekeeperId = `GK-${uuidv4().substring(0, 8).toUpperCase()}`
    const accessLink = `${process.env.FRONTEND_URL}/gatekeeper/${uuidv4()}`

    const gatekeeper = await prisma.gatekeeper.create({
      data: {
        schoolId: req.schoolId,
        fullName,
        gatekeeperId,
        email,
        phoneNumber,
        fatherName,
        address,
        gateNumber,
        shiftStart,
        shiftEnd,
        accessLink,
        createdBy: req.userEmail,
      },
    })

    res.status(201).json({ success: true, message: "Gatekeeper created", gatekeeper })
  } catch (error) {
    next(error)
  }
}

exports.updateGatekeeper = async (req, res, next) => {
  try {
    const { id } = req.params
    const gatekeeper = await prisma.gatekeeper.update({
      where: { id },
      data: req.body,
    })
    res.status(200).json({ success: true, message: "Gatekeeper updated", gatekeeper })
  } catch (error) {
    next(error)
  }
}

exports.deleteGatekeeper = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.gatekeeper.delete({ where: { id } })
    res.status(200).json({ success: true, message: "Gatekeeper deleted" })
  } catch (error) {
    next(error)
  }
}
