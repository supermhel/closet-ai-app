/**
 * Cloudinary Service - Browser Compatible Version
 *
 * This service provides browser-compatible methods for working with Cloudinary
 * without requiring Node.js specific modules like 'fs'.
 */

import logger from "@/utils/logger"
import {
  createRateLimiter,
  ServiceError,
  formatResponse,
  checkSignal,
  ServiceResponse,
} from "@/utils/serviceUtils"
import { quotaManager } from "./quotaManager"

// Rate limiter for Cloudinary API calls
const cloudinaryRateLimiter = createRateLimiter(100, 60 * 1000) // 100 calls per minute

// --- TYPE DEFINITIONS ---

interface ImageSize {
  width: number
  height: number
}

interface ImageSizes {
  thumbnail: ImageSize
  preview: ImageSize
  full: ImageSize
}

type Transformation = Record<string, string | number>

interface ImageTransformations {
  base: Transformation[]
  thumbnail: Transformation[]
  preview: Transformation[]
  full: Transformation[]
}

export interface TransformedUrls {
  thumbnail: string
  preview: string
  full: string
  original: string
}

export interface SignatureOptions {
  public_id?: string
  folder?: string
  tags?: string
  context?: Record<string, string | number | boolean>
  colors?: boolean
  overwrite?: boolean
  unique_filename?: boolean
  async?: boolean
  use_filename_as_display_name?: boolean
  media_metadata?: boolean
  type?: string
  categorization?: string
  moderation?: string
  detection?: string
  access_control?: string
  auto_tagging?: number
  allowed_formats?: string
  ocr?: string
}

export interface SignatureData {
  timestamp: string // Cloudinary returns timestamp as a string
  signature: string
  api_key: string
  ocr?: string
}

export interface UploadOptions extends SignatureOptions {
  [key: string]: string | number | boolean | undefined | Record<string, string | number | boolean>
}

export interface CloudinaryUploadResult {
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  urls: TransformedUrls
}

export type ResourceType = "image" | "video" | "raw"

export interface DeletionResult {
  message: string
  result: "ok" | "not found"
}

export interface CloudinaryImageInfo {
  public_id: string
  format: string
  version: number
  resource_type: string
  type: string
  created_at: string
  bytes: number
  width: number
  height: number
  url: string
  secure_url: string
  [key: string]: unknown // for other properties
}

/**
 * Represents the detailed information of a Cloudinary asset returned from the Admin API.
 */
export interface CloudinaryAssetDetails {
  public_id: string
  format: string
  version: number
  resource_type: string
  type: string
  created_at: string
  bytes: number
  width: number
  height: number
  url: string
  secure_url: string
  tags: string[]
  context?: {
    custom: Record<string, string>
  }
  colors?: [string, number][]
  predominant?: {
    google?: [string, number][]
    cloudinary?: [string, number][]
  }
  info?: {
    categorization?: {
      aws_rek_tagging?: { data: { tag: string; confidence: number }[] }
      google_tagging?: { data: { tag: string; confidence: number }[] }
      imagga_tagging?: { data: { tag: { en: string }; confidence: number }[] }
      cld_fashion_v4?: { data: { name: string; confidence: number }[] }
    }
    detection?: {
      "cld-fashion_v4"?: { 
        data: { 
          tags?: {
            top?: Array<{
              categories?: string[]
              confidence?: number
              attributes?: Record<string, unknown>
            }>
          } 
        } 
      }
      captioning?: { data: { caption?: string } }
    }
  }
}

// --- CONFIGURATIONS ---

const IMAGE_SIZES: ImageSizes = {
  thumbnail: { width: 200, height: 200 },
  preview: { width: 500, height: 500 },
  full: { width: 1000, height: 1000 },
}

