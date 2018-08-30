// Create the tile layer that will be the background of our map
// const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}";
const mapbox_url = "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}?access_token={accessToken}";

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
