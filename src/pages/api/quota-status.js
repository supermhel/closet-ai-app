import { quotaManager, createCroppedImageUrls } from "@/lib/services/quotaManager";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const quotaStatus = quotaManager.getQuotaStatus();
      const recommendedPriority = quotaManager.getRecommendedPriority();
      const usageSummary = quotaManager.getUsageSummary();

      return res.status(200).json({
        success: true,
        data: {
          quotaStatus,
          recommendedPriority,
          usageSummary,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting quota status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get quota status'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, publicId, detectionData } = req.body;

      if (action === 'reset') {
        quotaManager.resetMonthlyUsage();
        return res.status(200).json({
          success: true,
          message: 'Quota usage reset successfully'
        });
      }

      if (action === 'crop' && publicId && detectionData) {
        const croppedUrls = createCroppedImageUrls(publicId, detectionData);
        return res.status(200).json({
          success: true,
          data: {
            croppedUrls,
            count: croppedUrls.length
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action or missing parameters'
      });
    } catch (error) {
      console.error('Error processing quota action:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process quota action'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
} 