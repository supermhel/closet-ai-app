import { ItemFormData } from "./types";
import { colornames } from 'color-name-list';

// This is a temporary stand-in for the full AnalysisResult type.
// TODO: Replace with the actual import once `analysis-types.ts` is restored or defined.
interface TempAnalysisResult {
  category: { label: string };
  colors: { name: string }[];
  attributes: {
    patterns: { label: string }[];
    materials: { label: string }[];
    styles: { label: string }[];
  };
  description?: string;
  seasons: { name: string }[];
  occasions: { name: string }[];
  fit: { name: string }[];
}

// --- MAPPING & CONVERSION UTILITIES ---

/**
 * Converts a hex color code to the nearest human-readable color name.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns The closest color name (e.g., "Navy Blue").
 */
export function getColorName(hex: string): string {
    // Handle white-ish colors (very close to white)
    const upperHex = hex.toUpperCase();
    if (upperHex === '#FFFFFF' || upperHex === '#FEFEFE' || upperHex === '#FAFAFA' || upperHex === '#F8F8F8') {
        return 'White';
    }
    if (upperHex === '#000000') return 'Black';

    let closestColor = { name: '', distance: Infinity };

    const r1 = parseInt(hex.substring(1, 3), 16);
    const g1 = parseInt(hex.substring(3, 5), 16);
    const b1 = parseInt(hex.substring(5, 7), 16);

    colornames.forEach((color: { name: string, hex: string }) => {
        const r2 = parseInt(color.hex.substring(1, 3), 16);
        const g2 = parseInt(color.hex.substring(3, 5), 16);
        const b2 = parseInt(color.hex.substring(5, 7), 16);
        
        // Simple Euclidean distance. More complex formulas exist but this is fast and effective.
        const distance = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));

        if (distance < closestColor.distance) {
            closestColor = { name: color.name, distance: distance };
        }
    });

    return closestColor.name;
}

/**
 * Maps raw AI categories to the application's fixed set of categories.
 * (Currently a simple pass-through but can be expanded later).
 * @param category The raw category from the AI service.
 * @returns A validated category string.
 */
export function mapToValidCategory(category: string): string {
    // In the future, this could contain more complex mapping logic.
    // e.g., if (['tshirt', 'tee', 'polo'].includes(category.toLowerCase())) return 'T-Shirts';
    return category || 'Uncategorized';
}

const CONFIDENCE_THRESHOLDS = {
  SEASONS: 0.1, 
  OCCASIONS: 0.1,
};

// This function was moved from ItemForm.tsx to decouple logic
const generateItemName = (category: string, description: string, colors: string[]): string => {
  const colorText = colors.length > 0 ? colors[0] : "";
  const lowerDesc = description.toLowerCase();

  if (category === "tops" && (lowerDesc.includes("pants") || lowerDesc.includes("jeans"))) {
    category = "pants";
  } else if (category === "tops" && lowerDesc.includes("dress")) {
    category = "dresses";
  } else if (category === "tops" && (lowerDesc.includes("jacket") || lowerDesc.includes("coat"))) {
    category = "outerwear";
  } else if (category === "tops" && lowerDesc.includes("shoes")) {
    category = "shoes";
  }

  if (["tops", "t-shirts", "shirts", "blouses"].includes(category)) {
    return `${colorText} ${category.slice(0, -1)}`.trim();
  }
  if (["pants", "jeans", "shorts", "bottoms"].includes(category)) {
    return `${colorText} ${category === "bottoms" ? "pants" : category}`.trim();
  }
  if (category === "dresses") {
    return `${colorText} dress`.trim();
  }
  if (["outerwear", "jackets", "coats"].includes(category)) {
    const isJacket = lowerDesc.includes("jacket");
    const isCoat = lowerDesc.includes("coat");
    return `${colorText} ${isJacket ? "jacket" : isCoat ? "coat" : "outerwear"}`.trim();
  }
  if (category === "shoes") {
    const isSandal = lowerDesc.includes("sandal");
    const isBoots = lowerDesc.includes("boot");
    return `${colorText} ${isSandal ? "sandals" : isBoots ? "boots" : "shoes"}`.trim();
  }
  return `${colorText} ${category}`.trim() || "Clothing Item";
};

