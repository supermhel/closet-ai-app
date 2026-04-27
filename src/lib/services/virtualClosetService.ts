import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
  increment,
} from "firebase/firestore";
import { ClosetItem, VirtualClosetLayout, VirtualClosetLayoutDTO, Position3D, Rotation3D, Scale3D } from "@/types/virtual-closet";

// Category to 3D model mapping
const CATEGORY_MODEL_MAPPING: Record<string, string> = {
  'tops': '/models/top.glb',
  'shirts': '/models/top.glb',
  'blouses': '/models/top.glb',
  'sweaters': '/models/top.glb',
  't-shirts': '/models/top.glb',
  'tank tops': '/models/top.glb',
  'pants': '/models/bottom.glb',
  'jeans': '/models/bottom.glb',
  'skirts': '/models/bottom.glb',
  'shorts': '/models/bottom.glb',
  'trousers': '/models/bottom.glb',
  'leggings': '/models/bottom.glb',
  'jackets': '/models/outerwear.glb',
  'coats': '/models/outerwear.glb',
  'blazers': '/models/outerwear.glb',
  'hoodies': '/models/outerwear.glb',
  'cardigans': '/models/outerwear.glb',
  'shoes': '/models/shoes.glb',
  'sneakers': '/models/shoes.glb',
  'boots': '/models/shoes.glb',
  'sandals': '/models/shoes.glb',
  'heels': '/models/shoes.glb',
  'flats': '/models/shoes.glb',
  'accessories': '/models/accesoiries.glb',
  'bags': '/models/accesoiries.glb',
  'jewelry': '/models/accesoiries.glb',
  'belts': '/models/accesoiries.glb',
  'hats': '/models/accesoiries.glb',
  'scarves': '/models/accesoiries.glb',
};

// Get 3D model URL for an item based on its category
export const getModelUrlForItem = (item: ClosetItem): string => {
  const category = item.category.toLowerCase().trim();
  return CATEGORY_MODEL_MAPPING[category] || '/models/top.glb'; // fallback to top
};

// Generate default position for items in a grid layout
export const getDefaultPosition = (index: number): Position3D => {
  const gridX = (index % 5) * 2 - 4; // 5 items per row: -4, -2, 0, 2, 4
  const gridZ = Math.floor(index / 5) * 2 - 2; // rows: -2, 0, 2, 4...
  
  return {
    x: gridX,
    y: 0.5, // Slightly above ground
    z: gridZ
  };
};

// Get default 3D size based on category
export const getDefaultSize3D = (category: string) => {
  const normalizedCategory = category.toLowerCase();
  
  if (normalizedCategory.includes('top') || normalizedCategory.includes('shirt') || normalizedCategory.includes('blouse')) {
    return { width: 0.8, height: 1.2, depth: 0.1 };
  }
  if (normalizedCategory.includes('pant') || normalizedCategory.includes('jean') || normalizedCategory.includes('skirt') || normalizedCategory.includes('short')) {
    return { width: 0.8, height: 1.0, depth: 0.1 };
  }
  if (normalizedCategory.includes('shoe') || normalizedCategory.includes('boot') || normalizedCategory.includes('sneaker')) {
    return { width: 0.6, height: 0.3, depth: 1.0 };
  }
  if (normalizedCategory.includes('jacket') || normalizedCategory.includes('coat') || normalizedCategory.includes('blazer')) {
    return { width: 1.0, height: 1.4, depth: 0.2 };
  }
  if (normalizedCategory.includes('accessor') || normalizedCategory.includes('bag') || normalizedCategory.includes('jewelry')) {
    return { width: 0.4, height: 0.4, depth: 0.4 };
  }
  
  // Default size
  return { width: 0.8, height: 1.2, depth: 0.1 };
};

// Transform user items for 3D environment
export const transformItemsFor3D = (items: ClosetItem[]): ClosetItem[] => {
  return items.map((item, index) => ({
    ...item,
    modelUrl: item.modelUrl || getModelUrlForItem(item),
    position: item.position || getDefaultPosition(index),
    size3D: item.size3D || getDefaultSize3D(item.category),
    placed: item.placed || false,
    usageCount: item.usageCount || 0,
    accessibility: item.accessibility || 'easy',
    lastUsed: item.lastUsed || new Date()
  }));
};

