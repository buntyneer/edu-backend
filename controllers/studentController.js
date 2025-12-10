const { PrismaClient } = require("@prisma/client")
const { v4: uuidv4 } = require("uuid")
const { generateQRCode, generateQRCodeBase64 } = require("../utils/qrcode")

const prisma = new PrismaClient()

exports.getStudents = async (req, res, next) => {
  try {
    const {
      schoolId,
      class: className,
      section,
      batchId,
      search,
      status = "ACTIVE",
      limit = 50,
      offset = 0,
    } = req.query

    const where = {
      schoolId: schoolId || req.schoolId,
      status: status.toUpperCase(),
    }

    if (className) where.class = className
    if (section) where.section = section
    if (batchId) where.batchIds = { has: batchId }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        take: Number.parseInt(limit),
        skip: Number.parseInt(offset),
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ])

    res.status(200).json({ success: true, students, total })
  } catch (error) {
    next(error)
  }
}

exports.createStudent = async (req, res, next) => {
  try {
    const {
      schoolId,
      fullName,
      fatherName,
      motherName,
      dateOfBirth,
      class: className,
      section,
      parentWhatsapp,
      parentEmail,
      enrollmentDate,
      guardianName,
      courseName,
      courseDuration,
      batchTiming,
      targetScore,
      currentLevel,
      subjects,
      address,
      emergencyContact,
      medicalInfo,
      previousSchool,
    } = req.validated

    // Generate unique student ID
    const studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const student = await prisma.student.create({
      data: {
        schoolId: schoolId || req.schoolId,
        studentId,
        fullName,
        fatherName,
        motherName,
        guardianName,
        dateOfBirth: new Date(dateOfBirth),
        class: className,
        section,
        courseName,
        courseDuration,
        batchTiming,
        targetScore,
        currentLevel,
        subjects,
        studentPhoto: req.file?.path || null,
        address,
        emergencyContact,
        parentWhatsapp,
        parentEmail,
        medicalInfo,
        previousSchool,
        enrollmentDate: new Date(enrollmentDate),
        createdBy: req.userEmail,
      },
    })

    res.status(201).json({ success: true, student })
  } catch (error) {
    next(error)
  }
}

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = { ...req.validated }

    if (req.file) {
      data.studentPhoto = req.file.path
    }

    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth)
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    })

    res.status(200).json({ success: true, student })
  } catch (error) {
    next(error)
  }
}

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params

    const student = await prisma.student.update({
      where: { id },
      data: { status: "DROPPED" },
    })

    res.status(200).json({ success: true, message: "Student dropped", student })
  } catch (error) {
    next(error)
  }
}

exports.generateQRCode = async (req, res, next) => {
  try {
    const { id } = req.params

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    const qrData = {
      studentId: student.studentId,
      schoolId: student.schoolId,
      fullName: student.fullName,
    }

    const qrCodeDataURL = await generateQRCode(qrData)

    res.status(200).json({ success: true, qrCodeDataURL })
  } catch (error) {
    next(error)
  }
}
