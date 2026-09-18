import { VesselData, VesselCategory, VesselResponse } from "@/shared";

const DIGITRAFFIC_LOCATIONS_URL =
  "https://meri.digitraffic.fi/api/ais/v1/locations?latitude=59.45&longitude=24.75&radius=45";
const DIGITRAFFIC_VESSELS_URL = "https://meri.digitraffic.fi/api/ais/v1/vessels";

const metadataCache = new Map<
  number,
  {
    name: string;
    shipType: number;
    destination: string;
    callSign: string;
    updatedAt: number;
  }
>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface MaritimeWaypoint {
  lng: number;
  lat: number;
  sogKnots?: number;
}

export interface MaritimeRoute {
  mmsi: number;
  name: string;
  shipType: number;
  destination: string;
  callSign: string;
  defaultSog: number;
  waypoints: MaritimeWaypoint[];
  cycleOffsetSec: number;
}

function getShipCategory(shipType: number): VesselCategory {
  if ((shipType >= 36 && shipType <= 37) || shipType === 30) {
    return "yacht";
  }
  if (shipType >= 70 && shipType <= 79) {
    return "cargo";
  }
  if (shipType >= 80 && shipType <= 89) {
    return "tanker";
  }
  if (shipType >= 60 && shipType <= 69) {
    return "passenger";
  }
  return "other";
}

