"use client"
import { motion } from "framer-motion";
import { Check, Grid, Layout, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import TemplateSelector3D from "./template-selector-3d";

interface TemplateOption {
  id: string
  name: string
  type?: string
  thumbnailUrl?: string
  isNew?: boolean
}

interface TemplateSelectorProps {
  templates: TemplateOption[];
  selectedTemplate: string;
  onSelect: (id: string) => void;
  className?: string;
  title?: string;
  use3D?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, selectedTemplate, onSelect, className = "", title = "Choose a Template", use3D = false }) => {
  if (!templates.length) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <Grid className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No templates available</p>
      </div>
    )
  }

  if (use3D) {
    const templateOptions = templates.map((template) => ({
      id: template.id,
      name: template.name,
      type: template.type,
      modelPath: `src/public/models/${template.id}.glb`, // Assuming 3D models are in /public/models
      isNew: template.isNew,
    }))

    return (
      <TemplateSelector3D
        options={templateOptions}
        selectedTemplate={selectedTemplate}
        onSelect={(id) => onSelect(id)}
      />
    )
  }

  return (
    <div className={cn("bg-background rounded-xl shadow-md border p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Badge variant="secondary">{templates.length} options</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative overflow-hidden rounded-lg border cursor-pointer group",
              selectedTemplate === template.id
                ? "border-primary ring-2 ring-primary/30 shadow-lg"
                : "border-border hover:border-muted-foreground shadow-md",
            )}
            onClick={() => onSelect(template.id)}
          >
            <div className="aspect-[2/3] bg-muted">
              {template.thumbnailUrl ? (
                <motion.img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="object-cover w-full h-full"
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Layout className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* Preview button */}
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            <div className="p-2 bg-background border-t">
              <h3 className="text-sm font-medium">{template.name}</h3>

              <div className="flex flex-wrap mt-1 gap-1">
                {template.type && (
                  <Badge variant="outline" className="text-xs">
                    {template.type}
                  </Badge>
                )}

                {template.isNew && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            </div>

            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <motion.div
                className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-lg"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Check className="h-3 w-3" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
