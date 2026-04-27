/**
 * Unified Taxonomy System for ClosetAI
 * 
 * This file serves as the single source of truth for all clothing categorization,
 * attribute mapping, and AI-detected classification across the application.
 */

// --------------------------------
// Core Category Structure
// --------------------------------

// Main clothing categories (lowercase for consistency)
export const CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
  "activewear",
  "sleepwear",
  "formal",
  "swimwear",
  "underwear",
  "other",
]

// Legacy format categories (maintain backward compatibility)
export const DISPLAY_CATEGORIES = [
  "Tops", "T-Shirts", "Shirts", "Blouses", "Sweaters", "Hoodies", 
  "Bottoms", "Pants", "Jeans", "Shorts", "Skirts", "Dresses",
  "Outerwear", "Jackets", "Coats", "Blazers",
  "Activewear", "Swimwear", "Sleepwear", "Underwear",
  "Accessories", "Shoes", "Bags", "Hats", "Jewelry", "Watches"
];

// For backward compatibility with existing code
export const SIMPLIFIED_CATEGORIES = CATEGORIES;

// Subcategories for each main category
export const SUBCATEGORIES: Record<string, string[]> = {
  tops: [
    "t-shirts",
    "blouses",
    "shirts",
    "sweaters",
    "hoodies",
    "tank tops",
    "crop tops",
    "cardigans",
    "turtlenecks",
    "polos",
  ],
  bottoms: ["jeans", "pants", "shorts", "skirts", "leggings", "joggers", "chinos", "trousers", "culottes"],
  dresses: [
    "casual dresses",
    "formal dresses",
    "maxi dresses",
    "mini dresses",
    "midi dresses",
    "sundresses",
    "cocktail dresses",
    "evening gowns",
  ],
  outerwear: ["jackets", "coats", "blazers", "vests", "parkas", "raincoats", "windbreakers", "ponchos"],
  shoes: ["sneakers", "boots", "sandals", "heels", "flats", "loafers", "oxfords", "slippers", "athletic shoes"],
  accessories: ["bags", "jewelry", "hats", "scarves", "belts", "gloves", "sunglasses", "watches", "ties", "socks"],
  activewear: ["sports bras", "athletic tops", "athletic shorts", "leggings", "sweatpants", "track suits", "swimsuits"],
  sleepwear: ["pajamas", "nightgowns", "robes", "slippers", "sleep shirts", "sleep shorts"],
  formal: ["suits", "tuxedos", "formal dresses", "formal shirts", "formal pants", "formal skirts"],
  swimwear: ["bikinis", "one-pieces", "swim trunks", "cover-ups", "board shorts"],
  underwear: ["bras", "panties", "boxers", "briefs", "undershirts", "shapewear", "lingerie"],
  other: ["costumes", "uniforms", "special occasion", "maternity", "vintage", "custom"],
}

// --------------------------------
// AI Category Mapping
// --------------------------------

