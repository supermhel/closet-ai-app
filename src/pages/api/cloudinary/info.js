import { v2 as cloudinary } from "cloudinary"
import logger from "@/utils/logger"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const getResourceDetails = async (publicId) => {
  logger.info("Fetching Cloudinary resource details", { publicId })
  
  const result = await cloudinary.api.resource(publicId, {
    colors: true,
    image_metadata: true,
    categorization: "google_tagging,aws_rek_tagging,imagga_tagging",
    auto_tagging: 0.6,
    context: true,
  })

  // Remove any sensitive information
  if (result.api_key) delete result.api_key;
  if (result.api_secret) delete result.api_secret;

  logger.info("Resource details fetched", {
    publicId,
    format: result.format,
    resourceType: result.resource_type,
    type: result.type,
    created: result.created_at,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    hasColors: !!result.colors,
    hasContext: !!result.context,
    aiAnalysis: {
      hasGoogleTags: !!result.info?.categorization?.google_tagging?.data,
      hasAwsTags: !!result.info?.categorization?.aws_rek_tagging?.data,
      hasImaggaTags: !!result.info?.categorization?.imagga_tagging?.data,
    }
  })

  return result
}

const updateMetadata = async (publicId, metadata) => {
  logger.info("Updating Cloudinary resource metadata", {
    publicId,
    metadataKeys: Object.keys(metadata)
  })

  const contextStr = Object.entries(metadata)
    .map(([key, value]) => `${key}=${value}`)
    .join("|")

  const result = await cloudinary.api.update(publicId, {
    context: contextStr,
  })

  // Remove any sensitive information
  if (result.api_key) delete result.api_key;
  if (result.api_secret) delete result.api_secret;

  logger.info("Metadata update completed", {
    publicId,
    success: result.success === true,
    context: result.context
  })

  return result
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    logger.warn("Invalid method for info endpoint", { method: req.method })
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { publicId, action, payload } = req.body

  logger.info("Processing Cloudinary info request", {
    action,
    publicId,
    hasPayload: !!payload
  })

  if (!publicId) {
    logger.error("Missing public ID", { body: req.body })
    return res.status(400).json({ error: "Public ID is required" })
  }

  try {
    let result
    switch (action) {
      case "getResourceDetails":
        result = await getResourceDetails(publicId)
        break

      case "updateMetadata": 
        if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
          logger.error("Invalid metadata payload", {
            publicId,
            payload,
            type: typeof payload
          })
          return res.status(400).json({ error: "Payload with metadata is required for updateMetadata" })
        }
        result = await updateMetadata(publicId, payload)
        break

      default:
        logger.error("Invalid action requested", {
          action,
          publicId
        })
        return res.status(400).json({ error: `Invalid action: ${action}` })
    }

    // Final check to remove any sensitive data
    if (result && typeof result === 'object') {
      if (result.api_key) delete result.api_key;
      if (result.api_secret) delete result.api_secret;
    }

    logger.info("Cloudinary info request completed", {
      action,
      publicId,
      success: true
    })

    res.status(200).json({ success: true, data: result })
  } catch (error) {
    logger.error("Cloudinary info operation failed", {
      action,
      publicId,
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({ success: false, error: `Failed to perform action: ${action}` })
  }
}