function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const dLngRad = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(dLngRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const SIMULATED_MARITIME_FLEET: MaritimeRoute[] = [
  // --- PASSENGER & FERRIES ---
  {
    mmsi: 276841000,
    name: "MEGASTAR",
    shipType: 60,
    destination: "HELSINKI",
    callSign: "ESMG",
    defaultSog: 21.5,
    cycleOffsetSec: 0,
    waypoints: [
      { lng: 24.7665, lat: 59.4452, sogKnots: 8.0 },
      { lng: 24.7610, lat: 59.4580, sogKnots: 14.0 },
      { lng: 24.7720, lat: 59.4950, sogKnots: 21.5 },
      { lng: 24.8100, lat: 59.5550, sogKnots: 22.0 },
      { lng: 24.8650, lat: 59.6300, sogKnots: 22.0 },
      { lng: 24.9100, lat: 59.7200, sogKnots: 21.5 },
      { lng: 24.8650, lat: 59.6300, sogKnots: 22.0 },
      { lng: 24.8100, lat: 59.5550, sogKnots: 21.5 },
      { lng: 24.7720, lat: 59.4950, sogKnots: 19.0 },
      { lng: 24.7610, lat: 59.4580, sogKnots: 12.0 },
    ],
  },
  {
    mmsi: 276852000,
    name: "MYSTAR",
    shipType: 60,
    destination: "TALLINN",
    callSign: "ESMS",
    defaultSog: 20.2,
    cycleOffsetSec: 850,
    waypoints: [
      { lng: 24.9100, lat: 59.7200, sogKnots: 20.2 },
      { lng: 24.8650, lat: 59.6300, sogKnots: 20.5 },
      { lng: 24.8100, lat: 59.5550, sogKnots: 20.0 },
      { lng: 24.7720, lat: 59.4950, sogKnots: 18.5 },
      { lng: 24.7610, lat: 59.4580, sogKnots: 11.5 },
      { lng: 24.7665, lat: 59.4452, sogKnots: 6.0 },
      { lng: 24.7610, lat: 59.4580, sogKnots: 12.0 },
      { lng: 24.7720, lat: 59.4950, sogKnots: 19.0 },
      { lng: 24.8100, lat: 59.5550, sogKnots: 20.5 },
      { lng: 24.8650, lat: 59.6300, sogKnots: 20.5 },
    ],
  },
  {
    mmsi: 276789000,
    name: "BALTIC QUEEN",
    shipType: 60,
    destination: "STOCKHOLM",
    callSign: "ESBQ",
    defaultSog: 16.0,
    cycleOffsetSec: 300,
    waypoints: [
      { lng: 24.7630, lat: 59.4465, sogKnots: 7.5 },
      { lng: 24.7450, lat: 59.4650, sogKnots: 12.0 },
      { lng: 24.6800, lat: 59.4950, sogKnots: 15.5 },
      { lng: 24.5600, lat: 59.5200, sogKnots: 16.5 },
      { lng: 24.3800, lat: 59.5400, sogKnots: 17.0 },
      { lng: 24.1500, lat: 59.5600, sogKnots: 17.0 },
      { lng: 24.3800, lat: 59.5400, sogKnots: 17.0 },
      { lng: 24.5600, lat: 59.5200, sogKnots: 16.0 },
      { lng: 24.6800, lat: 59.4950, sogKnots: 14.5 },
      { lng: 24.7450, lat: 59.4650, sogKnots: 10.0 },
    ],
  },
  {
    mmsi: 230627000,
    name: "SILJA EUROPA",
    shipType: 60,
    destination: "HELSINKI",
    callSign: "OGEU",
    defaultSog: 14.5,
    cycleOffsetSec: 600,
    waypoints: [
      { lng: 24.7640, lat: 59.4470, sogKnots: 8.0 },
      { lng: 24.7550, lat: 59.4700, sogKnots: 13.0 },
      { lng: 24.7800, lat: 59.5200, sogKnots: 15.0 },
      { lng: 24.8400, lat: 59.6000, sogKnots: 15.5 },
      { lng: 24.9000, lat: 59.6900, sogKnots: 15.0 },
      { lng: 24.8400, lat: 59.6000, sogKnots: 15.0 },
      { lng: 24.7800, lat: 59.5200, sogKnots: 14.0 },
      { lng: 24.7550, lat: 59.4700, sogKnots: 10.0 },
    ],
  },
  {
    mmsi: 230638000,
    name: "VIKING XPRS",
    shipType: 60,
    destination: "HELSINKI KATAJNOKKA",
    callSign: "XPRS",
    defaultSog: 19.5,
    cycleOffsetSec: 420,
    waypoints: [
      { lng: 24.7680, lat: 59.4450, sogKnots: 7.0 },
      { lng: 24.7630, lat: 59.4600, sogKnots: 14.0 },
      { lng: 24.7750, lat: 59.5050, sogKnots: 19.5 },
      { lng: 24.8200, lat: 59.5800, sogKnots: 20.0 },
      { lng: 24.8800, lat: 59.6800, sogKnots: 19.5 },
      { lng: 24.8200, lat: 59.5800, sogKnots: 19.5 },
      { lng: 24.7750, lat: 59.5050, sogKnots: 18.0 },
      { lng: 24.7630, lat: 59.4600, sogKnots: 12.0 },
    ],
  },
  {
    mmsi: 276812000,
    name: "VICTORIA I",
    shipType: 60,
    destination: "TALLINN VANASADAM",
    callSign: "ESVI",
    defaultSog: 15.2,
    cycleOffsetSec: 720,
    waypoints: [
      { lng: 24.2500, lat: 59.5500, sogKnots: 16.0 },
      { lng: 24.4500, lat: 59.5350, sogKnots: 15.5 },
      { lng: 24.6200, lat: 59.5100, sogKnots: 14.0 },
      { lng: 24.7300, lat: 59.4700, sogKnots: 11.5 },
      { lng: 24.7620, lat: 59.4460, sogKnots: 6.5 },
      { lng: 24.7300, lat: 59.4700, sogKnots: 12.0 },
      { lng: 24.6200, lat: 59.5100, sogKnots: 15.0 },
      { lng: 24.4500, lat: 59.5350, sogKnots: 16.0 },
    ],
  },

  // --- CARGO & CONTAINER VESSELS ---
  {
    mmsi: 305889000,
    name: "ELAND",
    shipType: 70,
    destination: "ST. PETERSBURG",
    callSign: "V2QG3",
    defaultSog: 11.4,
    cycleOffsetSec: 750,
    waypoints: [
      { lng: 24.6980, lat: 59.4620, sogKnots: 6.0 },
      { lng: 24.6750, lat: 59.4900, sogKnots: 10.0 },
      { lng: 24.7500, lat: 59.5400, sogKnots: 12.0 },
      { lng: 24.9000, lat: 59.5900, sogKnots: 12.5 },
      { lng: 25.1000, lat: 59.6200, sogKnots: 12.5 },
      { lng: 24.9000, lat: 59.5900, sogKnots: 12.0 },
      { lng: 24.7500, lat: 59.5400, sogKnots: 11.0 },
      { lng: 24.6750, lat: 59.4900, sogKnots: 8.5 },
    ],
  },
  {
    mmsi: 230991000,
    name: "FINNLADY",
    shipType: 70,
    destination: "VUOSAARI",
    callSign: "OJGA",
    defaultSog: 18.0,
    cycleOffsetSec: 180,
    waypoints: [
      { lng: 24.9600, lat: 59.4960, sogKnots: 7.0 },
      { lng: 24.9850, lat: 59.5400, sogKnots: 14.0 },
      { lng: 24.9600, lat: 59.6200, sogKnots: 18.5 },
      { lng: 24.9850, lat: 59.5400, sogKnots: 15.0 },
      { lng: 24.9600, lat: 59.4960, sogKnots: 8.0 },
    ],
  },
  {
    mmsi: 276443000,
    name: "BALTIC SAILOR",
    shipType: 70,
    destination: "MUUGA CONTAINER",
    callSign: "ESBS",
    defaultSog: 13.0,
    cycleOffsetSec: 520,
    waypoints: [
      { lng: 24.4000, lat: 59.6100, sogKnots: 13.5 },
      { lng: 24.7000, lat: 59.6000, sogKnots: 13.0 },
      { lng: 24.9200, lat: 59.5700, sogKnots: 11.5 },
      { lng: 24.9650, lat: 59.5050, sogKnots: 7.5 },
      { lng: 24.9200, lat: 59.5700, sogKnots: 12.0 },
      { lng: 24.7000, lat: 59.6000, sogKnots: 13.5 },
    ],
  },
  {
    mmsi: 230112000,
    name: "TRANSLANDIA",
    shipType: 70,
    destination: "PALDISKI RO-RO",
    callSign: "OJTL",
    defaultSog: 14.8,
    cycleOffsetSec: 340,
    waypoints: [
      { lng: 24.1500, lat: 59.5300, sogKnots: 15.0 },
      { lng: 24.4500, lat: 59.5200, sogKnots: 14.5 },
      { lng: 24.6800, lat: 59.4850, sogKnots: 12.0 },
      { lng: 24.4500, lat: 59.5200, sogKnots: 14.5 },
      { lng: 24.1500, lat: 59.5300, sogKnots: 15.0 },
    ],
  },
  {
    mmsi: 276554000,
    name: "MUUGA EXPRESS",
    shipType: 70,
    destination: "ROTTERDAM",
    callSign: "ESME",
    defaultSog: 12.5,
    cycleOffsetSec: 90,
    waypoints: [
      { lng: 24.9620, lat: 59.4980, sogKnots: 6.0 },
      { lng: 24.9750, lat: 59.5500, sogKnots: 11.0 },
      { lng: 24.8000, lat: 59.6100, sogKnots: 13.0 },
      { lng: 24.3000, lat: 59.6300, sogKnots: 13.5 },
      { lng: 24.8000, lat: 59.6100, sogKnots: 13.0 },
      { lng: 24.9750, lat: 59.5500, sogKnots: 10.5 },
    ],
  },
  {
    mmsi: 276665000,
    name: "BOTNICA MULTIPURPOSE",
    shipType: 70,
    destination: "PALJASSAARE BASIN",
    callSign: "ESBN",
    defaultSog: 9.0,
    cycleOffsetSec: 15,
    waypoints: [
      { lng: 24.7050, lat: 59.4630, sogKnots: 4.0 },
      { lng: 24.6900, lat: 59.4800, sogKnots: 8.5 },
      { lng: 24.7200, lat: 59.5100, sogKnots: 10.0 },
      { lng: 24.6900, lat: 59.4800, sogKnots: 8.0 },
      { lng: 24.7050, lat: 59.4630, sogKnots: 3.5 },
    ],
  },

  // --- OIL & CHEMICAL TANKERS ---
  {
    mmsi: 212543000,
    name: "NORDIC N",
    shipType: 80,
    destination: "MUUGA OIL TERMINAL",
    callSign: "5BAX4",
    defaultSog: 9.8,
    cycleOffsetSec: 400,
    waypoints: [
      { lng: 24.9580, lat: 59.4950, sogKnots: 5.0 },
      { lng: 24.9800, lat: 59.5350, sogKnots: 8.5 },
      { lng: 24.9450, lat: 59.5850, sogKnots: 10.5 },
      { lng: 24.7500, lat: 59.6200, sogKnots: 11.0 },
      { lng: 24.4500, lat: 59.6350, sogKnots: 11.0 },
      { lng: 24.7500, lat: 59.6200, sogKnots: 10.5 },
      { lng: 24.9450, lat: 59.5850, sogKnots: 9.5 },
      { lng: 24.9800, lat: 59.5350, sogKnots: 7.0 },
    ],
  },
  {
    mmsi: 276223000,
    name: "BALTIC ENERGY LNG",
    shipType: 80,
    destination: "TALLINN LNG ROAD",
    callSign: "ESBE",
    defaultSog: 10.5,
    cycleOffsetSec: 640,
    waypoints: [
      { lng: 24.7500, lat: 59.4850, sogKnots: 6.0 },
      { lng: 24.7800, lat: 59.5300, sogKnots: 10.5 },
      { lng: 24.8800, lat: 59.5900, sogKnots: 11.0 },
      { lng: 24.7800, lat: 59.5300, sogKnots: 10.0 },
      { lng: 24.7500, lat: 59.4850, sogKnots: 5.5 },
    ],
  },
  {
    mmsi: 230441000,
    name: "NESTE GRACE",
    shipType: 80,
    destination: "PORVOO OIL REFINERY",
    callSign: "OJNG",
    defaultSog: 12.0,
    cycleOffsetSec: 230,
    waypoints: [
      { lng: 24.9700, lat: 59.5100, sogKnots: 6.5 },
      { lng: 25.0200, lat: 59.5700, sogKnots: 11.5 },
      { lng: 25.0800, lat: 59.6400, sogKnots: 13.0 },
      { lng: 25.0200, lat: 59.5700, sogKnots: 11.5 },
      { lng: 24.9700, lat: 59.5100, sogKnots: 6.0 },
    ],
  },
  {
    mmsi: 276332000,
    name: "TALLINN BUNKER 1",
    shipType: 80,
    destination: "TALLINN ANCHORAGE",
    callSign: "ESTB",
    defaultSog: 7.2,
    cycleOffsetSec: 110,
    waypoints: [
      { lng: 24.7300, lat: 59.4580, sogKnots: 4.0 },
      { lng: 24.7450, lat: 59.4750, sogKnots: 7.5 },
      { lng: 24.7700, lat: 59.4850, sogKnots: 7.0 },
      { lng: 24.7450, lat: 59.4750, sogKnots: 6.5 },
      { lng: 24.7300, lat: 59.4580, sogKnots: 3.5 },
    ],
  },

  // --- SPECIAL, COAST GUARD, PILOT & TUGS ---
  {
    mmsi: 276001234,
    name: "TALLINN PILOT 1",
    shipType: 30,
    destination: "PILOT STATION ALPHA",
    callSign: "ESPL1",
    defaultSog: 18.0,
    cycleOffsetSec: 150,
    waypoints: [
      { lng: 24.7350, lat: 59.4540, sogKnots: 12.0 },
      { lng: 24.7200, lat: 59.4750, sogKnots: 18.0 },
      { lng: 24.7600, lat: 59.5100, sogKnots: 19.5 },
      { lng: 24.7900, lat: 59.4800, sogKnots: 18.0 },
      { lng: 24.7450, lat: 59.4600, sogKnots: 14.0 },
    ],
  },
  {
    mmsi: 276001235,
    name: "TALLINN PILOT 2",
    shipType: 30,
    destination: "MUUGA PILOT ROAD",
    callSign: "ESPL2",
    defaultSog: 17.0,
    cycleOffsetSec: 480,
    waypoints: [
      { lng: 24.9600, lat: 59.5000, sogKnots: 10.0 },
      { lng: 24.9750, lat: 59.5400, sogKnots: 17.5 },
      { lng: 24.9400, lat: 59.5700, sogKnots: 17.5 },
      { lng: 24.9750, lat: 59.5400, sogKnots: 16.0 },
      { lng: 24.9600, lat: 59.5000, sogKnots: 9.5 },
    ],
  },
  {
    mmsi: 276999888,
    name: "EVA-316 ICEBREAKER",
    shipType: 52,
    destination: "HUNDIPEA BASE",
    callSign: "ES316",
    defaultSog: 4.5,
    cycleOffsetSec: 50,
    waypoints: [
      { lng: 24.7340, lat: 59.4530, sogKnots: 0.0 },
      { lng: 24.7300, lat: 59.4570, sogKnots: 3.5 },
      { lng: 24.7450, lat: 59.4650, sogKnots: 5.0 },
      { lng: 24.7300, lat: 59.4570, sogKnots: 3.0 },
      { lng: 24.7340, lat: 59.4530, sogKnots: 0.0 },
    ],
  },
  {
    mmsi: 276009999,
    name: "PPA VAPPER 101",
    shipType: 52,
    destination: "GULF SECURITY PATROL",
    callSign: "ESVP",
    defaultSog: 16.5,
    cycleOffsetSec: 360,
    waypoints: [
      { lng: 24.7320, lat: 59.4540, sogKnots: 8.0 },
      { lng: 24.6800, lat: 59.4900, sogKnots: 16.0 },
      { lng: 24.5500, lat: 59.5400, sogKnots: 18.0 },
      { lng: 24.7200, lat: 59.5800, sogKnots: 17.0 },
      { lng: 24.8400, lat: 59.5200, sogKnots: 16.0 },
      { lng: 24.7600, lat: 59.4700, sogKnots: 14.0 },
    ],
  },
  {
    mmsi: 276002222,
    name: "PORT TUG CASTOR",
    shipType: 52,
    destination: "VANASADAM DOCK ASSIST",
    callSign: "ESTG1",
    defaultSog: 8.5,
    cycleOffsetSec: 70,
    waypoints: [
      { lng: 24.7600, lat: 59.4470, sogKnots: 4.0 },
      { lng: 24.7550, lat: 59.4560, sogKnots: 8.5 },
      { lng: 24.7680, lat: 59.4620, sogKnots: 9.0 },
      { lng: 24.7550, lat: 59.4560, sogKnots: 7.5 },
      { lng: 24.7600, lat: 59.4470, sogKnots: 3.5 },
    ],
  },
  {
    mmsi: 276002223,
    name: "PORT TUG POLLUX",
    shipType: 52,
    destination: "MUUGA TUG STATION",
    callSign: "ESTG2",
    defaultSog: 9.0,
    cycleOffsetSec: 190,
    waypoints: [
      { lng: 24.9600, lat: 59.4970, sogKnots: 3.5 },
      { lng: 24.9700, lat: 59.5200, sogKnots: 9.0 },
      { lng: 24.9800, lat: 59.5450, sogKnots: 9.5 },
      { lng: 24.9700, lat: 59.5200, sogKnots: 8.0 },
      { lng: 24.9600, lat: 59.4970, sogKnots: 3.0 },
    ],
  },

  // --- YACHTS, SPEEDBOATS & MARINA CRAFT ---
  {
    mmsi: 276112233,
    name: "VIIMSI SPIRIT",
    shipType: 36,
    destination: "PIRITA MARINA",
    callSign: "ESVS",
    defaultSog: 12.0,
    cycleOffsetSec: 200,
    waypoints: [
      { lng: 24.8260, lat: 59.4670, sogKnots: 5.0 },
      { lng: 24.8050, lat: 59.4800, sogKnots: 12.5 },
      { lng: 24.7650, lat: 59.4750, sogKnots: 13.0 },
      { lng: 24.7900, lat: 59.4620, sogKnots: 10.0 },
    ],
  },
  {
    mmsi: 276112234,
    name: "PIRITA WIND",
    shipType: 36,
    destination: "TALLINN BAY REGATTA",
    callSign: "ESPW",
    defaultSog: 10.5,
    cycleOffsetSec: 440,
    waypoints: [
      { lng: 24.8220, lat: 59.4700, sogKnots: 7.0 },
      { lng: 24.7900, lat: 59.4950, sogKnots: 11.5 },
      { lng: 24.7400, lat: 59.4900, sogKnots: 12.0 },
      { lng: 24.7800, lat: 59.4750, sogKnots: 10.0 },
      { lng: 24.8220, lat: 59.4700, sogKnots: 6.5 },
    ],
  },
  {
    mmsi: 276112235,
    name: "NOBLESSNER STAR",
    shipType: 36,
    destination: "NOBLESSNER MARINA",
    callSign: "ESNS",
    defaultSog: 9.5,
    cycleOffsetSec: 310,
    waypoints: [
      { lng: 24.7380, lat: 59.4520, sogKnots: 4.0 },
      { lng: 24.7300, lat: 59.4680, sogKnots: 10.0 },
      { lng: 24.7100, lat: 59.4750, sogKnots: 11.0 },
      { lng: 24.7300, lat: 59.4680, sogKnots: 9.5 },
      { lng: 24.7380, lat: 59.4520, sogKnots: 3.5 },
    ],
  },
  {
    mmsi: 276112236,
    name: "HAVEN KAKUMAE CRUISER",
    shipType: 36,
    destination: "HAVEN KAKUMÄE",
    callSign: "ESHK",
    defaultSog: 14.0,
    cycleOffsetSec: 580,
    waypoints: [
      { lng: 24.5900, lat: 59.4530, sogKnots: 5.0 },
      { lng: 24.5800, lat: 59.4850, sogKnots: 14.5 },
      { lng: 24.6400, lat: 59.5100, sogKnots: 15.0 },
      { lng: 24.5800, lat: 59.4850, sogKnots: 13.5 },
      { lng: 24.5900, lat: 59.4530, sogKnots: 4.5 },
    ],
  },
];

export function calculateMaritimePosition(
  route: MaritimeRoute,
  timestampSec: number
): { lat: number; lng: number; sog: number; heading: number } {
  const waypoints = route.waypoints;
  if (waypoints.length < 2) {
    const wp = waypoints[0] || { lat: 59.45, lng: 24.75 };
    return { lat: wp.lat, lng: wp.lng, sog: 0, heading: 0 };
  }

  // Precompute segment distances and cumulative durations
  const segmentDurations: number[] = [];
  let totalDurationSec = 0;

  for (let i = 0; i < waypoints.length; i++) {
    const nextIdx = (i + 1) % waypoints.length;
    const wp1 = waypoints[i];
    const wp2 = waypoints[nextIdx];
    const distMeters = haversineDistanceMeters(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
    const speedKnots = wp1.sogKnots ?? route.defaultSog ?? 12;
    const speedMs = Math.max(0.5, speedKnots * 0.514444);
    const dur = distMeters / speedMs;
    segmentDurations.push(dur);
    totalDurationSec += dur;
  }

  if (totalDurationSec <= 0) totalDurationSec = 1;

  const effectiveTime = ((timestampSec + route.cycleOffsetSec) % totalDurationSec + totalDurationSec) % totalDurationSec;

  let accumulated = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const dur = segmentDurations[i];
    if (accumulated + dur >= effectiveTime || i === waypoints.length - 1) {
      const nextIdx = (i + 1) % waypoints.length;
      const wp1 = waypoints[i];
      const wp2 = waypoints[nextIdx];

      const segmentElapsed = effectiveTime - accumulated;
      const fraction = Math.min(1, Math.max(0, dur > 0 ? segmentElapsed / dur : 0));

      const lat = wp1.lat + fraction * (wp2.lat - wp1.lat);
      const lng = wp1.lng + fraction * (wp2.lng - wp1.lng);
      const heading = calculateBearingDeg(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
      const sog = Number((wp1.sogKnots ?? route.defaultSog).toFixed(1));

      return { lat, lng, sog, heading };
    }
    accumulated += dur;
  }

  const first = waypoints[0];
  return { lat: first.lat, lng: first.lng, sog: route.defaultSog, heading: 0 };
}

/**
 * Strict Coastline & Water Boundary Safeguard
 * Ensures no vessel coordinate accidentally falls on Tallinn metropolitan land.
 */
export function sanitizeVesselWaterPosition(lat: number, lng: number): { lat: number; lng: number } {
  let sanitizedLat = lat;
  let sanitizedLng = lng;

  // Central Tallinn port & Old Town buffer
  if (sanitizedLng >= 24.70 && sanitizedLng <= 24.80) {
    if (sanitizedLat < 59.4445) {
      sanitizedLat = 59.4450;
    }
  } else if (sanitizedLng >= 24.55 && sanitizedLng < 24.70) {
    // Western Tallinn (Kopli & Kakumäe bay)
    if (sanitizedLat < 59.4320) {
      sanitizedLat = 59.4350;
    }
  } else if (sanitizedLng > 24.80 && sanitizedLng <= 24.90) {
    // Eastern Tallinn (Pirita & Kadriorg coast)
    if (sanitizedLat < 59.4580) {
      sanitizedLat = 59.4620;
    }
  } else if (sanitizedLng > 24.90) {
    // Muuga Bay
    if (sanitizedLat < 59.4900) {
      sanitizedLat = 59.4930;
    }
  } else if (sanitizedLat < 59.4300) {
    sanitizedLat = 59.4400;
  }

  return { lat: sanitizedLat, lng: sanitizedLng };
}

// In-memory cache for live API responses to prevent Digitraffic 429 rate limit
let lastLiveFetchTime = 0;
let cachedLiveResponse: VesselResponse | null = null;
const LIVE_CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

export class VesselsService {
  async fetchLiveVessels(): Promise<VesselResponse> {
    const now = Date.now();
    if (cachedLiveResponse && now - lastLiveFetchTime < LIVE_CACHE_TTL_MS) {
      return cachedLiveResponse;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(DIGITRAFFIC_LOCATIONS_URL, {
        headers: { "Accept-Encoding": "gzip", "User-Agent": "NeuralCity-Tallinn/2.0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        throw new Error(`Digitraffic locations responded with ${res.status}`);
      }

      const geojson = (await res.json()) as {
        features?: Array<{
          mmsi: number;
          geometry: { coordinates: [number, number] };
          properties: {
            sog: number;
            cog: number;
            heading: number;
            navStat: number;
            timestampExternal: number;
          };
        }>;
      };

      const features = geojson.features ?? [];
      const mmsiList = features.map((f) => f.mmsi);

      if (features.length === 0) {
        return this.generateSimulatedVessels();
      }

      // Fetch metadata for un-cached vessels
      const missingMmsi = mmsiList.filter((mmsi) => {
        const cached = metadataCache.get(mmsi);
        return !cached || Date.now() - cached.updatedAt > CACHE_TTL_MS;
      });

      if (missingMmsi.length > 0) {
        try {
          const metaController = new AbortController();
          const metaTimeout = setTimeout(() => metaController.abort(), 2500);
          const metaRes = await fetch(DIGITRAFFIC_VESSELS_URL, {
            headers: { "Accept-Encoding": "gzip", "User-Agent": "NeuralCity-Tallinn/2.0" },
            signal: metaController.signal,
          }).finally(() => clearTimeout(metaTimeout));

          if (metaRes.ok) {
            const metaList = (await metaRes.json()) as Array<{
              mmsi: number;
              name?: string;
              shipType?: number;
              destination?: string;
              callSign?: string;
            }>;

            const nowMeta = Date.now();
            for (const item of metaList) {
              if (mmsiList.includes(item.mmsi)) {
                metadataCache.set(item.mmsi, {
                  name: item.name?.trim() || `VESSEL-${item.mmsi}`,
                  shipType: item.shipType || 0,
                  destination: item.destination?.trim() || "TALLINN",
                  callSign: item.callSign?.trim() || "",
                  updatedAt: nowMeta,
                });
              }
            }
          }
        } catch {
          // Ignore metadata fetch error, fallback gracefully
        }
      }

      const vessels: VesselData[] = features.map((f) => {
        const meta = metadataCache.get(f.mmsi);
        const shipType = meta?.shipType || 0;
        const rawLat = f.geometry.coordinates[1];
        const rawLng = f.geometry.coordinates[0];
        const { lat, lng } = sanitizeVesselWaterPosition(rawLat, rawLng);

        return {
          mmsi: f.mmsi,
          name: meta?.name || `VESSEL-${f.mmsi}`,
          shipType,
          shipCategory: getShipCategory(shipType),
          lat,
          lng,
          sog: f.properties.sog || 0,
          cog: f.properties.cog || 0,
          heading: f.properties.heading || f.properties.cog || 0,
          navStatus: f.properties.navStat || 0,
          destination: meta?.destination || "GULF OF FINLAND",
          callSign: meta?.callSign || "",
          timestamp: f.properties.timestampExternal || Date.now(),
        };
      });

      const response: VesselResponse = {
        status: "success",
        count: vessels.length,
        vessels,
        simulated: false,
      };

      lastLiveFetchTime = Date.now();
      cachedLiveResponse = response;
      return response;
    } catch {
      return this.generateSimulatedVessels();
    }
  }

  public generateSimulatedVessels(customTimestampSec?: number): VesselResponse {
    const timestampSec = customTimestampSec ?? Math.floor(Date.now() / 1000);

    const vessels: VesselData[] = SIMULATED_MARITIME_FLEET.map((route) => {
      const pos = calculateMaritimePosition(route, timestampSec);
      const safePos = sanitizeVesselWaterPosition(pos.lat, pos.lng);

      return {
        mmsi: route.mmsi,
        name: route.name,
        shipType: route.shipType,
        shipCategory: getShipCategory(route.shipType),
        lat: safePos.lat,
        lng: safePos.lng,
        sog: pos.sog,
        cog: pos.heading,
        heading: pos.heading,
        navStatus: pos.sog > 0.5 ? 0 : 1,
        destination: route.destination,
        callSign: route.callSign || `ES${route.mmsi.toString().slice(-4)}`,
        timestamp: Date.now(),
      };
    });

    return {
      status: "success",
      count: vessels.length,
      vessels,
      simulated: true,
    };
  }
}

export const vesselsService = new VesselsService();

