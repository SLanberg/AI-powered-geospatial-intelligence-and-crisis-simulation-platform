export type VehicleType = "ambulance" | "police" | "bus" | "car" | "fire_engine" | "yacht";
export type VehicleStatus = "responding" | "patrolling" | "in_transit" | "delayed";
export type CongestionLevel = "clear" | "moderate" | "heavy" | "critical";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  lat: number;
  lng: number;
  destLat?: number;
  destLng?: number;
  speed: number; // km/h
  heading: number; // degrees
  status: VehicleStatus;
  routeId: string;
  progress: number; // 0 to 1 along route
  direction: 1 | -1;
  destination: string;
  updatedAt: number;
}

export interface TrafficSegment {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat]
  congestion: CongestionLevel;
  speedKmH: number;
}

// Tallinn Major Road & Maritime Corridors [lng, lat]
export const ROAD_CORRIDORS: Record<string, { name: string; path: [number, number][] }> = {
  parnu_mnt: {
    name: "Pärnu Maantee (Viru - Järve)",
    path: [
      [24.7540, 59.4360],
      [24.7470, 59.4320],
      [24.7420, 59.4240],
      [24.7350, 59.4140],
      [24.7260, 59.4010],
    ],
  },
  narva_mnt: {
    name: "Narva Maantee (Viru - Kadriorg - Lasnamäe)",
    path: [
      [24.7550, 59.4370],
      [24.7720, 59.4390],
      [24.7950, 59.4440],
      [24.8250, 59.4470],
    ],
  },
  liivalaia: {
    name: "Liivalaia / Pronksi (Kristiine - Stockmann)",
    path: [
      [24.7330, 59.4270],
      [24.7500, 59.4310],
      [24.7640, 59.4340],
      [24.7750, 59.4360],
    ],
  },
  jarvevana: {
    name: "Järvevana Tee (Ülemiste - Pärnu mnt)",
    path: [
      [24.7900, 59.4210],
      [24.7650, 59.4170],
      [24.7350, 59.4140],
    ],
  },
  paldiski_mnt: {
    name: "Paldiski Maantee (Balti Jaam - Haabersti)",
    path: [
      [24.7380, 59.4390],
      [24.7180, 59.4340],
      [24.6850, 59.4280],
      [24.6400, 59.4220],
    ],
  },
  laagna_tee: {
    name: "Laagna Tee (Kanali tee Express Way)",
    path: [
      [24.7800, 59.4350],
      [24.8100, 59.4370],
      [24.8500, 59.4390],
      [24.8850, 59.4400],
    ],
  },
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "AMB-01",
    name: "Ambulance Unit 101",
    type: "ambulance",
    lat: 59.4320,
    lng: 24.7470,
    destLat: 59.4372,
    destLng: 24.7453,
    speed: 72,
    heading: 215,
    status: "responding",
    routeId: "parnu_mnt",
    progress: 0.25,
    direction: 1,
    destination: "Vanalinn Substation Incident",
    updatedAt: Date.now(),
  },
  {
    id: "POL-04",
    name: "Police Interceptor 404",
    type: "police",
    lat: 59.4360,
    lng: 24.7540,
    destLat: 59.4365,
    destLng: 24.7562,
    speed: 65,
    heading: 105,
    status: "patrolling",
    routeId: "narva_mnt",
    progress: 0.1,
    direction: 1,
    destination: "Viru Junction Corridor",
    updatedAt: Date.now(),
  },
  {
    id: "FIRE-02",
    name: "Rescue Engine 202",
    type: "fire_engine",
    lat: 59.4210,
    lng: 24.7900,
    destLat: 59.4215,
    destLng: 24.7958,
    speed: 80,
    heading: 250,
    status: "responding",
    routeId: "jarvevana",
    progress: 0.05,
    direction: 1,
    destination: "Ülemiste Tech Park Surge",
    updatedAt: Date.now(),
  },
  {
    id: "AMB-03",
    name: "Medic Unit 103",
    type: "ambulance",
    lat: 59.4440,
    lng: 24.7950,
    destLat: 59.4402,
    destLng: 24.7378,
    speed: 68,
    heading: 260,
    status: "responding",
    routeId: "narva_mnt",
    progress: 0.6,
    direction: -1,
    destination: "Central Hospital ER",
    updatedAt: Date.now(),
  },
  {
    id: "POL-09",
    name: "Police Patrol 909",
    type: "police",
    lat: 59.4010,
    lng: 24.7260,
    destLat: 59.4260,
    destLng: 24.7240,
    speed: 55,
    heading: 35,
    status: "patrolling",
    routeId: "parnu_mnt",
    progress: 0.95,
    direction: -1,
    destination: "Kristiine Sector Checkpoint",
    updatedAt: Date.now(),
  },
  {
    id: "BUS-67",
    name: "TLT Express Bus Line 67",
    type: "bus",
    lat: 59.4370,
    lng: 24.8100,
    speed: 42,
    heading: 275,
    status: "in_transit",
    routeId: "laagna_tee",
    progress: 0.5,
    direction: -1,
    destination: "Estonia Bus Terminal",
    updatedAt: Date.now(),
  },
  {
    id: "BUS-18",
    name: "TLT City Bus Line 18",
    type: "bus",
    lat: 59.4340,
    lng: 24.7480,
    speed: 22,
    heading: 200,
    status: "delayed",
    routeId: "parnu_mnt",
    progress: 0.35,
    direction: 1,
    destination: "Viru Keskus Terminal",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-101",
    name: "Civil Commuter Traffic",
    type: "car",
    lat: 59.4362,
    lng: 24.7535,
    speed: 14,
    heading: 90,
    status: "delayed",
    routeId: "parnu_mnt",
    progress: 0.05,
    direction: 1,
    destination: "Viru Square Bottleneck",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-102",
    name: "Rideshare Taxi Unit",
    type: "car",
    lat: 59.4358,
    lng: 24.7525,
    speed: 12,
    heading: 90,
    status: "delayed",
    routeId: "parnu_mnt",
    progress: 0.08,
    direction: 1,
    destination: "Viru Square Congestion",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-103",
    name: "Courier Delivery Van",
    type: "car",
    lat: 59.4366,
    lng: 24.7555,
    speed: 18,
    heading: 80,
    status: "delayed",
    routeId: "narva_mnt",
    progress: 0.04,
    direction: 1,
    destination: "Narva Mnt Congestion Zone",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-104",
    name: "Civilian SUV 44",
    type: "car",
    lat: 59.4328,
    lng: 24.7485,
    speed: 25,
    heading: 205,
    status: "in_transit",
    routeId: "parnu_mnt",
    progress: 0.2,
    direction: 1,
    destination: "Pärnu Mnt Viaduct",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-105",
    name: "Commercial Fleet Van",
    type: "car",
    lat: 59.4312,
    lng: 24.7455,
    speed: 22,
    heading: 210,
    status: "in_transit",
    routeId: "parnu_mnt",
    progress: 0.28,
    direction: 1,
    destination: "Tondi Corridor",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-106",
    name: "Electric Sedan 808",
    type: "car",
    lat: 59.4300,
    lng: 24.7480,
    speed: 32,
    heading: 85,
    status: "in_transit",
    routeId: "liivalaia",
    progress: 0.4,
    direction: 1,
    destination: "Stockmann Crossing",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-107",
    name: "City Taxi 777",
    type: "car",
    lat: 59.4315,
    lng: 24.7530,
    speed: 20,
    heading: 95,
    status: "delayed",
    routeId: "liivalaia",
    progress: 0.5,
    direction: 1,
    destination: "Pronksi Intersection Jam",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-108",
    name: "Civil Traffic Unit 108",
    type: "car",
    lat: 59.4340,
    lng: 24.7180,
    speed: 48,
    heading: 80,
    status: "in_transit",
    routeId: "paldiski_mnt",
    progress: 0.3,
    direction: 1,
    destination: "Balti Jaam Transit Hub",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-109",
    name: "Freight Logistics Truck",
    type: "car",
    lat: 59.4180,
    lng: 24.7600,
    speed: 28,
    heading: 240,
    status: "delayed",
    routeId: "jarvevana",
    progress: 0.3,
    direction: 1,
    destination: "Järvevana Heavy Congestion",
    updatedAt: Date.now(),
  },
  {
    id: "CAR-110",
    name: "Commuter Passenger Car",
    type: "car",
    lat: 59.4190,
    lng: 24.7700,
    speed: 30,
    heading: 245,
    status: "delayed",
    routeId: "jarvevana",
    progress: 0.2,
    direction: 1,
    destination: "Järvevana Bypass",
    updatedAt: Date.now(),
  },
];

