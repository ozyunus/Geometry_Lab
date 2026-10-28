export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  isAnchor?: boolean;
  isConstruction?: boolean;
}

export interface GeoSegment {
  id: string;
  p1Id: string;
  p2Id: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  isConstruction?: boolean;
}

export interface GeoCircle {
  id: string;
  centerId: string;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  fill?: string;
  isConstruction?: boolean;
}

export interface GeoPolygon {
  id: string;
  centerId: string;
  sides: number;
  radius: number;
  rotationDeg: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

export interface GeoScene {
  points: GeoPoint[];
  segments: GeoSegment[];
  circles: GeoCircle[];
  polygons: GeoPolygon[];
}

export type ToolType = 'select' | 'point' | 'segment' | 'circle' | 'polygon' | 'eraser';

export type Language = 'tr' | 'en';

export interface ValidationFeedback {
  isValid: boolean;
  score: number; // 0 to 100
  completedCriteria: string[];
  missingCriteria: string[];
  hints: string[];
}
