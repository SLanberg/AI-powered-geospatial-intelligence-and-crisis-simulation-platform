import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Demo timeline anchor: crisis starts at 07:15 on a winter morning
// All timestamps are relative to this base.
// ---------------------------------------------------------------------------
const BASE = new Date('2024-01-15T07:15:00+02:00');
const t = (offsetMinutes: number): Date =>
  new Date(BASE.getTime() + offsetMinutes * 60 * 1000);

async function main() {
  console.log('🗑  Clearing existing data...');
  await prisma.instruction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.infrastructure.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // -------------------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------------------
  console.log('👤 Seeding users...');

  const maret = await prisma.user.create({
    data: {
      email: 'maret.tamm@tallinn.ee',
      name: 'Maret Tamm',
      role: 'OFFICIAL',
    },
  });

  const aleksei = await prisma.user.create({
    data: {
      email: 'aleksei.petrov@citysignal.local',
      name: 'Aleksei Petrov',
      role: 'CITIZEN',
    },
  });

  const natalja = await prisma.user.create({
    data: {
      email: 'natalja.sorokina@citysignal.local',
      name: 'Natalja Sorokina',
      role: 'CITIZEN',
    },
  });

  const dmitri = await prisma.user.create({
    data: {
      email: 'dmitri.volkov@citysignal.local',
      name: 'Dmitri Volkov',
      role: 'CITIZEN',
    },
  });

  const botFarm = await prisma.user.create({
    data: {
      email: 'bot-farm-01@citysignal.local',
      name: 'Bot-Farm-01',
      role: 'CITIZEN',
    },
  });

  // -------------------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------------------
  console.log('⚡ Seeding events...');

  await prisma.event.createMany({
    data: [
      {
        type: 'STORM',
        title: 'Storm Helgi — Lasnamäe power grid disruption',
        description:
          'Severe winter storm with 28 m/s wind gusts struck north Tallinn. Downed power lines reported across Lasnamäe and Pirita districts. Grid frequency drop detected at 06:28.',
        districtId: 'lasnamae',
        severity: 'HIGH',
        startedAt: t(-45), // 06:30
      },
      {
        type: 'POWER_OUTAGE',
        title: 'Lasnamäe substation trip — full district blackout',
        description:
          'Coordinated grid failure: storm damage combined with a suspected cyberattack on SCADA systems caused the Lasnamäe 110 kV substation to trip. Approx 42,000 residents without power. Mobile base stations on backup batteries.',
        districtId: 'lasnamae',
        severity: 'CRITICAL',
        startedAt: t(0), // 07:15
      },
    ],
  });

  // -------------------------------------------------------------------------
  // INFRASTRUCTURE
  // -------------------------------------------------------------------------
  console.log('🏗  Seeding infrastructure...');

  await prisma.infrastructure.createMany({
    data: [
      // --- Shelters ---
      {
        type: 'SHELTER',
        name: 'Laagna Civic Centre',
        address: 'Laagna tee 17, Lasnamäe',
        lat: 59.428,
        lng: 24.835,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Capacity 350. Generator on site. Warm food available.',
      },
      {
        type: 'SHELTER',
        name: 'Punane Kool (Punane School)',
        address: 'Punane 40, Lasnamäe',
        lat: 59.431,
        lng: 24.829,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Capacity 200. Ground floor accessible.',
      },
      {
        type: 'SHELTER',
        name: 'Mustakivi Culture Centre',
        address: 'Mustakivi tee 19, Lasnamäe',
        lat: 59.42,
        lng: 24.842,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Capacity 500. Large hall, backup lighting.',
      },

      // --- Water points ---
      {
        type: 'WATER_POINT',
        name: 'Lasnamäe Water Distribution Point',
        address: 'Pallasti 28, Lasnamäe',
        lat: 59.4268,
        lng: 24.831,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Tallinn Vesi tanker. 2000L capacity. Refills every 4h.',
      },
      {
        type: 'WATER_POINT',
        name: 'Peterburi Tee Standpipe',
        address: 'Peterburi tee 60, Lasnamäe',
        lat: 59.419,
        lng: 24.826,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Street-level gravity-fed standpipe. No pump required.',
      },
      {
        type: 'WATER_POINT',
        name: 'Punane Fire Station Reserve Tank',
        address: 'Punane 62, Lasnamäe',
        lat: 59.432,
        lng: 24.839,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Rescue Board coordination required for access.',
      },
      {
        type: 'WATER_POINT',
        name: 'Laagna Park Standpipe',
        address: 'Laagna tee 5, Lasnamäe',
        lat: 59.425,
        lng: 24.83,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Gravity fed. Open 07:00–20:00.',
      },

      // --- Pharmacies ---
      {
        type: 'PHARMACY',
        name: 'Apotheka Mustakivi',
        address: 'Mustakivi tee 21, Lasnamäe',
        lat: 59.4198,
        lng: 24.843,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Open. UPS backup for refrigerated medicines.',
      },
      {
        type: 'PHARMACY',
        name: 'Benu Apteek Laagna',
        address: 'Laagna tee 11, Lasnamäe',
        lat: 59.427,
        lng: 24.8347,
        districtId: 'lasnamae',
        status: 'OFFLINE',
        notes: 'Closed — power outage, no backup. POS terminal down.',
      },
      {
        type: 'PHARMACY',
        name: 'Euroapteek Ülemiste',
        address: 'Peterburi tee 42, Lasnamäe',
        lat: 59.4205,
        lng: 24.824,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Open. Limited stock of insulin pens — contact ahead.',
      },

      // --- Mobile base stations ---
      // Battery life degrades over ~3h after power out (07:15 + 3h = ~10:15)
      // Demo is set ~80 min in: Punane already OFFLINE, Laagna/Mustakivi DEGRADED
      {
        type: 'BASE_STATION',
        name: 'Telia LTE — Laagna tee',
        address: 'Laagna tee 30, Lasnamäe',
        lat: 59.429,
        lng: 24.837,
        districtId: 'lasnamae',
        status: 'DEGRADED',
        notes: 'On battery backup. Est. 3.5h remaining. Capacity at 60%.',
      },
      {
        type: 'BASE_STATION',
        name: 'Elisa 5G — Mustakivi',
        address: 'Mustakivi tee 50, Lasnamäe',
        lat: 59.4195,
        lng: 24.845,
        districtId: 'lasnamae',
        status: 'DEGRADED',
        notes: 'On battery backup. Est. 2.1h remaining. Capacity at 40%.',
      },
      {
        type: 'BASE_STATION',
        name: 'Tele2 LTE — Punane',
        address: 'Punane 55, Lasnamäe',
        lat: 59.4315,
        lng: 24.84,
        districtId: 'lasnamae',
        status: 'OFFLINE',
        notes: 'Battery exhausted. Station dark. Punane sector no coverage.',
      },
      {
        type: 'BASE_STATION',
        name: 'Elisa LTE — Peterburi tee',
        address: 'Peterburi tee 58, Lasnamäe',
        lat: 59.4188,
        lng: 24.825,
        districtId: 'lasnamae',
        status: 'OPERATIONAL',
        notes: 'Fibre-backhauled. No disruption. Serving southern sector.',
      },

      // --- Substation ---
      {
        type: 'SUBSTATION',
        name: 'Lasnamäe 110 kV Substation',
        address: 'Peterburi tee 101, Lasnamäe',
        lat: 59.4245,
        lng: 24.855,
        districtId: 'lasnamae',
        status: 'OFFLINE',
        notes: 'Tripped at 07:15. Elering repair crew ETA 4–6h. SCADA under investigation.',
      },
    ],
  });

  // -------------------------------------------------------------------------
  // SIGNALS  (aggregated — derived from the report clusters below)
  // -------------------------------------------------------------------------
  console.log('📡 Seeding signals...');

  const sigNoWater = await prisma.signal.create({
    data: {
      title: 'No water — Punane / Laagna sector',
      description:
        '12 reports of no tap water across Punane and Laagna tee area. Consistent with electric booster pump failure following power outage. High spatial density, high confidence.',
      status: 'OPEN',
      latitude: 59.431,
      longitude: 24.833,
      districtId: 'lasnamae',
      reportCount: 12,
      confidence: 0.91,
      authorId: maret.id,
    },
  });

  const sigPharma = await prisma.signal.create({
    data: {
      title: 'Pharmacy closed — Benu Laagna tee 11',
      description:
        '8 reports of Benu Apteek being closed and locked. Corroborates infrastructure status (OFFLINE). Residents seeking insulin and prescription medication.',
      status: 'OPEN',
      latitude: 59.427,
      longitude: 24.8347,
      districtId: 'lasnamae',
      reportCount: 8,
      confidence: 0.94,
      authorId: maret.id,
    },
  });

  const sigRoad = await prisma.signal.create({
    data: {
      title: 'Road blocked — Peterburi / Laagna junction',
      description:
        '5 reports of a fallen tree blocking Peterburi tee at the Laagna intersection. Emergency vehicle route affected.',
      status: 'OPEN',
      latitude: 59.426,
      longitude: 24.8285,
      districtId: 'lasnamae',
      reportCount: 5,
      confidence: 0.9,
      authorId: maret.id,
    },
  });

  // Low-confidence / flagged — does NOT become a real signal
  const sigFake = await prisma.signal.create({
    data: {
      title: 'Water contamination reports (LOW CONFIDENCE — FLAGGED)',
      description:
        '5 reports of water contamination from a single account, burst within 2 minutes, identical coordinates. Confidence 0.18. Likely coordinated disinformation. Not actioned.',
      status: 'FLAGGED',
      latitude: 59.4268,
      longitude: 24.831,
      districtId: 'lasnamae',
      reportCount: 5,
      confidence: 0.18,
      authorId: maret.id,
    },
  });

  // -------------------------------------------------------------------------
  // REPORTS — 30 citizen reports across 4 clusters
  // -------------------------------------------------------------------------
  console.log('📝 Seeding reports...');

  // Helper: small random offset so pins don't overlap exactly on the map
  const jitter = (): number => (Math.random() - 0.5) * 0.002;

  // --- Cluster 1: No water (12 reports) ---
  const noWaterDescriptions = [
    'Kraanivesi ei tule. 4. korrus.',
    'No water since 7am. Block 45, floor 6.',
    'Vett pole. Lapsed peavad kooli minema.',
    'No water in the whole building. 3rd floor.',
    'Вода не идёт уже час. Этаж 7.',
    'Краны сухие. Блок 47.',
    'Vett pole terves majas juba tund aega.',
    'Нет воды. Дети есть хотят.',
    'No running water. Called Tallinn Vesi, no answer.',
    'Vesi läks ära umbes 7:20. Korrus 5.',
    'Water pump not working. Upper floors dry.',
    'Вода пропала рано утром.',
  ];

  for (let i = 0; i < 12; i++) {
    const offsetMin = 5 + i * 4; // reports arrive 07:20 to 08:04
    await prisma.report.create({
      data: {
        type: 'NO_WATER',
        description: noWaterDescriptions[i],
        lat: 59.431 + jitter(),
        lng: 24.833 + jitter(),
        districtId: 'lasnamae',
        authorId: i % 3 === 0 ? aleksei.id : i % 3 === 1 ? natalja.id : dmitri.id,
        confidence: 0.85 + Math.random() * 0.12,
        flagged: false,
        queuedAt: t(offsetMin),
        receivedAt: t(offsetMin + 1),
        status: 'GRADED',
        signalId: sigNoWater.id,
      },
    });
  }

  // --- Cluster 2: Pharmacy closed (8 reports) ---
  const pharmacyDescriptions = [
    'Benu on kinni, uks lukus.',
    'Pharmacy locked. Need insulin.',
    'Apteeк закрыт. Нужны лекарства.',
    'Benu Laagna kinni. Mõlemad uksed lukus.',
    'Pharmacie fermée. Diabétique sans insuline.',
    'Apteek suletud. Vana inimene vajab ravimeid.',
    'Аптека закрыта. Пожилая соседка без лекарств.',
    'Benu closed, no sign on door.',
  ];

  for (let i = 0; i < 8; i++) {
    const offsetMin = 8 + i * 5; // reports arrive 07:23 to 07:58
    await prisma.report.create({
      data: {
        type: 'PHARMACY_CLOSED',
        description: pharmacyDescriptions[i],
        lat: 59.427 + jitter(),
        lng: 24.8347 + jitter(),
        districtId: 'lasnamae',
        authorId: i % 2 === 0 ? natalja.id : dmitri.id,
        confidence: 0.88 + Math.random() * 0.1,
        flagged: false,
        queuedAt: t(offsetMin),
        receivedAt: t(offsetMin + 1),
        status: 'GRADED',
        signalId: sigPharma.id,
      },
    });
  }

  // --- Cluster 3: Road blocked (5 reports) ---
  const roadDescriptions = [
    'Puu teel. Autod ei pääse läbi. Peterburi / Laagna.',
    'Tree down blocking road. Cars stuck.',
    'Дерево упало на дорогу. Peterburi tee.',
    'Road blocked at junction. Emergency vehicles can\'t pass.',
    'Puu kukkunud. Kiirabi ei saa läbi.',
  ];

  for (let i = 0; i < 5; i++) {
    const offsetMin = 10 + i * 6; // reports arrive 07:25 to 07:49
    await prisma.report.create({
      data: {
        type: 'ROAD_BLOCKED',
        description: roadDescriptions[i],
        lat: 59.426 + jitter(),
        lng: 24.8285 + jitter(),
        districtId: 'lasnamae',
        authorId: i % 2 === 0 ? aleksei.id : dmitri.id,
        confidence: 0.87 + Math.random() * 0.1,
        flagged: false,
        queuedAt: t(offsetMin),
        receivedAt: t(offsetMin + 1),
        status: 'GRADED',
        signalId: sigRoad.id,
      },
    });
  }

  // --- Cluster 4: Fake water contamination (5 reports, same author, burst) ---
  for (let i = 0; i < 5; i++) {
    const offsetMin = 55 + i * 0.4; // all within 2 minutes = coordinated burst
    await prisma.report.create({
      data: {
        type: 'WATER_CONTAMINATED',
        description: 'Vesi on mürgitatud! Ärge jooge! / Вода отравлена! Не пейте!',
        lat: 59.4268, // identical coords — red flag for engine
        lng: 24.831,
        districtId: 'lasnamae',
        authorId: botFarm.id,
        confidence: 0.18,
        flagged: true,
        queuedAt: t(offsetMin),
        receivedAt: t(offsetMin + 0.1),
        status: 'RECEIVED', // never GRADED
        signalId: sigFake.id,
      },
    });
  }

  // --- BEAT 3 & 5: The live queued report (offline mode demo) ---
  // receivedAt is null — network was down when Aleksei submitted it.
  // During the demo, this row gets its receivedAt set and status → RECEIVED.
  await prisma.report.create({
    data: {
      id: 'DEMO-QUEUED-REPORT', // fixed ID so the demo script can target it
      type: 'NO_WATER',
      description: 'Still no water on floor 8. Sent offline — queued on phone.',
      lat: 59.4305,
      lng: 24.8375,
      districtId: 'lasnamae',
      authorId: aleksei.id,
      confidence: 0.87,
      flagged: false,
      queuedAt: t(77), // 08:32 — sent during network blackout
      receivedAt: null,  // null until network returns
      status: 'QUEUED',
      signalId: null,
    },
  });

  // -------------------------------------------------------------------------
  // INSTRUCTION (issued after network returns — beat 6)
  // -------------------------------------------------------------------------
  console.log('📢 Seeding instruction...');

  await prisma.instruction.create({
    data: {
      title: 'Water distribution point open — Laagna Civic Centre',
      body:
        'Vee väljastuspunkt on avatud Laagna tee 17 (Laagna Civic Centre). Palun suunduge sinna koos anumatega. Maht 2000L, täiendatakse iga 4 tunni tagant.\n\nWater distribution point is open at Laagna tee 17 (Laagna Civic Centre). Please bring containers. 2000L capacity, refilled every 4 hours.\n\nПункт выдачи воды открыт по адресу Laagna tee 17 (Laagna Civic Centre). Приходите с ёмкостями. Объём 2000Л, пополняется каждые 4 часа.',
      districtId: 'lasnamae',
      geoFenceLat: 59.428,
      geoFenceLng: 24.835,
      geoFenceRadiusKm: 1.5,
      issuedAt: t(100), // 08:55
      issuedById: maret.id,
      confirmations: 7,
      status: 'ACKNOWLEDGED',
    },
  });

  console.log('✅ Seed complete.');
  console.log('');
  console.log('Summary:');
  console.log('  Users:          5  (1 official, 3 citizens, 1 bot)');
  console.log('  Events:         2  (storm + power outage)');
  console.log('  Infrastructure: 14 (3 shelters, 4 water, 3 pharmacy, 4 base stations, 1 substation)');
  console.log('  Signals:        4  (3 real + 1 flagged)');
  console.log('  Reports:        31 (12 no-water + 8 pharma + 5 road + 5 fake + 1 queued)');
  console.log('  Instructions:   1  (targeted water-point broadcast)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
