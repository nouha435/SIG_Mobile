// Création de la carte
var map = L.map('mapid', {drawControl: true}).setView([33.808975, -7.045327], 8);

// Ajout de la couche OpenStreetMap
var OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Ajout de la couche Google Maps
var googleMaps = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: 'Map data ©2022 Google, GeoBasis-DE/BKG (©2009)',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
});

// Ajout de la couche ArcGIS
var arcGIS = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Création de l'objet pour les couches de base
var baseMaps = {
    "OpenStreetMap": OSM,
    "Google Maps": googleMaps,
    "ArcGIS Satellite": arcGIS
};

// Ajout du contrôle des couches à la carte
L.control.layers(baseMaps).addTo(map);

// Fonction pour calculer la distance
function calculerDistance(latlng1, latlng2) {
    return (latlng1.distanceTo(latlng2) / 1000);
}

// Ajout des marqueurs
// marqueur1
var point_depart = L.marker([33.9716, -6.8498], {
    title: 'Start point',
    draggable: true
}).addTo(map);

// marqueur2
var point_arrive = L.marker([33.573, -7.5898], {
    title: 'Destination',
    draggable: true
}).addTo(map);

// Fonction pour mettre à jour l'affichage de la distance
function mettreAJourDistance() {
    var distance = calculerDistance(point_depart.getLatLng(), point_arrive.getLatLng());
    document.getElementById('distance-info').innerHTML = 'Distance : ' + distance.toFixed(2) + ' km';
}

// Événements de déplacement des marqueurs
point_arrive.on('drag', function(e) {
    var distance = calculerDistance(e.target.getLatLng(), point_depart.getLatLng());
    document.getElementById('distance-info').innerHTML = 'Distance : ' + distance.toFixed(2) + ' km';
});

point_depart.on('drag', function(e) {
    var distance = calculerDistance(e.target.getLatLng(), point_arrive.getLatLng());
    document.getElementById('distance-info').innerHTML = 'Distance : ' + distance.toFixed(2) + ' km';
});

// Calcul initial de la distance
mettreAJourDistance();