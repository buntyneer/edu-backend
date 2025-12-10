const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { schoolId: req.schoolId },
      include: {
        student: true,
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
    })

    res.status(200).json({ success: true, conversations })
  } catch (error) {
    next(error)
  }
}

exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    })

    res.status(200).json({ success: true, messages })
  } catch (error) {
    next(error)
  }
}

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, messageText, messageType = "TEXT", attachmentUrl } = req.body

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderUserId: req.userId,
        senderType: "TEACHER",
        messageText,
        messageType,
        attachmentUrl,
      },
    })

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: messageText,
        lastMessageTime: new Date(),
        lastMessageSender: req.userId,
      },
    })

    res.status(201).json({ success: true, message: "Message sent", data: message })
  } catch (error) {
    next(error)
  }
}

exports.markMessageAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params

    await prisma.message.updateMany({
      where: { conversationId },
      data: { isReadByTeacher: true, deliveredToTeacher: true },
    })

    res.status(200).json({ success: true, message: "Messages marked as read" })
  } catch (error) {
    next(error)
  }
}

exports.createConversation = async (req, res, next) => {
  try {
    const { studentId, conversationType } = req.body

    const conversation = await prisma.conversation.create({
      data: {
        schoolId: req.schoolId,
        studentId,
        parentUserId: req.userId,
        conversationType,
      },
    })

    res.status(201).json({ success: true, message: "Conversation created", conversation })
  } catch (error) {
    next(error)
  }
}
