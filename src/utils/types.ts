export interface ServiceResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: number
}

export interface AIAnalysisResult {
  compatible: boolean
  score: number
  analysis: Array<{
    type: 'positive' | 'negative' | 'neutral'
    text: string
  }>
  suggestions: string[]
}

export interface OutfitRecommendation {
  type: string
  description: string
  items: string[]
  confidence: number
}

export interface WeatherData {
  current: {
    temp_c: number
    feels_like: number
    humidity: number
    condition: {
      text: string
      icon: string
      code: number
    }
    wind_kph: number
    uv: number
    visibility_km: number
  }
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  forecast?: {
    forecastday: Array<{
      date: string
      day: {
        maxtemp_c: number
        mintemp_c: number
        condition: {
          text: string
          icon: string
        }
      }
    }>
  }
}

export enum ServiceErrorCode {
  MISSING_API_KEY = 'MISSING_API_KEY',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  WEATHER_ERROR = 'WEATHER_ERROR',
  COMPATIBILITY_ERROR = 'COMPATIBILITY_ERROR'
}

export interface ServiceError {
  message: string
  code: ServiceErrorCode
  statusCode?: number
  timestamp: number
}

export interface ItemFormData {
  name: string;
  category: string;
  brand: string;
  size: string;
  price: string;
  description: string;
  colors: string[];
  tags: string[];
  seasons: string[];
  occasions: string[];
  fit: string;
  imageUrl: string;
}
