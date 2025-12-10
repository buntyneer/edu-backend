const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Clean up existing data (optional)
  // await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE;');

  // Create a school
  const school = await prisma.school.create({
    data: {
      schoolName: "Demo School",
      displayName: "Demo School",
      sidebarHeaderSubtitle: "Welcome to Demo School",
      instituteType: "SCHOOL",
      schoolAddress: "123 Education Street, City",
      zipcode: "123456",
      schoolType: "PRIVATE",
      establishmentYear: 2020,
      principalName: "Dr. John Doe",
      principalEmail: "principal@demoschool.com",
      principalPhone: "+1234567890",
      schoolStartTime: "08:00",
      schoolEndTime: "15:00",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: "admin@demoschool.com",
    },
  })

  console.log(`✅ School created: ${school.schoolName}`)

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin@123456", 10)
  const user = await prisma.user.create({
    data: {
      email: "admin@demoschool.com",
      password: hashedPassword,
      fullName: "Admin User",
      role: "ADMIN",
      schoolId: school.id,
    },
  })

  console.log(`✅ Admin user created: ${user.email}`)

  // Create sample students
  const studentIds = []
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        studentId: `STU-${String(i).padStart(5, "0")}`,
        fullName: `Student ${i}`,
        fatherName: `Father ${i}`,
        motherName: `Mother ${i}`,
        dateOfBirth: new Date(2010, Math.random() * 12, Math.random() * 28),
        class: "10A",
        section: "A",
        parentWhatsapp: `+919999999${String(i).padStart(2, "0")}`,
        parentEmail: `parent${i}@example.com`,
        enrollmentDate: new Date(),
        createdBy: user.email,
      },
    })
    studentIds.push(student.id)
    console.log(`✅ Student created: ${student.fullName}`)
  }

  // Create a batch
  const batch = await prisma.batch.create({
    data: {
      schoolId: school.id,
      batchName: "Morning Batch - Grade 10",
      batchCode: `BATCH-${uuidv4().substring(0, 8).toUpperCase()}`,
      startTime: "08:00",
      endTime: "12:00",
      entryTime: "07:45",
      exitTime: "12:15",
      daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      courseName: "Primary Education",
      instructorName: "Ms. Jane Smith",
      maxCapacity: 50,
      currentEnrollment: 5,
      batchType: "REGULAR",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`✅ Batch created: ${batch.batchName}`)

  // Create a gatekeeper
  const gatekeeper = await prisma.gatekeeper.create({
    data: {
      schoolId: school.id,
      fullName: "Gate Keeper 1",
      gatekeeperId: `GK-${uuidv4().substring(0, 8).toUpperCase()}`,
      email: "gatekeeper@demoschool.com",
      phoneNumber: "+1234567890",
      gateNumber: "Gate 1",
      shiftStart: "07:00",
      shiftEnd: "15:00",
      accessLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/gatekeeper/${uuidv4()}`,
      createdBy: user.email,
    },
  })

  console.log(`✅ Gatekeeper created: ${gatekeeper.fullName}`)

  // Create holidays
  await prisma.holiday.create({
    data: {
      schoolId: school.id,
      holidayName: "Independence Day",
      startDate: new Date(new Date().getFullYear(), 7, 15),
      endDate: new Date(new Date().getFullYear(), 7, 15),
      holidayType: "NATIONAL",
      description: "National Holiday",
    },
  })

  console.log("✅ Holidays created")

  // Create a license key
  const licenseKey = await prisma.licenseKey.create({
    data: {
      licenseKey: `EDUMANEGE-${uuidv4().substring(0, 12).toUpperCase()}`,
      schoolId: school.id,
      schoolName: school.schoolName,
      principalEmail: school.principalEmail,
      principalName: school.principalName,
      duration: "12",
      planType: "REGULAR",
      isActivated: true,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`✅ License key created: ${licenseKey.licenseKey}`)

  console.log("\n🎉 Database seed completed successfully!")
  console.log("\nTest Credentials:")
  console.log(`Email: ${user.email}`)
  console.log(`Password: Admin@123456`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
