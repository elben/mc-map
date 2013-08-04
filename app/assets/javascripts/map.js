//= require jquery
//= require leaflet

(function () {
  var austinCoords = new L.LatLng(30.2669, -97.7428);

  // custom icons for the campuses
  var CampusIcon = L.Icon.extend({
    options: {
      popupAnchor: [1, -32],
      campus: ''
    },

    initialize: function (options) {
      options = L.setOptions(this, options);
    },

    createIcon: function () {
      // build the icon as a div so we can style it via CSS
      var $marker = $('<div></div>');

      $marker.addClass('campus-marker');
      if (this.options.campus) {
        $marker.addClass('campus-marker-' + this.options.campus);
      }

      return $marker[0];
    },

    // we create and manage the shadow via CSS
    createShadow: function () {
      var $shadow = $('<div></div>');
      $shadow.addClass('campus-marker-shadow');
      return $shadow[0];
    }
  });

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
        var campus = point.campus ? point.campus.toLowerCase() : '';

        var coord = new L.LatLng(point.coords.lat, point.coords.lng);

        // add a marker to the map and add its point to the bounds
        L.marker(coord, {
          icon: new CampusIcon({ campus: campus }),
          riseOnHover: true
        }).addTo(map);
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
