const QRCode = require("qrcode")

async function generateQRCode(data) {
  try {
    const qrData = JSON.stringify(data)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
      type: "image/png",
    })
    return qrCodeDataURL
  } catch (error) {
    console.error("QR Code generation error:", error)
    throw error
  }
}

async function generateQRCodeBase64(data) {
  try {
    const qrData = JSON.stringify(data)
    const buffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
    })
    return buffer.toString("base64")
  } catch (error) {
    console.error("QR Code generation error:", error)
    throw error
  }
}

module.exports = { generateQRCode, generateQRCodeBase64 }
