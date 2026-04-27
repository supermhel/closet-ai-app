import logger from "@/utils/logger";
import { checkOutfitCompatibility } from "@/lib/services/outfitGenerationService";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    logger.warn("Invalid method for compatibility check", { method: req.method });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { items } = req.body;

    logger.info("Starting outfit compatibility check", {
      itemCount: items?.length || 0,
      hasItems: !!items,
      isArray: Array.isArray(items)
    });

    if (!items || !Array.isArray(items) || items.length < 2) {
      logger.error("Invalid items input for compatibility check", {
        items,
        type: typeof items,
        length: items?.length
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request: requires an array of at least two items.' 
      });
    }

    // Log item details before AI processing
    logger.info("Processing items for compatibility check", {
      itemCount: items.length,
      itemCategories: items.map(item => item.category || 'unknown').join(','),
      hasAllImages: items.every(item => !!item.imageUrl),
      hasColors: items.every(item => item.colors && item.colors.length > 0)
    });

    // Use the real intelligent compatibility checking
    const compatibilityResult = await checkOutfitCompatibility(items);

    logger.info("Outfit compatibility check completed", {
      compatible: compatibilityResult.compatible,
      score: compatibilityResult.score,
      analysisCount: compatibilityResult.analysis.length,
      suggestionsCount: compatibilityResult.suggestions.length
    });

    return res.status(200).json({ 
      success: true, 
      result: compatibilityResult 
    });

  } catch (error) {
    logger.error("Outfit compatibility check failed", {
      error: error.message,
      stack: error.stack,
      itemCount: req.body?.items?.length,
      code: error.code || 'INTERNAL_ERROR'
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check outfit compatibility.',
      code: error.code || 'INTERNAL_ERROR'
    });
  }
}
