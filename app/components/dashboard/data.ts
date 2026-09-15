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

export const MOCK_INCIDENTS: Incident[] = [
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
