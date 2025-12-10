const express = require("express")
const authMiddleware = require("../middleware/auth")
const { validate, schemas } = require("../utils/validation")
const subscriptionController = require("../controllers/subscriptionController")

const router = express.Router()

router.get("/", authMiddleware, subscriptionController.getSubscription)
router.put("/", authMiddleware, validate(schemas.subscriptionUpdate), subscriptionController.updateSubscription)

module.exports = router

