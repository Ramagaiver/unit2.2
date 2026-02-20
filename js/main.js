// Global map variable
var map;

function createMap(){
    // Creates the map
    map = L.map('map', {
        center: [39.328, -111.674],
        zoom: 7,
        minZoom: 7,
        maxBounds: ([
            [44.001, -116.043],
            [35.001, -107.047],
        ])
    })

    // Initializes the tile layer
    L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}.png', {
        // Add the proper ESRI/ARCGIS attribution here //
        // attribution: '&copy; <a href="ATTRIBUTION LINK HERE">ESRI</a>'
        attribution: 'ESRI'
        // Add the proper ESRI/ARCGIS attribution here //
    }).addTo(map);
    
    // Runs the loadData function; responsible for fetching data, 
    loadData()
}

// Function that handles getting feature attributes for popups; if there are none then it adds them via an html string
function onEachFeature(feature, layer){
    var popupContent = "";
    if (feature.properties) {
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

// Function that handles fetching and loading all necessary data
function loadData(){

    // Variable that holds directory of all datasets
    const geojsonData = [
    'data/Natives1870.geojson',
    'data/StateOutlines.geojson',
    'data/AdjustedMormonSettlements.geojson' // This data was used with permission of Brandon Plewe, 2025
    ];  

    for (path of geojsonData){
        console.log("Fetching " + path)
        fetch(path)
            .then(function(response){
                return response.json();
            })
            .then(console.log("Fetched " + path))

            .then(function(json){
                    L.geoJson(json, {
                        pointToLayer: function(feature, latlng){
                            if (feature.properties.periodized === true){
                                return L.circleMarker(latlng, definitiveSettlement);
                            } else {
                                return L.circleMarker(latlng, approximateSettlement);
                            }
                        },
                        onEachFeature: onEachFeature
                    }).addTo(map)} )
    }
}

document.addEventListener('DOMContentLoaded',createMap)