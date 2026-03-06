// Global variable that holds directories for all datasets
const geojsonData = [
'data/baseNatives.geojson',
'data/mormonSettlementsUtah.geojson', // This data was used with permission of Brandon Plewe, 2025
'data/studyArea.geojson'
];  

let proportionalSymbols = true
let clusteredSymbols = false

// Global variable for settlement data
var mormonSettlementData;
var map;
var clusterGroup;

function createMap(){
    // Creates the map
    map = L.map('map', {
        center: [39.5, -111.674],
        zoom: 7,
        minZoom: 7,
        maxZoom: 11,
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
        attribution: '&copy; <a href="https://www.arcgis.com/home/item.html?id=1b243539f4514b6ba35e7d995890db1d">ESRI</a> | ' 
                    + '&copy; <a href="https://mormonplaces.byu.edu/">Brandon Plewe</a>'
    }).addTo(map);

    // Map panes for z index
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';

    // Handles map zoom events
    map.on('zoomend', function() {
        console.log(map.getZoom())
        let currentZoom = map.getZoom()
        let labels = document.querySelectorAll('.my-polygon-label');

        labels.forEach(function(label){
            if (currentZoom === 8) {
                label.style.opacity = '0.8'
            } else if (currentZoom === 9){
                label.style.opacity = '0.5';
            } else if (currentZoom === 10){
                label.style.opacity = '0.2'
            } else if (currentZoom == 11){
                label.style.opacity = '0'
            } else {
                label.style.opacity = '1'
            }
        })
    });

    // Runs the loadData function; responsible for fetching data
    loadData()
}

// Function responsible for applying map-wide effects
// Currently, this only handles popup creation, but eventually this will handle other map-wide functions as well
function onEachFeature(feature, layer){
    var popupContent = createPopupContent(feature, layer); 
    if (popupContent){
        layer.bindPopup(popupContent);
    }
}

// Function responsible for applying visible labels to territory
function onEachPolygon(feature, layer){
    var squareOne = L.latLngBounds([[44.001, -114.043], [37, -109]]);
    var squareTwo = L.latLngBounds([[37.002, -111.050], [35.001, -107.047]]);

    var center = layer.getBounds().getCenter();

    if (squareOne.contains(center) || squareTwo.contains(center)){
        layer.bindTooltip(`${feature.properties.Band}`, {
            permanent: true,
            direction: "center",
            className: "my-polygon-label",
            offset: [0, 0],
            pane: "labels"
        })
    }
}

// Function responsible for handling all popup data
function createPopupContent(feature, layer){
    var popupContent = "";
        if (feature.properties){

            // Popups for settlement data
            if (feature.properties.settlement){

                var startDate = feature.properties["start date"]
                var endDate = feature.properties["end date"]
                let yearRange = Number(endDate.slice(0, 4) - startDate.slice(0, 4))

                if (feature.properties.periodized === true){
                    popupContent += "<p><h2>" + feature.properties.settlement + "</h2>" + 
                    `Established on ${startDate}.` + "<br><br>" + 
                    `Occupied for ${yearRange} years total,` + "<br>" + `${startDate} to ${endDate}.` + "<br><br>" + feature.properties.description + "<br><br>" + 
                    `Source: ${feature.properties.source}.` + "</p>"
                }

                else {
                    popupContent += "<p><h2>" + feature.properties.settlement + "</h2>" + 
                    `Established some time between ${startDate} and ${endDate}` + 
                    "<br><br>" + feature.properties.description + "<br><br>" + `Source: ${feature.properties.source}.` + "</p>"
                }

                layer.bindPopup(popupContent, { 
                    keepInView: true
                });
            } 
            
            // Popups for bands
            else if (feature.properties.Band){
                popupContent += `${feature.properties.Band}`
            }

            // Popups for everything else

            else if (feature.properties.id===0){
                return;
            }
            else {
                for (var property in feature.properties){
                    popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
                }
            }

            return popupContent
        }
};

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
                    if (path === 'data/mormonSettlementsUtah.geojson') {
                        mormonSettlementData = L.geoJson(json, {
                            pointToLayer: function(feature, latlng) {
                                let isPeriodized = feature.properties.periodized === true;
                                
                                return L.marker(latlng, {
                                    icon: L.icon({
                                        iconUrl: 'img/mormon_settlement.svg',
                                        iconSize: [8, 8],
                                        iconAnchor: [4, 4],
                                        className: isPeriodized ? 'definitive-settlement' : 'approximate-settlement'
                                    })
                                });
                            },
                            onEachFeature: onEachFeature
                        }).addTo(map);

                        let initialDate = new Date(1900, 0, 0);
                        sequenceControls();
                        otherButtons();
                        updateSettlementSymbols(initialDate);
                    }

                    else if (path === 'data/studyArea.geojson'){
                        L.geoJSON(json, {
                            filter: function(feature){
                                return feature.properties.id !== 1;
                            },

                            style: function(feature){
                                return otherStates; 
                            },
                        }).addTo(map);
                    }

                    else if (path === 'data/baseNatives.geojson'){
                        L.geoJson(json, {
                            style: function(feature){
                                // return nativeStyles[feature.properties.Tribe] || nativeStyles["Default"];
                                let tribe = feature.properties.Tribe;
                                let tribeClass = tribe.toLowerCase().replace(/ /g, '-'); 
                                return { className: `territory territory-${tribeClass}` };
                                },
                        onEachFeature: function(feature, layer) {
                            onEachPolygon(feature, layer);
                            onEachFeature(feature, layer);
                            }
                        }).addTo(map);
                    }
                    else {
                        L.geoJson(json, {
                            onEachFeature: onEachFeature
                        }).addTo(map)
                    }
                });
    }
}

