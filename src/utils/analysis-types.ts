// This file centralizes the type definitions related to AI analysis of a single clothing item.

export interface AnalysisResult {
  category: {
    label: string;
    confidence: number;
    votes: Record<string, number>;
  };
  colors: Array<{
    name: string;
    hex: string;
    confidence: number;
    proportion?: number;
  }>;
  attributes: {
    patterns: Array<{ label: string; confidence: number }>;
    materials: Array<{ label: string; confidence: number }>;
    styles: Array<{ label: string; confidence: number }>;
  };
  seasons: Array<{ name: string; confidence: number }>;
  occasions: Array<{ name: string; confidence: number }>;
  fit: Array<{ name: string; confidence: number }>;
  description?: string;
  metadata: {
    processingTime: number;
    activeServices: string[];
    confidence: number;
  };
} 