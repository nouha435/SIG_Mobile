// =============================================
// FICHIER : map.js (TP1 à TP6)
// =============================================

// ==================== CONFIGURATION ====================
const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY1Yjc3Y2NiNDFlZTQ1NTM4ZjJjYzc3NTI4MTM0ZjdhIiwiaCI6Im11cm11cjY0In0='; // REMPLACEZ PAR VOTRE CLÉ
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Variables globales
var map;
var point_depart, point_arrive;
var selectedMarker = null;
var routeLayer = null;
var routeData = null;
var currentRoutePolyline = null;

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation TP6...');
    
    // Initialiser la carte
    initialiserCarte();
    
    // Initialiser les marqueurs
    initialiserMarqueurs();
    
    // Initialiser les POI
    initialiserPOI();
    
    // Événements du formulaire (TP6)
    document.getElementById('route-form').addEventListener('submit', function(event) {
        event.preventDefault();
        obtenirItineraireForm();
    });
    
    // Bouton effacer
    document.getElementById('clear-route-btn').addEventListener('click', clearRoute);
    
    // Contrôle des couches de carte
    document.querySelectorAll('input[name="basemap"]').forEach(radio => {
        radio.addEventListener('change', function() {
            changerFondCarte(this.value);
        });
    });
    
    // Mettre à jour les champs quand les marqueurs bougent
    point_depart.on('dragend', function() {
        mettreAJourChampsFormulaire();
        mettreAJourDistance();
    });
    
    point_arrive.on('dragend', function() {
        mettreAJourChampsFormulaire();
        mettreAJourDistance();
    });
    
    // Calcul initial
    mettreAJourDistance();
    mettreAJourChampsFormulaire();
    
    console.log('✅ TP6 initialisé');
});

// ==================== FONCTIONS CARTE ====================
function initialiserCarte() {
    map = L.map('mapid').setView([33.808975, -7.045327], 8);
    
    // Couches de base
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

function changerFondCarte(type) {
    // Retirer toutes les couches de tuiles
    map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    
    // Ajouter la nouvelle couche
    switch(type) {
        case 'google':
            L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: 'Google Maps',
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                maxZoom: 20
            }).addTo(map);
            break;
        case 'arcgis':
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Esri'
            }).addTo(map);
            break;
        default: // OSM
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);
    }
}

// ==================== FONCTIONS MARQUEURS ====================
function initialiserMarqueurs() {
    // Marqueur de départ
    point_depart = L.marker([33.9716, -6.8498], {
        title: 'Départ',
        draggable: true,
        icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }).addTo(map).bindPopup("<b>Point de départ</b>");
    
    // Marqueur d'arrivée
    point_arrive = L.marker([33.573, -7.5898], {
        title: 'Arrivée',
        draggable: true,
        icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }).addTo(map).bindPopup("<b>Point d'arrivée</b>");
}

// ==================== FONCTIONS DISTANCE ====================
function calculerDistance(latlng1, latlng2) {
    return (latlng1.distanceTo(latlng2) / 1000);
}

function mettreAJourDistance() {
    var distance = calculerDistance(point_depart.getLatLng(), point_arrive.getLatLng());
    document.getElementById('distance-info').innerHTML = 
        `Distance à vol d'oiseau : ${distance.toFixed(2)} km`;
}

function mettreAJourChampsFormulaire() {
    const start = point_depart.getLatLng();
    const end = point_arrive.getLatLng();
    
    document.getElementById('start').value = `${start.lng.toFixed(4)},${start.lat.toFixed(4)}`;
    document.getElementById('end').value = `${end.lng.toFixed(4)},${end.lat.toFixed(4)}`;
}

// ==================== OPENROUTESERVICE (TP5 & TP6) ====================
async function obtenirItineraireForm() {
    const startInput = document.getElementById('start').value.trim();
    const endInput = document.getElementById('end').value.trim();
    
    // Validation
    if (!startInput || !endInput) {
        alert('Veuillez saisir les coordonnées de départ et d\'arrivée');
        return;
    }
    
    // Vérifier le format des coordonnées
    const startCoords = validerCoordonnees(startInput);
    const endCoords = validerCoordonnees(endInput);
    
    if (!startCoords || !endCoords) {
        alert('Format de coordonnées invalide. Utilisez: longitude,latitude');
        return;
    }
    
    // Mettre à jour les marqueurs
    point_depart.setLatLng([startCoords.lat, startCoords.lng]);
    point_arrive.setLatLng([endCoords.lat, endCoords.lng]);
    
    // Obtenir l'itinéraire
    await fetchData(startInput, endInput);
}