// Map AI-detected categories to our system categories
export const CATEGORY_MAP: Record<string, string> = {
  // Tops
  "t-shirt": "tops",
  "shirt": "tops",
  "blouse": "tops",
  "top": "tops",
  "sweater": "tops",
  "sweatshirt": "tops",
  "hoodie": "tops",
  "tank": "tops",
  "tank top": "tops",
  "tee": "tops",
  "polo": "tops",
  "turtleneck": "tops",
  
  // Bottoms
  "pants": "bottoms",
  "jeans": "bottoms",
  "shorts": "bottoms",
  "skirt": "bottoms",
  "trousers": "bottoms",
  "leggings": "bottoms",
  "joggers": "bottoms",
  "culottes": "bottoms",
  "chinos": "bottoms",
  
  // Dresses
  "dress": "dresses",
  "gown": "dresses",
  "sundress": "dresses",
  "cocktail dress": "dresses",
  "maxi dress": "dresses",
  "mini dress": "dresses",
  "midi dress": "dresses",
  
  // Outerwear
  "jacket": "outerwear",
  "coat": "outerwear",
  "blazer": "outerwear",
  "cardigan": "outerwear",
  "vest": "outerwear",
  "parka": "outerwear",
  "raincoat": "outerwear",
  "windbreaker": "outerwear",
  "poncho": "outerwear",
  
  // Shoes
  "sneakers": "shoes",
  "boots": "shoes",
  "sandals": "shoes",
  "heels": "shoes",
  "flats": "shoes",
  "loafers": "shoes",
  "oxfords": "shoes",
  "slippers": "shoes",
  "shoes": "shoes",
  
  // Accessories
  "hat": "accessories",
  "cap": "accessories",
  "scarf": "accessories",
  "gloves": "accessories",
  "belt": "accessories",
  "bag": "accessories",
  "purse": "accessories",
  "jewelry": "accessories",
  "necklace": "accessories",
  "bracelet": "accessories",
  "earrings": "accessories",
  "watch": "accessories",
  "sunglasses": "accessories",
  "glasses": "accessories",
  
  // Underwear
  "underwear": "underwear",
  "bra": "underwear",
  "panties": "underwear",
  "boxers": "underwear",
  "briefs": "underwear",
  "socks": "underwear",
  "lingerie": "underwear",
  "shapewear": "underwear",
  
  // Activewear
  "activewear": "activewear",
  "sportswear": "activewear",
  "athletic": "activewear",
  "gym": "activewear",
  "workout": "activewear",
  "yoga": "activewear",
  "sports bra": "activewear",
  
  // Sleepwear
  "pajamas": "sleepwear",
  "nightgown": "sleepwear",
  "robe": "sleepwear",
  "sleepwear": "sleepwear",
  "sleep shirt": "sleepwear",
  "sleep shorts": "sleepwear",
  
  // Formal
  "suit": "formal",
  "tuxedo": "formal",
  "formal": "formal",
  "tie": "formal",
  "bow tie": "formal",
  
  // Swimwear
  "swimsuit": "swimwear",
  "bikini": "swimwear",
  "swim trunks": "swimwear",
  "one-piece": "swimwear",
  "cover-up": "swimwear",
};

// --------------------------------
// Attribute Classifications
// --------------------------------

// Common patterns in clothing
export const PATTERNS = [
  "Solid", "Striped", "Plaid", "Checkered", "Floral", "Polka Dot", 
  "Geometric", "Animal Print", "Abstract", "Camouflage", "Paisley", "Tie-Dye"
];

// Common materials/fabrics
export const MATERIALS = [
  "Cotton", "Linen", "Silk", "Wool", "Denim", "Leather", "Polyester", 
  "Rayon", "Spandex", "Velvet", "Corduroy", "Flannel"
];

// Seasons
export const SEASONS = ["Spring", "Summer", "Fall", "Winter", "All Seasons"]

// Occasions
export const OCCASIONS = [
  "Casual", "Work", "Formal", "Party", "Date Night", "Outdoor", "Workout",
  "Travel", "Beach", "Lounge", "Wedding", "Interview", "Business", "Sports", "Everyday"
];

// Common styles in clothing
export const STYLES = [
  "Casual", "Formal", "Streetwear", "Vintage", "Minimalist", "Bohemian",
  "Preppy", "Athletic", "Business", "Elegant", "Grunge", "Punk", 
  "Hip-Hop", "Retro", "Classic", "Artsy"
];

// Available sizes
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

// Available fits
export const FITS = [
  "Fitted",
  "Regular",
  "Loose",
  "Oversized",
  "Slim",
  "Relaxed",
  "Tailored",
  "Skinny"
];

// Common brands
export const BRANDS = [
  "No Brand",
  "Nike",
  "Adidas",
  "H&M",
  "Zara",
  "Gap",
  "Levi's",
  "Calvin Klein",
  "Tommy Hilfiger",
  "Ralph Lauren",
  "Gucci",
  "Prada",
  "Versace",
  "Armani",
  "Uniqlo",
  "North Face",
  "Under Armour",
  "New Balance",
  "Puma",
  "Reebok",
  "Other"
];

// Common colors
export const COLORS = [
  "Black", "White", "Navy", "Gray", "Beige", "Brown", "Red", "Pink", 
  "Orange", "Yellow", "Green", "Teal", "Blue", "Light Blue", "Purple", 
  "Lavender", "Burgundy", "Olive"
];

