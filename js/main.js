// Global variable that holds directories for all datasets
const geojsonData = [
'data/Natives1870.geojson',
'data/AdjustedMormonSettlements.geojson', // This data was used with permission of Brandon Plewe, 2025
'data/StateOutlines.geojson'
];  

// Global variable for settlement data
var mormonSettlementData;
var calculatedStats = {};

// Global map variable
var map;

function createMap(){
    // Creates the map
    map = L.map('map', {
        center: [39.5, -111.674],
        zoom: 7,
        minZoom: 7,
        maxBounds: ([
            [44.001, -116.043],
            [35.001, -107.047],
        ]),
        attributionControl: false

    })

    L.control.attribution({
        position: 'topright' // Can be 'topleft', 'topright', 'bottomleft', 'bottomright'
    }).addTo(map);

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

// ACTIVITY 6 - Lesson 1 //
// ACTIVITY 6 - Lesson 1 //

// Everything below the ACTIVITY 6 - Lesson 1 comment up until the next one should account for everything
// covered in Lesson 1, modified and adpted to fit my application

// Function responsible for applying map-wide effects
// Currently, this only handles popup creation, but eventually this will handle other map-wide functions as well
function onEachFeature(feature, layer){
    var popupContent = createPopupContent(feature, layer); 
    layer.bindPopup(popupContent);
}

// Function responsible for handling all popup data
function createPopupContent(feature, layer){
    var popupContent = "";
        if (feature.properties){

            // Popups for settlement data
            if (feature.properties.settlement){

                var startDate = feature.properties["start date"]
                var endDate = feature.properties["end date"]
                let yearRange = yearParser(startDate, endDate)

                if (feature.properties.periodized === true){
                    popupContent += "<p><h2>" + feature.properties.settlement + "</h2>" + 
                    `${startDate} to ${endDate}` + "<br><br>" + 
                    `Established for ${yearRange} years` + "<br><br>" + feature.properties.description + "<br><br>" + 
                    feature.properties.source + "</p>"
                }

                else {
                    popupContent += "<p><h2>" + feature.properties.settlement + "</h2>" + 
                    `Approximately established between ${startDate} and ${endDate}` + 
                    "<br><br>" + feature.properties.description + "<br><br>" + feature.properties.source + "</p>"
                }

                layer.bindPopup(popupContent, { 
                    keepInView: true
                });
            } 
            
            // Popups for bands
            // else if (feature.properties["Band"]){
                
            // }

            // Popups for everything else
            else {
                for (var property in feature.properties){
                    popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
                }
            }

            return popupContent
        }
};

// Handles the year ranges XXXX-YYYY for any popup that needs them
function yearParser(startYear, endYear){
    var yearRange = Number(endYear.slice(0, 4) - startYear.slice(0, 4))
    return yearRange
}

// ACTIVITY 6 - Lesson 1 //
// ACTIVITY 6 - Lesson 1 //

// Function that handles fetching and loading all necessary data
function loadData(){
    for (let path of geojsonData){
        console.log("Fetching " + path)
        fetch(path)
            .then(function(response){
                return response.json();
            })
            .then(console.log("Fetched " + path))

            .then(function(json){
                    if (path === 'data/AdjustedMormonSettlements.geojson'){
                        calculateStats(json);

                        mormonSettlementData = L.geoJson(json, {
                            pointToLayer: function(feature, latlng){
                                if (feature.properties.periodized === true){
                                    return L.marker(latlng, {icon: L.icon(definitiveMormonSettlement)}); // ACTIVITY 6 - Lesson 3 //
                                } else {
                                    return L.marker(latlng, {icon: L.icon(approximateMormonSettlement), opacity: 0.4}); // ACTIVITY 6 - Lesson 3 //
                                }
                            },

                            onEachFeature: onEachFeature

                            }).addTo(map);

                            createLegend()
                        }

                        else {
                            L.geoJson(json, {
                                filter: function(feature){
                                    if (feature.properties.id === 1){
                                        return false;
                                    } else {
                                        return true;
                                    }
                                },

                                style:function(feature){
                                    if (path === 'data/StateOutlines.geojson'){
                                        return otherStates;
                                    }
                                },

                                onEachFeature: onEachFeature

                            }).addTo(map)
                        }
                    });
    }

    // Loads the time series controller & legend
    createSequenceControls()
}

// ACTIVITY 6 - Lesson 2 & 3//
// ACTIVITY 6 - Lesson 2 & 3//

// Creates time series sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');

            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range" min="1" max="19358" value="19358" step="1">');
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());

    // Slider handler
    const slider = document.querySelector('.range-slider');

    document.querySelector('.range-slider').oninput = function() {
        var currentDate = new Date(1847, 0, 0);
        currentDate.setDate(currentDate.getDate() + parseInt(this.value));

        console.log(currentDate)
        updateSettlementSymbols(currentDate);
    }

    // Next year button
    document.querySelector('#forward').onclick = function() {
        let index = parseInt(slider.value);
        if (index < 19358) {
            index++;
            slider.value = index;
            // This calls updateSettlementSymbols every time the button is pressed
            slider.dispatchEvent(new Event('input'));
        }
    };

    // Previous year button
    document.querySelector('#reverse').onclick = function() {
        let index = parseInt(slider.value);
        if (index > 1) {
            index--;
            slider.value = index;
            // This calls updateSettlementSymbols every time the button is pressed
            slider.dispatchEvent(new Event('input'));
        }
    };
}

