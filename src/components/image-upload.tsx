"use client"

"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/hooks/use-toast"

interface UploadResult {
  info: {
    secure_url: string;
    public_id: string;
  }
}

interface ImageUploadProps {
  onFileSelect?: (file: File) => void
  onUpload?: (result: UploadResult) => void
  processing?: boolean
  defaultImage?: string
  initialImageUrl?: string
  className?: string
  maxSizeMB?: number
  aspectRatio?: string
  allowedTypes?: string[]
  uploadPreset?: string
}

export function ImageUpload({
  onFileSelect,
  onUpload,
  processing = false,
  defaultImage,
  initialImageUrl,
  className = "",
  maxSizeMB = 5,
  aspectRatio = "1:1",
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  uploadPreset,
}: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(defaultImage || initialImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported. Please use ${allowedTypes.join(", ")}.`
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size must be less than ${maxSizeMB}MB.`
      }

      return null
    },
    [allowedTypes, maxSizeMB],
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        toast.error(validationError)
        return
      }
      setError(null)
      
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file)
      setImage(previewUrl)
      
      // If uploadPreset is provided, upload to Cloudinary
      if (onUpload && uploadPreset) {
        setUploading(true)
        // First get a signature for the upload
        fetch('/api/cloudinary/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ upload_preset: uploadPreset })
        })
        .then(res => {
          if (!res.ok) {
            throw new Error(`Signature API error: ${res.status}`);
          }
          return res.json();
        })
        .then(signatureData => {
          console.log("Signature received:", { 
            preset: uploadPreset, 
            folder: signatureData.folder,
            timestamp: signatureData.timestamp
          });
          
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
          if (!cloudName) {
            throw new Error('Cloudinary cloud name not configured');
          }
          
          // Create form data for the upload
          // The order of these parameters is important for signature validation
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', signatureData.folder);
          formData.append('timestamp', signatureData.timestamp.toString());
          formData.append('upload_preset', uploadPreset);
          formData.append('api_key', signatureData.api_key);
          formData.append('signature', signatureData.signature);
          
          // Upload to Cloudinary
          return fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData
          });
        })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              console.error("Cloudinary error response:", text);
              throw new Error(`Cloudinary upload error: ${res.status} - ${text}`);
            });
          }
          return res.json();
        })
        .then(result => {
          setUploading(false);
          // Call the onUpload callback with the Cloudinary result
          onUpload({ info: result });
          
          // Log success for debugging
          console.log('Upload successful:', result.public_id);
        })
        .catch(err => {
          setUploading(false);
          console.error('Upload error:', err);
          setError(err.message || 'Upload failed');
          toast.error('Failed to upload image: ' + (err.message || 'Unknown error'));
        });
      } else if (onFileSelect) {
        // Just pass the file directly if no Cloudinary upload needed
        onFileSelect(file);
      }
    }
  }, [validateFile, onFileSelect, onUpload, uploadPreset])

  const removeImage = () => {
    setImage(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card
        className={`border-2 border-dashed transition-colors ${
          image ? "border-success bg-success/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4">
            {processing || uploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : image ? (
              <ImageIcon className="h-12 w-12 text-success" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {processing || uploading ? (
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Processing Image..."}</p>
              <Progress value={uploading ? 75 : 50} className="w-full" />
              <p className="text-xs text-muted-foreground mt-2">
                {uploading ? "Uploading to cloud storage..." : "AI is analyzing your item. Please wait."}
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
              <p className="text-muted-foreground mb-4">Drag and drop your image here, or click to browse</p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={image !== null}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Up to {maxSizeMB}MB, aspect ratio {aspectRatio}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="font-medium">Uploaded Image</h4>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-2">
                  <div className="aspect-square relative mb-2">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt="Uploaded Image"
                      fill
                      className="rounded object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
