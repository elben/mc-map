//= require jquery
//= require leaflet

(function () {
  var austinCoords = new L.LatLng(30.2669, -97.7428);

  // the width of the sidebar, so we can pad the map to ignore that area
  var sidebarWidth = $('#filters').outerWidth();

  // elements
  var $filters = $('#filters');
  var $filterNav = $filters.find('nav');
  var $filterTabs = $filters.find('.filter-tab');

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
          // the campus values here and in the stylesheets correspond to the
          // keys in Community::CAMPUSES enum.
          icon: new CampusIcon({ campus: campus }),
          riseOnHover: true
        }).addTo(map);
        bounds.extend(coord);
      });

      // zoom the map to include all the markers, leaving room for the controls
      map.fitBounds(bounds, {
        paddingBottomRight: [sidebarWidth, 0]
      });
    }
  });

  // add the Esri map tiles layer (free!)
  L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }).addTo(map);

  // set up all the accordian sections
  var accordians = [];
  $('.accordian-section').each(function () {
    var accordian = new Accordian($(this));
    accordians.push(accordian);
  });

  // handle selecting filter tabs
  $filterNav.delegate('a', 'click', function (e) {
    e.preventDefault();
    var selectedClass = 'selected';
    var $navButton = $(this);

    // deselect other tabs, select this one
    $navButton.addClass(selectedClass).siblings().removeClass(selectedClass);
    $filterTabs.removeClass('selected');
    $('#' + $(this).attr('data-tab-id')).addClass('selected');
  });

  // select the first tab
  $filterNav.children().first().click();

}());
