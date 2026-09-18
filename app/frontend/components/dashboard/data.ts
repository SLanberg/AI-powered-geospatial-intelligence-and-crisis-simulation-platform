export interface Incident {
  id: string;
  title: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  category: "Grid Failure" | "Traffic Flow" | "Telecom Node" | "Emergency Dispatch" | "Sensor Anomaly";
  makiIcon: "lightning" | "caution" | "traffic-light" | "emergency-phone" | "communications-tower" | "waveform" | string;
  lat: number;
  lng: number;
  description: string;
  status: "active" | "investigating" | "mitigated";
  nodeId: string;
}


export const CRISIS_TIMESTAMP = "08:47:00";

export const TIMELINE_STEPS = [
  { time: "08:40", label: "Baseline Operations", status: "normal" },
  { time: "08:44", label: "Initial Telemetry Spike", status: "warning" },
  { time: "08:47", label: "CRISIS IMPACT EVENT", status: "critical" },
  { time: "08:50", label: "Failover Protocol Engaged", status: "warning" },
  { time: "08:55", label: "Grid Stabilization", status: "recovering" },
  { time: "09:00", label: "Post-Incident Audit", status: "normal" },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-0847-01",
    title: "Vanalinn Substation #4 Tripped",
    timestamp: "08:47:05",
    severity: "critical",
    category: "Grid Failure",
    makiIcon: "lightning",
    lat: 59.4372,
    lng: 24.7453,
    description: "Primary transformer isolation relay triggered unexpectedly. Cascading frequency drop detected in Old Town district.",
    status: "active",
    nodeId: "EE-TLN-SUB-04"
  },
  {
    id: "INC-0847-02",
    title: "Ülemiste Smart Feeder Surge",
    timestamp: "08:47:01",
    severity: "critical",
    category: "Grid Failure",
    makiIcon: "caution",
    lat: 59.4215,
    lng: 24.7958,
    description: "Voltage spike exceeding 420kV tolerances. Automated circuit breaker isolated tech park sectors B & C.",
    status: "active",
    nodeId: "EE-TLN-ULE-01"
  },
  {
    id: "INC-0847-03",
    title: "Viru Junction Signal Controller Freeze",
    timestamp: "08:47:18",
    severity: "warning",
    category: "Traffic Flow",
    makiIcon: "traffic-light",
    lat: 59.4365,
    lng: 24.7562,
    description: "Optical traffic sensors lost heartbeat connection. Junction defaulted to fail-safe amber pulse state.",
    status: "investigating",
    nodeId: "EE-TLN-TRF-88"
  },
  {
    id: "INC-0847-04",
    title: "Balti Jaam Automated Dispatch Timeout",
    timestamp: "08:47:30",
    severity: "warning",
    category: "Emergency Dispatch",
    makiIcon: "emergency-phone",
    lat: 59.4402,
    lng: 24.7378,
    description: "Emergency vehicle priority routing server experienced a 1.4s packet drop. Secondary routing route initiated.",
    status: "active",
    nodeId: "EE-TLN-DISP-09"
  },
  {
    id: "INC-0847-05",
    title: "Port of Tallinn Fiber Gateway Latency",
    timestamp: "08:46:50",
    severity: "info",
    category: "Telecom Node",
    makiIcon: "communications-tower",
    lat: 59.4450,
    lng: 24.7680,
    description: "Subsea link telemetry reporting elevated ping (48ms vs baseline 4ms). Traffic rerouted through terrestrial backbone.",
    status: "mitigated",
    nodeId: "EE-TLN-GW-03"
  },
  {
    id: "INC-0847-06",
    title: "Kristiine Sector Sensor Array Anomaly",
    timestamp: "08:47:42",
    severity: "warning",
    category: "Sensor Anomaly",
    makiIcon: "waveform",
    lat: 59.4260,
    lng: 24.7240,
    description: "Environmental acoustic sensor array detected low-frequency micro-vibrations prior to power trip.",
    status: "investigating",
    nodeId: "EE-TLN-SNS-44"
  }
];

export let MOCK_INCIDENTS: Incident[] = [...INITIAL_INCIDENTS];

