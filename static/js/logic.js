// Create the tile layer that will be the background of our map
const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}";

const attribution = "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>";

// var lightmap = L.tileLayer(mapbox_url, {
//   attribution: attribution,
//   maxZoom: 18,
//   id: "mapbox.light",
//   accessToken: API_KEY
// });

var satellitemap = L.tileLayer(mapbox_url, {
  attribution: attribution,
  maxZoom: 18,
  id: "mapbox.satellite",
  accessToken: API_KEY
});

// Initialize all of the LayerGroups we'll be using
var layers = {
  PAST_HOUR: new L.LayerGroup(),
  PAST_DAY: new L.LayerGroup(),
  PAST_WEEK: new L.LayerGroup(),
  PAST_MONTH: new L.LayerGroup(),
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [40.73, -74.0059],
  zoom: 2,
  layers: [
    layers.PAST_HOUR,
    layers.PAST_DAY,
    layers.PAST_WEEK,
    layers.PAST_MONTH,
  ]
});

// Add our 'lightmap' tile layer to the map
// lightmap.addTo(map);
satellitemap.addTo(map);

// Create an overlays object to add to the layer control
var overlays = {
  "Past Hour": layers.PAST_HOUR,
  "Past Day": layers.PAST_DAY,
  "Past Week": layers.PAST_WEEK,
  "Past Month": layers.PAST_MONTH,
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(null, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

function fmtTimestamp(time) {
  var dt = new Date(time);
  return dt.toUTCString();
};

function getColor(mag) {
  if (mag < 1) { return "#ddf57e"; }
  else if (mag < 2) { return "#fde63a"; }
  else if (mag < 3) { return "#fcbc2c"; }
  else if (mag < 4) { return "#fd9e28"; }
  else if (mag < 5) { return "#fa7f23"; }
  else { return "#fb0d1b"; }
};

// API call to USGS earthquake data
URLs = {
  PAST_HOUR: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson",
  PAST_DAY: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  PAST_WEEK: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", 
  PAST_MONTH: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
};

var earthquakeCount = {
  PAST_HOUR: 0,
  PAST_DAY: 0,
  PAST_WEEK: 0,
  PAST_MONTH: 0,
};

var earthquakeUpdated = {
  PAST_HOUR: 0,
  PAST_DAY: 0,
  PAST_WEEK: 0,
  PAST_MONTH: 0,
};

Object.entries(URLs).forEach(([key, url]) => {
  console.log(key, url);

  d3.json(url).then(function (response){
    console.log(response);
    // Update earthquake count
    earthquakeCount[key] = response.features.length;
    var generatedOn = fmtTimestamp(response.metadata.generated);
    earthquakeUpdated[key] = fmtTimestamp(response.metadata.generated);

    // Add features to map
    response.features.forEach(feature => {
      quake = L.geoJSON(feature, {
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: feature.properties.mag,
            fillColor: getColor(feature.properties.mag),
            color: getColor(feature.properties.mag),
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
        },
        // onEachFeature: addEarthquakeInfo,
      });

      // Add popup with info
      quake.bindPopup("<h3>" + feature.properties.title + "</h3><hr>" + 
      "<strong>Magnitude: </strong>" + feature.properties.mag + 
      "<br><strong>Time: </strong>" + fmtTimestamp(feature.properties.time) +
      "<br><strong>Significance: </strong>" + feature.properties.sig + "/1000" +
      "<br><strong>More info: </strong><a href=" + feature.properties.detail + ">USGS Earthquake Event Page</a>");

      // Add to specific layer
      quake.addTo(layers[key]);

      // Update the legend
      updateLegend(generatedOn, earthquakeCount);
    });
  });
});

// Update the legend's innerHTML with the last updated time and station count
function updateLegend(time, earthquakeCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Updated: " + time + "</p>",
    "<p class='out-of-order'>Past hour: " + earthquakeCount.PAST_HOUR+ "</p>",
    "<p class='coming-soon'>Past day: " + earthquakeCount.PAST_DAY + "</p>",
    "<p class='empty'>Past week: " + earthquakeCount.PAST_WEEK + "</p>",
    "<p class='low'>Past month: " + earthquakeCount.PAST_MONTH + "</p>"
  ].join("");
}



// function addEarthquakeInfo(feature, layer) {
//   if (feature.properties && feature.properties.title) {
//     layer.bindPopup(
//       "<h3>" + feature.properties.title + "</h3><hr>" + 
//       "<strong>Magnitude: </strong>" + feature.properties.mag + 
//       "<br><strong>Time: </strong>" + fmtTimestamp(feature.properties.time) +
//       "<br><strong>Significance: </strong>" + feature.properties.sig + "/1000" +
//       "<br><strong>More info: </strong><a href=" + feature.properties.detail + ">USGS Earthquake Event Page</a>");
//   }
// };

// // API call to USGS earthquake data
// function getUrl(timespan) {
//   if (timespan==="hour") {
//     return "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson";
//   } else if (timespan) {
//     return "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_" + timespan + ".geojson";
//   }
//   return "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
// }
  