const IMAGE_TRANSFORMATIONS: ImageTransformations = {
  base: [
    { crop: "lfill" },
    { effect: "auto_color" },
    { effect: "auto_contrast" },
    { effect: "auto_brightness" },
    { effect: "sharpen" },
  ],
  thumbnail: [
    { width: IMAGE_SIZES.thumbnail.width, height: IMAGE_SIZES.thumbnail.height },
    { crop: "fill", gravity: "center" },
    { quality: "auto:good" },
  ],
  preview: [
    { width: IMAGE_SIZES.preview.width, height: IMAGE_SIZES.preview.height },
    { crop: "fill", gravity: "center" },
    { quality: "auto:good" },
  ],
  full: [
    { width: IMAGE_SIZES.full.width, height: IMAGE_SIZES.full.height },
    { crop: "fill", gravity: "center" },
    { quality: "auto:best" },
  ],
}

// --- SERVICE FUNCTIONS ---

/**
 * Generate dynamic Cloudinary URLs for transformed images
 * @param public_id - Cloudinary public ID
 * @returns Object with URLs for different image sizes
 */
export const getTransformedUrls = (public_id: string): TransformedUrls => {
  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

  const getTransformationString = (transformations: Transformation[]): string => {
    return transformations
      .map((t) =>
        Object.entries(t)
          .map(([k, v]) => `${k}_${v}`)
          .join(",")
      )
      .join("/")
  }

  const thumbnailTransformations = getTransformationString([
    ...IMAGE_TRANSFORMATIONS.base,
    ...IMAGE_TRANSFORMATIONS.thumbnail,
  ])
  const previewTransformations = getTransformationString([
    ...IMAGE_TRANSFORMATIONS.base,
    ...IMAGE_TRANSFORMATIONS.preview,
  ])
  const fullTransformations = getTransformationString([
    ...IMAGE_TRANSFORMATIONS.base,
    ...IMAGE_TRANSFORMATIONS.full,
  ])

  return {
    thumbnail: `${baseUrl}/${thumbnailTransformations}/v1/${public_id}`,
    preview: `${baseUrl}/${previewTransformations}/v1/${public_id}`,
    full: `${baseUrl}/${fullTransformations}/v1/${public_id}`,
    original: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${public_id}`,
  }
}

/**
 * Generate a Cloudinary upload signature using a server-side API endpoint
 * @param upload_preset - The Cloudinary upload preset to use
 * @param options - Optional parameters like public_id, folder, tags, context
 * @returns Signature data (timestamp, signature, api_key)
 */
export const generateSignature = async (
  upload_preset: string = "closet_ai_upload",
  options: SignatureOptions = {}
): Promise<ServiceResponse<SignatureData>> => {
  const timestamp = new Date().toISOString()
  try {
    if (!cloudinaryRateLimiter.checkLimit()) {
      throw new Error("Rate limit exceeded for signature generation")
    }

    const response = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upload_preset,
        folder: "wardrobe",
        ...options,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate signature: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data, error: null, code: null, timestamp }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, data: null, error: errorMessage, code: "SIGNATURE_ERROR", timestamp }
  }
}

/**
 * Upload an image to Cloudinary directly from the browser
 * @param file - The file object to upload
 * @param upload_preset - Cloudinary upload preset
 * @param options - Additional upload options
 * @param signal - Optional AbortSignal
 * @returns Upload result
 */
export const uploadImage = async (
  file: File,
  upload_preset: string = "closet_ai_upload",
  options: UploadOptions = {},
  signal?: AbortSignal
): Promise<ServiceResponse<CloudinaryUploadResult>> => {
  try {
    checkSignal(signal);

    if (!cloudinaryRateLimiter.checkLimit()) {
      throw new ServiceError('Rate limit exceeded for image upload', 'RATE_LIMIT_EXCEEDED');
    }

    // Remove OCR from options if present
    const cleanOptions = { ...options };
    if (cleanOptions.ocr) delete cleanOptions.ocr;
    if (cleanOptions.detection && typeof cleanOptions.detection === 'string') {
      cleanOptions.detection = cleanOptions.detection
        .split(',')
        .filter(d => !d.includes('ocr') && !d.includes('adv_ocr'))
        .join(',');
    }

    // Get signature with AI analysis parameters
    const signatureResponse = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      upload_preset,
        folder: "wardrobe",
        ...cleanOptions, // Use cleaned options
      }),
    });

    if (!signatureResponse.ok) {
      const error = await signatureResponse.json();
      throw new ServiceError(error.message || error.error || 'Failed to generate signature', error.code || 'API_ERROR');
    }

    const signatureData = await signatureResponse.json();
    
    // Remove OCR from signature data if present
    if (signatureData.ocr) delete signatureData.ocr;
    if (signatureData.detection && typeof signatureData.detection === 'string') {
      signatureData.detection = signatureData.detection
        .split(',')
        .filter((d: string) => !d.includes('ocr') && !d.includes('adv_ocr'))
        .join(',');
    }
    
    const { timestamp, signature, api_key, ...otherParams } = signatureData;
    
    // Don't log the API key
    logger.info("Signature received successfully");
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', api_key); // Need to include the API key for the upload
    
    // Add all parameters that were signed
    Object.entries(otherParams).forEach(([key, value]) => {
      // Skip OCR parameters
      if (key === 'ocr' || (key === 'detection' && String(value).includes('ocr'))) {
        return;
      }
      
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
      }
    });
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
        signal,
      }
    );

    checkSignal(signal);

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new ServiceError(errorData.error?.message || 'Upload failed', 'UPLOAD_ERROR');
    }

    const uploadResult = await uploadResponse.json();
    
    // Remove API key from result if present
    if (uploadResult.api_key) {
      delete uploadResult.api_key;
    }
    
    // Add transformed URLs to the result
    const urls = getTransformedUrls(uploadResult.public_id);
    const result: CloudinaryUploadResult = {
      ...uploadResult,
      urls,
    };

    logger.info('Image uploaded successfully');

    // Use as ServiceResponse<CloudinaryUploadResult> to ensure type compatibility
    return {
      success: true,
      data: result,
      error: null,
      code: null,
      timestamp: new Date().toISOString()
    } as ServiceResponse<CloudinaryUploadResult>;
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== 'AbortError') {
      logger.error('Image upload failed', { 
        error: error instanceof Error ? error : new Error("Unknown error"),
        fileName: file?.name,
        errorMessage: error instanceof Error ? error.message : "Unknown error", 
        errorCode: (error as ServiceError)?.code || 'UNKNOWN_ERROR',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    const serviceError = error instanceof ServiceError 
      ? error 
      : error instanceof Error
        ? new ServiceError(error.message, error.name === 'AbortError' ? 'ABORTED' : 'UNKNOWN_ERROR')
        : new ServiceError('Unknown error', 'UNKNOWN_ERROR');
    
    // Use as ServiceResponse<CloudinaryUploadResult> to ensure type compatibility
    return {
      success: false,
      data: null,
      error: serviceError.message,
      code: serviceError.code,
      timestamp: new Date().toISOString()
    } as ServiceResponse<CloudinaryUploadResult>;
  }
}

/**
 * Delete an asset from Cloudinary using a server-side API endpoint
 * @param publicId - The public ID of the asset to delete
 * @param signal - Optional AbortSignal
 * @param resourceType - Optional resource type (e.g., 'image', 'video', 'raw')
 * @returns Deletion result
 */
export const deleteAsset = async (
  publicId: string,
  signal?: AbortSignal,
  resourceType: ResourceType = "image"
): Promise<ServiceResponse<DeletionResult>> => {
  try {
    checkSignal(signal)

    if (!cloudinaryRateLimiter.checkLimit()) {
      logger.warn("Rate limit exceeded for asset deletion", { publicId })
      throw new ServiceError("Rate limit exceeded", "RATE_LIMIT_EXCEEDED")
    }

    if (!publicId || typeof publicId !== "string" || publicId.trim() === "") {
      logger.error("Missing or invalid publicId parameter for deletion", {
        publicId,
      })
      throw new ServiceError(
        "Missing public_id parameter for deletion",
        "VALIDATION_ERROR"
      )
    }

    logger.info("Attempting to delete asset via API", { publicId, resourceType })

    const response = await fetch("/api/cloudinary/delete_asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
      signal,
    })

    checkSignal(signal)

    const responseData = await response.json()

    if (!response.ok) {
      throw new ServiceError(
        responseData.error || "Failed to delete asset",
        responseData.code || "API_ERROR"
      )
    }

    logger.info("Asset deletion API call successful", {
      publicId,
      result: responseData.result,
    })
    return formatResponse(true, responseData)
  } catch (error: unknown) {
    const serviceError = error instanceof ServiceError ? error : new ServiceError("Error deleting asset", "API_ERROR")
    if (serviceError.name !== "AbortError") {
      logger.error("Error deleting asset via API", {
        publicId,
        errorMessage: serviceError.message,
        errorCode: serviceError.code,
      })
    }
    return formatResponse(
      false,
      null,
      serviceError.message,
      serviceError.code || (serviceError.name === "AbortError" ? "ABORTED" : "UNKNOWN_ERROR")
    )
  }
}

/**
 * Get image information from Cloudinary using a server-side API endpoint
 * @param publicId - The public ID of the image
 * @param signal - Optional AbortSignal
 * @returns Image information
 */
export const getImageInfo = async (publicId: string): Promise<ServiceResponse<CloudinaryImageInfo>> => {
  try {
    if (!publicId) {
      throw new ServiceError('Public ID is required', 'INVALID_PARAMS');
    }
    
    const response = await fetch('/api/cloudinary/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(errorData.error || 'Failed to get image info', errorData.code || 'API_ERROR');
    }
    
    const result = await response.json();
    
    logger.info('Image info retrieved successfully');
    
    // Use as ServiceResponse<CloudinaryImageInfo> to ensure type compatibility
    return {
      success: true,
      data: result,
      error: null,
      code: null,
      timestamp: new Date().toISOString()
    } as ServiceResponse<CloudinaryImageInfo>;
  } catch (error) {
    logger.error('Failed to get image info', { 
      error: error instanceof Error ? error : new Error("Unknown error"),
      publicId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as ServiceError)?.code || 'UNKNOWN_ERROR'
    });
    
    const serviceError = error instanceof ServiceError 
      ? error 
      : error instanceof Error
        ? new ServiceError(error.message, 'API_ERROR')
        : new ServiceError('Unknown error', 'UNKNOWN_ERROR');
    
    // Use as ServiceResponse<CloudinaryImageInfo> to ensure type compatibility
    return {
      success: false,
      data: null,
      error: serviceError.message,
      code: serviceError.code,
      timestamp: new Date().toISOString()
    } as ServiceResponse<CloudinaryImageInfo>;
  }
}

/**
 * Delete an image from Cloudinary using its public ID via a server-side API endpoint.
 * @param {string} publicId - The public ID of the image to delete.
 * @param {AbortSignal} [signal] - Optional AbortSignal.
 * @returns {Promise<Object>} - Result of the deletion operation.
 */
export const deleteImage = async (publicId: string): Promise<ServiceResponse<DeletionResult>> => {
  try {
    if (!publicId) {
      throw new ServiceError('Public ID is required for deletion', 'INVALID_PARAMS');
    }
    
    const response = await fetch('/api/cloudinary/delete_asset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(errorData.error || 'Failed to delete image', errorData.code || 'API_ERROR');
    }
    
    const result = await response.json();
    
    logger.info('Image deleted successfully');
    
    // Use as ServiceResponse<DeletionResult> to ensure type compatibility
    return {
      success: true,
      data: result,
      error: null,
      code: null,
      timestamp: new Date().toISOString()
    } as ServiceResponse<DeletionResult>;
  } catch (error) {
    logger.error('Failed to delete image', { 
      error: error instanceof Error ? error : new Error("Unknown error"),
        publicId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as ServiceError)?.code || 'UNKNOWN_ERROR'
    });
    
    const serviceError = error instanceof ServiceError 
      ? error 
      : error instanceof Error
        ? new ServiceError(error.message, 'API_ERROR')
        : new ServiceError('Unknown error', 'UNKNOWN_ERROR');
    
    // Use as ServiceResponse<DeletionResult> to ensure type compatibility
    return {
      success: false,
      data: null,
      error: serviceError.message,
      code: serviceError.code,
      timestamp: new Date().toISOString()
    } as ServiceResponse<DeletionResult>;
  }
}

// --- NEW HYBRID AI PROCESSING WORKFLOW ---

export interface AiTags {
  category: string
  subCategory?: string | null
  attributes: string[]
  style: string[]
  season: string[]
  colors: string[]
  patterns: string[]
  description?: string  // Add description field to store AI caption
}

export interface ProcessedImagePayload {
  cloudinaryInfo: CloudinaryUploadResult
  aiTags: AiTags
  rawAnalysis: {
    cloudinary: Partial<CloudinaryUploadResult>
    customAI: Record<string, unknown>
  }
}

// Define more specific types for the AI data to avoid 'any'
interface CloudinaryAiData {
  tags?: string[]
  info?: {
    categorization?: {
      google_tagging?: {
        data?: { tag: string; confidence: number }[]
      }
      aws_rek_tagging?: {
        data?: { tag: string; confidence: number }[]
      }
      imagga_tagging?: {
        data?: { tag: { en: string }; confidence: number }[]
      }
    }
    detection?: {
      object_detection?: {
        data?: {
          "cld-fashion"?: {
            tags?: {
              top?: Array<{
                categories?: string[]
                confidence?: number
                attributes?: Record<string, any>
              }>
            }
          }
        }
      }
      captioning?: {
        data?: {
          caption?: string
        }
      }
    }
  }
  colors?: [string, number][]
  predominant?: {
    google?: [string, number][]
    cloudinary?: [string, number][]
  }
  secure_url?: string
}

interface CustomAiData {
  category?: string
  subCategory?: string
  attributes?: string[]
  style?: string[]
  season?: string[]
  patterns?: string[]
}

// Garment type priority list for better category selection
const GARMENT_TYPES = [
  "t-shirt", "shirt", "blouse", "sweater", "jacket", "coat", "blazer", 
  "jeans", "pants", "trousers", "shorts", "skirt", "dress", 
  "shoes", "sneakers", "boots", "sandals", "heels",
  "hat", "cap", "scarf", "gloves", "socks", "underwear", "bra",
  "suit", "hoodie", "sweatshirt", "cardigan", "vest"
];

// Mapping of common color hex codes to color names
const COLOR_NAMES = {
  "#000000": "black",
  "#FFFFFF": "white",
  "#FF0000": "red",
  "#0000FF": "blue",
  "#00FF00": "green",
  "#FFFF00": "yellow",
  "#FFA500": "orange",
  "#800080": "purple",
  "#FFC0CB": "pink",
  "#A52A2A": "brown",
  "#808080": "gray",
  "#C0C0C0": "silver",
  "#FFD700": "gold",
  "#808000": "olive",
  "#008000": "dark green",
  "#000080": "navy blue",
  "#800000": "maroon",
  "#008080": "teal",
};

// Get the closest named color from hex
function getColorName(hexColor: string): string {
  // Simple implementation - in a real app you'd use a color distance algorithm
  const normalizedHex = hexColor.toUpperCase();
  return COLOR_NAMES[normalizedHex as keyof typeof COLOR_NAMES] || hexColor;
}

const mergeAiResults = (cloudinaryData: CloudinaryAiData, customAiData: CustomAiData): AiTags => {
  // Log each AI service's results separately with minimal information
  logger.info("Processing AWS Rekognition AI Results");
  logger.info("Processing Google Vision AI Results");
  logger.info("Processing Imagga AI Results");
  logger.info("Processing Fashion Detection AI Results");
  
  // 5. Captioning results
  const captioningData = cloudinaryData.info?.detection?.captioning?.data || {};
  const caption = captioningData.caption || "";
  logger.info("Processing AI Caption");
  
  // 6. Color Analysis
  logger.info("Processing Color Analysis");
  
  // 7. Custom AI results
  logger.info("Processing Custom AI Results");
  
  // Original logging
  logger.info("Processing Raw Cloudinary AI Data");
  logger.info("Processing Raw Custom AI Data");

  const cloudinaryTags = cloudinaryData.tags || []
  const cloudinaryCategories = cloudinaryData.info?.categorization?.google_tagging?.data || []
  const cloudinaryColors = cloudinaryData.colors?.map(c => c[0]) || []

  // Log processed data with minimal information
  logger.info("Processed Cloudinary Results");

  // IMPROVED CATEGORY SELECTION LOGIC
  // First try to find a garment type in custom AI results
  let category = customAiData?.category || "";
  
  // If no category from custom AI, look for garment types in all tags
  if (!category || !GARMENT_TYPES.includes(category.toLowerCase())) {
    // Check AWS Rekognition tags (usually most accurate for clothing)
    const awsRekResults = cloudinaryData.info?.categorization?.aws_rek_tagging?.data || [];
    const awsGarments = awsRekResults
      .filter(tag => tag.confidence > 0.7) // Only consider high confidence tags
      .filter(tag => GARMENT_TYPES.includes(tag.tag.toLowerCase()));
      
    if (awsGarments.length > 0) {
      // Sort by confidence and take the highest
      awsGarments.sort((a, b) => b.confidence - a.confidence);
      category = awsGarments[0].tag;
    } else {
      // If no AWS garment types found, check all other tags
      const allTags = [
        ...cloudinaryTags,
        ...(cloudinaryCategories.map(t => t.tag) || []),
        ...(cloudinaryData.info?.categorization?.imagga_tagging?.data?.map(t => t.tag?.en) || [])
      ].map(t => t?.toLowerCase()).filter(Boolean);
      
      // Find the first tag that matches a garment type
      const garmentTag = allTags.find(tag => GARMENT_TYPES.includes(tag));
      if (garmentTag) {
        category = garmentTag;
      } else if (cloudinaryCategories.length > 0) {
        // Fallback to the first category from Google Vision
        category = cloudinaryCategories[0].tag.split("/").pop()?.trim() ?? "Uncategorized";
      } else {
        category = "Uncategorized";
      }
    }
  }

  const combinedAttributes = [...new Set([...cloudinaryTags, ...(customAiData?.attributes || [])])]

  // Extract potential description from caption
  const description = captioningData.caption || "";

  // Log final merged results with minimal information
  logger.info("AI Results Merged Successfully");

  const mergedResults = {
    category,
    subCategory: customAiData?.subCategory,
    attributes: combinedAttributes,
    style: customAiData?.style || [],
    season: customAiData?.season || [],
    colors: cloudinaryColors,
    patterns: customAiData?.patterns || [],
    description
  }

  return mergedResults
}

/**
 * The primary function for uploading an image to Cloudinary.
 * This has been simplified to focus only on Cloudinary operations.
 * @param imageFile The raw image file from user input.
 * @param uploadPreset The Cloudinary upload preset to use.
 * @param signal Optional AbortSignal for cancellation.
 * @returns The Cloudinary upload result.
 */
export const processAndUploadImage = async (
  imageFile: File,
  uploadPreset: string = "closet_ai_upload",
  signal?: AbortSignal
): Promise<ServiceResponse<CloudinaryUploadResult>> => {
  logger.info("Starting image upload to Cloudinary", {
    fileName: imageFile.name,
    fileSize: imageFile.size,
    uploadPreset,
  });

  try {
    // Get optimal AI services based on quota usage
    const aiConfig = quotaManager.getOptimalServices('medium');
    logger.info("Selected AI services based on quota", {
      uploadPreset,
      aiConfig,
      quotaStatus: quotaManager.getUsageSummary()
    });

    // Upload the image to Cloudinary
    logger.info("Uploading image to Cloudinary", { uploadPreset });
    const uploadResponse = await uploadImage(
      imageFile,
      uploadPreset,
      {
        tags: "fashion,user_upload",
        context: {
          source: "webapp_upload",
        },
        categorization: aiConfig.categorization,
        detection: aiConfig.detection,
      },
      signal
    );

    // Record the AI service usage
    if (uploadResponse.success) {
      quotaManager.recordUsage({
        categorization: aiConfig.categorization,
        detection: aiConfig.detection
      });
    }

    if (!uploadResponse.success || !uploadResponse.data) {
      throw new ServiceError(
        "Cloudinary upload failed",
        uploadResponse.error || "No data returned from upload",
        uploadResponse.code || "UPLOAD_FAILED"
      );
    }

    const cloudinaryResult = uploadResponse.data;
    logger.info("Cloudinary upload successful", {
      public_id: cloudinaryResult.public_id,
    });

    return {
      success: true,
      data: cloudinaryResult,
      error: null,
      code: null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const serviceError = error instanceof ServiceError 
      ? error 
      : error instanceof Error
        ? new ServiceError(error.message, "PROCESSING_ERROR", error.stack)
        : new ServiceError("An unknown error occurred during image processing.", "PROCESSING_ERROR");
    
    logger.error("Error in processAndUploadImage", { 
      error: new Error("Image processing failed"),
      publicId: imageFile.name,
    });

    return {
      success: false,
      data: null,
      error: serviceError.message,
      code: serviceError.code,
      timestamp: new Date().toISOString()
    };
  }
};

// A generic helper to call our action-based Cloudinary Admin API endpoint
const callCloudinaryAdminApi = async <T>(
  action: string,
  publicId: string,
  payload?: Record<string, unknown>,
): Promise<ServiceResponse<T>> => {
  try {
    const response = await fetch("/api/cloudinary/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, publicId, payload }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new ServiceError(result.error || `API call for action '${action}' failed`, `API_CALL_FAILED`)
    }

    return formatResponse(true, result.data as T)
  } catch (error) {
    console.error(`Error in callCloudinaryAdminApi for action '${action}':`, error)
    const serviceError =
      error instanceof ServiceError ? error : new ServiceError("An unknown error occurred", "UNKNOWN")
    return formatResponse(false, null, serviceError.message, serviceError.code)
  }
}

/**
 * Fetches the full, detailed information for a Cloudinary asset.
 * @param publicId The public ID of the asset to fetch.
 * @returns A service response with the detailed asset information.
 */
export const getAssetDetails = (publicId: string) => {
  return callCloudinaryAdminApi<CloudinaryAssetDetails>("getResourceDetails", publicId)
}

/**
 * Updates the metadata of a Cloudinary asset using a secure backend endpoint.
 * @param publicId The public ID of the asset to update.
 * @param metadata An object containing the metadata key-value pairs to update.
 * @returns A service response with the updated asset information.
 */
export const updateAssetMetadata = (
  publicId: string,
  metadata: { [key: string]: string },
) => {
  return callCloudinaryAdminApi<CloudinaryAssetDetails>("updateMetadata", publicId, metadata)
}

// Export the unified cloudinary service
export default {
  getTransformedUrls,
  generateSignature,
  uploadImage,
  getImageInfo,
  deleteAsset,
  deleteImage,
  processAndUploadImage,
  getAssetDetails,
  updateAssetMetadata,
}
