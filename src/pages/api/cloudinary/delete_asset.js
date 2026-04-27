import { v2 as cloudinary } from "cloudinary"
import logger from "@/utils/logger"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default async function handler(req, res) {
  if (req.method !== "POST") {
    logger.warn("Invalid method for delete_asset endpoint", { 
      error: null, 
      method: req.method 
    })
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { publicId, resource_type = "image" } = req.body

    if (!publicId) {
      logger.error("Missing public ID for asset deletion", { 
        error: new Error("Missing publicId"), 
        body: req.body 
      })
      return res.status(400).json({ error: "Public ID is required" })
    }

    logger.info("Attempting to delete Cloudinary asset", {
      error: null,
      publicId,
      resource_type
    })

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    })

    // Ensure no sensitive data is returned
    const sanitizedResult = {
      result: result.result,
      publicId
    }

    logger.info("Asset deletion completed", {
      error: null,
      publicId,
      result: result.result
    })

    res.status(200).json({
      message: "Asset deletion completed",
      ...sanitizedResult
    })
  } catch (error) {
    logger.error("Error deleting asset", {
      error,
      publicId: req.body?.publicId,
      stack: error.stack
    })
    res.status(500).json({ error: "Failed to delete asset" })
  }
}
