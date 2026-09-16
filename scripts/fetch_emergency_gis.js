const fs = require('fs');
const path = require('path');

// L-EST97 (EPSG:3301) to WGS84 (EPSG:4326) converter
function lest97ToWgs84(north, east) {
  const a = 6378137.0;
  const rf = 298.257222101;
  const f = 1.0 / rf;
  const b = a * (1.0 - f);
  const e = Math.sqrt((a * a - b * b) / (a * a));
  const lat1 = (59.333333333333336 * Math.PI) / 180.0;
  const lat2 = (58.0 * Math.PI) / 180.0;
  const lat0 = (57.51755393055556 * Math.PI) / 180.0;
  const lon0 = (24.0 * Math.PI) / 180.0;
  const x0 = 500000.0;
  const y0 = 6375000.0;

  const m1 = Math.cos(lat1) / Math.sqrt(1.0 - e * e * Math.sin(lat1) * Math.sin(lat1));
  const m2 = Math.cos(lat2) / Math.sqrt(1.0 - e * e * Math.sin(lat2) * Math.sin(lat2));

  const t1 = Math.tan(Math.PI / 4.0 - lat1 / 2.0) / Math.pow((1.0 - e * Math.sin(lat1)) / (1.0 + e * Math.sin(lat1)), e / 2.0);
  const t2 = Math.tan(Math.PI / 4.0 - lat2 / 2.0) / Math.pow((1.0 - e * Math.sin(lat2)) / (1.0 + e * Math.sin(lat2)), e / 2.0);
  const t0 = Math.tan(Math.PI / 4.0 - lat0 / 2.0) / Math.pow((1.0 - e * Math.sin(lat0)) / (1.0 + e * Math.sin(lat0)), e / 2.0);

  const n = Math.log(m1 / m2) / Math.log(t1 / t2);
  const F = m1 / (n * Math.pow(t1, n));
  const rho0 = a * F * Math.pow(t0, n);

  const x = east - x0;
  const y = north - y0;
  const rho = Math.hypot(x, rho0 - y);
  const theta = Math.atan2(x, rho0 - y);

  const t = Math.pow(rho / (a * F), 1.0 / n);

  let lat = Math.PI / 2.0 - 2.0 * Math.atan(t);
  for (let i = 0; i < 5; i++) {
    const sinLat = Math.sin(lat);
    lat = Math.PI / 2.0 - 2.0 * Math.atan(t * Math.pow((1.0 - e * sinLat) / (1.0 + e * sinLat), e / 2.0));
  }

  const lon = theta / n + lon0;

  return {
    lat: Number((lat * 180.0 / Math.PI).toFixed(6)),
    lng: Number((lon * 180.0 / Math.PI).toFixed(6)),
  };
}

async function fetchTallinnArcGIS() {
  console.log("Fetching Tallinn Päästeamet ArcGIS REST endpoints...");
  const results = {
    shelters: [],
    hazardousSites: [],
    hazardZones: []
  };

  // Layer 2: Public Shelters
  try {
    const url = "https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer/2/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";
    const res = await fetch(url);
    const geojson = await res.json();
    if (geojson.features) {
      results.shelters = geojson.features.map(f => ({
        id: `shelter-${f.properties.objectid || f.properties.id}`,
        name: f.properties.nimi || "Avalik varjumiskoht",
        type: "shelter",
        category: "Avalik varjumiskoht (Päästeamet)",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        address: f.properties.aadress || "",
        source: "Tallinn GIS / Päästeamet (ArcGIS REST)",
        sourceUrl: "https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer/2"
      }));
    }
  } catch (e) {
    console.error("Error fetching ArcGIS layer 2:", e.message);
  }

  // Layer 0: Hazardous Sites
  try {
    const url = "https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";
    const res = await fetch(url);
    const geojson = await res.json();
    if (geojson.features) {
      results.hazardousSites = geojson.features.map(f => ({
        id: `hazard-${f.properties.objectid}`,
        name: f.properties.nimi || f.properties.ettevoti || "Ohtlik ettevõte",
        type: "hazard_site",
        category: "Ohtlik ettevõte (Päästeamet)",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        address: f.properties.aadress || "",
        riskCategory: f.properties.ohukategooria || f.properties.kategooria || "Industrial Risk",
        source: "Tallinn GIS / Päästeamet (ArcGIS REST)",
        sourceUrl: "https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer/0"
      }));
    }
  } catch (e) {
    console.error("Error fetching ArcGIS layer 0:", e.message);
  }

  return results;
}

