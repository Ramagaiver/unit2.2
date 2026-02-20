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
    'data/MormonSettlements.geojson'
    ];  

    for (path of geojsonData){
        console.log("Fetching " + path)
        fetch(path)
            .then(function(response){
                return response.json();
            })
            .then(console.log("Fetched " + path))

            .then(function(json){
                var geojsonMarkerOptions = {
                    radius: 8,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                };

                    L.geoJson(json, {
                        pointToLayer: function(feature, latlng){
                            return L.circleMarker(latlng, geojsonMarkerOptions);
                        },
                        onEachFeature: onEachFeature
                    }).addTo(map)} )
    }
}


document.addEventListener('DOMContentLoaded',createMap)