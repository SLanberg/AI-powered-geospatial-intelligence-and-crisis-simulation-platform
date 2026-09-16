import officialGisData from "@/public/data/official_emergency_services.json";

export type EmergencyServiceType =
  | "hospital"
  | "police"
  | "fire_station"
  | "clinic"
  | "shelter"
  | "hazard_site";

export interface EmergencyService {
  id: string;
  name: string;
  shortName: string;
  type: EmergencyServiceType;
  category: string;
  lat: number;
  lng: number;
  address: string;
  district?: string;
  city?: string;
  phone?: string;
  emergency?: string;
  status?: "active" | "standby" | "alert";
  hours?: string;
  beds?: number;
  vehicles?: string;
  fleet?: string;
  source?: string;
  sourceUrl?: string;
  riskCategory?: string;
}

export const TALLINN_EMERGENCY_SERVICES: EmergencyService[] = (officialGisData as any[]).map((item) => ({
  id: String(item.id),
  name: String(item.name),
  shortName: String(item.shortName || (item.name.length > 26 ? item.name.slice(0, 24) + "..." : item.name)),
  type: item.type as EmergencyServiceType,
  category: String(item.category || "Official GIS Infrastructure"),
  lat: Number(item.lat),
  lng: Number(item.lng),
  address: String(item.address || "Address unavailable"),
  district: String(item.city || "Tallinn"),
  city: String(item.city || "Tallinn"),
  phone: String(item.phone || "+372 112"),
  emergency: "112",
  status: "active",
  hours: "24/7 Active Service",
  source: item.source,
  sourceUrl: item.sourceUrl,
  riskCategory: item.riskCategory,
}));
