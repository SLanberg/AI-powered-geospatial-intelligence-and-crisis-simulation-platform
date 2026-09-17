export type NepalPhase =
  | "PRE-EVENT / UNCERTAIN"
  | "TRIGGER"
  | "EARLY IMPACT"
  | "FIRST MAJOR DOWNSTREAM IMPACT"
  | "HUMAN REPORT"
  | "MASS WARNING"
  | "SENSOR DEGRADATION"
  | "DOWNSTREAM PROPAGATION"
  | "DOWNSTREAM CONFIRMATION"
  | "DOWNSTREAM IMPACT"
  | "SECONDARY EVENT"
  | "DOWNSTREAM PEAK DEVELOPMENT"
  | "LOWER-BASIN IMPACT"
  | "PEAK"
  | "RECESSION";

export interface NepalTimelineEvent {
  eventId: string;
  date: string;
  timeNpt: string;
  timeUtc?: string;
  timeDisplay: string;
  secondsFromMidnight: number; // 00:00 = 0, 08:37:10 = 31030
  phase: NepalPhase;
  location: string;
  coordinates: [number, number]; // [lng, lat]
  elevationMeters?: number;
  distanceFromTriggerKm: number;
  eventType: string;
  eventDescription: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceType: string;
  operationalDataAvailable: string;
  aiInterpretation: string;
  recommendedAiTask: string;
  notes: string;
  severity: "critical" | "warning" | "info" | "normal";
  intensity: number; // 0 - 100 for waveform visualization
  gaugeReading?: {
    levelMeters: number;
    description: string;
    isCompromised?: boolean;
    isDangerLevel?: boolean;
  };
  warningCount?: number;
  seismicMagnitude?: number;
  affectedRoute?: string;
}

export interface AffectedRouteInfo {
  name: string;
  corridorCode: string;
  type: "National Highway" | "Bridge Crossing" | "Border Trade Arterial" | "Mountain Trail Corridor";
  segment: string;
  criticality: "CRITICAL LIFELINE" | "HIGH" | "STRATEGIC TRADE" | "LOCAL ACCESS";
  impactSummary: string;
  secondaryRoute?: string;
  diversionAdvice: string;
}

export interface DynamicRouteStatus {
  status: "IMPASSABLE" | "SEVERED" | "DEBRIS BLOCKED" | "PRE-EMPTIVE CLOSURE" | "RESTRICTED" | "OPEN / ADVISORY";
  badgeVariant: "destructive" | "warning" | "default" | "secondary";
  badgeClass: string;
  color: string;
  actionRequired: string;
  affectedCorridor: string;
}

export interface RiverStation {
  id: string;
  name: string;
  sector: string;
  coordinates: [number, number]; // [lng, lat]
  elevationMeters: number;
  distanceKm: number;
  baselineLevelMeters: number;
  warningThresholdMeters: number;
  dangerThresholdMeters: number;
  arrivalSeconds: number; // seconds from midnight when wave reaches
  peakSeconds: number;
  peakLevelMeters: number;
  compromisedSeconds?: number;
  affectedRoute: AffectedRouteInfo;
}

/**
 * Key monitoring stations along the Langtang Lirung -> Trishuli -> Narayani river cascade
 */