// Creates the map's legend
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = '<p class="temporalLegend">Legend<span class="date"><br>Fri Jan 01 1847</span></p>';

            var svg = '<svg id="attribute-legend" width="200px" height="200">';

            // Array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            for (var i = 0; i < circles.length; i++) {
                var ageDays = calculatedStats[circles[i]];
                var ageYears = ageDays / 365

                var radius = (25 + (ageYears * 0.4 * 2)) / 1.5;
                var cy = 130 - radius;

                svg += '<circle class="legend-circle" id="' + circles[i] + 
                        '" r="' + radius + '" cy="' + cy + '" cx="65" ' + 
                        'fill="#61a5f5" fill-opacity="0.8" stroke="#325780" />';

                var textY = i * 30 + 30;
                svg += '<text id="' + circles[i] + '-text" x="95" y="' + textY + '" fill="#325780">' + 
                        Math.round(ageYears) + " years</text>";

                };

            svg += "</svg>";

            // Add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);

            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });

    map.addControl(new LegendControl());
};

// This variable will eventually allow switching between proportional and static symbologies
var propContinuity = true

// This handles updating all the symbols: spatiotemporal & proportional 
function updateSettlementSymbols(currentDate){

    // This updates the current date on the legend
    document.querySelector("span.date").innerHTML = `<br>${currentDate.toDateString()}`;

    mormonSettlementData.eachLayer(function(layer){
        var props = layer.feature.properties
        var startDate = new Date(props["start date"]);
        var endDate = new Date(props["end date"]);

        if (currentDate >= startDate && currentDate <= endDate){
            let iconPath = props.periodized ? 'img/definitive_mormon_settlement.svg' : 'img/approximate_mormon_settlement.svg';

            // If propContinuity is true, then all symbols will change size proportionall with respect to their 
            // continuous age
            if (propContinuity === true){
                let ageInDays = (currentDate - startDate) / (1000 * 60 * 60 * 24);
                let ageInYears = ageInDays / 365;
                let radius = ageInYears * 0.4;

                layer.setIcon(L.icon({
                    iconUrl: iconPath,
                    iconSize: [13 + radius * 2, 13 + radius * 2],
                    iconAnchor: [6.5 + radius, 6.5 + radius]
                }));
            }
            
            if (!map.hasLayer(layer)){
                layer.addTo(map);
            }
        }

        else {
            map.removeLayer(layer);
        }

    })
}

function calculateStats(data){
    allAges = [];

    // Loops through each settlement to calculate
    for (var settlement of data.features) {
            var start = new Date(settlement.properties["start date"]);
            var end = new Date(settlement.properties["end date"]);
            
            // Total settlement age in days
            var totalDays = (end - start) / (1000 * 60 * 60 * 24);
            allAges.push(totalDays);
        }
    // Stores the min, mean & max states in the global variable
    calculatedStats.min = Math.min(...allAges);
    calculatedStats.max = Math.max(...allAges);

    // Calculate the mean
    var sum = allAges.reduce(function(a, b){return a+b;});
    calculatedStats.mean = sum/ allAges.length;
}    

document.addEventListener('DOMContentLoaded',createMap)