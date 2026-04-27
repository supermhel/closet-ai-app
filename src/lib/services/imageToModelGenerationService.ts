/**
 * 3D Model Generation Service - Client Side
 * 
 * Provides client-side utilities for 3D model rendering and initiating model generation via API.
 */

import { THREE, loadGLTFLoader, loadDRACOLoader } from '@/utils/threeExamplesCompat';
import logger from '@/utils/logger';

// Add this import at the top of your file
import type { GLTFLoader as GLTFLoaderType } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { DRACOLoader as DRACOLoaderType } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Update your variable declarations
let GLTFLoader: typeof GLTFLoaderType | undefined;
let DRACOLoader: typeof DRACOLoaderType | undefined;

// We'll dynamically load these in the functions that use them
// let GLTFLoader;
// let DRACOLoader;

// Device capability detection (client-side)
const isMobile = () => {
  if (typeof navigator === 'undefined') return false; // Guard for non-browser environments if any part of this service is ever imported server-side by mistake
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768);
};

// Performance level detection (client-side)
const getPerformanceLevel = () => {
  if (typeof navigator === 'undefined') return 'medium'; // Default if no navigator
  const cores = navigator.hardwareConcurrency || 2;
  
  if (cores <= 2) return 'low';
  if (cores <= 4) return 'medium';
  return 'high';
};

/**
 * Initialize a 3D renderer with optimizations based on device capability (client-side)
 * @param {HTMLElement} container - Container element for the renderer
 * @param {Object} options - Renderer options
 * @returns {Object} - Renderer, scene, camera, and controls
 */
export const initializeRenderer = (container, options = {}) => {
  try {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const performanceLevel = getPerformanceLevel();
    const mobile = isMobile();
    
    logger.debug('Initializing 3D renderer', {
      width,
      height,
      performanceLevel,
      mobile
    });
    
    const renderer = new THREE.WebGLRenderer({
      antialias: !mobile || performanceLevel === 'high',
      alpha: true,
      powerPreference: mobile ? 'low-power' : 'high-performance',
      ...options
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(mobile && typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : (typeof window !== 'undefined' ? window.devicePixelRatio : 1));
    renderer.shadowMap.enabled = !mobile || performanceLevel === 'high';
    renderer.shadowMap.type = mobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    const scene = new THREE.Scene();
    scene.background = options.background || null;
    
    const camera = new THREE.PerspectiveCamera(
      options.fov || 45,
      width / height,
      options.near || 0.1,
      options.far || 1000
    );
    
    camera.position.set(
      options.cameraX || 0,
      options.cameraY || 1,
      options.cameraZ || 5
    );
    
    const setupLights = () => {
      const mainLight = new THREE.DirectionalLight(0xffffff, 1);
      mainLight.position.set(5, 5, 5);
      
      if (!mobile || performanceLevel === 'high') {
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = mobile ? 1024 : 2048;
        mainLight.shadow.mapSize.height = mobile ? 1024 : 2048;
      }
      
      scene.add(mainLight);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      if (!mobile || performanceLevel !== 'low') {
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 0, -5);
        scene.add(fillLight);
      }
    };
    
    setupLights();
    
    let resizeObserver;
    if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        });
        resizeObserver.observe(container);
    } else {
        // Fallback for older browsers or non-browser environments
        const handleResizeFallback = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        if (typeof window !== 'undefined') window.addEventListener('resize', handleResizeFallback);
    }

    return {
      renderer,
      scene,
      camera,
      performanceLevel,
      mobile,
      dispose: () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        } else if (typeof window !== 'undefined') {
            // Remove fallback listener if it was used
            // window.removeEventListener('resize', handleResizeFallback); // Need to store handleResizeFallback to remove it
        }
        renderer.dispose();
        if (container && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
      }
    };
  } catch (error) {
    logger.error('Failed to initialize renderer', {
      error: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : 'none'
    });
    throw error;
  }
};

/**
 * Load a 3D model with optimizations (client-side)
 * @param {string} url - URL of the model to load
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} - Loaded model
 */