export const RIVER_STATIONS: RiverStation[] = [
  {
    id: "STN-LIRUNG",
    name: "Langtang Lirung Peak / North Flank",
    sector: "Upper Cryosphere / Collapse Zone",
    coordinates: [85.5161, 28.2575],
    elevationMeters: 7234,
    distanceKm: 0,
    baselineLevelMeters: 0,
    warningThresholdMeters: 0,
    dangerThresholdMeters: 0,
    arrivalSeconds: 31030, // 08:37:10 (collapse trigger)
    peakSeconds: 31030,
    peakLevelMeters: 0,
    affectedRoute: {
      name: "Langtang Valley High Trek & Supply Spine",
      corridorCode: "LV-01",
      type: "Mountain Trail Corridor",
      segment: "Km 0–14 (Kyanjin Gompa to Langtang Village sector)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "Obliterated by catastrophic 6.8M m³ rock-ice avalanche collapse. Mountain trail buried under tens of meters of pulverised glacial debris.",
      secondaryRoute: "Langtang River Footbridges & Yala Peak Access",
      diversionAdvice: "Entire upper valley route impassable; mountain transit prohibited; search & rescue restricted to high-altitude helicopter operations.",
    },
  },
  {
    id: "STN-RASUWAGADHI",
    name: "Rasuwagadhi / Timure / Gyirong Border",
    sector: "Upper Trishuli Gorge",
    coordinates: [85.378, 28.272],
    elevationMeters: 1814,
    distanceKm: 14,
    baselineLevelMeters: 1.2,
    warningThresholdMeters: 2.0,
    dangerThresholdMeters: 3.0,
    arrivalSeconds: 31200, // ~08:40:00
    peakSeconds: 31440, // ~08:44:00
    peakLevelMeters: 4.8,
    compromisedSeconds: 31200, // compromised after 1.62m reading
    affectedRoute: {
      name: "Pasang Lhamu Highway (NH09 / AH48) & Miteri Friendship Bridge",
      corridorCode: "NH09 / AH48",
      type: "Border Trade Arterial",
      segment: "Km 10–18 (Nepal-China Border Post to Timure Dry Port)",
      criticality: "STRATEGIC TRADE",
      impactSummary: "Gorge bottleneck flooded; Miteri Friendship Bridge abutments damaged; Timure customs freight yard inundated by sediment pulse.",
      secondaryRoute: "Timure Custom Yard Feeder & Dry Port Access",
      diversionAdvice: "International freight corridor severed; halt cargo at Kerung/Gyirong; divert priority trade via Tatopani/Kodari border.",
    },
  },
  {
    id: "STN-SYABRUBESI",
    name: "Syabrubesi Station",
    sector: "Upper Trishuli Corridor",
    coordinates: [85.337, 28.16],
    elevationMeters: 1460,
    distanceKm: 28,
    baselineLevelMeters: 1.5,
    warningThresholdMeters: 3.5,
    dangerThresholdMeters: 5.0,
    arrivalSeconds: 32400, // ~09:00:00
    peakSeconds: 33300, // ~09:15:00
    peakLevelMeters: 6.2,
    compromisedSeconds: 33600, // 09:20 station failure
    affectedRoute: {
      name: "Pasang Lhamu Highway (NH09) & Syabrubesi Bridges",
      corridorCode: "NH09",
      type: "National Highway",
      segment: "Km 24–32 (Syabrubesi Gorge & Rongga Riverfront)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "Flood surge reached 6.2m; pedestrian suspension bridges swept away; roadway foundation undermined by Bhote Koshi torrent.",
      secondaryRoute: "Syabrubesi Pedestrian Suspension Bridges & Langtang Trailhead",
      diversionAdvice: "Halt all northbound traffic at Betrawati; emergency evacuation of vehicles and residents to upper hillside terraces.",
    },
  },
  {
    id: "STN-DHUNCHE",
    name: "Dhunche Operational Post",
    sector: "Rasuwa District Command",
    coordinates: [85.308, 28.113],
    elevationMeters: 1960,
    distanceKm: 35,
    baselineLevelMeters: 0,
    warningThresholdMeters: 0,
    dangerThresholdMeters: 0,
    arrivalSeconds: 32400, // 09:00:00 (human report fallback)
    peakSeconds: 32400,
    peakLevelMeters: 0,
    affectedRoute: {
      name: "Pasang Lhamu Highway (NH09) - Ramche–Dhunche Cliff Road",
      corridorCode: "NH09",
      type: "National Highway",
      segment: "Km 32–44 (Ramche Landslide Zone to Dhunche Ridge)",
      criticality: "HIGH",
      impactSummary: "Secondary rockslides and slope instabilities triggered along steep cliff road; transit severed at Ramche hairpin bends.",
      secondaryRoute: "Dhunche District Admin Access & Helipad Corridor",
      diversionAdvice: "Highway restricted to 4x4 search-and-rescue convoys; establish emergency command perimeter at Dhunche barracks.",
    },
  },
  {
    id: "STN-BETRAWATI",
    name: "Betrawati Hydrological Gauge",
    sector: "Middle Trishuli Basin",
    coordinates: [85.184, 27.978],
    elevationMeters: 625,
    distanceKm: 56,
    baselineLevelMeters: 1.8,
    warningThresholdMeters: 4.0,
    dangerThresholdMeters: 5.5,
    arrivalSeconds: 36000, // 10:00:00
    peakSeconds: 37200, // 10:20:00
    peakLevelMeters: 5.9,
    compromisedSeconds: 36900, // 10:15 compromised at 3.55m
    affectedRoute: {
      name: "Galchhi–Trishuli–Mailung–Syabrubesi Road (NH09) & Betrawati Bridge",
      corridorCode: "NH09",
      type: "Bridge Crossing",
      segment: "Km 50–60 (Trishuli–Betrawati Riverbank & Nuwakot Junction)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "Rapid 4.1m water surge in 20 min; low-lying Betrawati bridge approaches submerged under thick silt and floating timber debris.",
      secondaryRoute: "Betrawati River Bridge & Bidur Feeder Road",
      diversionAdvice: "Close Betrawati bridge immediately; reroute vital medical and food supplies via Bidur–Kathmandu Tokha auxiliary ridge road.",
    },
  },
  {
    id: "STN-GALCHHI",
    name: "Galchhi Hydrometric Station",
    sector: "Dhading River Confluence",
    coordinates: [85.031, 27.818],
    elevationMeters: 450,
    distanceKm: 82,
    baselineLevelMeters: 2.1,
    warningThresholdMeters: 6.0,
    dangerThresholdMeters: 9.0,
    arrivalSeconds: 37680, // 10:28:00
    peakSeconds: 39480, // ~10:58:00 (+9m rise over 30 min)
    peakLevelMeters: 11.1,
    affectedRoute: {
      name: "Prithvi Highway (H04 / NH41 - Primary Lifeline to Kathmandu)",
      corridorCode: "H04 / NH41",
      type: "National Highway",
      segment: "Km 78–88 (Galchhi Confluence & Mahesh Khola Junction)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "River stage exceeded danger mark at 11.1m; highway carriageway submerged at river bend; severe multi-kilometer vehicular gridlock.",
      secondaryRoute: "Galchhi–Trishuli Feeder Road (NH09 intersection)",
      diversionAdvice: "Stop all outbound Kathmandu vehicles at Thankot checkpost; reroute passenger cars via Tribhuvan Highway (H02 / Daman).",
    },
  },
  {
    id: "STN-MALEKHU",
    name: "Malekhu Observation Post",
    sector: "Middle Trishuli Valley",
    coordinates: [84.828, 27.808],
    elevationMeters: 340,
    distanceKm: 104,
    baselineLevelMeters: 2.3,
    warningThresholdMeters: 6.5,
    dangerThresholdMeters: 8.5,
    arrivalSeconds: 40800, // ~11:20:00
    peakSeconds: 42300, // ~11:45:00
    peakLevelMeters: 9.4,
    affectedRoute: {
      name: "Prithvi Highway (H04 / NH41) & Malekhu Bridge",
      corridorCode: "H04 / NH41",
      type: "National Highway",
      segment: "Km 98–110 (Malekhu–Benighat River Canyon)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "River surge crested at 9.4m (danger 8.5m); riverside highway restaurants, fuel bays, and parking aprons submerged; bridge clearance critical.",
      secondaryRoute: "Malekhu Bridge & Dhading Besi Access Road",
      diversionAdvice: "Highway closed to heavy freight; clear all stationary vehicles from low road shoulders; stage emergency responders at Malekhu post.",
    },
  },
  {
    id: "STN-MUGLIN",
    name: "Muglin Confluence Gauge",
    sector: "Trishuli / Marsyangdi Junction",
    coordinates: [84.556, 27.858],
    elevationMeters: 260,
    distanceKm: 135,
    baselineLevelMeters: 2.8,
    warningThresholdMeters: 7.0,
    dangerThresholdMeters: 10.0,
    arrivalSeconds: 46800, // 13:00:00
    peakSeconds: 49200, // ~13:40:00
    peakLevelMeters: 11.5,
    affectedRoute: {
      name: "Prithvi Highway (H04) & Muglin–Narayangarh Highway (H05 / NH42)",
      corridorCode: "H04 / H05",
      type: "National Highway",
      segment: "Km 130–138 (Muglin Triangular Confluence Interconnect)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "Vital national junction connecting Kathmandu, Pokhara, & Terai flooded to 11.5m; Marsyangdi river backed up; debris slides on gorge walls.",
      secondaryRoute: "Muglin Arch Bridge & Marsyangdi Hydro Access Road",
      diversionAdvice: "Total intersection closure. Halt Pokhara traffic at Dumre; reroute Terai-bound transit via Butwal–Pokhara (Siddhartha Highway H10).",
    },
  },
  {
    id: "STN-KALIKHOLA",
    name: "Kalikhola Gauge",
    sector: "Lower Trishuli Gorge",
    coordinates: [84.51, 27.82],
    elevationMeters: 230,
    distanceKm: 142,
    baselineLevelMeters: 3.0,
    warningThresholdMeters: 8.0,
    dangerThresholdMeters: 10.5,
    arrivalSeconds: 50400, // 14:00:00
    peakSeconds: 51240, // 14:14:00 (exceeded danger: 12.3m)
    peakLevelMeters: 12.3,
    affectedRoute: {
      name: "Muglin–Narayangarh Highway (H05 / NH42 - Narayani Lifeline)",
      corridorCode: "H05 / NH42",
      type: "National Highway",
      segment: "Km 139–146 (Chorkhola, Kalikhola, & Jalbire Canyon Sections)",
      criticality: "CRITICAL LIFELINE",
      impactSummary: "Catastrophic 12.3m surge crest destroyed 3 road sections; reinforced gabion walls sheared off; mud slurry and rock boulders 2m deep.",
      secondaryRoute: "Kalikhola Box Culvert & Mountain Stream Crossings",
      diversionAdvice: "APF armed blockade established. Roadway impassable for minimum 72 hours; all trans-Himalayan freight rerouted via BP Highway (H06).",
    },
  },
  {
    id: "STN-DEVGHAT",
    name: "Devghat Hydro-Terminal",
    sector: "Trishuli / Kali Gandaki / Narayani Junction",
    coordinates: [84.417, 27.705],
    elevationMeters: 180,
    distanceKm: 165,
    baselineLevelMeters: 3.2,
    warningThresholdMeters: 7.3,
    dangerThresholdMeters: 9.0,
    arrivalSeconds: 55200, // ~15:20:00
    peakSeconds: 57600, // 16:00:00 (peak: 6.57m)
    peakLevelMeters: 6.57,
    affectedRoute: {
      name: "Narayani River Corridor Road & Devghat Pilgrimage Access",
      corridorCode: "H01 Feeder",
      type: "Bridge Crossing",
      segment: "Km 160–170 (Devghat Sacred Confluence to Narayani Bridge)",
      criticality: "HIGH",
      impactSummary: "Water level rose to 6.57m; Devghat pedestrian suspension bridge closed due to heavy floating tree impacts; pilgrimage ghats inundated.",
      secondaryRoute: "Narayani Main Bridge Approach & East-West Highway Junction (H01)",
      diversionAdvice: "Maintain regulated single-lane transit across Narayani Bridge (20 km/h speed limit); initiate flood evacuation for Bharatpur lowlands.",
    },
  },
];