/**
 * Sets up a real-time listener for a user's closet items.
 * @param userId The user's unique ID.
 * @param callback A function to be called with the items array whenever it updates.
 * @returns The unsubscribe function for the listener.
 */
export const listenToClosetItems = (userId: string, callback: (items: ClosetItem[]) => void) => {
  const itemsRef = collection(db, "users", userId, "closetItems");
  return onSnapshot(itemsRef, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClosetItem[];
    callback(items);
  });
};

/**
 * Sets up a real-time listener for a user's saved virtual closet layouts.
 * @param userId The user's unique ID.
 * @param callback A function to be called with the layouts array whenever it updates.
 * @returns The unsubscribe function for the listener.
 */
export const listenToVirtualClosetLayouts = (userId: string, callback: (layouts: VirtualClosetLayout[]) => void) => {
  const layoutsRef = collection(db, "users", userId, "virtualClosetLayouts");
  return onSnapshot(layoutsRef, (snapshot) => {
    const layouts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as VirtualClosetLayout[];
    callback(layouts);
  });
};

/**
 * Updates a specific closet item's data in Firestore.
 * @param userId The user's unique ID.
 * @param itemId The ID of the item to update.
 * @param data The data to update.
 */
export const updateClosetItem = (userId: string, itemId: string, data: Partial<ClosetItem>) => {
  const itemRef = doc(db, "users", userId, "closetItems", itemId);
  return updateDoc(itemRef, data);
};

/**
 * Saves a new virtual closet layout to Firestore.
 * @param userId The ID of the user.
 * @param layoutData The layout data to save.
 */
export const saveVirtualClosetLayout = async (
  userId: string,
  layoutData: VirtualClosetLayoutDTO,
): Promise<string> => {
  const layoutsRef = collection(db, "users", userId, "virtualClosetLayouts");
  const docRef = await addDoc(layoutsRef, layoutData);
  return docRef.id;
};

/**
 * Resets the layout by un-placing all currently placed items.
 * @param userId The user's unique ID.
 */
export const resetVirtualClosetLayout = async (userId: string) => {
  const itemsRef = collection(db, "users", userId, "closetItems");
  const q = query(itemsRef, where("placed", "==", true));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  querySnapshot.forEach((document) => {
    batch.update(document.ref, { placed: false, position: null, rotation: null, scale: null });
  });

  return batch.commit();
};

/**
 * Updates a closet item's 3D position in Firestore.
 * @param userId The user's unique ID.
 * @param itemId The ID of the item to update.
 * @param position The new 3D position.
 * @param rotation Optional rotation data.
 * @param scale Optional scale data.
 */
export const updateItemPosition = async (
  userId: string, 
  itemId: string, 
  position: Position3D,
  rotation?: Rotation3D,
  scale?: Scale3D
) => {
  const itemRef = doc(db, "users", userId, "closetItems", itemId);
  const updateData = { 
    position,
    placed: true,
    updatedAt: new Date(),
    lastUsed: new Date()
  };
  
  if (rotation) updateData.rotation = rotation;
  if (scale) updateData.scale = scale;
  
  await updateDoc(itemRef, updateData);
};

/**
 * Toggles whether an item is placed in the virtual closet.
 * @param userId The user's unique ID.
 * @param itemId The ID of the item to update.
 * @param placed Whether the item is placed or not.
 */
export const toggleItemPlacement = async (userId: string, itemId: string, placed: boolean) => {
  const itemRef = doc(db, "users", userId, "closetItems", itemId);
  await updateDoc(itemRef, { 
    placed,
    updatedAt: new Date()
  });
};

/**
 * Updates an item's usage statistics.
 * @param userId The user's unique ID.
 * @param itemId The ID of the item to update.
 */
export const updateItemUsage = async (userId: string, itemId: string) => {
  const itemRef = doc(db, "users", userId, "closetItems", itemId);
  await updateDoc(itemRef, {
    lastUsed: new Date(),
    usageCount: increment(1),
    updatedAt: new Date()
  });
};
