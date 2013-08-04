//= require jquery
//= require leaflet

(function () {
  var austinCoords = new L.LatLng(30.2669, -97.7428);

  var map = L.map('map', {
    // center on Austin until points are loaded
    center: austinCoords,
    zoom: 13,

    // TODO: put the Esri attribution SOMEWHERE
    attributionControl: false
  });

  // add all the initial points to the map and zoom the map to include them
  $.getJSON('communities/points', function (response) {
    if (response) {
      var bounds = new L.LatLngBounds();
      $.each(response.community_points || [], function (index, point) {
        // only add the coord if it has geodata available
        if (!point.coords) { return; }

        var coord = new L.LatLng(point.coords.lat, point.coords.lng);

        // add a marker to the map and add its point to the bounds
        L.marker(coord).addTo(map);
        bounds.extend(coord);
      });

      // zoom the map to include all the markers
      map.fitBounds(bounds);
    }
  });

  // add the Esri map tiles layer (free!)
  L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }).addTo(map);
}());