export const mapAnalysisToFormData = (
  analysisResult: TempAnalysisResult,
  prevFormData: ItemFormData
): ItemFormData => {
  const detectedCategory = analysisResult.category.label;
  const colors = analysisResult.colors.map((color: { name: string }) => color.name);
  const tags = new Set<string>();
  analysisResult.attributes.patterns.forEach((p: { label: string }) => tags.add(p.label));
  analysisResult.attributes.materials.forEach((m: { label:string }) => tags.add(m.label));
  analysisResult.attributes.styles.forEach((s: { label: string }) => tags.add(s.label));
  
  const description = analysisResult.description || "";
  const seasons = analysisResult.seasons.map((s: { name: string }) => s.name);
  const occasions = analysisResult.occasions.map((o: { name: string }) => o.name);
  const itemName = generateItemName(detectedCategory, description, colors);

  return {
    ...prevFormData,
    name: prevFormData.name || itemName,
    category: detectedCategory || prevFormData.category,
    colors: [...new Set([...prevFormData.colors, ...colors])],
    tags: [...new Set([...prevFormData.tags, ...Array.from(tags)])],
    seasons: prevFormData.seasons.length > 1 ? prevFormData.seasons : (seasons.length > 0 ? seasons : ["All Seasons"]),
    occasions: prevFormData.occasions.length > 1 ? prevFormData.occasions : (occasions.length > 0 ? occasions : ["Casual"]),
    fit: (analysisResult.fit && analysisResult.fit.length > 0) ? analysisResult.fit[0].name : (prevFormData.fit || ""),
    brand: prevFormData.brand || "No Brand",
    description: prevFormData.description || description,
    imageUrl: prevFormData.imageUrl || ""
  };
};

// Logic moved from aiAnalysisService.ts for better separation of concerns

export function detectSeasons(
  attributes: string[], 
  colors: string[], 
  patterns: string[]
): Array<{ name: string; confidence: number }> {
  const seasonIndicators = {
    Winter: { colors: ['black', 'gray', 'navy', 'burgundy', 'dark green'], patterns: ['plaid', 'tartan', 'houndstooth', 'cable knit', 'argyle'], attrs: ['wool', 'cashmere', 'fur', 'velvet', 'corduroy', 'fleece', 'down'] },
    Spring: { colors: ['pastel', 'light pink', 'light blue', 'mint', 'lavender'], patterns: ['floral', 'gingham', 'polka dot', 'striped'], attrs: ['cotton', 'linen', 'denim', 'chiffon'] },
    Summer: { colors: ['white', 'yellow', 'bright orange', 'turquoise', 'hot pink', 'lime green'], patterns: ['tropical', 'nautical', 'tie-dye', 'paisley'], attrs: ['linen', 'cotton', 'rayon', 'seersucker', 'jersey'] },
    Autumn: { colors: ['brown', 'mustard', 'olive', 'terracotta', 'burnt orange', 'maroon'], patterns: ['checkered', 'animal print', 'fair isle', 'tweed'], attrs: ['leather', 'suede', 'denim', 'flannel', 'tweed'] }
  };

  const results: Record<string, number> = { Winter: 0, Spring: 0, Summer: 0, Autumn: 0 };
  
  attributes.forEach(attr => {
    const lowerAttr = attr.toLowerCase();
    for (const [season, indicators] of Object.entries(seasonIndicators)) {
      if (indicators.attrs.some(a => lowerAttr.includes(a))) results[season] += 1;
    }
  });

  colors.forEach(color => {
    const lowerColor = color.toLowerCase();
    for (const [season, indicators] of Object.entries(seasonIndicators)) {
      if (indicators.colors.some(c => lowerColor.includes(c))) results[season] += 1;
    }
  });

  patterns.forEach(pattern => {
    const lowerPattern = pattern.toLowerCase();
    for (const [season, indicators] of Object.entries(seasonIndicators)) {
      if (indicators.patterns.some(p => lowerPattern.includes(p))) results[season] += 1;
    }
  });

  const total = Object.values(results).reduce((sum, count) => sum + count, 0) || 1;
  return Object.entries(results)
    .map(([name, count]) => ({ name, confidence: count / total }))
    .filter(season => season.confidence > CONFIDENCE_THRESHOLDS.SEASONS)
    .sort((a, b) => b.confidence - a.confidence);
}

