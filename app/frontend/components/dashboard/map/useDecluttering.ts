"use client";

import type { MapRef } from "react-map-gl/maplibre";
import type { EmergencyService } from "../emergencyServicesData";
import type { TransportHub } from "../transportHubsData";

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

export interface InfrastructureCluster {
  id: string;
  lat: number;
  lng: number;
  services: EmergencyService[];
  hubs: TransportHub[];
  totalCount: number;
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
 * Projects (lng, lat) to standard Web Mercator world pixel coordinates at a given zoom level.
 * This coordinate system is completely invariant to camera center/panning, which prevents
 * cluster thrashing and icon flickering during map movement, fast forwarding, and animations.
 */
export function projectToWorldPixels(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = scale * ((lng + 180) / 360);
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const clampedSinLat = Math.max(-0.9999, Math.min(0.9999, sinLat));
  const y = scale * (0.5 - Math.log((1 + clampedSinLat) / (1 - clampedSinLat)) / (4 * Math.PI));
  return { x, y };
}

/**
 * Groups emergency facilities by their rendered distance instead of their
 * geographic distance. Uses world-pixel coordinates to guarantee rock-solid
 * stability across panning and camera movement.
 */
export function clusterEmergencyServices(
  services: EmergencyService[],
  map: MapRef | null,
  zoom: number,
): EmergencyServiceCluster[] {
  if (services.length === 0) return [];

  const sortedServices = [...services].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (zoom >= 14.0) {
    return sortedServices.map((service) => ({
      id: `emergency-${service.id}`,
      lat: service.lat,
      lng: service.lng,
      services: [service],
    }));
  }

  // Dynamic screen-space radius based on zoom level to eliminate badge stacking in high-density corridors
  const radius = zoom < 11.5 ? 64 : zoom < 12.8 ? 48 : 36;
  const cellSize = radius;

  const projected: Array<{ service: EmergencyService; x: number; y: number }> = [];
  const grid = new Map<string, number[]>();

  for (let i = 0; i < sortedServices.length; i++) {
    const s = sortedServices[i];
    const { x, y } = projectToWorldPixels(s.lng, s.lat, zoom);
    projected.push({ service: s, x, y });

    const cellKey = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
    let cell = grid.get(cellKey);
    if (!cell) {
      cell = [];
      grid.set(cellKey, cell);
    }
    cell.push(i);
  }

  const visited = new Uint8Array(projected.length);
  const clusters: EmergencyServiceCluster[] = [];

  for (let i = 0; i < projected.length; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const group: typeof projected = [projected[i]];
    const queue: number[] = [i];

    while (queue.length > 0) {
      const currIdx = queue.pop()!;
      const curr = projected[currIdx];

      const gx = Math.floor(curr.x / cellSize);
      const gy = Math.floor(curr.y / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = `${gx + dx},${gy + dy}`;
          const cell = grid.get(neighborKey);
          if (!cell) continue;

          for (let k = 0; k < cell.length; k++) {
            const candIdx = cell[k];
            if (visited[candIdx]) continue;

            const cand = projected[candIdx];
            const dist = Math.hypot(curr.x - cand.x, curr.y - cand.y);

            if (dist <= radius) {
              visited[candIdx] = 1;
              queue.push(candIdx);
              group.push(cand);
            }
          }
        }
      }
    }

    const count = group.length;
    const sortedIds = group.map(({ service }) => service.id).sort();
    const clusterId = count === 1 ? `emergency-${sortedIds[0]}` : `emergency-${sortedIds.join("-")}`;

    clusters.push({
      id: clusterId,
      lat: group.reduce((sum, { service }) => sum + service.lat, 0) / count,
      lng: group.reduce((sum, { service }) => sum + service.lng, 0) / count,
      services: group.map(({ service }) => service),
    });
  }

  return clusters;
}

/**
 * Clusters both emergency facilities AND transport hubs together in world pixel space.
 * Prevents overlapping marker icons and enables area infrastructure inspection.
 * Uses O(N) Spatial Grid Hashing with camera-invariant Web Mercator coordinates.
 */
export function clusterInfrastructure(
  services: EmergencyService[],
  hubs: TransportHub[],
  map: MapRef | null,
  zoom: number,
): InfrastructureCluster[] {
  type ItemEntry =
    | { kind: "service"; item: EmergencyService; lat: number; lng: number; id: string }
    | { kind: "hub"; item: TransportHub; lat: number; lng: number; id: string };

  const allEntries: ItemEntry[] = [
    ...services.map((s) => ({ kind: "service" as const, item: s, lat: s.lat, lng: s.lng, id: `svc-${s.id}` })),
    ...hubs.map((h) => ({ kind: "hub" as const, item: h, lat: h.lat, lng: h.lng, id: `hub-${h.id}` })),
  ];

  if (allEntries.length === 0) return [];

  // Deterministic sorting to guarantee rock-solid cluster keys and prevent re-order flickering
  allEntries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (zoom >= 14.0) {
    return allEntries.map((entry) => ({
      id: entry.id,
      lat: entry.lat,
      lng: entry.lng,
      services: entry.kind === "service" ? [entry.item] : [],
      hubs: entry.kind === "hub" ? [entry.item] : [],
      totalCount: 1,
    }));
  }

  const radius = zoom < 11.5 ? 64 : zoom < 12.8 ? 48 : 36;
  const cellSize = radius;

  const projected: Array<{ entry: ItemEntry; x: number; y: number }> = [];
  const grid = new Map<string, number[]>();

  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i];
    const { x, y } = projectToWorldPixels(entry.lng, entry.lat, zoom);
    projected.push({ entry, x, y });

    const cellKey = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
    let cell = grid.get(cellKey);
    if (!cell) {
      cell = [];
      grid.set(cellKey, cell);
    }
    cell.push(i);
  }

  const visited = new Uint8Array(projected.length);
  const clusters: InfrastructureCluster[] = [];

  for (let i = 0; i < projected.length; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const group: typeof projected = [projected[i]];
    const queue: number[] = [i];

    while (queue.length > 0) {
      const currIdx = queue.pop()!;
      const curr = projected[currIdx];

      const gx = Math.floor(curr.x / cellSize);
      const gy = Math.floor(curr.y / cellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = `${gx + dx},${gy + dy}`;
          const cell = grid.get(neighborKey);
          if (!cell) continue;

          for (let k = 0; k < cell.length; k++) {
            const candIdx = cell[k];
            if (visited[candIdx]) continue;

            const cand = projected[candIdx];
            const dist = Math.hypot(curr.x - cand.x, curr.y - cand.y);

            if (dist <= radius) {
              visited[candIdx] = 1;
              queue.push(candIdx);
              group.push(cand);
            }
          }
        }
      }
    }

    const count = group.length;
    const servicesList: EmergencyService[] = [];
    const hubsList: TransportHub[] = [];

    for (let g = 0; g < group.length; g++) {
      const e = group[g].entry;
      if (e.kind === "service") servicesList.push(e.item);
      else hubsList.push(e.item);
    }

    const sortedIds = group.map(({ entry }) => entry.id).sort();
    const clusterId = count === 1 ? sortedIds[0] : `infra-${sortedIds.join("-")}`;

    clusters.push({
      id: clusterId,
      lat: group.reduce((sum, { entry }) => sum + entry.lat, 0) / count,
      lng: group.reduce((sum, { entry }) => sum + entry.lng, 0) / count,
      services: servicesList,
      hubs: hubsList,
      totalCount: count,
    });
  }

  return clusters;
}
