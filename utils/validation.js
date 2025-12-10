const Joi = require("joi")

const schemas = {
  register: Joi.object({
    schoolName: Joi.string().required(),
    instituteType: Joi.string()
      .valid("school", "ielts_center", "computer_center", "tuition_center", "coaching_center")
      .required(),
    schoolAddress: Joi.string().required(),
    principalName: Joi.string().required(),
    principalEmail: Joi.string().email().required(),
    principalPhone: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  googleLogin: Joi.object({
    idToken: Joi.string().required(),
    schoolId: Joi.string().optional(),
  }),

  student: Joi.object({
    schoolId: Joi.string().required(),
    fullName: Joi.string().required(),
    fatherName: Joi.string().required(),
    motherName: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    class: Joi.string().required(),
    section: Joi.string().required(),
    parentWhatsapp: Joi.string().required(),
    parentEmail: Joi.string().email(),
    enrollmentDate: Joi.date().required(),
  }),

  batch: Joi.object({
    schoolId: Joi.string().required(),
    batchName: Joi.string().required(),
    batchCode: Joi.string().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    entryTime: Joi.string().required(),
    exitTime: Joi.string().required(),
    daysOfWeek: Joi.array(),
    maxCapacity: Joi.number().required(),
    batchType: Joi.string().valid("regular", "weekend", "intensive", "online").required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),

  message: Joi.object({
    conversationId: Joi.string().required(),
    senderUserId: Joi.string().required(),
    senderType: Joi.string().valid("parent", "teacher", "principal", "system").required(),
    messageText: Joi.string().required(),
  }),

  paymentOrder: Joi.object({
    schoolId: Joi.string().required(),
    plan: Joi.string().required(),
    amount: Joi.number().positive().required(),
    notes: Joi.object().optional(),
  }),

  paymentVerify: Joi.object({
    orderId: Joi.string().required(),
    paymentId: Joi.string().required(),
    signature: Joi.string().required(),
    schoolId: Joi.string().required(),
    plan: Joi.string().required(),
    amount: Joi.number().positive().optional(),
  }),

  teacher: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).optional(),
    fullName: Joi.string().required(),
    role: Joi.string().valid("TEACHER", "USER").default("TEACHER"),
  }),

  subscriptionUpdate: Joi.object({
    subscriptionStatus: Joi.string().valid("TRIAL", "ACTIVE", "EXPIRED", "CANCELLED").required(),
    subscriptionPlan: Joi.string().valid("REGULAR", "ULTRA").optional(),
    subscriptionExpiresAt: Joi.date().optional(),
    studentLimit: Joi.number().optional(),
  }),
}

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    req.validated = value
    next()
  }
}

module.exports = { schemas, validate }