export const loadModel = async (url, options = {}) => {
  try {
    logger.debug('Loading 3D model', { url });
    
    // Dynamically load the loaders if they haven't been loaded yet
    if (!GLTFLoader || !DRACOLoader) {
      const gltfModule = await loadGLTFLoader();
      GLTFLoader = gltfModule.GLTFLoader;
      
      const dracoModule = await loadDRACOLoader();
      DRACOLoader = dracoModule.DRACOLoader;
    }
    
    const gltfLoader = new GLTFLoader();
    
    if (options.useDraco !== false) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/'); // Ensure this path is correct for your public folder structure
      gltfLoader.setDRACOLoader(dracoLoader);
    }
    
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          logger.debug('Model loaded successfully', { url });
          const performanceLevel = getPerformanceLevel();
          const mobile = isMobile();

          if (mobile || performanceLevel !== 'high') {
            gltf.scene.traverse((node) => {
              if (node.isMesh) {
                if (performanceLevel === 'low') {
                  node.material = new THREE.MeshBasicMaterial({
                    map: node.material.map,
                    color: node.material.color,
                    transparent: node.material.transparent,
                    opacity: node.material.opacity
                  });
                }
                if (mobile || performanceLevel === 'low') {
                  node.castShadow = false;
                  node.receiveShadow = false;
                } else {
                  node.castShadow = true;
                  node.receiveShadow = true;
                }
              }
            });
          }
          resolve(gltf);
        },
        (progress) => {
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          logger.error('Failed to load model', {
            url,
            error: error.message
          });
          reject(error);
        }
      );
    });
  } catch (error) {
    logger.error('Error in loadModel', {
      error: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : 'none'
    });
    throw error;
  }
};

/**
 * Client-side function to request 3D model generation from an image URL.
 * Calls the /api/generate-3d-model endpoint.
 * @param {Object} params - Parameters for model generation
 * @param {string} params.imageUrl - URL of the image to generate a model from
 * @param {string} params.category - Category of the item (e.g., 'top', 'bottom')
 * @param {Object} params.options - Additional options for the API
 * @returns {Promise<Object>} - Response from the API, expected to include a modelUrl.
 */
export const generateModelFromImage = async ({ imageUrl, category, options = {} }) => {
  logger.debug('Client: Requesting 3D model generation', { imageUrl, category });
  try {
    const response = await fetch('/api/generate-3d-model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, category, options }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      logger.error('Client: API call to generate-3d-model failed', { 
        status: response.status, 
        statusText: response.statusText,
        errorData 
      });
      throw new Error(`API request failed: ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    logger.debug('Client: Received response from generate-3d-model API', { result });
    return result; // Expected to contain modelUrl, etc.

  } catch (error) {
    logger.error('Client: Error calling generateModelFromImage API', {
      message: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : 'none',
      imageUrl,
      category
    });
    throw error; // Re-throw to be caught by the caller (e.g., in Zustand store)
  }
};

// Removed the old server-side generateModel function that used 'canvas', 'node-fetch', and 'GLTFExporter'.
// That logic is now in src/pages/api/generate-3d-model.js

// The cacheAsyncFunction might need to be re-evaluated for client-side API calls if it was intended for the old generateModel.
// Caching API POST requests usually involves more complex cache invalidation strategies.
// For now, it's left as is, but `generateModelFromImage` is not wrapped with it directly here.

/**
 * Apply an image texture to a 3D model
 * @param {Object} model - The 3D model to texture
 * @param {string} imageUrl - URL of the image to use as texture
 * @returns {Promise<Object>} - Textured model
 */
export const applyTextureToModel = async (model, imageUrl) => {
  try {
    logger.debug('Applying texture to model', { imageUrl });
    
    // Create a texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Load the texture
    return new Promise((resolve, reject) => {
      textureLoader.load(
        imageUrl,
        (texture) => {
          // Apply the texture to the model
          model.traverse((node) => {
            if (node.isMesh) {
              // Create a new material with the texture
              const material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.7,
                metalness: 0.0
              });
              
              // Apply the material
              node.material = material;
              
            }
          });
          
          logger.debug('Texture applied successfully', { imageUrl });
          resolve(model);
        },
        undefined,
        (error) => {
          logger.error('Failed to load texture', {
            imageUrl,
            error: error.message
          });
          reject(error);
        }
      );
    });
  } catch (error) {
    logger.error('Error in applyTextureToModel', {
      imageUrl,
      error: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : 'none'
    });
    
    // Return the original model on error
    return model;
  }
};

export default {
  initializeRenderer,
  loadModel,
  generateModelFromImage,
  applyTextureToModel,
  isMobile,
  getPerformanceLevel
};