export function detectOccasions(
  attributes: string[], 
  styles: string[]
): Array<{ name: string; confidence: number }> {
  const occasionIndicators = {
    Formal: ['tuxedo', 'ball gown', 'evening dress', 'formal suit', 'black tie', 'silk', 'satin'],
    Business: ['blazer', 'pencil skirt', 'suit', 'trousers', 'button-down', 'sheath dress'],
    Casual: ['jeans', 't-shirt', 'sneakers', 'hoodie', 'denim', 'cotton', 'everyday'],
    Sports: ['athletic', 'sportswear', 'activewear', 'leggings', 'tracksuit', 'performance'],
    Party: ['cocktail dress', 'sequin', 'glitter', 'metallic', 'clubwear', 'festive'],
    Beach: ['swimsuit', 'bikini', 'sarong', 'boardshorts', 'beachwear'],
    Travel: ['comfortable', 'versatile', 'wrinkle-resistant', 'packable']
  };

  const results: Record<string, number> = {
    Formal: 0, Business: 0, Casual: 0, Sports: 0, Party: 0, Beach: 0, Travel: 0
  };

  const allTerms = [...attributes, ...styles];
  
  for (const term of allTerms) {
    const lowerTerm = term.toLowerCase();
    for (const [occasion, indicators] of Object.entries(occasionIndicators)) {
      if (indicators.some(indicator => lowerTerm.includes(indicator.toLowerCase()))) {
        results[occasion] += 1;
      }
    }
  }

  const total = Object.values(results).reduce((sum, count) => sum + count, 0) || 1;
  return Object.entries(results)
    .map(([name, count]) => ({ name, confidence: count / total }))
    .filter(occasion => occasion.confidence > CONFIDENCE_THRESHOLDS.OCCASIONS)
    .sort((a, b) => b.confidence - a.confidence);
}

export function detectFit(
  attributes: string[], 
  description: string = ""
): Array<{ name: string; confidence: number }> {
  const fitIndicators = {
    "Fitted": ['fitted', 'slim-fit', 'tailored', 'bodycon', 'form-fitting', 'tight'],
    "Slim": ['slim', 'skinny', 'tapered', 'narrow'],
    "Regular": ['regular', 'standard', 'straight-cut', 'classic'],
    "Relaxed": ['relaxed', 'easy-fit', 'comfort-fit', 'comfortable'],
    "Loose": ['loose', 'baggy', 'draped', 'wide', 'roomy'],
    "Oversized": ['oversized', 'extra-large', 'slouchy', 'boyfriend', 'oversize'],
    "Tailored": ['tailored', 'bespoke', 'custom', 'made-to-measure'],
    "Skinny": ['skinny', 'super-slim', 'skin-tight', 'spray-on']
  };

  const results: Record<string, number> = {
    "Fitted": 0, "Slim": 0, "Regular": 0, "Relaxed": 0, "Loose": 0,
    "Oversized": 0, "Tailored": 0, "Skinny": 0
  };

  const lowerDesc = description.toLowerCase();
  for (const [fit, indicators] of Object.entries(fitIndicators)) {
    if (indicators.some(indicator => lowerDesc.includes(indicator))) {
      results[fit] += 2;
    }
  }

  for (const term of attributes) {
    const lowerTerm = term.toLowerCase();
    for (const [fit, indicators] of Object.entries(fitIndicators)) {
      if (indicators.some(indicator => lowerTerm.includes(indicator))) {
        results[fit] += 1;
      }
    }
  }

  for (const term of attributes) {
    const lowerTerm = term.toLowerCase();
    for (const fit of Object.keys(fitIndicators)) {
      if (lowerTerm === fit.toLowerCase()) {
        results[fit] += 3;
      }
    }
  }

  const total = Object.values(results).reduce((sum, count) => sum + count, 0) || 1;
  return Object.entries(results)
    .map(([name, count]) => ({ name, confidence: count / total }))
    .filter(fit => fit.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
} 