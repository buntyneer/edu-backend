const { PrismaClient } = require("@prisma/client")
const webpush = require("web-push")
const prisma = new PrismaClient()

webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@edumanege.com"}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

exports.sendNotification = async (req, res, next) => {
  try {
    const { title, description, link, targetUserEmails } = req.body

    const notifications = await Promise.all(
      targetUserEmails.map((email) =>
        prisma.notification.create({
          data: {
            userEmail: email,
            title,
            description,
            link,
          },
        }),
      ),
    )

    res.status(201).json({ success: true, message: "Notifications created", notifications })
  } catch (error) {
    next(error)
  }
}

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userEmail: req.userEmail },
      orderBy: { createdAt: "desc" },
    })

    res.status(200).json({ success: true, notifications })
  } catch (error) {
    next(error)
  }
}

exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    res.status(200).json({ success: true, notification })
  } catch (error) {
    next(error)
  }
}
