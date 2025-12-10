const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

exports.getHolidays = async (req, res, next) => {
  try {
    const holidays = await prisma.holiday.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { startDate: "asc" },
    })
    res.status(200).json({ success: true, holidays })
  } catch (error) {
    next(error)
  }
}

exports.createHoliday = async (req, res, next) => {
  try {
    const { holidayName, startDate, endDate, holidayType, description } = req.body

    const holiday = await prisma.holiday.create({
      data: {
        schoolId: req.schoolId,
        holidayName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        holidayType,
        description,
      },
    })

    res.status(201).json({ success: true, message: "Holiday created", holiday })
  } catch (error) {
    next(error)
  }
}

exports.deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.holiday.delete({ where: { id } })
    res.status(200).json({ success: true, message: "Holiday deleted" })
  } catch (error) {
    next(error)
  }
}
