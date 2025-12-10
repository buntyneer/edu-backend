const admin = require("firebase-admin")
const webpush = require("web-push")

// Initialize Firebase Admin SDK
let firebaseInitialized = false

function initializeFirebase() {
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      })
      firebaseInitialized = true
    } catch (error) {
      console.error("Firebase initialization error:", error)
    }
  }
}

// Setup Web Push VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:edumanege1@gmail.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
}

async function sendFCM(fcmToken, title, body, data = {}) {
  try {
    initializeFirebase()

    if (!fcmToken || !firebaseInitialized) {
      return { success: false, error: "FCM token or Firebase not initialized" }
    }

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      webpush: {
        fcmOptions: { link: data.click_action || "/" },
      },
    })

    return { success: true }
  } catch (error) {
    console.error("FCM error:", error.message)
    return { success: false, error: error.message }
  }
}

async function sendWebPush(subscription, title, body) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: "/icon-192.png",
      }),
    )
    return { success: true }
  } catch (error) {
    console.error("Web Push error:", error.message)
    return { success: false, error: error.message }
  }
}

async function sendBulkFCM(fcmTokens, title, body, data = {}) {
  try {
    initializeFirebase()

    const validTokens = fcmTokens.filter((token) => token)
    if (validTokens.length === 0) {
      return { success: false, error: "No valid FCM tokens" }
    }

    const messages = validTokens.map((token) => ({
      token,
      notification: { title, body },
      data,
      webpush: { fcmOptions: { link: data.click_action || "/" } },
    }))

    const response = await admin.messaging().sendAll(messages)

    return { success: true, sentCount: response.successCount, failureCount: response.failureCount }
  } catch (error) {
    console.error("Bulk FCM error:", error.message)
    return { success: false, error: error.message }
  }
}

module.exports = { sendFCM, sendWebPush, sendBulkFCM }
