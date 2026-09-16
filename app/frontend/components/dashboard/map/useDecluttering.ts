"use client";

import type { MapRef } from "react-map-gl/maplibre";
import type { EmergencyService } from "../emergencyServicesData";

export interface TrackedItem {
  id: string;
  lng: number;
  lat: number;
  label: string;
  subLabel?: string;
  domain: "air" | "maritime";
}

export interface DeclutteredLabel {
  id: string;
  originalLng: number;
  originalLat: number;
  screenX: number;
  screenY: number;
  offsetX: number;
  offsetY: number;
  hasCollision: boolean;
}

export interface EmergencyServiceCluster {
  id: string;
  lat: number;
  lng: number;
  services: EmergencyService[];
}

const BOX_WIDTH = 110;
const BOX_HEIGHT = 28;
const MIN_GAP = 6;

export function calculateDeclutteredOffsets(
  items: TrackedItem[],
  map: MapRef | null
): Record<string, DeclutteredLabel> {
  if (!map) return {};

  const projected: DeclutteredLabel[] = [];

  for (const item of items) {
    try {
      const point = map.project([item.lng, item.lat]);
      projected.push({
        id: item.id,
        originalLng: item.lng,
        originalLat: item.lat,
        screenX: point.x,
        screenY: point.y,
        offsetX: 0,
        offsetY: 24, // default label placement below icon
        hasCollision: false,
      });
    } catch {
      // Map not ready or out of bounds
    }
  }

  // Bounding box collision resolution algorithm
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const rectA = {
      left: a.screenX + a.offsetX - BOX_WIDTH / 2,
      right: a.screenX + a.offsetX + BOX_WIDTH / 2,
      top: a.screenY + a.offsetY,
      bottom: a.screenY + a.offsetY + BOX_HEIGHT,
    };

    for (let j = i + 1; j < projected.length; j++) {
      const b = projected[j];
      const rectB = {
        left: b.screenX + b.offsetX - BOX_WIDTH / 2,
        right: b.screenX + b.offsetX + BOX_WIDTH / 2,
        top: b.screenY + b.offsetY,
        bottom: b.screenY + b.offsetY + BOX_HEIGHT,
      };

      // Check collision
      const overlapX =
        rectA.left < rectB.right + MIN_GAP && rectA.right + MIN_GAP > rectB.left;
      const overlapY =
        rectA.top < rectB.bottom + MIN_GAP && rectA.bottom + MIN_GAP > rectB.top;

      if (overlapX && overlapY) {
        a.hasCollision = true;
        b.hasCollision = true;

        // Shift label B to avoid overlap
        if (b.screenY >= a.screenY) {
          b.offsetY += BOX_HEIGHT + MIN_GAP;
        } else {
          b.offsetY -= BOX_HEIGHT + MIN_GAP;
        }

        if (b.screenX >= a.screenX) {
          b.offsetX += 24;
        } else {
          b.offsetX -= 24;
        }
      }
    }
  }

  const result: Record<string, DeclutteredLabel> = {};
  for (const p of projected) {
    result[p.id] = p;
  }

  return result;
}

/**
 * Groups emergency facilities by their rendered distance instead of their
 * geographic distance. That keeps the result stable across latitude and lets
 * the map progressively reveal individual facilities as an operator zooms in.
 */
export function clusterEmergencyServices(
  services: EmergencyService[],
  map: MapRef | null,
  zoom: number,
): EmergencyServiceCluster[] {
  if (!map || zoom >= 14.25) {
    return services.map((service) => ({
      id: `emergency-${service.id}`,
      lat: service.lat,
      lng: service.lng,
      services: [service],
    }));
  }

  const radius = zoom < 12.8 ? 44 : 30;
  const projected = services.map((service) => {
    const point = map.project([service.lng, service.lat]);
    return { service, x: point.x, y: point.y };
  });
  const remaining = new Set(projected.map((_, index) => index));
  const clusters: EmergencyServiceCluster[] = [];

  while (remaining.size > 0) {
    const [seedIndex] = remaining;
    remaining.delete(seedIndex);

    const group = [projected[seedIndex]];
    const queue = [seedIndex];

    while (queue.length > 0) {
      const current = projected[queue.pop()!];

      for (const candidateIndex of Array.from(remaining)) {
        const candidate = projected[candidateIndex];
        const distance = Math.hypot(
          current.x - candidate.x,
          current.y - candidate.y,
        );

        if (distance <= radius) {
          remaining.delete(candidateIndex);
          queue.push(candidateIndex);
          group.push(candidate);
        }
      }
    }

    const count = group.length;
    clusters.push({
      id: `emergency-${group.map(({ service }) => service.id).join("-")}`,
      lat: group.reduce((sum, { service }) => sum + service.lat, 0) / count,
      lng: group.reduce((sum, { service }) => sum + service.lng, 0) / count,
      services: group.map(({ service }) => service),
    });
  }

  return clusters;
}
