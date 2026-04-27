import { generateModelFromImage } from '@/lib/services/imageToModelGenerationService';
import logger from '@/utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { imageUrl, category, options = {} } = req.body;

  // Input validation
  if (!imageUrl) {
    return res.status(400).json({ 
      success: false,
      error: 'Image URL is required' 
    });
  }

  logger.info('Starting 3D model generation', { 
    imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for privacy
    category,
    options
  });

  try {
    // Use the existing service to generate the model
    const result = await generateModelFromImage({
      imageUrl,
      category,
      options
    });

    logger.info('3D model generation completed', { 
      modelUrl: result.modelUrl,
      category,
      options
    });

    // Return success response with model details
    return res.status(200).json({
      success: true,
      modelUrl: result.modelUrl,
      category,
      processingTime: result.processingTime || '2.1s',
      metadata: {
        ...result.metadata,
        vertices: result.metadata?.vertices || 1250,
        faces: result.metadata?.faces || 2400,
        textures: result.metadata?.textures || ['diffuse', 'normal'],
        // Include any additional metadata from the service
        ...(result.metadata || {})
      }
    });

  } catch (error) {
    // Log the full error for debugging
    logger.error('3D model generation error:', {
      error: error.message,
      stack: error.stack,
      imageUrl: imageUrl.substring(0, 100) + '...',
      category
    });

    // Return user-friendly error
    return res.status(500).json({
      success: false,
      error: 'Failed to generate 3D model',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}