function sequenceControls(){   
    // Slider handler
    const slider = document.querySelector('#range-slider');
    let stepType = 'day'

    document.getElementById('sequence-increment').addEventListener('change', (event) =>{
        stepType = event.target.value
    });

    document.querySelector('#range-slider').oninput = function(){
        let currentDate = new Date(1847, 0, 0);
        currentDate.setDate(currentDate.getDate() + parseInt(this.value));
        
        // Legend date
        const legendDate = document.getElementById('date');
        if (legendDate) {
            legendDate.textContent = currentDate.toDateString(); 
        }

        console.log(currentDate)
        updateSettlementSymbols(currentDate);
        calculateStats(currentDate)
    }

    // Previous year button
    document.querySelector('#reverse').onclick = function(){
        let index = parseInt(slider.value);
        if (index > 1) {
            index = leapYearHandler(stepType, index, -1)
            slider.value = index;

            // This calls updateSettlementSymbols every time the button is pressed
            slider.dispatchEvent(new Event('input'));
        }
    };

    // Play and pause sequence button
    let playSequence = null
    const playIcon = document.querySelector('#start-stop img');

    document.querySelector('#start-stop').onclick = function(){
        if (playSequence === null){
            playIcon.src = 'img/pause.svg';
            this.title = 'Pause';

            playSequence = setInterval(function(){
                let index = parseInt(slider.value);
                if (index < 19358){
                    index = leapYearHandler(stepType, index, 1)
                    slider.value = index;
                    slider.dispatchEvent(new Event('input'));
                } else {
                    clearInterval(playSequence);
                    playSequence = null;
                            
                    playIcon.src = 'img/play.svg';
                    this.title = 'Play';
                }
            }, 500);
        } else {
            clearInterval(playSequence);
            playSequence = null;

            playIcon.src = 'img/play.svg';
            this.title = 'Play';
        }
    }

    // Next year button
    document.querySelector('#forward').onclick = function(){
        let index = parseInt(slider.value);
        if (index < 19358){
            index = leapYearHandler(stepType, index, 1)
            slider.value = index;

            // This calls updateSettlementSymbols every time the button is pressed
            slider.dispatchEvent(new Event('input'));
        }
    };

}

function leapYearHandler(stepType, index, direction){
    const baseDate = new Date(1847, 0, 0);

    let calcDate = new Date(1847, 0, 0);
    calcDate.setDate(calcDate.getDate() + index);

    // Determines if a leap year is present
    if (stepType === 'year'){
        calcDate.setFullYear(calcDate.getFullYear() + (1 * direction));
    } else if (stepType === 'month'){
        calcDate.setMonth(calcDate.getMonth() + (1 * direction));
    } else if (stepType === 'week'){
        calcDate.setDate(calcDate.getDate() + (7 * direction));
    } else {
        calcDate.setDate(calcDate.getDate() + (1 * direction));
    }

    // Calculates number of days for slider increment
    let timeDifference = calcDate.getTime() - baseDate.getTime();
    return Math.round(timeDifference / (1000 * 60 * 60 * 24));
};

// This variable allows switching between proportional and static symbologies

