//= require jquery
//= require leaflet

(function () {
  var map = L.map('map', {
    center: new L.LatLng(30.2669, -97.7428),
    zoom: 13,

    // TODO: put the Esri attribution SOMEWHERE
    attributionControl: false
  });

  // add all the initial points to the map
  $.getJSON('communities/points', function (response) {
    if (response) {
      $.each(response.community_points || [], function (index, pointData) {
        console.log(pointData);
        L.marker([pointData.lat, pointData.lng]).addTo(map);
      });
    }
  });

  // add the Esri map tiles layer (free!)
  L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }).addTo(map);
}());
