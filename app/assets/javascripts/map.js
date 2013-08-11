//= require jquery
//= require leaflet
//= require mustache

(function () {

  // compile the templates we'll be using
  var tmplCommunitySearchResult = Mustache.compile(
    $('#template-community-search-result').html());

  var austinCoords = new L.LatLng(30.2669, -97.7428);

  // the width of the sidebar, so we can pad the map to ignore that area
  var sidebarWidth = $('#filters').outerWidth();

  // storage for all the short-form points, keyed to their slug
  var POINTS = {};

  // elements
  var $filters = $('#filters');
  var $filterNav = $filters.find('nav');
  var $filterTabs = $filters.find('.filter-tab');
  var $searchResults = $('#search-results');

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
      $.each(response || [], function (index, point) {
        // store the point by its slug in our map
        POINTS[point.properties.slug] = point;

        // only add the point to the map if it has geodata available
        if (!point.geometry) { return; }

        var latlng = new L.LatLng(point.geometry.coordinates[1],
            point.geometry.coordinates[0]);

        // add a marker to the map and add its point to the bounds
        L.marker(latlng, {
          // the campus values here and in the stylesheets correspond to the
          // keys in Community::CAMPUSES enum.
          icon: new CampusIcon({
            campus: point.properties.campus.toLowerCase()
          }),
          riseOnHover: true
        }).addTo(map);
        bounds.extend(latlng);
      });

      // zoom the map to include all the markers, leaving room for the controls
      map.fitBounds(bounds, {
        paddingBottomRight: [sidebarWidth, 0]
      });
    }
  });

  // add the Esri map tiles layer (free!)
  L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
    detectRetina: true,
    reuseTiles: true
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

  // TODO: for testing only
  for (var i = 0; i < 10; i++) {
    $searchResults.append(tmplCommunitySearchResult({
      slug: 'abcd1234',
      leader_name: 'Leader Name',
      coleader_name: Math.random() > 0.5 ? 'Co-leader Name' : undefined,
      kinds: ['Open to Everyone'],
      day: 'Monday',
      address: {
        line_1: '321 Address Lane',
        line_2: Math.random() > 0.5 ? '#1234' : undefined,
        city: 'Austin',
        province: 'TX',
        postal: '78723'
      }
    }));
  }

}());