/**
 * Approximate Trishuli river corridor polyline coordinates [lng, lat]
 */
export const TRISHULI_RIVER_PATH: [number, number][] = [
  [85.5161, 28.2575], // Langtang Lirung
  [85.441, 28.249],
  [85.378, 28.272], // Rasuwagadhi
  [85.352, 28.225],
  [85.337, 28.16],  // Syabrubesi
  [85.312, 28.125],
  [85.308, 28.113], // Dhunche area
  [85.258, 28.055],
  [85.184, 27.978], // Betrawati
  [85.142, 27.915], // Trishuli Bazaar
  [85.088, 27.852],
  [85.031, 27.818], // Galchhi
  [84.935, 27.812], // Gajuri
  [84.828, 27.808], // Malekhu
  [84.712, 27.828], // Benighat
  [84.615, 27.855], // Kurintar
  [84.556, 27.858], // Muglin
  [84.51, 27.82],   // Kalikhola
  [84.475, 27.755],
  [84.417, 27.705], // Devghat
  [84.405, 27.685], // Narayangarh / Bharatpur downstream
];

/**
 * 16 Reconstructed historical events from CSV
 */
export const NEPAL_TIMELINE_EVENTS: NepalTimelineEvent[] = [
  {
    eventId: "E00",
    date: "2026-08-26",
    timeNpt: "PRE-EVENT / UNCERTAIN",
    timeUtc: "02:15:00",
    timeDisplay: "PRE-EVENT (08:00:00)",
    secondsFromMidnight: 28800, // 08:00:00
    phase: "PRE-EVENT / UNCERTAIN",
    location: "Langtang Lirung north flank, Rasuwa, Nepal",
    coordinates: [85.5161, 28.2575],
    elevationMeters: 7234,
    distanceFromTriggerKm: 0,
    eventType: "Preconditioning",
    eventDescription:
      "Potential long-term slope/glacier instability existed before the collapse. Immediate precursor timing and mechanism remain uncertain.",
    confidence: "LOW",
    evidenceType: "Satellite / environmental analysis",
    operationalDataAvailable: "Background terrain, glacier, satellite and environmental data",
    aiInterpretation: "Do not treat this as a confirmed minute-scale warning signal.",
    recommendedAiTask: "Maintain baseline risk context; flag anomalies only when supported by observed data.",
    notes: "For the MVP replay, keep the period before 08:37:10 explicitly labelled PRE-EVENT / UNCERTAIN.",
    severity: "info",
    intensity: 15,
  },
  {
    eventId: "E01",
    date: "2026-08-26",
    timeNpt: "08:37:10",
    timeUtc: "02:52:10",
    timeDisplay: "08:37:10 NPT",
    secondsFromMidnight: 31030, // 08:37:10 (8*3600 + 37*60 + 10 = 31030)
    phase: "TRIGGER",
    location: "Langtang Lirung, Nepal",
    coordinates: [85.5161, 28.2575],
    elevationMeters: 7234,
    distanceFromTriggerKm: 0,
    eventType: "Rock-ice collapse / landslide-generated seismic event",
    eventDescription:
      "A large rock-ice collapse occurred on the north flank of Langtang Lirung. The seismic signal was initially catalogued as an earthquake but later identified as a landslide/glacial-collapse-related event, with seismic energy discussed as roughly equivalent to M5.2.",
    confidence: "HIGH",
    evidenceType: "USGS seismic analysis + satellite interpretation",
    operationalDataAvailable: "Seismic signal; approximate source location",
    aiInterpretation: "Classify the event as non-tectonic mass movement when the seismic and spatial evidence supports it.",
    recommendedAiTask: "Create a critical incident; immediately switch from earthquake-only interpretation to multi-hazard analysis.",
    notes: "This should be the replay start time.",
    severity: "critical",
    intensity: 95,
    seismicMagnitude: 5.2,
    affectedRoute: "Langtang Valley High Trek & Supply Spine (Obliterated)",
  },
  {
    eventId: "E02",
    date: "2026-08-26",
    timeNpt: "~08:40",
    timeUtc: "02:55:00",
    timeDisplay: "08:40:00 NPT (~08:40)",
    secondsFromMidnight: 31200, // 08:40:00
    phase: "EARLY IMPACT",
    location: "Rasuwagadhi / Timure area",
    coordinates: [85.378, 28.272],
    elevationMeters: 1814,
    distanceFromTriggerKm: 14,
    eventType: "Hydrological impact / gauge degradation",
    eventDescription:
      "The Rasuwagadhi/Timure monitoring context shows very limited warning lead time; a reported last reading was about 1.62 m before monitoring was compromised.",
    confidence: "MEDIUM",
    evidenceType: "Government/ground reporting",
    operationalDataAvailable: "Last available gauge state; local monitoring",
    aiInterpretation: "Do not assume normal gauge thresholds will provide adequate warning for a rapidly propagating debris/flood cascade.",
    recommendedAiTask: "Combine sensor status with terrain and event physics; detect loss-of-sensor risk.",
    notes: "Exact gauge chronology varies across secondary reconstructions.",
    severity: "warning",
    intensity: 75,
    gaugeReading: {
      levelMeters: 1.62,
      description: "Last recorded telemetry reading before sensor line severance",
      isCompromised: true,
    },
    affectedRoute: "Pasang Lhamu Highway (NH09 / AH48) & Miteri Friendship Bridge",
  },
  {
    eventId: "E03",
    date: "2026-08-26",
    timeNpt: "~08:44",
    timeUtc: "02:59:00",
    timeDisplay: "08:44:00 NPT (~08:44)",
    secondsFromMidnight: 31440, // 08:44:00
    phase: "FIRST MAJOR DOWNSTREAM IMPACT",
    location: "Rasuwagadhi / Gyirong border area",
    coordinates: [85.378, 28.272],
    elevationMeters: 1814,
    distanceFromTriggerKm: 14,
    eventType: "Debris-flow / flood impact",
    eventDescription:
      "The destructive flow reached the Rasuwagadhi/Gyirong border sector approximately 6–7 minutes after the seismic/collapse signal.",
    confidence: "HIGH",
    evidenceType: "CCTV / satellite / official reporting",
    operationalDataAvailable: "Observed impact; infrastructure damage; downstream geography",
    aiInterpretation: "Confirm that the primary hazard is propagating downstream and update the impact corridor.",
    recommendedAiTask: "Project downstream arrival times and identify exposed people, roads, bridges and critical infrastructure.",
    notes: "Rasuwagadhi is a key validation point for the replay.",
    severity: "critical",
    intensity: 90,
    affectedRoute: "Rasuwagadhi–Timure Border Arterial & Dry Port Access",
  },
  {
    eventId: "E04",
    date: "2026-08-26",
    timeNpt: "09:00",
    timeUtc: "03:15:00",
    timeDisplay: "09:00:00 NPT",
    secondsFromMidnight: 32400, // 09:00:00
    phase: "HUMAN REPORT",
    location: "Dhunche / Rasuwa",
    coordinates: [85.308, 28.113],
    elevationMeters: 1960,
    distanceFromTriggerKm: 35,
    eventType: "Operational alert",
    eventDescription:
      "Flood Forecasting Division received information about the event by telephone after automatic monitoring in the upper corridor was compromised.",
    confidence: "HIGH",
    evidenceType: "Operational / government reporting",
    operationalDataAvailable: "Human field report; degraded automated telemetry",
    aiInterpretation: "Human reports become a critical alternative data stream when automated sensors fail.",
    recommendedAiTask: "Ingest, geolocate and cross-check field reports against modelled hazard propagation.",
    notes: "Important replay event: demonstrates sensor-to-human-report fallback.",
    severity: "warning",
    intensity: 70,
    affectedRoute: "Pasang Lhamu Highway (NH09) - Ramche to Dhunche Sector",
  },
  {
    eventId: "E05",
    date: "2026-08-26",
    timeNpt: "09:15-09:16",
    timeUtc: "03:30:30",
    timeDisplay: "09:15:30 NPT (09:15-09:16)",
    secondsFromMidnight: 33330, // 09:15:30
    phase: "MASS WARNING",
    location: "Downstream Nepal",
    coordinates: [85.088, 27.852],
    elevationMeters: 550,
    distanceFromTriggerKm: 70,
    eventType: "Public emergency warning",
    eventDescription:
      "Approximately 679,295 mass SMS alerts were issued to populations in downstream risk areas.",
    confidence: "HIGH",
    evidenceType: "Government reporting",
    operationalDataAvailable: "Incident location, downstream risk zones, public alert channel",
    aiInterpretation: "Translate modelled exposure into geographically targeted warnings.",
    recommendedAiTask: "Prioritize warning sectors by estimated hazard arrival time and population exposure.",
    notes: "Use the exact warning count as a historical event marker, not as a model output.",
    severity: "warning",
    intensity: 85,
    warningCount: 679295,
    affectedRoute: "All Trishuli Basin Highway Corridors (NH09, H04, H05)",
  },
  {
    eventId: "E06",
    date: "2026-08-26",
    timeNpt: "09:00-09:30",
    timeUtc: "03:45:00",
    timeDisplay: "09:25:00 NPT (09:00-09:30)",
    secondsFromMidnight: 33900, // 09:25:00
    phase: "SENSOR DEGRADATION",
    location: "Syabrubesi",
    coordinates: [85.337, 28.16],
    elevationMeters: 1460,
    distanceFromTriggerKm: 28,
    eventType: "Gauge / telemetry loss",
    eventDescription:
      "The Syabrubesi monitoring station ceased providing useful observations as the flood/debris cascade progressed through the corridor.",
    confidence: "MEDIUM",
    evidenceType: "Government / reconstruction",
    operationalDataAvailable: "Last known station data; inferred hazard progression",
    aiInterpretation: "Mark live telemetry as degraded rather than interpreting silence as absence of hazard.",
    recommendedAiTask: "Switch to last-known state plus terrain/network propagation modelling.",
    notes: "Exact timestamp should be kept approximate in the MVP.",
    severity: "critical",
    intensity: 75,
    gaugeReading: {
      levelMeters: 6.2,
      description: "Sensor loss; gauge offline during passage of main debris front",
      isCompromised: true,
    },
    affectedRoute: "Pasang Lhamu Highway (NH09) & Syabrubesi Suspension Bridges",
  },
  {
    eventId: "E07",
    date: "2026-08-26",
    timeNpt: "10:00-10:30",
    timeUtc: "04:30:00",
    timeDisplay: "10:15:00 NPT (10:00-10:30)",
    secondsFromMidnight: 36900, // 10:15:00
    phase: "DOWNSTREAM PROPAGATION",
    location: "Betrawati",
    coordinates: [85.184, 27.978],
    elevationMeters: 625,
    distanceFromTriggerKm: 56,
    eventType: "Flood-wave impact / station loss",
    eventDescription:
      "Betrawati monitoring reached its last usable state before the station was compromised; later reconstruction records a last level of about 3.55 m.",
    confidence: "MEDIUM",
    evidenceType: "Technical reconstruction",
    operationalDataAvailable: "Last gauge state; river-network context",
    aiInterpretation: "Use the last verified measurement as a boundary condition, then propagate uncertainty downstream.",
    recommendedAiTask: "Recalculate ETA and exposure with uncertainty bounds.",
    notes: "Prefer a time interval over a false precise timestamp.",
    severity: "critical",
    intensity: 80,
    gaugeReading: {
      levelMeters: 3.55,
      description: "Last usable measurement before station compromised",
      isCompromised: true,
    },
    affectedRoute: "Galchhi–Trishuli Road (NH09) & Betrawati River Bridge",
  },
  {
    eventId: "E08",
    date: "2026-08-26",
    timeNpt: "10:28",
    timeUtc: "04:43:00",
    timeDisplay: "10:28:00 NPT",
    secondsFromMidnight: 37680, // 10:28:00
    phase: "DOWNSTREAM CONFIRMATION",
    location: "Galchhi, Dhading",
    coordinates: [85.031, 27.818],
    elevationMeters: 450,
    distanceFromTriggerKm: 82,
    eventType: "Flood-wave arrival",
    eventDescription:
      "The downstream flood wave reached Galchhi; reports describe a rapid rise of roughly 9 m over about 30 minutes.",
    confidence: "HIGH",
    evidenceType: "Gauge / technical reporting",
    operationalDataAvailable: "Observed downstream level change",
    aiInterpretation: "Use the observation to update or validate the propagation model.",
    recommendedAiTask: "Recalibrate downstream ETA and exposure estimates.",
    notes: "Excellent checkpoint for evaluating model-vs-observation error.",
    severity: "critical",
    intensity: 88,
    gaugeReading: {
      levelMeters: 11.1,
      description: "Rapid surge: +9m rise recorded within 30 minutes",
      isDangerLevel: true,
    },
    affectedRoute: "Prithvi Highway (H04 / NH41 - Primary Lifeline to Kathmandu)",
  },
  {
    eventId: "E09",
    date: "2026-08-26",
    timeNpt: "~11:20",
    timeUtc: "05:35:00",
    timeDisplay: "11:20:00 NPT (~11:20)",
    secondsFromMidnight: 40800, // 11:20:00
    phase: "DOWNSTREAM IMPACT",
    location: "Malekhu",
    coordinates: [84.828, 27.808],
    elevationMeters: 340,
    distanceFromTriggerKm: 104,
    eventType: "Flood-wave impact",
    eventDescription:
      "The flood wave reached the Malekhu area and river levels rose rapidly.",
    confidence: "MEDIUM",
    evidenceType: "Technical / media reporting",
    operationalDataAvailable: "Observed river response and infrastructure exposure",
    aiInterpretation: "Increase downstream risk priority for remaining exposed sectors.",
    recommendedAiTask: "Update exposed population, infrastructure and route closures.",
    notes: "Keep approximate timing unless using the underlying DHM technical report directly.",
    severity: "warning",
    intensity: 75,
    gaugeReading: {
      levelMeters: 9.4,
      description: "Rapid water level surge; bridges and riverside markets put on high alert",
    },
    affectedRoute: "Prithvi Highway (H04 / NH41) & Malekhu Bridge (Km 98–110)",
  },
  {
    eventId: "E10",
    date: "2026-08-26",
    timeNpt: "~11:45",
    timeUtc: "06:00:00",
    timeDisplay: "11:45:00 NPT (~11:45)",
    secondsFromMidnight: 42300, // 11:45:00
    phase: "SECONDARY EVENT",
    location: "Rasuwa region",
    coordinates: [85.45, 28.2],
    elevationMeters: 4500,
    distanceFromTriggerKm: 18,
    eventType: "Second seismic / mass-movement signal",
    eventDescription:
      "A second major seismic signal was recorded roughly three hours after the initial collapse, with energy equivalent to about M4.2.",
    confidence: "HIGH",
    evidenceType: "USGS seismic analysis",
    operationalDataAvailable: "Second seismic signal; updated hazard context",
    aiInterpretation:
      "Treat as evidence of continuing instability or a secondary mass-movement process rather than automatically classifying it as a tectonic earthquake.",
    recommendedAiTask: "Reassess active hazard zones and secondary-failure risk.",
    notes: "Use approximately three hours after the first event unless the replay has the reviewed USGS origin time.",
    severity: "critical",
    intensity: 82,
    seismicMagnitude: 4.2,
    affectedRoute: "Upper Rasuwa Cliff Road & Secondary Ridge Bypass",
  },
  {
    eventId: "E11",
    date: "2026-08-26",
    timeNpt: "13:00",
    timeUtc: "07:15:00",
    timeDisplay: "13:00:00 NPT",
    secondsFromMidnight: 46800, // 13:00:00
    phase: "DOWNSTREAM PROPAGATION",
    location: "Muglin",
    coordinates: [84.556, 27.858],
    elevationMeters: 260,
    distanceFromTriggerKm: 135,
    eventType: "Flood-wave arrival",
    eventDescription:
      "The flood pulse propagated through the Muglin area and continued toward the lower Trishuli/Narayani system.",
    confidence: "HIGH",
    evidenceType: "Technical reconstruction",
    operationalDataAvailable: "River-network observations; downstream geography",
    aiInterpretation: "Continue updating downstream arrival times and exposure.",
    recommendedAiTask: "Maintain warning coverage for lower-basin populations.",
    notes: "Useful checkpoint for long-range propagation.",
    severity: "warning",
    intensity: 70,
    gaugeReading: {
      levelMeters: 11.5,
      description: "Prithvi highway confluence sector inundated; heavy sediment pulse",
    },
    affectedRoute: "Prithvi Highway (H04) & Muglin–Narayangarh Junction (H05)",
  },
  {
    eventId: "E12",
    date: "2026-08-26",
    timeNpt: "14:14",
    timeUtc: "08:29:00",
    timeDisplay: "14:14:00 NPT",
    secondsFromMidnight: 51240, // 14:14:00
    phase: "DOWNSTREAM PEAK DEVELOPMENT",
    location: "Kalikhola",
    coordinates: [84.51, 27.82],
    elevationMeters: 230,
    distanceFromTriggerKm: 142,
    eventType: "Danger-level exceedance",
    eventDescription:
      "Kalikhola monitoring crossed the danger level; later peak conditions were reported around 12.3 m.",
    confidence: "MEDIUM",
    evidenceType: "Technical reconstruction",
    operationalDataAvailable: "Gauge observations and warning thresholds",
    aiInterpretation: "Use threshold crossing as an observed state, not as the only hazard signal.",
    recommendedAiTask: "Update evacuation/closure priorities and compare observed vs predicted propagation.",
    notes: "Useful for model evaluation.",
    severity: "critical",
    intensity: 85,
    gaugeReading: {
      levelMeters: 12.3,
      description: "Exceeded danger threshold (10.5m); peak recorded at 12.3m",
      isDangerLevel: true,
    },
    affectedRoute: "Muglin–Narayangarh Highway (H05 / NH42 - Kalikhola Gorge Chute)",
  },
  {
    eventId: "E13",
    date: "2026-08-26",
    timeNpt: "~15:20",
    timeUtc: "09:35:00",
    timeDisplay: "15:20:00 NPT (~15:20)",
    secondsFromMidnight: 55200, // 15:20:00
    phase: "LOWER-BASIN IMPACT",
    location: "Devghat",
    coordinates: [84.417, 27.705],
    elevationMeters: 180,
    distanceFromTriggerKm: 165,
    eventType: "Flood-wave arrival",
    eventDescription:
      "The flood pulse reached the Devghat area where the Trishuli joins the Kali Gandaki to form the Narayani.",
    confidence: "HIGH",
    evidenceType: "Technical reconstruction",
    operationalDataAvailable: "Observed downstream river response",
    aiInterpretation:
      "Continue tracking the hazard while distinguishing the original debris wave from the broader flood response.",
    recommendedAiTask: "Update lower-basin exposure and response status.",
    notes: "Important endpoint for the initial high-speed replay.",
    severity: "warning",
    intensity: 70,
    affectedRoute: "Narayani River Corridor Road & Devghat Pilgrimage Access",
  },
  {
    eventId: "E14",
    date: "2026-08-26",
    timeNpt: "16:00",
    timeUtc: "10:15:00",
    timeDisplay: "16:00:00 NPT",
    secondsFromMidnight: 57600, // 16:00:00
    phase: "PEAK",
    location: "Devghat",
    coordinates: [84.417, 27.705],
    elevationMeters: 180,
    distanceFromTriggerKm: 165,
    eventType: "Flood peak",
    eventDescription:
      "Reported peak river level at Devghat was approximately 6.57 m, below the local amber threshold cited in the reconstruction.",
    confidence: "HIGH",
    evidenceType: "Gauge / technical reporting",
    operationalDataAvailable: "Observed peak level",
    aiInterpretation:
      "Treat the peak as an observed validation point for the downstream model.",
    recommendedAiTask:
      "Calculate model error, update confidence, and transition from immediate propagation to recovery monitoring.",
    notes: "Strong checkpoint for end-to-end replay evaluation.",
    severity: "warning",
    intensity: 75,
    gaugeReading: {
      levelMeters: 6.57,
      description: "Peak recorded at 6.57m (attenuated below local 7.3m amber threshold)",
    },
    affectedRoute: "Narayani Bridge & East-West Highway (H01) Confluence Approach",
  },
  {
    eventId: "E15",
    date: "2026-08-26",
    timeNpt: "~18:30",
    timeUtc: "12:45:00",
    timeDisplay: "18:30:00 NPT (~18:30)",
    secondsFromMidnight: 66600, // 18:30:00
    phase: "RECESSION",
    location: "Devghat / lower basin",
    coordinates: [84.417, 27.705],
    elevationMeters: 180,
    distanceFromTriggerKm: 165,
    eventType: "Flood recession",
    eventDescription:
      "Water levels were reported to be falling substantially by the evening as the main flood pulse passed through the monitored downstream system.",
    confidence: "MEDIUM",
    evidenceType: "Technical reconstruction",
    operationalDataAvailable: "Falling gauge levels",
    aiInterpretation:
      "Transition from life-safety propagation mode to impact assessment and recovery monitoring, while retaining secondary-hazard awareness.",
    recommendedAiTask: "Switch operational state to impact assessment and recovery planning.",
    notes: "Optional final state for the MVP replay.",
    severity: "warning",
    intensity: 35,
    gaugeReading: {
      levelMeters: 4.1,
      description: "Steep recession phase underway; river returning to elevated baseflow",
    },
    affectedRoute: "Entire 165 km Trishuli–Narayani Transport Corridor (Recovery & Assessment)",
  },
];