function validerCoordonnees(input) {
    const parts = input.split(',');
    if (parts.length !== 2) return null;
    
    const lng = parseFloat(parts[0].trim());
    const lat = parseFloat(parts[1].trim());
    
    if (isNaN(lng) || isNaN(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    
    return { lng, lat };
}

// Fonction principale TP6
async function fetchData(startCoordinates, endCoordinates) {
    document.getElementById('route-info').innerHTML = 
        '<span style="color: blue;">⌛ Calcul de l\'itinéraire en cours...</span>';
    
    try {
        const headers = new Headers();
        headers.append('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
        headers.append('Authorization', API_KEY);
        
        const url = `${ORS_URL}?start=${startCoordinates}&end=${endCoordinates}`;
        
        console.log('🌐 Requête OpenRouteService:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Itinéraire obtenu');
            displayRoute(data); // Fonction TP6
        } else {
            console.error('❌ Erreur:', response.status);
            document.getElementById('route-info').innerHTML = 
                `<span style="color: red;">Erreur ${response.status}: ${response.statusText}</span>`;
            clearRoute();
        }
    } catch (error) {
        console.error('💥 Erreur réseau:', error);
        document.getElementById('route-info').innerHTML = 
            `<span style="color: red;">Erreur réseau: ${error.message}</span>`;
        clearRoute();
    }
}

// Fonction TP6: displayRoute
function displayRoute(routeData) {
    // Effacer l'ancien itinéraire
    clearRoute();
    
    if (!routeData.features || routeData.features.length === 0) {
        document.getElementById('route-info').innerHTML = 
            '<span style="color: red;">Aucun itinéraire trouvé</span>';
        return;
    }
    
    // Récupérer les coordonnées de l'itinéraire
    const coordinates = routeData.features[0].geometry.coordinates;
    
    // Créer les points pour la polyligne
    const routePoints = coordinates.map(coord => L.latLng(coord[1], coord[0]));
    
    // Créer la polyligne (TP6)
    currentRoutePolyline = L.polyline(routePoints, {
        color: 'blue',
        weight: 5,
        opacity: 0.7,
        lineJoin: 'round'
    }).addTo(map);
    
    // Ajuster la vue
    map.fitBounds(currentRoutePolyline.getBounds());
    
    // Afficher les informations
    afficherInfosItineraire(routeData);
}

// Fonction TP6: clearRoute
function clearRoute() {
    // Supprimer la polyligne de l'itinéraire
    if (currentRoutePolyline) {
        map.removeLayer(currentRoutePolyline);
        currentRoutePolyline = null;
    }
    
    // Supprimer également l'ancienne couche routeLayer si elle existe
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    
    // Réinitialiser les informations
    document.getElementById('route-info').innerHTML = 'Aucun itinéraire affiché';
    mettreAJourDistance();
}

// Afficher les informations de l'itinéraire
function afficherInfosItineraire(data) {
    if (data.features && data.features.length > 0) {
        const summary = data.features[0].properties.summary;
        const distanceKm = (summary.distance / 1000).toFixed(2);
        const durationMin = Math.round(summary.duration / 60);
        
        const heures = Math.floor(durationMin / 60);
        const minutes = durationMin % 60;
        let dureeFormatee = '';
        
        if (heures > 0) {
            dureeFormatee = `${heures}h ${minutes}min`;
        } else {
            dureeFormatee = `${minutes} min`;
        }
        
        document.getElementById('route-info').innerHTML = `
            <div style="color: green; font-weight: bold;">
                ✅ Itinéraire calculé
            </div>
            <div style="margin-top: 8px;">
                <strong>Distance :</strong> ${distanceKm} km<br>
                <strong>Durée :</strong> ${dureeFormatee}<br>
                <small><em>Coordonnées extraites de l'itinéraire</em></small>
            </div>
        `;
    }
}

// ==================== POINTS D'INTÉRÊT (TP4) ====================
function initialiserPOI() {
    const poiData = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "nom": "Musée d'Art Moderne",
                    "type": "Musée"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [2.3522, 48.8566]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "nom": "Jardin Botanique",
                    "type": "Jardin"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [2.3386, 48.8497]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "nom": "Cathédrale Notre-Dame",
                    "type": "Église"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [2.3499, 48.8530]
                }
            }
        ]
    };
    
    // Créer la couche POI
    const poiLayer = L.geoJSON(poiData, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            });
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(`<b>${feature.properties.nom}</b><br>${feature.properties.type}`);
        }
    }).addTo(map);
    
    // Gestion de la sélection
    document.getElementById('poi-select').addEventListener('change', function() {
        const selectedPoi = this.value;
        
        if (!selectedPoi) {
            if (selectedMarker) {
                selectedMarker.setIcon(L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                }));
                selectedMarker = null;
            }
            return;
        }
        
        poiLayer.eachLayer(function(layer) {
            if (layer.feature.properties.nom === selectedPoi) {
                if (selectedMarker) {
                    selectedMarker.setIcon(L.icon({
                        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    }));
                }
                
                // Icône sélectionnée (rouge)
                layer.setIcon(L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [35, 55],
                    iconAnchor: [17, 55]
                }));
                
                layer.openPopup();
                selectedMarker = layer;
                
                // Centrer sur le POI
                const coords = layer.feature.geometry.coordinates;
                map.setView([coords[1], coords[0]], 12);
                
                // Mettre à jour le formulaire avec les coordonnées du POI
                document.getElementById('end').value = `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`;
            }
        });
    });
}

// ==================== TEST CLÉ API ====================
function testerCleAPI() {
    console.log('🔑 Test clé API...');
    if (!API_KEY || API_KEY === 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY1Yjc3Y2NiNDFlZTQ1NTM4ZjJjYzc3NTI4MTM0ZjdhIiwiaCI6Im11cm11cjY0In0=') {
        console.warn('⚠️ Clé API manquante!');
        document.getElementById('route-info').innerHTML = 
            '<span style="color: orange;">⚠️ Clé API OpenRouteService requise</span>';
    } else {
        console.log('✅ Clé API détectée');
    }
}

// Lancer le test au chargement
testerCleAPI();