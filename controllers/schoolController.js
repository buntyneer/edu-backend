const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

exports.getSchoolInfo = async (req, res, next) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.schoolId },
      include: {
        students: true,
        batches: true,
        gatekeepers: true,
      },
    })

    if (!school) {
      return res.status(404).json({ error: "School not found" })
    }

    res.status(200).json({ success: true, school })
  } catch (error) {
    next(error)
  }
}

exports.updateSchoolInfo = async (req, res, next) => {
  try {
    const {
      displayName,
      schoolAddress,
      principalName,
      primaryColor,
      secondaryColor,
      schoolStartTime,
      schoolEndTime,
      classesOffered,
      defaultSections,
    } = req.body

    const school = await prisma.school.update({
      where: { id: req.schoolId },
      data: {
        ...(displayName && { displayName }),
        ...(schoolAddress && { schoolAddress }),
        ...(principalName && { principalName }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(schoolStartTime && { schoolStartTime }),
        ...(schoolEndTime && { schoolEndTime }),
        ...(classesOffered && { classesOffered }),
        ...(defaultSections && { defaultSections }),
      },
    })

    res.status(200).json({ success: true, message: "School updated successfully", school })
  } catch (error) {
    next(error)
  }
}

exports.getSchoolStats = async (req, res, next) => {
  try {
    const [totalStudents, totalBatches, totalGatekeepers, presentToday, absentToday] = await Promise.all([
      prisma.student.count({ where: { schoolId: req.schoolId, status: "ACTIVE" } }),
      prisma.batch.count({ where: { schoolId: req.schoolId, status: "ACTIVE" } }),
      prisma.gatekeeper.count({ where: { schoolId: req.schoolId, status: "ACTIVE" } }),
      prisma.attendance.count({
        where: {
          schoolId: req.schoolId,
          attendanceDate: new Date().toISOString().split("T")[0],
          status: "PRESENT",
        },
      }),
      prisma.attendance.count({
        where: {
          schoolId: req.schoolId,
          attendanceDate: new Date().toISOString().split("T")[0],
          status: "ABSENT",
        },
      }),
    ])

    res.status(200).json({
      success: true,
      stats: { totalStudents, totalBatches, totalGatekeepers, presentToday, absentToday },
    })
  } catch (error) {
    next(error)
  }
}
