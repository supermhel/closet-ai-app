/**
 * Three.js Examples Compatibility Layer
 * 
 * This file provides dynamic imports for Three.js examples modules
 * to ensure compatibility with Next.js and the build process.
 */

import * as OriginalTHREE from 'three';

// Create a wrapper for THREE that provides compatibility constants
const THREE = {
  ...OriginalTHREE,
  // Add compatibility for deprecated constants
  LinearEncoding: OriginalTHREE.LinearEncoding || 3000,
  sRGBEncoding: OriginalTHREE.sRGBEncoding || 3001,
  SRGBColorSpace: OriginalTHREE.SRGBColorSpace || 'srgb'
};

// Export a dynamic import function for GLTFLoader
export const loadGLTFLoader = async () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a mock loader
    return { 
      GLTFLoader: class MockGLTFLoader {
        load() {}
        setPath() { return this; }
        setResourcePath() { return this; }
      }
    };
  }
  
  // Client-side - load the real loader
  const gltfModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
  return { GLTFLoader: gltfModule.GLTFLoader };
};

// Export a dynamic import function for DRACOLoader
export const loadDRACOLoader = async () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a mock loader
    return { 
      DRACOLoader: class MockDRACOLoader {
        load() {}
        setDecoderPath() { return this; }
        setDecoderConfig() { return this; }
      }
    };
  }
  
  // Client-side - load the real loader
  const dracoModule = await import('three/examples/jsm/loaders/DRACOLoader.js');
  return { DRACOLoader: dracoModule.DRACOLoader };
};

// Export THREE for convenience
export { THREE };