export const INITIAL_TRAFFIC_SEGMENTS: TrafficSegment[] = [
  {
    id: "seg_viru",
    name: "Viru Intersection bottleneck",
    coordinates: [
      [24.7530, 59.4362],
      [24.7570, 59.4368],
    ],
    congestion: "critical",
    speedKmH: 12,
  },
  {
    id: "seg_parnu_mid",
    name: "Pärnu Maantee Viaduct",
    coordinates: [
      [24.7470, 59.4320],
      [24.7420, 59.4240],
    ],
    congestion: "heavy",
    speedKmH: 24,
  },
  {
    id: "seg_narva_kadriorg",
    name: "Narva Mnt / Kadriorg Expressway",
    coordinates: [
      [24.7720, 59.4390],
      [24.7950, 59.4440],
    ],
    congestion: "moderate",
    speedKmH: 45,
  },
  {
    id: "seg_laagna_exp",
    name: "Laagna Tee Arterial Flow",
    coordinates: [
      [24.7800, 59.4350],
      [24.8850, 59.4400],
    ],
    congestion: "clear",
    speedKmH: 70,
  },
  {
    id: "seg_jarvevana",
    name: "Järvevana Ringroad Bypass",
    coordinates: [
      [24.7900, 59.4210],
      [24.7350, 59.4140],
    ],
    congestion: "heavy",
    speedKmH: 28,
  },
];

