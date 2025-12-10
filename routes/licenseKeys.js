const express = require("express")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const router = express.Router()

router.get("/:licenseKey", async (req, res, next) => {
  try {
    const license = await prisma.licenseKey.findUnique({
      where: { licenseKey: req.params.licenseKey },
    })

    if (!license) {
      return res.status(404).json({ error: "License key not found" })
    }

    res.status(200).json({ success: true, license })
  } catch (error) {
    next(error)
  }
})

module.exports = router