// This handles updating all the symbols: spatiotemporal & proportional 
function updateSettlementSymbols(currentDate){
    mormonSettlementData.eachLayer(function(layer){
        var props = layer.feature.properties
        var startDate = new Date(props["start date"]);
        var endDate = new Date(props["end date"]);

        if (currentDate >= startDate && currentDate <= endDate){
            let iconPath = 'img/mormon_settlement.svg'

            // If proportionalSymbols is true, then all symbols will change size proportional with respect to their continuous age
            if (proportionalSymbols === true){
                let ageInDays = (currentDate - startDate) / (1000 * 60 * 60 * 24);
                let ageInYears = ageInDays / 365;
                let radius = ageInYears * 0.4;

                let currentSize = 8 + (radius * 1.5);
                let currentAnchor = currentSize / 2;
                let isPeriodized = props.periodized === true;

                layer.setIcon(L.icon({
                    iconUrl: iconPath,
                    iconSize: [currentSize, currentSize],
                    iconAnchor: [currentAnchor, currentAnchor],
                    className: isPeriodized ? 'definitive-settlement' : 'approximate-settlement'

                }));
            } else {
                let isPeriodized = props.periodized === true;

                layer.setIcon(L.icon({
                    iconUrl: iconPath,
                    iconSize: [10, 10], // Fixed size
                    iconAnchor: [5, 5],
                    className: isPeriodized ? 'definitive-settlement' : 'approximate-settlement'
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

// Function responsible for calculating statistics in legend
function calculateStats(currentDate){
    var allAges = []
    var calculatedStats = {};
    
    // If proportionalSymbols is true, then do stat calculations
    if (proportionalSymbols === true){
        mormonSettlementData.eachLayer(function(layer){
            // Calculate only from periodized localities
            if (map.hasLayer(layer) && layer.feature.properties.periodized === true){
                var props = layer.feature.properties
                var startDate = new Date(props["start date"]);

                var totalAge = (currentDate - startDate) / (1000 * 60 * 60 * 24);
                if (totalAge >= 0){
                    allAges.push(totalAge);
                }
            }
        })

        if (allAges.length > 0){
            // Stores the min, mean & max states in the local variable
            calculatedStats.min = Math.min(...allAges);
            calculatedStats.max = Math.max(...allAges);

            // Calculate the mean
            var sum = allAges.reduce(function(a, b){return a+b;});
            calculatedStats.mean = sum/ allAges.length;

            var circles = ["max", "mean", "min"];
                for (var i = 0; i < circles.length; i++){
                    var key = circles[i];
                    var totalDays = calculatedStats[key];

                    // Calculate years and days
                    var years = Math.floor(totalDays / 365.25);
                    var remainingDays = Math.floor(totalDays % 365.25);

                    // String formatting
                    var yearLabel = years === 1 ? " year" : " years";
                    var dayLabel = remainingDays === 1 ? " day" : " days";
                    var dateString = `${years}${yearLabel} and ${remainingDays}${dayLabel}`;

                    // Applies max, mean and min values to respective html element
                    console.log(`Minimum: ${calculatedStats.min}, Mean: ${calculatedStats.mean}, Max: ${calculatedStats.max}`)
                    var textElement = document.getElementById(key + "-date");
                    if (textElement){
                        textElement.textContent = dateString;
                    }
                }
        } 
        
        // This else statement handles all instances where there should be no presented value
        else {
            var circles = ["max", "mean", "min"];
            for (var i = 0; i < circles.length; i++){
                var textElement = document.getElementById(circles[i] + "-date");
                if (textElement){
                    textElement.textContent = "0 years and 0 days";
                }
            }
        }
    }
}

// This is the function that handles the settings and legend buttons and related functionality
function otherButtons(){
    // Proportional symbols
    document.querySelector('#proportional-toggle').onchange = function() {
        // Update proportionalSymbols to match checkbox state
        proportionalSymbols = this.checked;

        // Get current date from slider to refresh icons
        const slider = document.querySelector('#range-slider');
        let currentDate = new Date(1847, 0, 0);
        currentDate.setDate(currentDate.getDate() + parseInt(slider.value));

        updateSettlementSymbols(currentDate);

        // Grays out proportional legend information
        const attributes = document.querySelector('.proportional-elements');
        if (proportionalSymbols === false){    
            attributes.style.opacity = "0.3";
        } else {
            attributes.style.opacity = "1";
        }
    };

    // Legend visibility
    let legendVisible = true
    document.querySelector('#legend-button').onclick = function(){
        const button = document.querySelector("#legend-button");
        const legend = document.querySelector(".legend");

        if (legendVisible === true){
            legendVisible = false

            legend.style.opacity = "0";
            legend.style.pointerEvents = "none";
            button.textContent = "<"
        } else {
            legendVisible = true

            legend.style.opacity = "1";
            legend.style.pointerEvents = "auto";
            button.textContent = ">"
        }
    };

    // Settings visibility
    let settingsVisible = true
    document.querySelector('#settings-button').onclick = function(){
        const button = document.querySelector("#settings-button");
        const settings = document.querySelector("#settings-control");
        const date = document.querySelector("#date");

        if (settingsVisible === false){
            settingsVisible = true

            settings.style.opacity = "1";
            settings.style.pointerEvents = "auto";
            button.textContent = "x"

            date.style.bottom = "273px"; 

            button.style.bottom = "248px";
            button.style.left = "300px";
            button.style.width = "20px";
            button.style.height = "20px";
        } else {
            settingsVisible = false

            settings.style.opacity = "0";
            settings.style.pointerEvents = "none";
            button.textContent = "i"

            date.style.bottom = "62px"; 

            button.style.bottom = "126px";
            button.style.left = "10px";
            button.style.width = "30px";
            button.style.height = "30px";

        }
    };   
}

document.addEventListener('DOMContentLoaded',createMap)