export const REPLAY_START_SECONDS = 31030; // 08:37:10 (Trigger E01)
export const TIMELINE_MIN_SECONDS = 28800; // 08:00:00 (Pre-event E00)
export const TIMELINE_MAX_SECONDS = 68400; // 19:00:00 (After E15 recession)

/**
 * Format total seconds from midnight into HH:MM:SS string
 */
export function formatNptTime(secondsFromMidnight: number): string {
  const rounded = Math.max(0, Math.floor(secondsFromMidnight));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Convert NPT (UTC+5:45) seconds to approximate UTC HH:MM:SS
 */
export function formatUtcTime(secondsFromMidnightNpt: number): string {
  // NPT is UTC + 5h45m = 20700 seconds ahead of UTC
  let utcSeconds = secondsFromMidnightNpt - 20700;
  if (utcSeconds < 0) utcSeconds += 86400;
  const hours = Math.floor(utcSeconds / 3600);
  const minutes = Math.floor((utcSeconds % 3600) / 60);
  const seconds = Math.floor(utcSeconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Compute active event from current replay seconds
 */
export function getActiveEvent(currentSeconds: number): NepalTimelineEvent {
  // Find last event whose secondsFromMidnight <= currentSeconds
  let active = NEPAL_TIMELINE_EVENTS[0];
  for (const ev of NEPAL_TIMELINE_EVENTS) {
    if (ev.secondsFromMidnight <= currentSeconds) {
      active = ev;
    } else {
      break;
    }
  }
  return active;
}

/**
 * Compute wave front propagation distance (in km) along the river corridor
 */
export function getWavePropagationKm(currentSeconds: number): number {
  if (currentSeconds < REPLAY_START_SECONDS) {
    return 0;
  }
  // Interpolate based on historical station arrival times
  const triggerSec = REPLAY_START_SECONDS; // 31030
  if (currentSeconds <= 31440) {
    // 0 to 14 km (Rasuwagadhi) in ~7 min: ~33 m/s fast debris wave
    const t = (currentSeconds - triggerSec) / (31440 - triggerSec);
    return Math.min(14, 14 * Math.max(0, t));
  } else if (currentSeconds <= 36900) {
    // 14 km to 56 km (Betrawati)
    const t = (currentSeconds - 31440) / (36900 - 31440);
    return 14 + (56 - 14) * t;
  } else if (currentSeconds <= 37680) {
    // 56 km to 82 km (Galchhi)
    const t = (currentSeconds - 36900) / (37680 - 36900);
    return 56 + (82 - 56) * t;
  } else if (currentSeconds <= 51240) {
    // 82 km to 142 km (Kalikhola)
    const t = (currentSeconds - 37680) / (51240 - 37680);
    return 82 + (142 - 82) * t;
  } else {
    // 142 km to 165 km (Devghat)
    const t = (currentSeconds - 51240) / (57600 - 51240);
    return Math.min(165, 142 + (165 - 142) * Math.max(0, Math.min(1, t)));
  }
}

/**
 * Get dynamic station statuses for a given timestamp
 */
export function getStationDynamicState(station: RiverStation, currentSeconds: number) {
  if (currentSeconds < station.arrivalSeconds) {
    return {
      status: "NOMINAL" as const,
      waterLevel: station.baselineLevelMeters,
      color: "#3b82f6", // blue
      label: "Nominal Baseline",
    };
  }

  if (station.compromisedSeconds && currentSeconds >= station.compromisedSeconds) {
    return {
      status: "COMPROMISED" as const,
      waterLevel: station.peakLevelMeters,
      color: "#ef4444", // red
      label: "Telemetry Offline / Destroyed",
    };
  }

  if (currentSeconds >= station.peakSeconds + 3600) {
    // In recession
    const fallT = Math.min(1, (currentSeconds - (station.peakSeconds + 3600)) / 10800);
    const waterLevel =
      station.peakLevelMeters -
      (station.peakLevelMeters - station.baselineLevelMeters) * fallT * 0.7;
    const roundedWaterLevel = Number(waterLevel.toFixed(2));

    const isDanger =
      roundedWaterLevel >= station.dangerThresholdMeters && station.dangerThresholdMeters > 0;
    const isWarning =
      roundedWaterLevel >= station.warningThresholdMeters && station.warningThresholdMeters > 0;

    if (isDanger) {
      return {
        status: "DANGER" as const,
        waterLevel: roundedWaterLevel,
        color: "#dc2626", // red
        label: "Recession (Danger Exceeded)",
      };
    }

    if (isWarning) {
      return {
        status: "SURGING" as const,
        waterLevel: roundedWaterLevel,
        color: "#ea580c", // deep orange
        label: "Recession (Warning Active)",
      };
    }

    return {
      status: "RECESSION" as const,
      waterLevel: roundedWaterLevel,
      color: "#f97316", // amber-orange, representing residual post-flood hazard (never green)
      label: "Post-Peak Recession (Residual Hazard)",
    };
  }

  if (currentSeconds >= station.peakSeconds) {
    return {
      status: "PEAK" as const,
      waterLevel: station.peakLevelMeters,
      color: "#f59e0b", // amber
      label: "Crest / High Water",
    };
  }

  // Wave has arrived but before peak
  const riseT = (currentSeconds - station.arrivalSeconds) / Math.max(1, station.peakSeconds - station.arrivalSeconds);
  const waterLevel =
    station.baselineLevelMeters +
    (station.peakLevelMeters - station.baselineLevelMeters) * riseT;

  const isDanger = waterLevel >= station.dangerThresholdMeters && station.dangerThresholdMeters > 0;

  return {
    status: (isDanger ? "DANGER" : "SURGING") as "DANGER" | "SURGING",
    waterLevel: Number(waterLevel.toFixed(2)),
    color: isDanger ? "#dc2626" : "#f97316",
    label: isDanger ? "Danger Level Exceeded" : "Surge Inundation",
  };
}

/**
 * Compute dynamic road/route operational status at a station for a given timestamp
 */
export function getStationRouteDynamicStatus(
  station: RiverStation,
  currentSeconds: number
): DynamicRouteStatus {
  const route = station.affectedRoute;
  const timeToArrival = station.arrivalSeconds - currentSeconds;

  // 1. Before wave arrival
  if (currentSeconds < station.arrivalSeconds) {
    if (timeToArrival <= 2400) {
      // Within 40 minutes of flood front arrival
      return {
        status: "PRE-EMPTIVE CLOSURE",
        badgeVariant: "warning",
        badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider",
        color: "#f59e0b",
        actionRequired: "Precautionary traffic stoppage ordered; clearing low bridge approaches and riverside transit bays.",
        affectedCorridor: route.segment,
      };
    }

    return {
      status: "OPEN / ADVISORY",
      badgeVariant: "default",
      badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/50 uppercase font-semibold text-[10px] tracking-wider",
      color: "#38bdf8",
      actionRequired: "Corridor open under active hydrological advisory; emergency diversion protocols on standby.",
      affectedCorridor: route.segment,
    };
  }

  // 2. Active collapse / severed or telemetry destroyed
  if (station.id === "STN-LIRUNG" || (station.compromisedSeconds && currentSeconds >= station.compromisedSeconds)) {
    return {
      status: "SEVERED",
      badgeVariant: "destructive",
      badgeClass: "bg-red-500/20 text-red-400 border-red-500/50 uppercase font-bold text-[10px] tracking-wider animate-pulse",
      color: "#ef4444",
      actionRequired: "Infrastructure severed by massive debris avalanche / flood wave. Total transit prohibition enforced.",
      affectedCorridor: route.segment,
    };
  }

  // 3. Active flood surge / crest period
  if (currentSeconds <= station.peakSeconds + 3600) {
    return {
      status: "IMPASSABLE",
      badgeVariant: "destructive",
      badgeClass: "bg-red-500/20 text-red-400 border-red-500/50 uppercase font-bold text-[10px] tracking-wider animate-pulse",
      color: "#dc2626",
      actionRequired: "Highway roadbed inundated by catastrophic flood wave crest; bridge clearance breached. Movement halted.",
      affectedCorridor: route.segment,
    };
  }

  // 4. Post-peak recession
  return {
    status: "DEBRIS BLOCKED",
    badgeVariant: "warning",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/50 uppercase font-semibold text-[10px] tracking-wider",
    color: "#f97316",
    actionRequired: "Heavy mud, silt, and boulder deposits blocking carriageway; structural bridge inspection underway before reopening.",
    affectedCorridor: route.segment,
  };
}