function interpolatePath(path: [number, number][], progress: number): { lng: number; lat: number; heading: number } {
  if (path.length === 0) return { lng: 24.75, lat: 59.43, heading: 0 };
  if (path.length === 1) return { lng: path[0][0], lat: path[0][1], heading: 0 };

  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegments = path.length - 1;
  const scaled = clamped * totalSegments;
  const index = Math.floor(scaled);
  const segmentProgress = scaled - index;

  const start = path[Math.min(index, totalSegments - 1)];
  const end = path[Math.min(index + 1, totalSegments)];

  const lng = start[0] + (end[0] - start[0]) * segmentProgress;
  const lat = start[1] + (end[1] - start[1]) * segmentProgress;

  // Calculate heading in degrees (0 = North, 90 = East)
  const dLng = end[0] - start[0];
  const dLat = end[1] - start[1];
  let angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  return { lng, lat, heading: Math.round(angle) };
}

export function tickTrafficEngine(vehicles: Vehicle[], deltaMs: number): Vehicle[] {
  const deltaSec = deltaMs / 1000;

  return vehicles.map((v) => {
    const corridor = ROAD_CORRIDORS[v.routeId];
    if (!corridor || corridor.path.length < 2) return v;

    // Advance progress based on vehicle speed
    const step = (v.speed / 3600) * 0.05 * v.direction * deltaSec;
    let nextProgress = v.progress + step;
    let nextDirection = v.direction;

    if (nextProgress >= 1) {
      nextProgress = 1;
      nextDirection = -1;
    } else if (nextProgress <= 0) {
      nextProgress = 0;
      nextDirection = 1;
    }

    const { lng, lat, heading } = interpolatePath(
      nextDirection === 1 ? corridor.path : [...corridor.path].reverse(),
      nextDirection === 1 ? nextProgress : 1 - nextProgress
    );

    return {
      ...v,
      lng,
      lat,
      heading,
      progress: nextProgress,
      direction: nextDirection,
      updatedAt: Date.now(),
    };
  });
}
