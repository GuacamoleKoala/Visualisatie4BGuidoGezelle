// Variabelen voor de kaart en data
const map = L.map('map').setView([50.85, 4.35], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = L.markerClusterGroup({ 
    spiderfyOnMaxZoom: true, 
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});

let fullGeoJsonData = null; 
let geoJsonLayer = null;    

// Definieer de kleuren voor de legenda
const nodeColors = {
    'Person': '#E91E63', 
    'City': '#3388ff',   
};

// NIEUWE FUNCTIE: Bepaalt het Type voor consistentie, kleur en filtering
function getNodeType(originalType) {
    if (originalType === 'Person') {
        return 'Person';
    }
    // Alle andere types (Location, Town, City, etc.) worden behandeld als 'City' (Plaats)
    return 'City';
}

// --- FUNCTIES VOOR INTERACTIE ---

function generateNodePopupHtml(props) {
    // Deze functie blijft identiek, de logica zit in het Python script en de filtering
    let popupHtml = `<div class="node-popup">
        <h3>${props.label}</h3>
        <p><b>Type:</b> ${getNodeType(props.type)}</p>
        <hr>
        <b>Relaties (${props.relations ? props.relations.length : 0}):</b><br>
        <ul style="max-height: 150px; overflow-y: auto; padding-left: 20px;">`;

    const sortedRelations = props.relations ? props.relations.sort((a, b) => a.dir.localeCompare(b.dir)) : [];

    if (sortedRelations.length > 0) {
        sortedRelations.forEach(rel => {
            const directionText = rel.dir === "naar" ? 'gaat naar' : 'komt van';
            const icon = rel.dir === "naar" ? '<i class="fas fa-arrow-right"></i>' : '<i class="fas fa-arrow-left"></i>';
            popupHtml += `<li>${icon} <i>${rel.rel}</i> ${directionText} <b>${rel.target}</b></li>`;
        });
    } else {
        popupHtml += "<li>Geen directe relaties gevonden.</li>";
    }
    popupHtml += `</ul></div>`;
    return popupHtml;
}

function generateLinePopupHtml(props) {
     return `
        <h3>Relatie Detail</h3>
        <p><b>Relatie Type:</b> ${props.relationship}</p>
        <hr>
        <p><b>Van:</b> ${props.source_label || 'Onbekend'}</p>
        <p><b>Naar:</b> ${props.target_label || 'Onbekend'}</p>
    `;
}

function onEachFeature(feature, layer) {
    if (feature.geometry.type === 'LineString') {
        layer.bindPopup(generateLinePopupHtml(feature.properties), { minWidth: 200 });
    }
}


// --- FUNCTIES VOOR KAART WEERGAVE EN FILTERING ---

function drawMap(data) {
    if (geoJsonLayer) { map.removeLayer(geoJsonLayer); }
    markers.clearLayers();

    const filteredFeatures = data.features.filter(f => f.visible);

    geoJsonLayer = L.geoJSON({
        type: 'FeatureCollection',
        features: filteredFeatures
    }, {
        pointToLayer: (feature, latlng) => {
            if (feature.geometry.type === 'Point') {
                const props = feature.properties;
                // GEFIXTE KLEURTOEWIJZING
                const type = getNodeType(props.type);
                const color = nodeColors[type] || '#888';
                
                const marker = L.circleMarker(latlng, {
                    radius: 7,
                    fillColor: color,
                    color: "#000",
                    weight: 1,
                    fillOpacity: 0.8
                });

                marker.bindPopup(generateNodePopupHtml(props), { minWidth: 250 });
                markers.addLayer(marker);
                return null; 
            }
            return null;
        },
        style: (feature) => {
            if (feature.geometry.type === 'LineString') {
                return { color: '#888', weight: 1, opacity: 0.3 };
            }
            return {};
        },
        onEachFeature: onEachFeature 
    });

    map.addLayer(markers);
    geoJsonLayer.addTo(map);

    if (markers.getLayers().length > 0) {
         map.fitBounds(markers.getBounds(), { padding: [50, 50] });
    } else if (geoJsonLayer.getLayers().length > 0) {
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
    }
}

// Functie voor filteren en zoeken
window.filterMap = function() {
    if (!fullGeoJsonData) return;

    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;

    const filteredData = JSON.parse(JSON.stringify(fullGeoJsonData));

    filteredData.features.forEach(feature => {
        feature.visible = true;
        const props = feature.properties;

        if (feature.geometry.type === 'Point') {
            const label = props.label ? props.label.toLowerCase() : '';
            const nodeType = getNodeType(props.type); // Gebruik de geconsolideerde type

            if (searchTerm && !label.includes(searchTerm)) {
                feature.visible = false;
            }
            
            // GEFIXTE FILTERLOGICA
            if (feature.visible && filterType !== 'all') {
                if (filterType === 'Person' && nodeType !== 'Person') {
                    feature.visible = false;
                } else if (filterType === 'City' && nodeType !== 'City') {
                    feature.visible = false;
                }
            }
        }
    });

    drawMap(filteredData);
};

// Functie om de legenda te vullen (nu met consistente types)
function createLegend() {
    const legendContent = document.getElementById('legend-content');
    let html = '<h4>Knooppunten (Locaties/Personen)</h4>';

    // We definiëren de types nu hier om consistent te zijn met getNodeType
    const typesForLegend = {'Person': '#E91E63', 'Plaats': '#3388ff'};

    for (const type in typesForLegend) {
        const color = typesForLegend[type];
        html += `<div style="display: flex; align-items: center; margin-bottom: 5px;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 1px solid #000; margin-right: 8px;"></span>
            <span>${type}</span>
        </div>`;
    }
    
    html += '<h4 style="margin-top: 15px;">Lijnen (Relaties)</h4>';
    html += `<div style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 30px; height: 2px; background-color: #888; margin-right: 8px;"></span>
        <span>Aangetoonde relatie</span>
    </div>`;

    legendContent.innerHTML = html;
}

// Start de applicatie - gebruik de correcte bestandsnaam
fetch('network_data_with_full_labels.geojson') // Dit is de laatst bekende, correcte naam
    .then(res => res.json())
    .then(data => {
        fullGeoJsonData = data;
        fullGeoJsonData.features.forEach(f => f.visible = true);
        
        drawMap(fullGeoJsonData);
        createLegend();
    })
    .catch(error => {
        console.error('Fout bij het laden van de GeoJSON data:', error);
    });
