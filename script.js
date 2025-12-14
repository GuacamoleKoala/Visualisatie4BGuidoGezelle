const map = L.map('map').setView([50.85, 4.35], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Maak een clustergroep aan voor de punten
const markers = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});

fetch('network_data_filtered.geojson')
    .then(res => res.json())
    .then(data => {
        const geoLayer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                const marker = L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: feature.properties.type === 'Person' ? '#E91E63' : '#3388ff',
                    color: "#000",
                    weight: 1,
                    fillOpacity: 0.8
                });
                marker.bindPopup(`<b>${feature.properties.label}</b>`);
                // Voeg marker toe aan de clustergroep in plaats van direct aan de kaart
                markers.addLayer(marker);
                return null; // Voorkom dat Leaflet het dubbel tekent
            },
            style: (feature) => {
                if (feature.geometry.type === 'LineString') {
                    return { color: '#555', weight: 1.5, opacity: 0.5 };
                }
            }
        });

        map.addLayer(markers); // Voeg de clusters toe
        geoLayer.addTo(map);   // Voeg de lijnen toe
        map.fitBounds(markers.getBounds());
    });