// // ------------------------------------------
// // Add geojson data to map
// url = getUrl()

// d3.json(url).then(function (response){
//   console.log(response);
//   var quakes = response.features;

//   for (var i=0; i<quakes.length; i++){
//     var feature = quakes[i];

//     L.geoJSON(feature, {
//       pointToLayer: function(feature, latlng) {
//         return L.circleMarker(latlng, {
//           radius: feature.properties.mag,
//           fillColor: getColor(feature.properties.mag),
//           color: getColor(feature.properties.mag),
//           weight: 1,
//           opacity: 1,
//           fillOpacity: 0.8
//         });
//       },
//       onEachFeature: addEarthquakeInfo,
//     }).addTo(map);
//   }
// });







// // Initialize an object containing icons for each layer group
// var icons = {
//   COMING_SOON: L.ExtraMarkers.icon({
//     icon: "ion-settings",
//     iconColor: "white",
//     markerColor: "yellow",
//     shape: "star"
//   }),
//   EMPTY: L.ExtraMarkers.icon({
//     icon: "ion-android-bicycle",
//     iconColor: "white",
//     markerColor: "red",
//     shape: "circle"
//   }),
//   OUT_OF_ORDER: L.ExtraMarkers.icon({
//     icon: "ion-minus-circled",
//     iconColor: "white",
//     markerColor: "blue-dark",
//     shape: "penta"
//   }),
//   LOW: L.ExtraMarkers.icon({
//     icon: "ion-android-bicycle",
//     iconColor: "white",
//     markerColor: "orange",
//     shape: "circle"
//   }),
//   NORMAL: L.ExtraMarkers.icon({
//     icon: "ion-android-bicycle",
//     iconColor: "white",
//     markerColor: "green",
//     shape: "circle"
//   })
// };

// d3.json(url, function(infoRes) {
  //   // When the first API call is complete, perform another call to the Citi Bike Station Status endpoint
  //   d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", function(statusRes) {
  //     var updatedAt = infoRes.last_updated;
  //     var stationStatus = statusRes.data.stations;
  //     var stationInfo = infoRes.data.stations;

  //     // Create an object to keep of the number of markers in each layer
  //     var stationCount = {
  //       COMING_SOON: 0,
  //       EMPTY: 0,
  //       LOW: 0,
  //       NORMAL: 0,
  //       OUT_OF_ORDER: 0
  //     };

  //     // Initialize a stationStatusCode, which will be used as a key to access the appropriate layers, icons, and station count for layer group
  //     var stationStatusCode;

  //     // Loop through the stations (they're the same size and have partially matching data)
  //     for (var i = 0; i < stationInfo.length; i++) {

  //       // Create a new station object with properties of both station objects
  //       var station = Object.assign({}, stationInfo[i], stationStatus[i]);
  //       // If a station is listed but not installed, it's coming soon
  //       if (!station.is_installed) {
  //         stationStatusCode = "COMING_SOON";
  //       }
  //       // If a station has no bikes available, it's empty
  //       else if (!station.num_bikes_available) {
  //         stationStatusCode = "EMPTY";
  //       }
  //       // If a station is installed but isn't renting, it's out of order
  //       else if (station.is_installed && !station.is_renting) {
  //         stationStatusCode = "OUT_OF_ORDER";
  //       }
  //       // If a station has less than 5 bikes, it's status is low
  //       else if (station.num_bikes_available < 5) {
  //         stationStatusCode = "LOW";
  //       }
  //       // Otherwise the station is normal
  //       else {
  //         stationStatusCode = "NORMAL";
  //       }

  //       // Update the station count
  //       stationCount[stationStatusCode]++;
  //       // Create a new marker with the appropriate icon and coordinates
  //       var newMarker = L.marker([station.lat, station.lon], {
  //         icon: icons[stationStatusCode]
  //       });

  //       // Add the new marker to the appropriate layer
  //       newMarker.addTo(layers[stationStatusCode]);

  //       // Bind a popup to the marker that will  display on click. This will be rendered as HTML
  //       newMarker.bindPopup(station.name + "<br> Capacity: " + station.capacity + "<br>" + station.num_bikes_available + " Bikes Available");
  //     }

  //     // Call the updateLegend function, which will... update the legend!
  //     updateLegend(updatedAt, stationCount);
  //   });
  // });

  // // Update the legend's innerHTML with the last updated time and station count
  // function updateLegend(time, stationCount) {
  //   document.querySelector(".legend").innerHTML = [
  //     "<p>Updated: " + moment.unix(time).format("h:mm:ss A") + "</p>",
  //     "<p class='out-of-order'>Out of Order Stations: " + stationCount.OUT_OF_ORDER + "</p>",
  //     "<p class='coming-soon'>Stations Coming Soon: " + stationCount.COMING_SOON + "</p>",
  //     "<p class='empty'>Empty Stations: " + stationCount.EMPTY + "</p>",
  //     "<p class='low'>Low Stations: " + stationCount.LOW + "</p>",
  //     "<p class='healthy'>Healthy Stations: " + stationCount.NORMAL + "</p>"
  //   ].join("");
  // }
