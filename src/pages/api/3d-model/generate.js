import { ServiceError } from "@/utils/serviceUtils"
import logger from "@/utils/logger"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    logger.warn("Invalid method for 3D model generation", { method: req.method })
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { imageUrl, itemId, itemType } = req.body

    logger.info("Starting 3D model generation request", {
      itemId,
      itemType,
      hasImageUrl: !!imageUrl
    })

    if (!imageUrl) {
      logger.error("Missing image URL", { body: req.body })
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
        code: "MISSING_IMAGE_URL",
      })
    }

    // Check if Meshy API key is configured
    const meshyApiKey = process.env.MESHY_API_KEY
    if (!meshyApiKey) {
      logger.error("Missing Meshy API key in environment")
      return res.status(500).json({
        success: false,
        error: "3D model generation service not configured",
        code: "MISSING_API_KEY",
      })
    }

    logger.info("Initiating 3D model generation", {
      itemId,
      itemType,
      preset: itemType === "clothing" ? "clothing" : "general"
    })

    // Call Meshy API to generate 3D model
    try {
      // First, initiate the generation job
      const initResponse = await fetch("https://api.meshy.ai/v1/image-to-3d", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${meshyApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          preset: itemType === "clothing" ? "clothing" : "general",
          webhook_url: process.env.WEBHOOK_URL || null,
        }),
      })

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}))
        logger.error("Meshy API initialization failed", {
          status: initResponse.status,
          statusText: initResponse.statusText,
          error: errorData,
          itemId
        })

        throw new ServiceError(
          `Failed to initiate 3D model generation: ${initResponse.statusText}`,
          "MESHY_API_ERROR"
        )
      }

      const initData = await initResponse.json()
      const jobId = initData.job_id

      logger.info("3D model generation job initiated", {
        jobId,
        itemId,
        itemType
      })

      // For synchronous response, poll the job status
      let modelData = null
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        attempts++

        logger.info("Polling job status", {
          jobId,
          attempt: attempts,
          maxAttempts
        })

        // Wait between polling attempts
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const statusResponse = await fetch(`https://api.meshy.ai/v1/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${meshyApiKey}`,
          },
        })

        if (!statusResponse.ok) {
          logger.warn("Job status check failed", {
            jobId,
            attempt: attempts,
            status: statusResponse.status
          })
          continue // Try again
        }

        const statusData = await statusResponse.json()

        logger.info("Job status update", {
          jobId,
          status: statusData.status,
          attempt: attempts
        })

        if (statusData.status === "completed") {
          modelData = statusData.result
          break
        } else if (statusData.status === "failed") {
          throw new ServiceError(
            `3D model generation failed: ${statusData.error || "Unknown error"}`,
            "MODEL_GENERATION_FAILED"
          )
        }

        // If still processing, continue polling
      }

      // If we have model data, return it
      if (modelData) {
        logger.info("3D model generation completed successfully", {
          jobId,
          itemId,
          modelFormat: modelData.format,
          hasModelUrl: !!modelData.model_url,
          hasThumbnail: !!modelData.thumbnail_url
        })

        return res.status(200).json({
          success: true,
          modelUrl: modelData.model_url,
          thumbnailUrl: modelData.thumbnail_url,
          format: modelData.format || "glb",
          metadata: {
            jobId,
            generatedAt: new Date().toISOString(),
            itemId,
            itemType,
          },
        })
      }

      // If we reached max attempts without completion
      logger.warn("3D model generation timeout", {
        jobId,
        itemId,
        attempts,
        maxAttempts
      })

      return res.status(202).json({
        success: true,
        status: "processing",
        jobId,
        message: "3D model generation is still in progress. Check back later.",
        metadata: {
          itemId,
          itemType,
          startedAt: new Date().toISOString(),
        },
      })
    } catch (apiError) {
      logger.error("3D model generation API error", {
        error: apiError.message,
        stack: apiError.stack,
        itemId,
        code: apiError.code || "API_ERROR"
      })

      // Fall back to mock response if API call fails
      logger.info("Using mock 3D model fallback", { itemId })

      // Return a mock response with a placeholder model
      return res.status(200).json({
        success: true,
        modelUrl: "https://storage.googleapis.com/closetai-models/placeholder_model.glb",
        thumbnailUrl: "https://storage.googleapis.com/closetai-models/placeholder_thumbnail.png",
        format: "glb",
        metadata: {
          generatedAt: new Date().toISOString(),
          itemId,
          itemType,
          isMock: true,
        },
      })
    }
  } catch (error) {
    logger.error("3D model generation request failed", {
      error: error.message,
      stack: error.stack,
      code: error.code || "INTERNAL_ERROR",
      itemId: req.body?.itemId
    })

    return res.status(500).json({
      success: false,
      error: "Failed to generate 3D model",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
      code: error.code || "INTERNAL_ERROR",
    })
  }
}