// Color name mapping for common hex codes
export const COLOR_MAP: Record<string, string> = {
  "#000000": "black",
  "#FFFFFF": "white",
  "#808080": "gray",
  "#F5F5DC": "beige",
  "#A52A2A": "brown",
  "#FF0000": "red",
  "#FFC0CB": "pink",
  "#FFA500": "orange",
  "#FFFF00": "yellow",
  "#008000": "green",
  "#008080": "teal",
  "#0000FF": "blue",
  "#ADD8E6": "light blue",
  "#800080": "purple",
  "#E6E6FA": "lavender",
  "#800020": "burgundy",
  "#800000": "maroon",
  "#808000": "olive",
  "#000080": "navy",
  "#C0C0C0": "silver",
  "#FFD700": "gold"
};

// --------------------------------
// Helper Functions
// --------------------------------

/**
 * Get all subcategories as a flat array
 * @returns Array of all subcategories
 */
export function getAllSubcategories(): string[] {
  return Object.values(SUBCATEGORIES).flat()
}

/**
 * Find the main category for a given subcategory
 * @param subcategory The subcategory to look up
 * @returns The main category or null if not found
 */
export function findMainCategory(subcategory: string): string | null {
  const normalizedSubcategory = subcategory.toLowerCase().trim()

  for (const [category, subcategories] of Object.entries(SUBCATEGORIES)) {
    if (subcategories.some((sub) => sub.toLowerCase() === normalizedSubcategory)) {
      return category
    }
  }

  return null
}

/**
 * Normalize a category name to match our taxonomy
 * @param category The category name to normalize
 * @returns The normalized category name
 */
export function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim()

  // Check if it's a main category
  if (CATEGORIES.includes(normalized)) {
    return normalized
  }

  // Check if it's a subcategory
  for (const [mainCategory, subcategories] of Object.entries(SUBCATEGORIES)) {
    if (subcategories.includes(normalized)) {
      return mainCategory
    }
  }

  return normalized
}

/**
 * Map AI-detected category to valid taxonomy category
 * @param detectedCategory - The category detected by AI
 * @returns A valid category from our predefined list
 */
export function mapToValidCategory(detectedCategory: string): string {
  if (!detectedCategory) return "";
  
  const normalizedCategory = detectedCategory.toLowerCase().trim();
  
  // Check for exact match in our categories list first
  if (CATEGORIES.includes(normalizedCategory)) {
    return normalizedCategory;
  }
  
  // Check for match in our mapping
  if (CATEGORY_MAP[normalizedCategory]) {
    return CATEGORY_MAP[normalizedCategory];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalizedCategory.includes(key)) {
      return value;
    }
  }
  
  // Default to tops if no match found
  return "tops";
}

/**
 * Get detailed category from simplified category
 * @param simplifiedCategory - The simplified category (e.g., "tops")
 * @returns An array of detailed categories that match the simplified category
 */
export function getDetailedCategories(simplifiedCategory: string): string[] {
  const normalizedCategory = simplifiedCategory.toLowerCase();
  
  switch (normalizedCategory) {
    case "tops":
      return ["Tops", "T-Shirts", "Shirts", "Blouses", "Sweaters", "Hoodies"];
    case "bottoms":
      return ["Bottoms", "Pants", "Jeans", "Shorts", "Skirts"];
    case "dresses":
      return ["Dresses"];
    case "outerwear":
      return ["Outerwear", "Jackets", "Coats", "Blazers"];
    case "shoes":
      return ["Shoes"];
    case "accessories":
      return ["Accessories", "Bags", "Hats", "Jewelry", "Watches"];
    case "underwear":
      return ["Underwear"];
    case "activewear":
      return ["Activewear"];
    case "sleepwear":
      return ["Sleepwear"];
    case "formal":
      return ["Blazers", "Formal"];
    default:
      return DISPLAY_CATEGORIES;
  }
}

/**
 * Convert hex color to name
 * @param hexColor - The hex color code
 * @returns The color name or simplified version
 */
export function getColorName(hexColor: string): string {
  const normalizedHex = hexColor.toUpperCase();
  // Try exact match first
  if (COLOR_MAP[normalizedHex]) {
    return COLOR_MAP[normalizedHex];
  }
  
  // If no exact match, return simplified version
  if (hexColor.startsWith('#')) {
    return hexColor.slice(1, 7) === '000000' ? 'black' : 
           hexColor.slice(1, 7) === 'FFFFFF' ? 'white' :
           hexColor.slice(1, 3) === 'FF' ? 'red' :
           hexColor.slice(3, 5) === 'FF' ? 'green' :
           hexColor.slice(5, 7) === 'FF' ? 'blue' : 'multi';
  }
  
  return hexColor;
}
