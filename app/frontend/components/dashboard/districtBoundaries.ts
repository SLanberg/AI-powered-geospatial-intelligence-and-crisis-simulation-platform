import type { FeatureCollection, Feature, Polygon } from "geojson";
import type { MapAction, MapHighlightRegion } from "./data";

export interface DistrictPolygonProps {
  id: string;
  name: string;
  count: number;
  severity: "critical" | "warning" | "info" | "none";
  isTarget: boolean;
  isHighlighted: boolean;
  fillColor: string;
  strokeColor: string;
  centerLat: number;
  centerLng: number;
}

// Polygon boundaries for Tallinn districts (lng, lat coordinates)
export const TALLINN_DISTRICT_POLYGONS: Record<string, number[][][]> = {
  vanalinn: [
    [
      [24.740, 59.434],
      [24.744, 59.432],
      [24.752, 59.434],
      [24.754, 59.438],
      [24.750, 59.442],
      [24.743, 59.443],
      [24.738, 59.438],
      [24.740, 59.434],
    ],
  ],
  ulemiste: [
    [
      [24.775, 59.412],
      [24.815, 59.412],
      [24.835, 59.426],
      [24.805, 59.433],
      [24.770, 59.428],
      [24.775, 59.412],
    ],
  ],
  port: [
    [
      [24.755, 59.442],
      [24.782, 59.443],
      [24.785, 59.453],
      [24.758, 59.456],
      [24.748, 59.448],
      [24.755, 59.442],
    ],
  ],
  baltijaam: [
    [
      [24.726, 59.437],
      [24.743, 59.437],
      [24.742, 59.445],
      [24.724, 59.445],
      [24.726, 59.437],
    ],
  ],
  kristiine: [
    [
      [24.700, 59.412],
      [24.740, 59.412],
      [24.742, 59.432],
      [24.705, 59.432],
      [24.700, 59.412],
    ],
  ],
  mustamae: [
    [
      [24.645, 59.382],
      [24.698, 59.382],
      [24.702, 59.408],
      [24.652, 59.408],
      [24.645, 59.382],
    ],
  ],
  lasnamae: [
    [
      [24.795, 59.425],
      [24.895, 59.428],
      [24.890, 59.462],
      [24.805, 59.452],
      [24.795, 59.425],
    ],
  ],
  "pohja-tallinn": [
    [
      [24.665, 59.443],
      [24.745, 59.443],
      [24.735, 59.475],
      [24.655, 59.465],
      [24.665, 59.443],
    ],
  ],
  kesklinn: [
    [
      [24.738, 59.423],
      [24.778, 59.423],
      [24.778, 59.443],
      [24.738, 59.441],
      [24.738, 59.423],
    ],
  ],
  nomme: [
    [
      [24.620, 59.355],
      [24.725, 59.355],
      [24.725, 59.388],
      [24.620, 59.382],
      [24.620, 59.355],
    ],
  ],
  pirita: [
    [
      [24.805, 59.452],
      [24.885, 59.458],
      [24.895, 59.498],
      [24.815, 59.488],
      [24.805, 59.452],
    ],
  ],
  haabersti: [
    [
      [24.565, 59.398],
      [24.652, 59.398],
      [24.652, 59.442],
      [24.555, 59.435],
      [24.565, 59.398],
    ],
  ],
};

// District Center Coordinates fallback dictionary
export const DISTRICT_CENTERS: Record<string, { name: string; lat: number; lng: number }> = {
  vanalinn: { name: "Vanalinn", lat: 59.4372, lng: 24.7453 },
  ulemiste: { name: "Ülemiste", lat: 59.4215, lng: 24.7958 },
  port: { name: "Port / Sadam", lat: 59.4450, lng: 24.7680 },
  baltijaam: { name: "Balti Jaam", lat: 59.4402, lng: 24.7378 },
  kristiine: { name: "Kristiine", lat: 59.4260, lng: 24.7240 },
  mustamae: { name: "Mustamäe", lat: 59.3965, lng: 24.6730 },
  lasnamae: { name: "Lasnamäe", lat: 59.4380, lng: 24.8450 },
  "pohja-tallinn": { name: "Põhja-Tallinn", lat: 59.4500, lng: 24.7200 },
  kesklinn: { name: "Kesklinn", lat: 59.4320, lng: 24.7550 },
  nomme: { name: "Nõmme", lat: 59.3800, lng: 24.6800 },
  pirita: { name: "Pirita", lat: 59.4650, lng: 24.8300 },
  haabersti: { name: "Haabersti", lat: 59.4200, lng: 24.6300 },
};

/**
 * Generates a GeoJSON FeatureCollection of district polygons (disabled per user request)
 */
export function getDistrictBoundariesGeoJSON(
  _highlightedDistricts?: MapHighlightRegion[],
  _targetDistrictId?: string,
  _showAllDistrictsHeatmap: boolean = false
): FeatureCollection<Polygon, DistrictPolygonProps> {
  return {
    type: "FeatureCollection",
    features: [],
  };
}