export async function fetchIncidentsFromDb(): Promise<Incident[]> {
  try {
    const res = await fetch("/api/incidents");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.incidents) && data.incidents.length > 0) {
        MOCK_INCIDENTS = data.incidents;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("scada-incidents-updated", { detail: MOCK_INCIDENTS }));
        }
        return MOCK_INCIDENTS;
      }
    }
  } catch (err) {
    console.warn("Could not fetch incidents from SQLite DB, using in-memory store:", err);
  }
  return MOCK_INCIDENTS;
}

export function addDynamicIncident(incident: Incident): Incident[] {
  MOCK_INCIDENTS = [incident, ...MOCK_INCIDENTS];
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("scada-incidents-updated", { detail: MOCK_INCIDENTS }));
    
    // Persist asynchronously to SQLite DB
    fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident),
    }).catch((err) => console.error("Failed to persist incident to SQLite DB:", err));
  }
  return MOCK_INCIDENTS;
}


export interface TallinnDistrict {
  id: string;
  name: string;
  estonianName: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
}

export const TALLINN_DISTRICTS: TallinnDistrict[] = [
  {
    id: "all",
    name: "Tallinn All",
    estonianName: "Tallinn Metro",
    lat: 59.4370,
    lng: 24.7535,
    zoom: 12.3,
    description: "Metropolitan overview of Tallinn power grid & infrastructure"
  },
  {
    id: "vanalinn",
    name: "Old Town",
    estonianName: "Vanalinn",
    lat: 59.4372,
    lng: 24.7453,
    zoom: 14.6,
    description: "Historic center, Substation #4 critical trip sector"
  },
  {
    id: "ulemiste",
    name: "Ülemiste",
    estonianName: "Ülemiste City",
    lat: 59.4215,
    lng: 24.7958,
    zoom: 14.3,
    description: "High-tech innovation campus, Lake Ülemiste feeder corridor"
  },
  {
    id: "port",
    name: "Port / Sadam",
    estonianName: "Vanasadam",
    lat: 59.4450,
    lng: 24.7680,
    zoom: 14.3,
    description: "Maritime terminal & subsea telecom fiber trunk"
  },
  {
    id: "baltijaam",
    name: "Balti Jaam",
    estonianName: "Balti Jaam",
    lat: 59.4402,
    lng: 24.7378,
    zoom: 14.6,
    description: "Central transit hub and automated emergency dispatch node"
  },
  {
    id: "kristiine",
    name: "Kristiine",
    estonianName: "Kristiine",
    lat: 59.4260,
    lng: 24.7240,
    zoom: 14.1,
    description: "Acoustic sensor array zone & western residential power ring"
  }
];

export interface MapHighlightRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  severity: "critical" | "warning" | "info";
  incidents: string[];
}

export interface MapAction {
  type: "highlight_incidents_by_district" | "focus_district" | "reset" | "fly_to";
  targetDistrictId?: string;
  highlightedDistricts?: MapHighlightRegion[];
  center?: { lat: number; lng: number; zoom: number };
  title?: string;
  address?: string;
  locationName?: string;
}

export interface DistrictAggregation {
  district: TallinnDistrict;
  count: number;
  incidents: Incident[];
  highestSeverity: "critical" | "warning" | "info";
}

export function getDistrictIncidentAggregations(incidents: Incident[] = MOCK_INCIDENTS): DistrictAggregation[] {
  const districtsWithoutAll = TALLINN_DISTRICTS.filter((d) => d.id !== "all");

  const map = new Map<string, { district: TallinnDistrict; count: number; incidents: Incident[] }>();
  for (const d of districtsWithoutAll) {
    map.set(d.id, { district: d, count: 0, incidents: [] });
  }

  for (const inc of incidents) {
    let closestDistrict = districtsWithoutAll[0];
    let minDistance = Infinity;

    for (const d of districtsWithoutAll) {
      const dist = Math.hypot(inc.lat - d.lat, inc.lng - d.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestDistrict = d;
      }
    }

    const entry = map.get(closestDistrict.id);
    if (entry) {
      entry.count += 1;
      entry.incidents.push(inc);
    }
  }

  const results: DistrictAggregation[] = Array.from(map.values()).map((entry) => {
    let highestSeverity: "critical" | "warning" | "info" = "info";
    for (const inc of entry.incidents) {
      if (inc.severity === "critical") highestSeverity = "critical";
      else if (inc.severity === "warning" && highestSeverity !== "critical") highestSeverity = "warning";
    }
    return {
      ...entry,
      highestSeverity,
    };
  });

  return results.sort((a, b) => b.count - a.count);
}

