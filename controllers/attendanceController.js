const { PrismaClient } = require("@prisma/client")
const { sendFCM } = require("../utils/notifications")

const prisma = new PrismaClient()

exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, gatekeeperId, action } = req.body

    if (!["entry", "exit"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    const today = new Date().toDateString()
    const todayDate = new Date(today)

    let attendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        attendanceDate: todayDate,
      },
    })

    if (action === "entry") {
      const now = new Date()

      if (attendance) {
        return res.status(400).json({ error: "Entry already marked today" })
      }

      // Check if late
      const school = await prisma.school.findUnique({ where: { id: student.schoolId } })
      const schoolStartTime = new Date(todayDate)
      const [hours, minutes] = school.schoolStartTime.split(":")
      schoolStartTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0)

      const isLate = now > new Date(schoolStartTime.getTime() + 15 * 60000)

      attendance = await prisma.attendance.create({
        data: {
          schoolId: student.schoolId,
          studentId,
          gatekeeperId: gatekeeperId || null,
          entryTime: now,
          attendanceDate: todayDate,
          status: isLate ? "LATE" : "PRESENT",
          isLate,
          createdBy: req.userEmail || "system",
        },
      })

      // Send FCM notification asynchronously
      if (student.fcmToken) {
        sendFCM(student.fcmToken, "Attendance Marked", `Entry marked at ${now.toLocaleTimeString()}`, {
          type: "attendance",
          click_action: "/student/attendance",
        }).catch((err) => console.error("FCM error:", err))
      }

      return res.status(201).json({ success: true, attendance, student })
    }

    if (action === "exit") {
      if (!attendance) {
        return res.status(400).json({ error: "Entry not marked yet" })
      }

      const now = new Date()
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { exitTime: now },
      })

      if (student.fcmToken) {
        sendFCM(student.fcmToken, "Exit Marked", `Exit marked at ${now.toLocaleTimeString()}`, {
          type: "attendance",
          click_action: "/student/attendance",
        }).catch((err) => console.error("FCM error:", err))
      }

      return res.status(200).json({ success: true, attendance, student })
    }
  } catch (error) {
    next(error)
  }
}

exports.getAttendance = async (req, res, next) => {
  try {
    const { schoolId, studentId, date, startDate, endDate, status, limit = 50, offset = 0 } = req.query

    const where = { schoolId: schoolId || req.schoolId }

    if (studentId) where.studentId = studentId
    if (status) where.status = status.toUpperCase()

    if (date) {
      const targetDate = new Date(date)
      where.attendanceDate = targetDate
    } else if (startDate && endDate) {
      where.attendanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { student: true, gatekeeper: true },
        take: Number.parseInt(limit),
        skip: Number.parseInt(offset),
        orderBy: { attendanceDate: "desc" },
      }),
      prisma.attendance.count({ where }),
    ])

    res.status(200).json({ success: true, attendance, total })
  } catch (error) {
    next(error)
  }
}

exports.getAttendanceReports = async (req, res, next) => {
  try {
    const { schoolId, month, year } = req.query

    const startDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
    const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0)

    const attendance = await prisma.attendance.findMany({
      where: {
        schoolId: schoolId || req.schoolId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { student: true },
    })

    const reportMap = new Map()

    attendance.forEach((record) => {
      if (!reportMap.has(record.studentId)) {
        reportMap.set(record.studentId, {
          studentId: record.student.studentId,
          studentName: record.student.fullName,
          class: record.student.class,
          section: record.student.section,
          totalDays: 0,
          present: 0,
          late: 0,
          absent: 0,
        })
      }

      const student = reportMap.get(record.studentId)
      student.totalDays++

      if (record.status === "PRESENT") student.present++
      else if (record.status === "LATE") student.late++
      else if (record.status === "ABSENT") student.absent++
    })

    const report = Array.from(reportMap.values()).map((r) => ({
      ...r,
      attendancePercentage: (((r.present + r.late) / r.totalDays) * 100).toFixed(2),
    }))

    res.status(200).json({ success: true, report, month: Number.parseInt(month), year: Number.parseInt(year) })
  } catch (error) {
    next(error)
  }
}

exports.getTodayAttendance = async (req, res, next) => {
  try {
    const { schoolId } = req.query

    const today = new Date().toDateString()
    const todayDate = new Date(today)

    const attendance = await prisma.attendance.findMany({
      where: {
        schoolId: schoolId || req.schoolId,
        attendanceDate: todayDate,
      },
      include: { student: true },
    })

    const summary = {
      present: attendance.filter((a) => a.status === "PRESENT").length,
      late: attendance.filter((a) => a.status === "LATE").length,
      absent: attendance.filter((a) => a.status === "ABSENT").length,
      students: attendance.map((a) => ({
        studentId: a.student.studentId,
        studentName: a.student.fullName,
        status: a.status,
        entryTime: a.entryTime,
        exitTime: a.exitTime,
      })),
    }

    res.status(200).json({ success: true, summary })
  } catch (error) {
    next(error)
  }
}
