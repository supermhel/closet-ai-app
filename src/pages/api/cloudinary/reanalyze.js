import logger from "@/utils/logger";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinaryAdmin";
import { quotaManager } from "@/lib/services/quotaManager";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!isCloudinaryConfigured) {
    logger.error("Cloudinary Admin SDK not configured on the server.");
    return res.status(500).json({ error: "Image processing backend is not configured." });
  }

  try {
    const { publicId } = req.body;
    if (!publicId) {
      logger.error("Missing publicId for re-analysis");
      return res.status(400).json({ error: "Image public ID is required" });
    }

    logger.info(`Triggering fallback re-analysis for public_id: ${publicId}`);
    
    // Get optimal AI services based on current quota usage
    const aiConfig = quotaManager.getOptimalServices('low'); // Use low priority for re-analysis
    logger.info("Using optimized AI services for re-analysis", {
      publicId,
      aiConfig,
      quotaStatus: quotaManager.getUsageSummary()
    });
    
    // Use the explicit method to apply the upload preset to an existing image
    // This triggers the AI analysis but we don't return the full result
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      upload_preset: "closet_ai_upload",
      // Let the preset handle the folder (wardrobe) - don't override it
      categorization: aiConfig.categorization,
      detection: aiConfig.detection,
    });

    // Record the AI service usage
    quotaManager.recordUsage({
      categorization: aiConfig.categorization,
      detection: aiConfig.detection
    });

    // Remove any sensitive information
    if (result.api_key) delete result.api_key;
    if (result.api_secret) delete result.api_secret;

    logger.info("Fallback re-analysis triggered successfully", { 
      publicId: result.public_id,
      success: true
    });

    // Return minimal information - just enough to confirm success
    // The complete analysis data will be fetched separately via the info endpoint
    return res.status(200).json({
      success: true,
      public_id: result.public_id,
      secure_url: result.secure_url
    });

  } catch (error) {
    logger.error("Error in re-analysis endpoint", { 
      errorMessage: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: "An internal server error occurred during re-analysis." });
  }
} 