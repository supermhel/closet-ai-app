"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { OptimizedImage } from "@/components/optimized-image";
import { ArrowLeft, Save, Sparkles, Package, X, Plus, Tag, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import logger from "@/utils/logger";
import { Badge } from "@/components/ui/badge";
import { ItemFormData } from "@/utils/types";
import { 
  DISPLAY_CATEGORIES as CATEGORIES, 
  SIMPLIFIED_CATEGORIES, 
  SIZES, 
  SEASONS, 
  OCCASIONS,
  BRANDS,
  FITS,
} from "@/utils/taxonomy";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { analyzeImage, ProgressStatus } from "@/lib/services/aiAnalysisService";

// Define a type for the Cloudinary upload result information
interface CloudinaryUploadInfo {
  public_id: string;
  secure_url: string;
}

interface ItemFormProps {
  initialData?: ItemFormData;
  onSubmit: (formData: ItemFormData) => Promise<void>;
  isEdit?: boolean;
  isProcessing?: boolean;
}

export default function ItemForm({
  initialData = {
    name: "",
    category: "",
    brand: "Unbranded",
    size: "",
    price: "",
    description: "",
    colors: [],
    tags: [],
    seasons: ["All Seasons"],
    occasions: ["Casual"],
    fit: "",
    imageUrl: ""
  },
  onSubmit,
  isEdit = false,
  isProcessing = false
}: ItemFormProps) {
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageInfo, setUploadedImageInfo] = useState<{ public_id: string; secure_url: string } | null>(null);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<string | null>(null);

  const form = useForm<ItemFormData>({
    defaultValues: initialData || {
      name: "",
      category: "",
      brand: "",
      size: "",
      price: "",
      description: "",
      colors: [],
      tags: [],
      seasons: [],
      occasions: [],
      fit: "",
      imageUrl: "",
    },
  });

  const handleAddTag = () => {
    const currentTags = form.getValues("tags") || [];
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  const handleAddColor = () => {
    const currentColors = form.getValues("colors") || [];
    if (newColor.trim() && !currentColors.includes(newColor.trim())) {
      form.setValue("colors", [...currentColors, newColor.trim()]);
      setNewColor("");
    }
  };

  const handleRemoveColor = (color: string) => {
    const currentColors = form.getValues("colors") || [];
    form.setValue("colors", currentColors.filter(c => c !== color));
  };

  const handleImageUpload = (result: { info: CloudinaryUploadInfo }) => {
    const info = result.info;
    setUploadedImageInfo({ public_id: info.public_id, secure_url: info.secure_url });
    form.setValue("imageUrl", info.secure_url);
  };

  const handleAiAnalysis = async () => {
    if (!uploadedImageInfo) return;

    setAiAnalysisStatus("Starting AI analysis...");
    setError(null);

    // Create a callback that handles both string and ProgressStatus object
    const statusCallback = (status: string | ProgressStatus) => {
      if (typeof status === 'string') {
        setAiAnalysisStatus(status);
      } else {
        // Extract the message from the progress status object
        setAiAnalysisStatus(status.message);
      }
    };

    const response = await analyzeImage(uploadedImageInfo.public_id, statusCallback);

    if (response.success && response.data) {
      // Directly update the form with the new data
      form.reset({
        ...form.getValues(), // Keep existing manual entries like brand/price
        name: response.data.name,
        category: response.data.category,
        description: response.data.description,
        colors: response.data.colors,
        tags: response.data.tags,
        seasons: response.data.seasons,
        occasions: response.data.occasions,
        fit: response.data.fit,
        imageUrl: response.data.imageUrl,
      });
      setAiAnalysisStatus(null); // Reset status to allow saving
      toast.success("AI analysis complete! Form has been auto-filled.");
    } else {
      let errorMessage = "An unknown AI analysis error occurred.";
      if (response.error) {
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (typeof response.error === 'object' && (response.error as Error).message) {
          errorMessage = (response.error as Error).message;
        }
      }
      setError(errorMessage);
      setAiAnalysisStatus("Analysis failed.");
    }
  };

  const handleSubmit = async () => {
    // Use react-hook-form's state as the source of truth
    const currentFormData = form.getValues();

    if (!currentFormData.name) {
      toast.error("Please enter an item name");
      return;
    }

    if (!currentFormData.category) {
      toast.error("Please select a category");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(currentFormData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error saving item", { error: new Error(errorMessage) });
      toast.error("Failed to save item");
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/items">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? "Edit Item" : "Add New Item"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Item Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
              {form.watch("imageUrl") ? (
                <>
                  <OptimizedImage
                    src={form.watch("imageUrl")!}
                    alt="Item preview"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => form.setValue("imageUrl", "")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <ImageUpload 
                onUpload={handleImageUpload} 
                initialImageUrl={initialData?.imageUrl}
                uploadPreset="closet_ai_raw"
              />
              {uploadedImageInfo && (
                <Card className="bg-secondary/50 border-dashed">
                  <CardContent className="p-4 text-center">
                    <Button 
                      onClick={handleAiAnalysis} 
                      disabled={!!aiAnalysisStatus && aiAnalysisStatus !== "Analysis failed."}
                      className="w-full"
                    >
                      {aiAnalysisStatus && aiAnalysisStatus !== "Analysis failed." ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {aiAnalysisStatus || "Analyze with AI to auto-fill details"}
                    </Button>
                    {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Item Details Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
                  {...form.register("name")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isEdit ? (
                      CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))
                    ) : (
                      SIMPLIFIED_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={form.watch("brand")}
                  onValueChange={(value) => form.setValue("brand", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={form.watch("size")}
                  onValueChange={(value) => form.setValue("size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fit">Fit</Label>
                <Select
                  value={form.watch("fit")}
                  onValueChange={(value) => form.setValue("fit", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fit" />
                  </SelectTrigger>
                  <SelectContent>
                    {FITS.map((fit) => (
                      <SelectItem key={fit} value={fit}>
                        {fit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter price"
                  {...form.register("price")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. A gift from a friend, from my trip to Italy..."
                  {...form.register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color and Tag Management */}
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Management */}
              <div className="space-y-2">
                <Label>Colors</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add a color" 
                    value={newColor} 
                    onChange={e => setNewColor(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddColor()}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddColor}><Plus className="h-4 w-4"/></Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.watch("colors")?.map((color) => (
                    <Badge key={color} variant="secondary" className="flex items-center gap-1">
                    {color}
                      <button onClick={() => handleRemoveColor(color)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="h-3 w-3" />
                      </button>
                  </Badge>
                ))}
              </div>
              </div>

              {/* Tag Management */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Add a tag" 
                    value={newTag} 
                    onChange={e => setNewTag(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddTag}><Tag className="h-4 w-4"/></Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.watch("tags")?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="h-3 w-3" />
                      </button>
                  </Badge>
                ))}
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Seasons and Occasions */}
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Seasons</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SEASONS.map((season) => (
                    <div key={season} className="flex items-center space-x-2">
                      <Checkbox
                        id={`season-${season}`}
                        checked={form.watch("seasons")?.includes(season)}
                        onCheckedChange={(checked) => {
                          const currentSeasons = form.getValues("seasons") || [];
                          const newSeasons = checked
                            ? [...currentSeasons, season]
                            : currentSeasons.filter((s) => s !== season);
                          form.setValue("seasons", newSeasons);
                        }}
                      />
                      <label
                        htmlFor={`season-${season}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {season}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Occasions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OCCASIONS.map((occasion) => (
                    <div key={occasion} className="flex items-center space-x-2">
                      <Checkbox
                        id={`occasion-${occasion}`}
                        checked={form.watch("occasions")?.includes(occasion)}
                        onCheckedChange={(checked) => {
                          const currentOccasions = form.getValues("occasions") || [];
                          const newOccasions = checked
                            ? [...currentOccasions, occasion]
                            : currentOccasions.filter((o) => o !== occasion);
                          form.setValue("occasions", newOccasions);
                        }}
                      />
                      <label
                        htmlFor={`occasion-${occasion}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {occasion}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSubmit} 
          disabled={saving || (!!aiAnalysisStatus && aiAnalysisStatus !== 'Analysis failed.') || isProcessing}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> 
              Save Item
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
} 