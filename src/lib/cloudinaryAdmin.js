import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

let isCloudinaryConfigured = false;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  try {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true, // Default, but good to be explicit
    });
    isCloudinaryConfigured = true;
    logger.info('Cloudinary SDK configured successfully.', { error: null });
  } catch (error) {
    logger.error('Error configuring Cloudinary SDK:', {
      error: new Error(error.message),
      cloudNameProvided: !!CLOUDINARY_CLOUD_NAME,
      apiKeyProvided: !!CLOUDINARY_API_KEY,
      // Do not log API secret
    });
  }
} else {
  let missingVars = [];
  if (!CLOUDINARY_CLOUD_NAME) missingVars.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');
  logger.warn(`Cloudinary SDK not configured. Missing environment variables: ${missingVars.join(', ')}. Cloudinary operations will likely fail.`, {
    error: null,
    missingVars
  });
}

// Export the configured cloudinary instance and a flag to check if it's configured
export { cloudinary, isCloudinaryConfigured }; 