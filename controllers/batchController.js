const { PrismaClient } = require("@prisma/client")
const { v4: uuidv4 } = require("uuid")
const prisma = new PrismaClient()

exports.getBatches = async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { schoolId: req.schoolId },
      include: { students: true },
    })
    res.status(200).json({ success: true, batches })
  } catch (error) {
    next(error)
  }
}

exports.createBatch = async (req, res, next) => {
  try {
    const {
      batchName,
      startTime,
      endTime,
      entryTime,
      exitTime,
      daysOfWeek,
      courseName,
      instructorName,
      maxCapacity,
      batchType,
      feeAmount,
      startDate,
      endDate,
    } = req.body

    const batchCode = `BATCH-${uuidv4().substring(0, 8).toUpperCase()}`

    const batch = await prisma.batch.create({
      data: {
        schoolId: req.schoolId,
        batchName,
        batchCode,
        startTime,
        endTime,
        entryTime,
        exitTime,
        daysOfWeek: daysOfWeek || [],
        courseName,
        instructorName,
        maxCapacity,
        batchType,
        feeAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    res.status(201).json({ success: true, message: "Batch created", batch })
  } catch (error) {
    next(error)
  }
}

exports.updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params
    const batch = await prisma.batch.update({
      where: { id },
      data: req.body,
    })
    res.status(200).json({ success: true, message: "Batch updated", batch })
  } catch (error) {
    next(error)
  }
}

exports.deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.batch.delete({ where: { id } })
    res.status(200).json({ success: true, message: "Batch deleted" })
  } catch (error) {
    next(error)
  }
}