async function fetchMaruAksPOI() {
  console.log("Fetching Maa- ja Ruumiamet (MaRu) AKS POI WFS emergency services...");
  const emergencyServices = [];
  let startIndex = 0;
  const count = 1000;
  let hasMore = true;

  while (hasMore && startIndex < 10000) {
    const url = `https://aks.geoportaal.ee/aks-ogc?service=WFS&version=2.0.0&request=GetFeature&typeName=aks:ads_poi&count=${count}&startIndex=${startIndex}`;
    const res = await fetch(url);
    const xml = await res.text();

    const members = xml.split("<wfs:member>");
    if (members.length <= 1) {
      hasMore = false;
      break;
    }

    for (const member of members.slice(1)) {
      const poiIdMatch = member.match(/<aks:poi_id>(.*?)<\/aks:poi_id>/);
      const nameMatch = member.match(/<aks:avalik_nimi>(.*?)<\/aks:avalik_nimi>/);
      const groupMatch = member.match(/<aks:avalik_tyyp_grupp>(.*?)<\/aks:avalik_tyyp_grupp>/);
      const subGroupMatch = member.match(/<aks:avalik_tyyp_alamgrupp>(.*?)<\/aks:avalik_tyyp_alamgrupp>/);
      const addressMatch = member.match(/<aks:avalik_taisaadress>(.*?)<\/aks:avalik_taisaadress>/);
      const posMatch = member.match(/<gml:pos>(.*?)<\/gml:pos>/);

      const name = nameMatch ? nameMatch[1].trim() : "";
      const group = groupMatch ? groupMatch[1].trim() : "";
      const subGroup = subGroupMatch ? subGroupMatch[1].trim() : "";
      const address = addressMatch ? addressMatch[1].trim() : "";
      const pos = posMatch ? posMatch[1].trim().split(" ") : null;

      if (!name || !pos || pos.length < 2) continue;

      const north = parseFloat(pos[0]);
      const east = parseFloat(pos[1]);
      const coords = lest97ToWgs84(north, east);

      // Filter for emergency services, hospitals, clinics, police, fire, shelters, rescue
      let mappedType = null;
      const combinedText = `${name} ${group} ${subGroup}`.toLowerCase();
      if (/kliinik|polikliinik|tervisekeskus|perearst|meditsiin|kiirabi|clinic/i.test(combinedText)) {
        mappedType = "clinic";
      } else if (group === "haigla" || /haigla|hospital/i.test(combinedText)) {
        mappedType = "hospital";
      } else if (group === "PPA" || /politsei|PPA/i.test(combinedText)) {
        mappedType = "police";
      } else if (group === "pääste" || /päästekomando|tuletõrje|pääste/i.test(combinedText)) {
        mappedType = "fire_station";
      } else if (subGroup === "avalik varjumiskoht" || /varjumiskoht/i.test(combinedText)) {
        mappedType = "shelter";
      }

      if (mappedType) {
        emergencyServices.push({
          id: `maru-poi-${poiIdMatch ? poiIdMatch[1] : Math.random().toString(36).substr(2, 9)}`,
          name,
          shortName: name.length > 30 ? name.slice(0, 27) + "..." : name,
          type: mappedType,
          category: `${group} (${subGroup || "üldine"})`,
          lat: coords.lat,
          lng: coords.lng,
          address,
          city: address.includes("Tallinn") ? "Tallinn" : "Estonia",
          source: "Maa- ja Ruumiamet (MaRu) AKS POI WFS",
          sourceUrl: "https://aks.geoportaal.ee/aks-ogc"
        });
      }
    }

    startIndex += count;
  }

  return emergencyServices;
}

async function main() {
  console.log("=== Extraction of Emergency Services Data from State GIS ===");
  const tallinnData = await fetchTallinnArcGIS();
  const maruPoiData = await fetchMaruAksPOI();

  console.log(`ArcGIS Shelters: ${tallinnData.shelters.length}`);
  console.log(`ArcGIS Hazardous Sites: ${tallinnData.hazardousSites.length}`);
  console.log(`MaRu AKS Emergency POIs: ${maruPoiData.length}`);

  // Combine and deduplicate
  const allServices = [...maruPoiData, ...tallinnData.shelters, ...tallinnData.hazardousSites];

  const outputDir = path.join(__dirname, '../app/public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save GeoJSON
  const geojson = {
    type: "FeatureCollection",
    metadata: {
      title: "Estonian Official Emergency & Crisis Services Data",
      updatedAt: new Date().toISOString(),
      sources: [
        "Maa- ja Ruumiamet (MaRu) ETAK WFS (https://gsavalik.envir.ee/geoserver/etak/wfs)",
        "Maa- ja Ruumiamet AKS POI OGC (https://aks.geoportaal.ee/aks-ogc)",
        "Tallinn GIS / Päästeamet ArcGIS REST (https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer)"
      ]
    },
    features: allServices.map(s => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.lng, s.lat]
      },
      properties: s
    }))
  };

  fs.writeFileSync(path.join(outputDir, 'official_emergency_services.json'), JSON.stringify(allServices, null, 2));
  fs.writeFileSync(path.join(outputDir, 'tallinn_services.geojson'), JSON.stringify(geojson, null, 2));

  console.log(`Successfully saved ${allServices.length} objects to official_emergency_services.json and tallinn_services.geojson`);
}

main().catch(err => console.error(err));
