import "./lib/external/maplibre-gl/maplibre-gl.js";

const style = {
  version: 8,
  sources: {
    "osm-german-style": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.de/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "Kartendaten von OpenStreetMap",
    },
  },
  layers: [
    {
      id: "osm-german-style-layer",
      type: "raster",
      source: "osm-german-style",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const boundsGermany = [
  [5, 47],
  [16, 56],
];

const map = new maplibregl.Map({
  container: "map",
  bounds: boundsGermany,
  style: style,
  maplibreLogo: false,
  dragRotate: false,
  touchZoomRotate: false,
  attributionControl: {
    compact: false,
  },
});

map.addControl(new maplibregl.ScaleControl({}));

// geolocate start
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
    timeout: 6000,
  },
  showUserLocation: false,
  showAccuracyCircle: false,
});

map.addControl(geolocate, "top-left");

geolocate.on("error", (e) => {
  console.error("Fehler bei Standortermittlung:", e);
});

map.on("load", () => {
  const geolocateBtn = document.querySelector(".maplibregl-ctrl-geolocate");
  if (geolocateBtn) {
    geolocateBtn.title = "Wo bin ich?";
  }
  // geolocate.trigger(); // Zeigt Karte beim ersten Aufruf an aktueller Position an, wenn erlaubt.
});

geolocate.on("geolocate", (e) => {
  const { latitude, longitude } = e.coords;
  //const { latitude, longitude, accuracy } = e.coords;
  const SmallID = "temp-circle-small";

  /*
  // Würde einen größeren Kreis zeigen, der die Genauigkeit anzeigt.
  const AccuracyID = "temp-circle-accuracy";
  const limitedAccuracy = Math.min(accuracy, 1000);

  const accuracyCircleGeoJSON = createCircle(
    [longitude, latitude],
    limitedAccuracy,
  );
  if (map.getSource(AccuracyID)) map.removeSource(AccuracyID);
  map.addSource(AccuracyID, {
    type: "geojson",
    data: accuracyCircleGeoJSON,
  });
  if (map.getLayer(AccuracyID)) map.removeLayer(AccuracyID);
  map.addLayer({
    id: AccuracyID,
    type: "fill",
    source: AccuracyID,
    paint: {
      "fill-color": "#7ebc6f",
      "fill-opacity": 0.5,
    },
  });
  setTimeout(() => {
    if (map.getLayer(AccuracyID)) map.removeLayer(AccuracyID);
    if (map.getSource(AccuracyID)) map.removeSource(AccuracyID);
  }, 10000);
*/
  const smallCircleGeoJSON = createCircle([longitude, latitude], 20);

  if (map.getSource(SmallID)) map.removeSource(SmallID);
  map.addSource(SmallID, {
    type: "geojson",
    data: smallCircleGeoJSON,
  });

  if (map.getLayer(SmallID)) map.removeLayer(SmallID);
  map.addLayer({
    id: SmallID,
    type: "fill",
    source: SmallID,
    paint: {
      "fill-color": "#7ebc6f",
      "fill-opacity": 1.0,
    },
  });
  map.addLayer({
    id: `${SmallID}_outline`,
    type: "line",
    source: SmallID,
    paint: {
      "line-color": "#ffffff",
      "line-width": 2.5,
    },
  });

  map.flyTo({ center: [longitude, latitude], zoom: 14 });

  setTimeout(() => {
    if (map.getLayer(SmallID)) map.removeLayer(SmallID);
    if (map.getLayer(`${SmallID}_outline`)) map.removeLayer(`${SmallID}_outline`);
    if (map.getSource(SmallID)) map.removeSource(SmallID);
  }, 15000);

  // start popup
  const popupContent = `
  <div role="region" aria-label="Standortdaten">
    <strong>Standort:</strong><br>
    Lat: ${latitude.toFixed(5)}<br>
    Lng: ${longitude.toFixed(5)}<br>
    Genauigkeit: ±${Math.round(accuracy)} m
  </div>
`;

  const locationPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "location-popup",
  })
    .setLngLat([longitude, latitude])
    .setHTML(popupContent)
    .addTo(map);

  setTimeout(() => {
    locationPopup.remove();
  }, 15000);
  // end popup
});

// Kreis um Koordinate
function createCircle(center, radiusInMeters, points = 64) {
  const coords = [];
  const earth = 6371000; // Erdradius in m
  const lat = (center[1] * Math.PI) / 180;
  const lon = (center[0] * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusInMeters * Math.cos(angle);
    const dy = radiusInMeters * Math.sin(angle);

    const latOffset = dy / earth;
    const lonOffset = dx / (earth * Math.cos(lat));

    const pointLat = ((lat + latOffset) * 180) / Math.PI;
    const pointLon = ((lon + lonOffset) * 180) / Math.PI;

    coords.push([pointLon, pointLat]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}
// geolocate end
