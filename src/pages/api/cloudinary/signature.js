import logger from '@/utils/logger';
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinaryAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    logger.warn("Invalid method for signature endpoint", { error: null, method: req.method });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Simple context-based authentication check
    // You can enhance this with session checks, tokens, etc.
    const authHeader = req.headers.authorization;
    const sessionToken = req.cookies?.session || req.headers['x-session-token'];
    
    // For development, allow requests without strict auth
    // In production, you'd want to properly validate the session
    const isAuthenticated = process.env.NODE_ENV === 'development' || 
                           sessionToken || 
                           (authHeader && authHeader.startsWith('Bearer '));
    
    const userId = req.headers['x-user-id'] || 'anonymous-user';
    
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      logger.warn('Unauthorized attempt to get Cloudinary signature', { error: null, userId });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Config check
    if (!isCloudinaryConfigured) {
      logger.error('Cloudinary SDK not configured. Cannot generate signature.', { 
        error: new Error('Cloudinary not configured') 
      });
      return res.status(500).json({ error: 'Server configuration error: Cloudinary not configured.' });
    }

    // Get params from request
    const { upload_preset } = req.body;
    
    // Use the correct folder path based on the upload preset
    let folderPath = "wardrobe";
    if (upload_preset === "closet_ai_raw") {
      folderPath = "wardrobe/temp";
    }
    
    logger.info("Generating Cloudinary signature", {
      error: null,
      userId,
      upload_preset,
      folder: folderPath
    });

    if (!upload_preset) {
      logger.error("Missing upload preset", { error: new Error('Missing upload preset'), body: req.body });
      return res.status(400).json({ error: "Upload preset is required" });
    }

    // Create parameters for signature with AI analysis options
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Keep only the essential parameters for the signature in the exact order Cloudinary expects
    const paramsToSign = {
      folder: folderPath,
      timestamp,
      upload_preset
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);

    // Get the API key but don't log it
    const api_key = cloudinary.config().api_key;

    logger.info("Signature generated successfully", {
      error: null,
      userId,
      timestamp,
      upload_preset,
      hasSignature: !!signature
    });

    // Return all necessary data for the upload but don't include the API key in the log
    const responseData = {
      signature,
      timestamp,
      api_key,
      folder: folderPath,
      upload_preset,
      // Add additional parameters that don't affect the signature
      colors: true,
      overwrite: true,
      unique_filename: false,
      async: false,
      use_filename_as_display_name: true,
      media_metadata: true,
      type: "upload",
      categorization: "aws_rek_tagging,google_tagging,imagga_tagging",
      moderation: "aws_rek",
      detection: "cld-fashion_v4,captioning,iqa,watermark-detection",
      auto_tagging: 0.85,
      allowed_formats: "jpg,png,webp"
    };
    
    // Don't log the full response with API key
    res.status(200).json(responseData);

  } catch (error) {
    logger.error("Error generating signature", {
      error: error,
      stack: error.stack,
      userId: req.headers['x-user-id'] || 'anonymous-user'
    });
    res.status(500).json({ error: 'Failed to generate Cloudinary signature', details: error.message });
  }
}
