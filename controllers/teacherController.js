const { PrismaClient } = require("@prisma/client")
const { hashPassword } = require("../services/authService")

const prisma = new PrismaClient()

exports.listTeachers = async (req, res, next) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { schoolId: req.schoolId, role: "TEACHER" },
      select: { id: true, email: true, fullName: true, createdAt: true },
    })
    res.status(200).json({ success: true, teachers })
  } catch (error) {
    next(error)
  }
}

exports.createTeacher = async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.validated
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: "Email already in use" })
    }

    const teacher = await prisma.user.create({
      data: {
        email,
        password: password ? await hashPassword(password) : await hashPassword(Math.random().toString(36)),
        fullName,
        role: role || "TEACHER",
        schoolId: req.schoolId,
      },
    })

    res.status(201).json({ success: true, teacher: { id: teacher.id, email: teacher.email, fullName: teacher.fullName } })
  } catch (error) {
    next(error)
  }
}

exports.updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = { ...req.validated }
    if (data.password) {
      data.password = await hashPassword(data.password)
    }
    const teacher = await prisma.user.update({
      where: { id },
      data,
    })
    res.status(200).json({ success: true, teacher })
  } catch (error) {
    next(error)
  }
}

exports.deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.user.delete({ where: { id } })
    res.status(200).json({ success: true, message: "Teacher removed" })
  } catch (error) {
    next(error)
  }
}



